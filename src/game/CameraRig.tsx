import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MAX_SPEED, START_SPEED } from "./constants";
import { run } from "./runtime";

const look = new THREE.Vector3();

/**
 * Follow camera. Adapts to aspect ratio: portrait keeps the original framing;
 * landscape narrows the vertical FOV and pulls the camera back a little so the
 * track stays centered and the extra width shows more city instead of stretching.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const k = 1 - Math.exp(-6 * dt);
    const aspect = size.width / Math.max(1, size.height);
    const wide = THREE.MathUtils.clamp((aspect - 0.8) / 1.0, 0, 1); // 0 = portrait, 1 = >=1.8 landscape
    const baseFov = 62 - wide * 12;
    const camY = 3.6 + wide * 0.4;
    const camZ = 7 + wide * 1.2;
    camera.position.x += (run.x * (0.65 - wide * 0.25) - camera.position.x) * k;
    camera.position.y += (camY + run.y * 0.35 - camera.position.y) * k;
    camera.position.z = camZ;
    look.set(run.x * 0.4, 1.2, -10);
    camera.lookAt(look);
    camera.rotation.z += -run.lean * 0.04;
    const f = baseFov + ((run.speed - START_SPEED) / (MAX_SPEED - START_SPEED)) * (12 - wide * 4);
    if (Math.abs(camera.fov - f) > 0.05) { camera.fov += (f - camera.fov) * k; camera.updateProjectionMatrix(); }
  });
  return null;
}
