"use client";

import { useEffect, useRef, useState } from "react";

// How often an open app checks for a new service worker when it comes back
// to the foreground. Drivers often keep the installed app open all day.
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

// Registers public/sw.js in production builds and offers updates.
// An update is applied only when the user taps Reload, so a half-filled
// delivery or fuel form is never wiped by an automatic page refresh.
export default function PwaRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const userAcceptedUpdate = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // `next dev` serves unhashed chunk names, so a worker left over from a
      // local production run would serve stale code. Remove it in development.
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) void registration.unregister();
      });
      return;
    }

    let cancelled = false;
    let registration: ServiceWorkerRegistration | null = null;
    let lastUpdateCheck = Date.now();

    function offerUpdate(worker: ServiceWorker | null) {
      // Only an update needs the banner. On the very first install there is
      // no controller yet and the new worker simply takes over.
      if (!cancelled && worker && navigator.serviceWorker.controller) {
        setWaitingWorker(worker);
        setDismissed(false);
      }
    }

    function watchInstalling(worker: ServiceWorker | null) {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") offerUpdate(worker);
      });
    }

    function onUpdateFound() {
      watchInstalling(registration?.installing ?? null);
    }

    function onControllerChange() {
      if (!userAcceptedUpdate.current) return;
      userAcceptedUpdate.current = false;
      window.location.reload();
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "visible" || !registration) return;
      if (Date.now() - lastUpdateCheck < UPDATE_CHECK_INTERVAL_MS) return;
      lastUpdateCheck = Date.now();
      void registration.update().catch(() => undefined);
    }

    async function register() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;
        registration = reg;
        if (reg.waiting) offerUpdate(reg.waiting);
        watchInstalling(reg.installing);
        reg.addEventListener("updatefound", onUpdateFound);
      } catch (err) {
        console.warn("Service worker registration failed", err);
      }
    }

    function onLoad() {
      void register();
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Register after the page has loaded so it doesn't compete with first paint.
    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      registration?.removeEventListener("updatefound", onUpdateFound);
    };
  }, []);

  if (!waitingWorker || dismissed) return null;

  function applyUpdate() {
    if (!waitingWorker) return;
    userAcceptedUpdate.current = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "1rem",
        right: "1rem",
        // Sits above the driver tab bar and the admin mobile bottom nav.
        bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        zIndex: 350,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        className="card"
        style={{
          pointerEvents: "auto",
          width: "100%",
          maxWidth: "420px",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
        }}
      >
        <div style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
          A new version of the app is ready.
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDismissed(true)}>
          Later
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={applyUpdate}>
          Reload
        </button>
      </div>
    </div>
  );
}
