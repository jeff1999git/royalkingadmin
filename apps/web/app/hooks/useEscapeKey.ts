"use client";

import { useEffect } from "react";

// Closes a dialog on Escape. Pass `enabled: false` while the dialog must stay
// open (for example a blocking prompt).
export function useEscapeKey(onEscape: (() => void) | undefined, enabled = true) {
  useEffect(() => {
    if (!enabled || !onEscape) return;
    const handler = onEscape;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        handler();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onEscape, enabled]);
}
