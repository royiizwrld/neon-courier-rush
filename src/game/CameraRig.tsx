import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MAX_SPEED, START_SPEED } from "./constants";
import { run } from "./runtime";

const look = new THREE.Vector3();

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const k = 1 - Math.exp(-6 * dt);
    camera.position.x += (run.x * 0.65 - camera.position.x) * k;
    camera.position.y += (3.6 + run.y * 0.35 - camera.position.y) * k;
    camera.position.z = 7;
    look.set(run.x * 0.4, 1.2, -10);
    camera.lookAt(look);
    camera.rotation.z += -run.lean * 0.04;
    const f = 62 + ((run.speed - START_SPEED) / (MAX_SPEED - START_SPEED)) * 12;
    if (Math.abs(camera.fov - f) > 0.05) { camera.fov += (f - camera.fov) * k; camera.updateProjectionMatrix(); }
  });
  return null;
}
