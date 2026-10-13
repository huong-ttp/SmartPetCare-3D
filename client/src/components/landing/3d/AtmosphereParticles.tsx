"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const AtmosphereParticles: React.FC = () => {
  const dandelionCount = 80;
  const dandelionPointsRef = useRef<THREE.Points>(null);

  // Initial random positions for dandelions
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(dandelionCount * 3);
    const vel = new Float32Array(dandelionCount * 3);
    for (let i = 0; i < dandelionCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 35; // x
      pos[i * 3 + 1] = -1.5 + Math.random() * 8; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25; // z

      vel[i * 3] = 0.005 + Math.random() * 0.015; // drift right
      vel[i * 3 + 1] = 0.008 + Math.random() * 0.016; // float up
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.006;
    }
    return { positions: pos, velocities: vel };
  }, [dandelionCount]);

  useFrame((state) => {
    if (!dandelionPointsRef.current) return;
    const geom = dandelionPointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < dandelionCount; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      // Drift in breeze
      x += velocities[i * 3] + Math.sin(time + y) * 0.004;
      y += velocities[i * 3 + 1];
      z += velocities[i * 3 + 2] + Math.cos(time + x) * 0.003;

      // Wrap around boundary
      if (y > 6.5) {
        y = -2.0;
        x = (Math.random() - 0.5) * 35;
      }
      if (x > 18) x = -18;

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* ─── Floating Dandelion Fluff Points ─── */}
      <points ref={dandelionPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#FFFFFF"
          transparent
          opacity={0.85}
          sizeAttenuation
        />
      </points>

      {/* ─── Playful Floating Bubbles ─── */}
      <FloatingBubble position={[-2.2, 1.8, -1.2]} radius={0.22} speed={0.8} offset={0.5} />
      <FloatingBubble position={[2.5, 2.2, -0.5]} radius={0.28} speed={0.9} offset={2.1} />
      <FloatingBubble position={[-3.5, 0.4, 0.5]} radius={0.18} speed={1.1} offset={3.8} />
      <FloatingBubble position={[3.2, 0.2, 0.8]} radius={0.2} speed={0.75} offset={4.2} />
      <FloatingBubble position={[0.8, 2.6, -2.0]} radius={0.25} speed={0.85} offset={1.2} />
      <FloatingBubble position={[-1.2, -0.4, 1.5]} radius={0.16} speed={1.2} offset={5.0} />
    </group>
  );
};

// ─── Floating Iridescent Bubble Component ──────────────────────────────────
function FloatingBubble({
  position,
  radius = 0.2,
  speed = 1,
  offset = 0,
}: {
  position: [number, number, number];
  radius?: number;
  speed?: number;
  offset?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + offset;
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t) * 0.25;
      meshRef.current.position.x = position[0] + Math.cos(t * 0.7) * 0.12;
      meshRef.current.rotation.y = t * 0.4;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshPhysicalMaterial
        color="#E0F2FE"
        transmission={0.85}
        opacity={0.7}
        transparent
        roughness={0.08}
        metalness={0.05}
        clearcoat={1.0}
        clearcoatRoughness={0.05}
        ior={1.25}
      />
    </mesh>
  );
}
