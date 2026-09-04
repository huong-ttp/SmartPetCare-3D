"use client";

import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, SoftShadows } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useFloat } from "@/hooks/useFloat";
import { DEFAULT_CAMERA, DEFAULT_LIGHTING, RESPONSIVE_DPR, disposeScene } from "@/lib/three-helpers";
import { CANVAS_BG, BLOOM_CONFIG, BRAND_COLORS, CANVAS_PERFORMANCE } from "@/lib/threeConfig";

// Component xử lý cleanup resource
function SceneCleanup() {
  const state = useThree();
  useEffect(() => {
    return () => disposeScene(state);
  }, [state]);
  return null;
}

// Custom OrbitControls mượt hơn + Intro Animation
function CameraController() {
  const { camera } = useThree();
  const targetPos = new THREE.Vector3(...DEFAULT_CAMERA.position);
  
  // Start position for intro animation (zoom in effect)
  useEffect(() => {
    camera.position.set(targetPos.x * 1.5, targetPos.y + 2, targetPos.z * 1.5);
    camera.lookAt(0, 0, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state) => {
    // Lerp camera to target position for smooth intro
    state.camera.position.lerp(targetPos, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

function ClinicScene() {
  const group = useRef<THREE.Group>(null);
  useFloat(group, 0.5, 0.08);

  const dogRef = useRef<THREE.Group>(null);
  const catRef = useRef<THREE.Group>(null);
  const crossRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (dogRef.current) dogRef.current.rotation.y = Math.sin(t * 2) * 0.12;
    if (catRef.current) catRef.current.rotation.y = Math.cos(t * 1.6) * 0.14;
    if (crossRef.current) crossRef.current.rotation.y += 0.02;
  });

  return (
    <group ref={group} rotation={[0.3, -0.5, 0]} position={[0, -0.5, 0]}>
      {/* Platform/Floor */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.2, 32]} />
        <meshStandardMaterial color={BRAND_COLORS.navy} roughness={0.8} />
      </mesh>

      {/* Reception Desk */}
      <mesh position={[0, 0, -0.8]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.6, 1.2]} />
        <meshStandardMaterial color={BRAND_COLORS.desk} metalness={0.2} roughness={0.4} />
      </mesh>

      {/* Exam Table */}
      <mesh position={[-1.2, 0, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.3, 0.8]} />
        <meshStandardMaterial color={BRAND_COLORS.examTable} metalness={0.1} roughness={0.3} />
      </mesh>

      {/* Computer Monitor */}
      <mesh position={[0.6, 0.35, -0.4]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.05]} />
        <meshStandardMaterial emissive={BRAND_COLORS.desktopGlow} emissiveIntensity={0.6} color="#000" />
      </mesh>

      {/* Cabinet */}
      <mesh position={[1.8, -0.1, 0.8]} castShadow>
        <boxGeometry args={[0.7, 1.2, 0.6]} />
        <meshStandardMaterial color={BRAND_COLORS.cabinet} roughness={0.5} />
      </mesh>

      {/* Medical Cross Floating */}
      <group ref={crossRef} position={[0, 1.2, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 0.08, 0.08]} />
          <meshStandardMaterial color={BRAND_COLORS.cross} emissive={BRAND_COLORS.cross} emissiveIntensity={0.5} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.08, 0.3, 0.08]} />
          <meshStandardMaterial color={BRAND_COLORS.cross} emissive={BRAND_COLORS.cross} emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Dog */}
      <group ref={dogRef} position={[-0.8, 0.25, 0.6]}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color={BRAND_COLORS.dog} roughness={0.7} />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.1, 0.15, 0]}>
          <coneGeometry args={[0.06, 0.15, 8]} />
          <meshStandardMaterial color={BRAND_COLORS.dog} />
        </mesh>
        <mesh position={[0.1, 0.15, 0]}>
          <coneGeometry args={[0.06, 0.15, 8]} />
          <meshStandardMaterial color={BRAND_COLORS.dog} />
        </mesh>
      </group>

      {/* Cat */}
      <group ref={catRef} position={[0.8, -0.2, 0.3]}>
        <mesh castShadow>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial color={BRAND_COLORS.cat} roughness={0.6} />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.08, 0.12, 0]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.05, 0.12, 8]} />
          <meshStandardMaterial color={BRAND_COLORS.cat} />
        </mesh>
        <mesh position={[0.08, 0.12, 0]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.05, 0.12, 8]} />
          <meshStandardMaterial color={BRAND_COLORS.cat} />
        </mesh>
      </group>
    </group>
  );
}

export const RightScene: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={DEFAULT_CAMERA}
      dpr={RESPONSIVE_DPR}
      gl={{ 
        antialias: CANVAS_PERFORMANCE.antialias,
        powerPreference: CANVAS_PERFORMANCE.powerPreference,
        alpha: false 
      }}
      className="w-full h-full"
    >
      <color attach="background" args={[CANVAS_BG]} />
      
      {/* Lighting */}
      <ambientLight intensity={DEFAULT_LIGHTING.ambientIntensity} />
      <directionalLight
        position={DEFAULT_LIGHTING.directionalPosition}
        intensity={DEFAULT_LIGHTING.directionalIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />
      <pointLight 
        position={DEFAULT_LIGHTING.pointPosition} 
        intensity={DEFAULT_LIGHTING.pointIntensity} 
        color={DEFAULT_LIGHTING.pointColor}
      />

      <Environment preset="city" />
      <SoftShadows size={20} samples={16} focus={0.5} />
      
      <ClinicScene />
      <CameraController />
      <SceneCleanup />

      <EffectComposer>
        <Bloom 
          luminanceThreshold={BLOOM_CONFIG.luminanceThreshold} 
          luminanceSmoothing={BLOOM_CONFIG.luminanceSmoothing} 
          intensity={BLOOM_CONFIG.intensity} 
        />
      </EffectComposer>
    </Canvas>
  );
};

export default RightScene;
