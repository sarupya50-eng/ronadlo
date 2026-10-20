"use client";

import { useEffect } from "react";

// Registers the offline shell. Production only, so it never gets in the way
// of `npm run dev`.
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // not supported or blocked — the site still works normally
    });
  }, []);

  return null;
}
