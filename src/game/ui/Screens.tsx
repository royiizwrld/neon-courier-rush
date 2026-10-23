import { useEffect, useState } from "react";
import { useGame } from "../store";
import { BIND_LABELS, keyLabel, toggleFullscreen, useSettings, type Bindable, type FpsCap } from "../settings";
import { installHelp, usePwa } from "../pwa";

function useFullscreen() {
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    on(); document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  return fs;
}
const fsSupported = () => typeof document !== "undefined" && !!document.documentElement.requestFullscreen;

/** Control hints for the device currently in use. */
function ControlHints() {
  const device = useSettings((s) => s.device);
  const keys = useSettings((s) => s.keys);
  const k = (b: Bindable) => keys[b].map(keyLabel).join(" / ");
  if (device === "touch") return <p className="hint">Swipe left/right to dodge · up to jump · down to slide</p>;
  if (device === "gamepad") return <p className="hint">Stick or D‑pad to dodge · A jump · B slide · Start pause</p>;
  return (
    <p className="hint">
      <kbd>{k("left")}</kbd> <kbd>{k("right")}</kbd> dodge · <kbd>{k("jump")}</kbd> jump · <kbd>{k("slide")}</kbd> slide · <kbd>{k("pause")}</kbd> pause · <kbd>Enter</kbd> start
    </p>
  );
}

export function StartScreen() {
  const { best, totalCoins, start } = useGame();
  const device = useSettings((s) => s.device);
  const setOpen = useSettings((s) => s.setOpen);
  const verb = device === "touch" ? "Tap" : device === "gamepad" ? "Press A" : "Click or press Enter";
  return (
    <div className="screen screen-start">
      <button className="start-hit" onClick={start} aria-label="Play" />
      <div className="title-block">
        <p className="kicker">Night shift delivery</p>
        <h1 className="game-title">Neon<br />Courier</h1>
      </div>
      <p className="tap-pulse">{verb} to play</p>
      <div className="start-bottom">
        <div className="stat-row">
          <span>Best <b>{best}</b></span>
          <span className="coin-text">● {totalCoins}</span>
        </div>
        <ControlHints />
        <button className="btn-ghost btn-small" onClick={() => setOpen(true)}>Settings</button>
      </div>
      <InstallBanner />
    </div>
  );
}

function InstallBanner() {
  const { canPrompt, installed, bannerDismissed, install, dismiss } = usePwa();
  if (!canPrompt || installed || bannerDismissed) return null;
  return (
    <div className="install-banner">
      <span>Install Neon Courier for fullscreen play</span>
      <button className="btn-neon btn-small" onClick={() => void install()}>Install</button>
      <button className="icon-btn icon-sm" onClick={dismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}

export function HUD() {
  const { score, coins, pause } = useGame();
  const muted = useSettings((s) => s.muted);
  const toggleMute = useSettings((s) => s.toggleMute);
  const fs = useFullscreen();
  return (
    <div className="hud">
      <div>
        <div className="hud-score">{score}</div>
        <div className="coin-text hud-coins">● {coins}</div>
        <PowerBadges />
      </div>
      <BiomeToast />
      <div className="hud-btns">
        <button className="icon-btn" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>{muted ? "🔇" : "🔊"}</button>
        {fsSupported() && <button className="icon-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">{fs ? "🗗" : "⛶"}</button>}
        <button className="icon-btn" onClick={pause} aria-label="Pause">❚❚</button>
      </div>
    </div>
  );
}

const POWER_INFO = [
  { k: "magnet", icon: "🧲", label: "Magnet", max: 10 },
  { k: "x2", icon: "✖2", label: "Double score", max: 12 },
  { k: "jet", icon: "🚀", label: "Jetpack", max: 6 },
] as const;

function PowerBadges() {
  const p = useGame((s) => s.powers);
  return (
    <div className="powers">
      {p.shield && <div className="power"><span>🛡</span><i style={{ width: "100%" }} /></div>}
      {POWER_INFO.filter((x) => p[x.k] > 0).map((x) => (
        <div className="power" key={x.k} title={x.label}><span>{x.icon}</span><i style={{ width: `${(p[x.k] / x.max) * 100}%` }} /></div>
      ))}
    </div>
  );
}

function BiomeToast() {
  const { toast, toastKey } = useGame();
  if (!toast) return null;
  return <div className="biome-toast" key={toastKey}><small>Entering</small>{toast}</div>;
}

/** Full-screen flash when passing through a portal. */
export function WarpFlash() {
  const k = useGame((s) => s.toastKey);
  const phase = useGame((s) => s.phase);
  if (phase !== "playing" || k < 2) return null;
  return <div className="warp-flash" key={k} />;
}

export function PauseScreen() {
  const { resume, home } = useGame();
  const setOpen = useSettings((s) => s.setOpen);
  return (
    <div className="screen screen-dim">
      <h2 className="screen-heading">Paused</h2>
      <button className="btn-neon" onClick={resume}>Resume</button>
      <button className="btn-ghost" onClick={() => setOpen(true)}>Settings</button>
      <button className="btn-ghost" onClick={home}>Home</button>
      <ControlHints />
    </div>
  );
}

export function GameOverScreen() {
  const { score, best, coins, newBest, start, home } = useGame();
  return (
    <div className="screen screen-dim">
      <h2 className="screen-heading">Busted</h2>
      {newBest && <p className="kicker">New best!</p>}
      <div className="result-card">
        <div><span>Score</span><b>{score}</b></div>
        <div><span>Best</span><b>{best}</b></div>
        <div><span>Coins</span><b className="coin-text">● {coins}</b></div>
      </div>
      <button className="btn-neon" onClick={start}>Play again</button>
      <button className="btn-ghost" onClick={home}>Home</button>
    </div>
  );
}

const BINDS = Object.keys(BIND_LABELS) as Bindable[];

export function SettingsScreen() {
  const s = useSettings();
  const pwa = usePwa();
  const fs = useFullscreen();
  if (!s.open) return null;
  return (
    <div className="screen screen-dim settings-screen">
      <div className="settings-panel">
        <div className="settings-head">
          <h2 className="screen-heading sm">Settings</h2>
          <button className="icon-btn" onClick={() => s.setOpen(false)} aria-label="Close settings">✕</button>
        </div>

        <section>
          <h3>Display</h3>
          <div className="row"><span>Frame rate limit</span>
            <div className="seg">
              {([30, 60, 0] as FpsCap[]).map((f) => (
                <button key={f} className={s.fpsCap === f ? "on" : ""} onClick={() => s.setFpsCap(f)}>{f === 0 ? "Unlimited" : f}</button>
              ))}
            </div>
          </div>
          {fsSupported() && <div className="row"><span>Fullscreen</span><button className="btn-ghost btn-small" onClick={toggleFullscreen}>{fs ? "Exit" : "Enter"}</button></div>}
          <div className="row"><span>Sound</span><button className="btn-ghost btn-small" onClick={s.toggleMute}>{s.muted ? "Off" : "On"}</button></div>
        </section>

        <section>
          <h3>Install app</h3>
          {pwa.installed ? <p className="note">Already installed.</p>
            : pwa.canPrompt ? <button className="btn-neon btn-small" onClick={() => void pwa.install()}>Install Neon Courier</button>
            : <p className="note">{installHelp()}</p>}
        </section>

        <section>
          <h3>Keyboard <button className="link-btn" onClick={s.resetKeys}>Reset</button></h3>
          {BINDS.map((b) => (
            <div className="row" key={b}><span>{BIND_LABELS[b]}</span>
              <button className={"key-btn" + (s.rebinding === b ? " on" : "")} onClick={() => s.startRebind(b)}>
                {s.rebinding === b ? "Press a key…" : s.keys[b].map(keyLabel).join(" / ")}
              </button>
            </div>
          ))}
          <div className="row"><span>Start / restart</span><span className="note">Enter</span></div>
          <p className="note">Click an action, then press a new key. Esc cancels.</p>
        </section>

        <section>
          <h3>Mouse &amp; touch</h3>
          <p className="note">Swipe (or click and drag) left/right to dodge, up to jump, down to slide.</p>
        </section>
        <section>
          <h3>Gamepad</h3>
          <p className="note">Left stick or D‑pad: move · A: jump · B: slide · Start: pause / start</p>
        </section>
      </div>
    </div>
  );
}

export function DebugOverlay() {
  const { debug, fps } = useGame();
  if (!debug) return null;
  return <div className="debug">FPS {fps}</div>;
}
