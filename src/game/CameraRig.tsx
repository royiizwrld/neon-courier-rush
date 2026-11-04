import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MAX_SPEED, START_SPEED } from "./constants";
import { CAMERA_PRESETS, pickCamPreset } from "./config";
import { run } from "./runtime";

const look = new THREE.Vector3();

/** Follow camera. Preset picked from screen size/aspect each frame, so resize/rotation never restarts. */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const k = 1 - Math.exp(-6 * dt);
    const p = CAMERA_PRESETS[pickCamPreset(size.width, size.height)];
    camera.position.x += (run.x * p.followX - camera.position.x) * k;
    camera.position.y += (p.y + run.y * 0.35 - camera.position.y) * k;
    camera.position.z += (p.z - camera.position.z) * k;
    look.set(run.x * 0.4, p.lookY, p.lookZ);
    camera.lookAt(look);
    camera.rotation.z += -run.lean * 0.04;
    const f = p.fov + ((run.speed - START_SPEED) / (MAX_SPEED - START_SPEED)) * p.speedFov;
    if (Math.abs(camera.fov - f) > 0.05) { camera.fov += (f - camera.fov) * k; camera.updateProjectionMatrix(); }
  });
  return null;
}
