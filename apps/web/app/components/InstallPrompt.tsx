"use client";

import { useEffect, useState } from "react";

// Chrome/Edge event that lets the page trigger the native install dialog.
// Not in the TypeScript DOM library yet.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Mode = "hidden" | "prompt" | "ios";

const DISMISS_KEY = "rk-install-dismissed";

function isInstalled() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

function isIos() {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so also check for a touch screen.
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false; // storage blocked (private mode): just show the prompt
  }
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // storage blocked: the prompt will show again next visit, which is fine
  }
}

// Offers to install the app. Android/desktop Chrome and Edge get a button that
// opens the native dialog; iPhone and iPad get a short "Add to Home Screen" hint
// because iOS has no install API. Hidden once installed or dismissed.
export default function InstallPrompt() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isInstalled() || wasDismissed()) return;

    if (isIos()) {
      setMode("ios");
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault(); // keep Chrome's own mini-infobar out of the way
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMode("prompt");
    }

    function onInstalled() {
      setDeferredPrompt(null);
      setMode("hidden");
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // The event can only be used once, so hide the button whatever the answer.
    // Chrome fires a fresh beforeinstallprompt later if the user declined.
    setDeferredPrompt(null);
    setMode("hidden");
  }

  function dismiss() {
    rememberDismissal();
    setMode("hidden");
  }

  return (
    <div
      className="card"
      style={{
        width: "100%",
        padding: "0.85rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        border: "1px solid var(--border-active)",
      }}
    >
      <div style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
        {mode === "prompt" ? (
          <>
            <strong style={{ color: "var(--text-primary)" }}>Install the app</strong> for quick access from your home screen.
          </>
        ) : (
          <>
            <strong style={{ color: "var(--text-primary)" }}>Install on iPhone:</strong> tap Share, then Add to Home Screen.
          </>
        )}
      </div>
      {mode === "prompt" && (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void install()}>
          Install
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install suggestion"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          fontSize: "1rem",
          lineHeight: 1,
          padding: "0.25rem",
        }}
      >
        ✕
      </button>
    </div>
  );
}
