import { create } from "zustand";

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

interface PwaState {
  canPrompt: boolean; installed: boolean; bannerDismissed: boolean;
  install: () => Promise<void>; dismiss: () => void;
}

let deferred: BIPEvent | null = null;

export const usePwa = create<PwaState>((set) => ({
  canPrompt: false, installed: false, bannerDismissed: false,
  install: async () => {
    if (!deferred) return;
    await deferred.prompt();
    const r = await deferred.userChoice;
    deferred = null;
    set({ canPrompt: false, installed: r.outcome === "accepted" });
  },
  dismiss: () => { set({ bannerDismissed: true }); try { localStorage.setItem("neon-courier:pwa-dismissed", "1"); } catch { /* ignore */ } },
}));

/** Install instructions for browsers without a native install prompt. */
export function installHelp(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "In Safari, tap Share, then “Add to Home Screen”.";
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Edg/.test(ua)) return "In Safari, choose File › Add to Dock.";
  if (/Firefox/.test(ua)) return "Firefox on computers can't install web apps. Open this page in Chrome or Edge to install.";
  if (/Edg\//.test(ua)) return "Use the “App available” icon in the address bar, or Settings › Apps › Install this site.";
  if (/Chrome/.test(ua)) return "Use the install icon at the right of the address bar, or the menu › Cast, save and share › Install.";
  return "Use your browser menu to add this game to your home screen or apps.";
}

export function setupPwa() {
  const standalone = matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches;
  let dismissed = false;
  try { dismissed = localStorage.getItem("neon-courier:pwa-dismissed") === "1"; } catch { /* ignore */ }
  usePwa.setState({ installed: standalone, bannerDismissed: dismissed });
  const onBip = (e: Event) => { e.preventDefault(); deferred = e as BIPEvent; usePwa.setState({ canPrompt: true }); };
  const onInstalled = () => { deferred = null; usePwa.setState({ installed: true, canPrompt: false }); };
  window.addEventListener("beforeinstallprompt", onBip);
  window.addEventListener("appinstalled", onInstalled);
  // Skip the service worker inside the editor preview frame
  const inFrame = window.self !== window.top;
  if ("serviceWorker" in navigator && !inFrame && !import.meta.env.DEV) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
  return () => { window.removeEventListener("beforeinstallprompt", onBip); window.removeEventListener("appinstalled", onInstalled); };
}
