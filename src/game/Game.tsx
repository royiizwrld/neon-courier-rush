import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect } from "react";
import { GameLoop } from "./loop/GameLoop";
import { Player } from "./player/Player";
import { Track } from "./track/Track";
import { Scenery } from "./track/Scenery";
import { Obstacles } from "./obstacles/Obstacles";
import { Coins } from "./coins/Coins";
import { CameraRig } from "./CameraRig";
import { attachInput } from "./input/input";
import { useGame } from "./store";
import { useSettings } from "./settings";
import { setupPwa } from "./pwa";
import { FrameDriver } from "./loop/FrameDriver";
import { DebugOverlay, GameOverScreen, HUD, PauseScreen, SettingsScreen, StartScreen } from "./ui/Screens";

const SKY = "#120a2a";

export function Game() {
  const phase = useGame((s) => s.phase);
  useEffect(() => {
    useGame.getState().load();
    useSettings.getState().load();
    const off = attachInput();
    const offPwa = setupPwa();
    const onVis = () => { if (document.hidden) useGame.getState().pause(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onVis);
    return () => { off(); offPwa(); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("blur", onVis); };
  }, []);

  return (
    <div className="game-root">
      <Canvas frameloop="demand" tabIndex={0} dpr={[1, 2]} camera={{ position: [0, 3.6, 7], fov: 62, near: 0.1, far: 220 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <color attach="background" args={[SKY]} />
        <fog attach="fog" args={[SKY, 35, 145]} />
        <ambientLight intensity={0.35} color="#8a7bff" />
        <hemisphereLight args={["#ff6fb5", "#101030", 0.6]} />
        <directionalLight position={[4, 10, 6]} intensity={1.1} color="#ffd9f0" />
        <Environment resolution={64}>
          <Lightformer intensity={2} color="#ff3d8b" position={[-6, 3, -4]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          <Lightformer intensity={2} color="#00e5ff" position={[6, 3, -4]} rotation-y={-Math.PI / 2} scale={[20, 2, 1]} />
          <Lightformer intensity={1} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        </Environment>
        <FrameDriver />
        <GameLoop />
        <CameraRig />
        <Track />
        <Scenery />
        <Obstacles />
        <Coins />
        <Player />
      </Canvas>
      <div className="ui-layer">
        {phase === "start" && <StartScreen />}
        {(phase === "playing" || phase === "paused") && <HUD />}
        {phase === "paused" && <PauseScreen />}
        {phase === "over" && <GameOverScreen />}
        <SettingsScreen />
        <DebugOverlay />
      </div>
    </div>
  );
}
