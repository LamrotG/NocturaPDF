import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

const BUCKET = "pdfs";

/**
 * Upload a PDF to the user's cloud library.
 * Returns { id, storagePath } or { error }.
 */
export async function uploadPdf(file) {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const storagePath = `${user.id}/${crypto.randomUUID()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: "application/pdf", upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { data, error: dbError } = await supabase
    .from("pdf_files")
    .insert({
      user_id: user.id,
      filename: file.name,
      storage_path: storagePath,
      size_bytes: file.size,
    })
    .select("id, filename, storage_path, size_bytes, uploaded_at")
    .single();

  if (dbError) {
    // Roll back the storage upload so we don't leak orphaned objects.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: dbError.message };
  }

  return { id: data.id, storagePath: data.storage_path };
}

/**
 * List the user's cloud PDFs.
 * Returns [{ id, filename, size_bytes, uploaded_at }] or { error }.
 */
export async function listCloudPdfs() {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured." };
  const { data, error } = await supabase
    .from("pdf_files")
    .select("id, filename, size_bytes, uploaded_at")
    .order("uploaded_at", { ascending: false });
  if (error) return { error: error.message };
  return data || [];
}

/**
 * Download a cloud PDF as a File object (suitable for pdf.js).
 */
export async function downloadCloudPdf(pdfId) {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured." };

  const { data: row, error: rowError } = await supabase
    .from("pdf_files")
    .select("filename, storage_path")
    .eq("id", pdfId)
    .single();
  if (rowError) return { error: rowError.message };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(row.storage_path);
  if (error) return { error: error.message };

  return new File([data], row.filename, { type: "application/pdf" });
}

/**
 * Delete a cloud PDF (both the DB row and the storage object).
 */
export async function deleteCloudPdf(pdfId) {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured." };

  const { data: row, error: rowError } = await supabase
    .from("pdf_files")
    .select("storage_path")
    .eq("id", pdfId)
    .single();
  if (rowError) return { error: rowError.message };

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([row.storage_path]);
  if (storageError) return { error: storageError.message };

  const { error: dbError } = await supabase
    .from("pdf_files")
    .delete()
    .eq("id", pdfId);
  if (dbError) return { error: dbError.message };

  return { error: null };
}

/**
 * Save reading metadata for a cloud file.
 */
export async function saveCloudMetadata(pdfId, { lastPage, numPages, bookmarks, preferences }) {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("pdf_metadata")
    .upsert(
      {
        user_id: user.id,
        pdf_id: pdfId,
        last_page: lastPage ?? 1,
        num_pages: numPages ?? 0,
        bookmarks: bookmarks ?? [],
        preferences: preferences ?? {},
      },
      { onConflict: "user_id,pdf_id" }
    );
  return { error: error?.message || null };
}

/**
 * Load reading metadata for a cloud file.
 */
export async function loadCloudMetadata(pdfId) {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from("pdf_metadata")
    .select("last_page, num_pages, bookmarks, preferences")
    .eq("pdf_id", pdfId)
    .maybeSingle();
  return data || null;
}