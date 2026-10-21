import { useGame } from "../store";

export function StartScreen() {
  const { best, totalCoins, start } = useGame();
  return (
    <button className="screen screen-start" onClick={start} aria-label="Tap to play">
      <div className="title-block">
        <p className="kicker">Night shift delivery</p>
        <h1 className="game-title">Neon<br />Courier</h1>
      </div>
      <p className="tap-pulse">Tap to play</p>
      <div className="stat-row">
        <span>Best <b>{best}</b></span>
        <span className="coin-text">● {totalCoins}</span>
      </div>
      <p className="hint">Swipe or use arrows / WASD</p>
    </button>
  );
}

export function HUD() {
  const { score, coins, pause } = useGame();
  return (
    <div className="hud">
      <div>
        <div className="hud-score">{score}</div>
        <div className="coin-text hud-coins">● {coins}</div>
      </div>
      <button className="icon-btn" onClick={pause} aria-label="Pause">❚❚</button>
    </div>
  );
}

export function PauseScreen() {
  const { resume, home } = useGame();
  return (
    <div className="screen screen-dim">
      <h2 className="screen-heading">Paused</h2>
      <button className="btn-neon" onClick={resume}>Resume</button>
      <button className="btn-ghost" onClick={home}>Home</button>
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

export function DebugOverlay() {
  const { debug, fps } = useGame();
  if (!debug) return null;
  return <div className="debug">FPS {fps}</div>;
}
