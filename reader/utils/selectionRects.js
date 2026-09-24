// Converts a live DOM Range into per-page, normalized ([0..1] of the page
// box) highlight rectangles. Normalized storage keeps highlights correct
// across zoom, container width, rotation and theme re-renders.
export function collectSelectionPageRects(range, containerEl) {
  if (!range || !containerEl || range.collapsed) return [];
  const clientRects = Array.from(range.getClientRects()).filter(
    (r) => r.width > 0.5 && r.height > 0.5
  );
  if (!clientRects.length) return [];

  // Page boxes: every rendered page has a canvas[data-page-number] whose
  // parent is the sized page box.
  const pageBoxes = new Map();
  for (const canvas of containerEl.querySelectorAll("canvas[data-page-number]")) {
    const page = Number(canvas.getAttribute("data-page-number"));
    const box = canvas.parentElement;
    if (!Number.isFinite(page) || !box) continue;
    const rect = box.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (!pageBoxes.has(page)) pageBoxes.set(page, rect);
  }
  if (!pageBoxes.size) return [];

  // Assign each client rect to the page containing its midpoint, then
  // normalize into that page's box. Rects outside every page (e.g. a
  // selection in the app chrome rather than a page) are dropped, which is
  // also what makes "no real selection" detectable by callers.
  const byPage = new Map();
  for (const r of clientRects) {
    const midX = r.left + r.width / 2;
    const midY = r.top + r.height / 2;
    let owner = null;
    for (const [page, box] of pageBoxes) {
      if (midX >= box.left && midX <= box.right && midY >= box.top && midY <= box.bottom) {
        owner = { page, box };
        break;
      }
    }
    if (!owner) continue;
    const norm = {
      x: (r.left - owner.box.left) / owner.box.width,
      y: (r.top - owner.box.top) / owner.box.height,
      w: r.width / owner.box.width,
      h: r.height / owner.box.height,
    };
    // Clamp into the page box (caret rects can stick out a hair).
    norm.x = Math.min(Math.max(norm.x, 0), 1);
    norm.y = Math.min(Math.max(norm.y, 0), 1);
    norm.w = Math.min(Math.max(norm.w, 0), 1 - norm.x);
    norm.h = Math.min(Math.max(norm.h, 0), 1 - norm.y);
    if (norm.w <= 0 || norm.h <= 0) continue;
    if (!byPage.has(owner.page)) byPage.set(owner.page, []);
    byPage.get(owner.page).push(norm);
  }

  // Merge same-line boxes so a line renders as one highlight, not one box
  // per text item.
  const result = [];
  for (const [page, rects] of byPage) {
    rects.sort((a, b) => a.y - b.y || a.x - b.x);
    const merged = [];
    for (const r of rects) {
      const last = merged[merged.length - 1];
      const sameLine = last && Math.abs(r.y - last.y) < Math.min(r.h, last.h) * 0.6;
      if (sameLine && r.x <= last.x + last.w + 0.01) {
        const x0 = Math.min(last.x, r.x);
        const right = Math.max(last.x + last.w, r.x + r.w);
        const y0 = Math.min(last.y, r.y);
        const bottom = Math.max(last.y + last.h, r.y + r.h);
        last.x = x0;
        last.w = right - x0;
        last.y = y0;
        last.h = bottom - y0;
      } else {
        merged.push({ ...r });
      }
    }
    // Round to 4 decimals for storage.
    result.push({
      page,
      rects: merged.map((r) => ({
        x: +r.x.toFixed(4),
        y: +r.y.toFixed(4),
        w: +r.w.toFixed(4),
        h: +r.h.toFixed(4),
      })),
    });
  }
  return result.sort((a, b) => a.page - b.page);
}
