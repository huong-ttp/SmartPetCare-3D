"use client";

import React, { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function MedicalEmblem() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle idle spinning
      groupRef.current.rotation.y += delta * (hovered ? 1.2 : 0.4);
      // Gentle tilt based on mouse/time
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.08 : 1}
    >
      {/* Outer Orbiting Ring */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.5, 0.05, 16, 64]} />
        <meshStandardMaterial
          color="#0EA5B7"
          emissive="#0EA5B7"
          emissiveIntensity={hovered ? 0.8 : 0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Second Orbiting Ring */}
      <mesh rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[1.35, 0.035, 16, 48]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#10B981"
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Central Base Sphere Shield */}
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshPhysicalMaterial
          color="#0F172A"
          roughness={0.1}
          metalness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Medical Cross - Vertical Bar */}
      <mesh position={[0, 0, 0.35]}>
        <boxGeometry args={[0.22, 0.75, 0.16]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#0EA5B7"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Medical Cross - Horizontal Bar */}
      <mesh position={[0, 0, 0.35]}>
        <boxGeometry args={[0.75, 0.22, 0.16]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#0EA5B7"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Floating Accent Spheres */}
      <mesh position={[0.95, 0.5, 0.2]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#38BDF8"
          emissiveIntensity={0.9}
        />
      </mesh>
      <mesh position={[-0.95, -0.4, -0.2]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color="#34D399"
          emissive="#34D399"
          emissiveIntensity={0.9}
        />
      </mesh>
    </group>
  );
}

export default function DoctorBadge3D({ className = "w-36 h-36" }: { className?: string }) {
  return (
    <div className={`relative ${className} select-none cursor-grab active:cursor-grabbing`}>
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 5, 4]} intensity={2.2} color="#E0F2FE" />
        <pointLight position={[-3, -2, 2]} intensity={1.5} color="#0EA5B7" />
        <pointLight position={[2, -3, -2]} intensity={1.2} color="#10B981" />

        <Suspense fallback={null}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.6}>
            <MedicalEmblem />
          </Float>
        </Suspense>
      </Canvas>
    </div>
  );
}
