import { useCallback, useEffect, useState } from "react";

// Detect whether the app is running as an installed PWA (standalone window)
// or a normal browser tab.
function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

// Minimal client-side router — the app only ever has two destinations
// (marketing landing page at "/", the reader at "/app"), so a dependency
// like react-router would be pure overhead against the "keep it minimal"
// product principle. Just the History API + a popstate listener.
export function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to) => {
    window.history.pushState({}, "", to);
    setPath(to);
  }, []);

  return [path, navigate];
}

export { isStandalonePwa };