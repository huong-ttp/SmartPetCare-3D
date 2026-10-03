"use client";

import { useFrame } from "@react-three/fiber";

// Hook to apply subtle floating motion to a group
import type { RefObject } from "react";
import type { Object3D } from "three";

export function useFloat(ref: RefObject<Object3D | null> | { current: Object3D | null }, speed = 0.6, intensity = 0.06) {
  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    ref.current.rotation.y = Math.sin(t / 3) * intensity * 0.5;
    ref.current.position.y = Math.sin(t) * intensity;
  });
}
