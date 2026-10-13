"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GrassyTerrain } from "./GrassyTerrain";
import { AtmosphereParticles } from "./AtmosphereParticles";
import { CutePuppy, CuteKitty } from "./ProceduralPets";
import { KittenModel } from "./KittenModel";

// ─── Camera Controller with Mouse Parallax ──────────────────────────────────
function CameraController() {
  const targetCamPos = useRef(new THREE.Vector3(0, 1.4, 5.8));

  useFrame((state) => {
    // Subtle mouse parallax on camera
    const px = state.pointer.x * 0.35;
    const py = state.pointer.y * 0.22;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamPos.current.x + px, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamPos.current.y + py, 0.04);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamPos.current.z, 0.04);
    state.camera.lookAt(0, 0.3, 0);
  });

  return null;
}

// ─── Loading Fallback ──────────────────────────────────────────────────────
function SceneLoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 2;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 1, 0]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#00A86B" wireframe />
    </mesh>
  );
}

// ─── Main MeadowScene Component ────────────────────────────────────────────
export const MeadowScene: React.FC<{ onContextLost?: () => void }> = ({ onContextLost }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.4, 5.8], fov: 45, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      className="w-full h-full"
      onCreated={({ gl }) => {
        const onLost = (e: Event) => {
          e.preventDefault();
          onContextLost?.();
        };
        gl.domElement.addEventListener("webglcontextlost", onLost);
      }}
    >
      {/* Sky & Fog Atmosphere */}
      <color attach="background" args={["#E8FAF4"]} />
      <fog attach="fog" args={["#E8FAF4", 12, 50]} />

      {/* Sun & Ambient Lighting */}
      <ambientLight intensity={0.75} color="#F0FDF4" />
      <hemisphereLight args={["#BAE6FD", "#4ADE80", 0.65]} />

      {/* Directional Sun Light with Shadows */}
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.5}
        color="#FFFBEB"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* Warm Fill Light */}
      <pointLight position={[-6, 4, -4]} intensity={0.9} color="#FED7AA" distance={20} />

      {/* Soft Cyan Rim Light */}
      <pointLight position={[5, -1, 3]} intensity={0.7} color="#0EA5E9" distance={15} />

      <Suspense fallback={<SceneLoadingFallback />}>
        {/* Vast Grassy Terrain Floor */}
        <GrassyTerrain />

        {/* Floating Dandelions & Iridescent Bubbles */}
        <AtmosphereParticles />

        {/* ─── 5 FLOATING CUTE PETS LOOKING AT MOUSE ─── */}
        {/* 1. Google Poly Kitten Model "Luna" (Prominently in Front-Right) */}
        <KittenModel
          position={[1.8, 0.1, 0.8]}
          rotation={[0, 0.2, 0]}
          scale={0.026}
          floatSpeed={0.9}
          floatOffset={0.5}
        />

        {/* 2. Golden Shiba Puppy "Mochi" (Upper-Right) */}
        <CutePuppy
          position={[3.3, 1.3, -0.2]}
          rotation={[0.05, -0.3, 0]}
          scale={1.1}
          name="Mochi"
          furColor="#F59E0B"
          earType="pointy"
          collarColor="#EF4444"
          floatSpeed={1.0}
          floatOffset={0}
        />

        {/* 3. Fluffy White Cat "Bông" (Lower-Right) */}
        <CuteKitty
          position={[2.9, -0.9, 0.4]}
          rotation={[-0.05, -0.4, 0]}
          scale={1.0}
          name="Bông"
          furColor="#FFFFFF"
          collarColor="#00A86B"
          floatSpeed={0.85}
          floatOffset={2.2}
        />

        {/* 4. Golden Puppy "Gấu" with Floppy Ears (Mid-Right Far) */}
        <CutePuppy
          position={[4.2, 0.3, -0.8]}
          rotation={[0.1, -0.5, 0]}
          scale={0.95}
          name="Gấu"
          furColor="#D97706"
          earType="floppy"
          collarColor="#0EA5E9"
          floatSpeed={0.95}
          floatOffset={3.6}
        />

        {/* 5. Ginger Playful Kitten "Miu" (Top Left Peeking) */}
        <CuteKitty
          position={[-3.6, 1.8, -0.6]}
          rotation={[0.1, 0.5, 0]}
          scale={0.85}
          name="Miu"
          furColor="#EA580C"
          collarColor="#FBBF24"
          floatSpeed={1.1}
          floatOffset={4.8}
        />
      </Suspense>

      <CameraController />
    </Canvas>
  );
};

export default MeadowScene;
