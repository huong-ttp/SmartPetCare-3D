"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const GrassyTerrain: React.FC = () => {
  const grassInstancedRef = useRef<THREE.InstancedMesh>(null);
  const flowersInstancedRef = useRef<THREE.InstancedMesh>(null);

  // ─── 1. Rolling Hill Ground Geometry ─────────────────────────────────────────
  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(160, 160, 40, 40);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Gentle rolling hill waves
      const z =
        Math.sin(x * 0.07) * Math.cos(y * 0.07) * 1.2 +
        Math.sin(x * 0.03 + y * 0.02) * 0.8;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // ─── 2. Instanced Grass Tufts ────────────────────────────────────────────────
  const grassCount = 1200;
  const grassData = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const grassColorOptions = [
      new THREE.Color("#22C55E"), // Spring green
      new THREE.Color("#16A34A"), // Lush green
      new THREE.Color("#4ADE80"), // Light grass
      new THREE.Color("#84CC16"), // Lime sunlit
      new THREE.Color("#15803D"), // Deep emerald
      new THREE.Color("#10B981"), // Emerald mint
    ];

    const dummy = new THREE.Object3D();
    for (let i = 0; i < grassCount; i++) {
      // Scatter across camera view
      const x = (Math.random() - 0.5) * 65;
      const z = (Math.random() - 0.5) * 55;
      // Height following hill wave
      const y =
        -2.4 +
        Math.sin(x * 0.07) * Math.cos(-z * 0.07) * 1.2 +
        Math.sin(x * 0.03 - z * 0.02) * 0.8;

      const scale = 0.55 + Math.random() * 0.75;
      const rotY = Math.random() * Math.PI * 2;
      const rotX = (Math.random() - 0.5) * 0.3;
      const rotZ = (Math.random() - 0.5) * 0.3;

      dummy.position.set(x, y + 0.16 * scale, z);
      dummy.rotation.set(rotX, rotY, rotZ);
      dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.6), scale);
      dummy.updateMatrix();

      matrices.push(dummy.matrix.clone());
      colors.push(
        grassColorOptions[Math.floor(Math.random() * grassColorOptions.length)]
      );
    }
    return { matrices, colors };
  }, [grassCount]);

  // ─── 3. Instanced Wildflowers (Daisies & Buttercups) ─────────────────────────
  const flowerCount = 280;
  const flowerData = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const flowerColorOptions = [
      new THREE.Color("#FFFFFF"), // Daisy white
      new THREE.Color("#FEF08A"), // Buttercup light yellow
      new THREE.Color("#FACC15"), // Sunny yellow
      new THREE.Color("#F472B6"), // Soft pink clover
      new THREE.Color("#E0E7FF"), // Soft lavender
    ];

    const dummy = new THREE.Object3D();
    for (let i = 0; i < flowerCount; i++) {
      const x = (Math.random() - 0.5) * 48;
      const z = (Math.random() - 0.5) * 40;
      const y =
        -2.4 +
        Math.sin(x * 0.07) * Math.cos(-z * 0.07) * 1.2 +
        Math.sin(x * 0.03 - z * 0.02) * 0.8;

      const scale = 0.5 + Math.random() * 0.6;
      dummy.position.set(x, y + 0.18 * scale, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      matrices.push(dummy.matrix.clone());
      colors.push(
        flowerColorOptions[Math.floor(Math.random() * flowerColorOptions.length)]
      );
    }
    return { matrices, colors };
  }, [flowerCount]);

  // Set initial instance matrices & colors
  useMemo(() => {
    // Defer to ref assignment in effect or direct update
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (grassInstancedRef.current) {
      // Gentle wind tilt on grass
      const mesh = grassInstancedRef.current;
      mesh.rotation.z = Math.sin(time * 1.2) * 0.02;
      mesh.rotation.x = Math.cos(time * 0.9) * 0.015;
    }
  });

  return (
    <group>
      {/* ─── Undulating Grassy Meadow Floor ─── */}
      <mesh
        geometry={groundGeo}
        position={[0, -2.4, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#2E7D32" // Rich vibrant meadow green
          roughness={0.88}
          metalness={0.02}
        />
      </mesh>

      {/* ─── Instanced Grass Tufts ─── */}
      <instancedMesh
        ref={(inst) => {
          if (inst) {
            (grassInstancedRef as any).current = inst;
            grassData.matrices.forEach((mat, i) => inst.setMatrixAt(i, mat));
            grassData.colors.forEach((col, i) => inst.setColorAt(i, col));
            inst.instanceMatrix.needsUpdate = true;
            if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
          }
        }}
        args={[undefined, undefined, grassCount]}
        receiveShadow
      >
        <coneGeometry args={[0.07, 0.45, 5]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>

      {/* ─── Instanced Wildflowers ─── */}
      <instancedMesh
        ref={(inst) => {
          if (inst) {
            (flowersInstancedRef as any).current = inst;
            flowerData.matrices.forEach((mat, i) => inst.setMatrixAt(i, mat));
            flowerData.colors.forEach((col, i) => inst.setColorAt(i, col));
            inst.instanceMatrix.needsUpdate = true;
            if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
          }
        }}
        args={[undefined, undefined, flowerCount]}
      >
        <sphereGeometry args={[0.065, 8, 8]} />
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
    </group>
  );
};
