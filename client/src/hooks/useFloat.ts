"use client";

import { useFrame } from "@react-three/fiber";

// Hook to apply subtle floating motion to a group
export function useFloat(ref: any, speed = 0.6, intensity = 0.06) {
  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    ref.current.rotation.y = Math.sin(t / 3) * intensity * 0.5;
    ref.current.position.y = Math.sin(t) * intensity;
  });
}
