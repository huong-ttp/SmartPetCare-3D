"use client";

import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, SoftShadows } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import { useFloat } from "@/hooks/useFloat";

function ClinicScene() {
  const group = useRef<any>(null);
  useFloat(group, 0.5, 0.08);

  // simple animated dog and cat using spheres
  const dogRef = useRef<any>(null);
  const catRef = useRef<any>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (dogRef.current) dogRef.current.rotation.y = Math.sin(t * 2) * 0.12;
    if (catRef.current) catRef.current.rotation.y = Math.cos(t * 1.6) * 0.14;
  });

  return (
    <group ref={group} rotation={[0.35, -0.6, 0]} position={[0, -0.6, 0]}>
      {/* reception desk */}
      <mesh position={[0, 0, -0.6]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.6, 1.2]} />
        <meshStandardMaterial color="#2b2b2b" metalness={0.2} roughness={0.4} />
      </mesh>

      {/* exam table */}
      <mesh position={[-1.2, -0.1, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.24, 0.8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.35} />
      </mesh>

      {/* computer monitor */}
      <mesh position={[0.6, 0.3, -0.2]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.03]} />
        <meshStandardMaterial emissive="#0ea5e9" emissiveIntensity={0.6} color="#0b1220" />
      </mesh>

      {/* cabinet */}
      <mesh position={[1.6, -0.2, 0.8]} castShadow>
        <boxGeometry args={[0.6, 0.9, 0.6]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* plant */}
      <mesh position={[1.9, 0.1, -1.0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
        <meshStandardMaterial color="#6ee7b7" />
      </mesh>

      {/* medical cross floating */}
      <group position={[0.0, 0.6, 0.9]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.28, 0.08, 0.28]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* dog */}
      <group ref={dogRef} position={[-0.8, -0.3, 0.6]}> 
        <mesh castShadow>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        <mesh position={[0.18, 0.05, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>

      {/* cat */}
      <group ref={catRef} position={[0.8, -0.3, 0.3]}> 
        <mesh castShadow>
          <sphereGeometry args={[0.15, 24, 24]} />
          <meshStandardMaterial color="#60a5fa" />
        </mesh>
        <mesh position={[0.14, 0.04, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#0b1220" />
        </mesh>
      </group>
    </group>
  );
}

export const RightScene: React.FC = () => {
  return (
    <div className="w-full h-full">
      <Canvas shadows camera={{ position: [3, 2, 4], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[0, 2.5, 0]} intensity={0.5} />

        <Suspense fallback={null}>
          <Environment preset="city" />
          <SoftShadows />
          <ClinicScene />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} rotateSpeed={0.3} />

        <EffectComposer>
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={0.35} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default RightScene;
