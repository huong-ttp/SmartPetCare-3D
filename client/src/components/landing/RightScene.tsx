"use client";

import React, { Suspense, useRef, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { DEFAULT_CAMERA, RESPONSIVE_DPR, disposeScene } from "@/lib/three-helpers";
import { CANVAS_BG, BLOOM_CONFIG, BRAND_COLORS, CANVAS_PERFORMANCE } from "@/lib/threeConfig";

// ─── 3D Loading Fallback ────────────────────────────────────────────────────
function SceneLoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 2;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime()) * 0.3;
    }
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.4, 24, 24]} />
      <meshStandardMaterial color={BRAND_COLORS.tealPrimary} wireframe />
    </mesh>
  );
}

// ─── Cleanup Resource ───────────────────────────────────────────────────────
function SceneCleanup() {
  const state = useThree();
  useEffect(() => {
    return () => disposeScene(state);
  }, [state]);
  return null;
}

// ─── Smooth Camera Controller ───────────────────────────────────────────────
function CameraController() {
  const { camera } = useThree();
  const targetPos = useMemo(() => new THREE.Vector3(2.8, 1.8, 4.2), []);

  useEffect(() => {
    camera.position.set(targetPos.x * 1.4, targetPos.y + 1.5, targetPos.z * 1.4);
    camera.lookAt(0, 0.1, 0);
  }, [camera, targetPos]);

  useFrame((state) => {
    state.camera.position.lerp(targetPos, 0.04);
    state.camera.lookAt(0, 0.1, 0);
  });

  return null;
}

// ─── Mouse Parallax Controller ──────────────────────────────────────────────
// Applies a subtle tilt to the entire scene group based on mouse position.
// Uses lerp damping for smooth, non-jarring motion.
function MouseParallaxController({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  // Store smoothed rotation targets
  const smoothTarget = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!groupRef.current) return;

    // state.pointer is normalized [-1, 1] from canvas center
    const px = state.pointer.x;
    const py = state.pointer.y;

    // Target rotation: max ±0.12 rad (~7°) — subtle parallax tilt
    const targetRotY = px * 0.5;
    const targetRotX = -py * 0.5;

    // Lerp for smooth damping (lower = smoother/slower)
    const damping = 0.03;
    smoothTarget.current.x += (targetRotX - smoothTarget.current.x) * damping;
    smoothTarget.current.y += (targetRotY - smoothTarget.current.y) * damping;

    groupRef.current.rotation.x = smoothTarget.current.x;
    groupRef.current.rotation.y = smoothTarget.current.y;
  });

  return null;
}

// ─── Teardrop Shape Geometry Generator ─────────────────────────────────────
function createTeardropGeometry(): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [];
  const segments = 32;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI;
    // Parametric teardrop curve profile
    const y = Math.cos(t);
    const r = Math.sin(t) * Math.sin(t * 0.5) * 0.5;
    points.push(new THREE.Vector2(Math.max(0, r), -y * 0.45));
  }
  return new THREE.LatheGeometry(points, 36);
}

// ─── Floating Health Monitoring Module (Teardrop) ───────────────────────────
interface TeardropSensorProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  tealBody?: boolean;
  scale?: number;
  floatSpeed?: number;
  floatOffset?: number;
}

function TeardropSensor({
  position,
  rotation = [0, 0, 0],
  tealBody = false,
  scale = 1,
  floatSpeed = 1.0,
  floatOffset = 0,
}: TeardropSensorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const teardropGeo = useMemo(() => createTeardropGeometry(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * floatSpeed + floatOffset;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t) * 0.1;
      groupRef.current.position.x = position[0] + Math.cos(t * 0.7) * 0.04;
      groupRef.current.rotation.z = rotation[2] + Math.sin(t * 0.8) * 0.08;
      groupRef.current.rotation.y = rotation[1] + Math.cos(t * 0.6) * 0.1;
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.4;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Outer Rounded Teardrop Shell */}
      <mesh geometry={teardropGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={tealBody ? BRAND_COLORS.tealPrimary : BRAND_COLORS.plasticWhite}
          roughness={0.16}
          metalness={0.04}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Recessed Center Core */}
      <mesh position={[0, -0.05, 0.15]} scale={[0.65, 0.65, 0.4]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshPhysicalMaterial
          color={tealBody ? BRAND_COLORS.plasticWhite : BRAND_COLORS.tealPrimary}
          roughness={0.18}
          clearcoat={0.8}
        />
      </mesh>

      {/* Glowing Status Halo Ring */}
      <mesh ref={ringRef} position={[0, -0.05, 0.18]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.13, 0.016, 16, 48]} />
        <meshStandardMaterial
          color={BRAND_COLORS.accentCyan}
          emissive={BRAND_COLORS.accentCyan}
          emissiveIntensity={1.0}
          toneMapped={false}
        />
      </mesh>

      {/* Micro Sensor Indicator Dot */}
      <mesh position={[0, 0.28, 0.06]}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshStandardMaterial
          color={BRAND_COLORS.tealGlow}
          emissive={BRAND_COLORS.tealGlow}
          emissiveIntensity={1.5}
        />
      </mesh>


    </group>
  );
}

// ─── Floating Spherical Pod ────────────────────────────────────────────────
interface SphericalPodProps {
  position: [number, number, number];
  color: string;
  ringColor?: string;
  radius?: number;
  scale?: [number, number, number];
  floatSpeed?: number;
  floatOffset?: number;
}

function SphericalPod({
  position,
  color,
  ringColor = BRAND_COLORS.tealGlow,
  radius = 0.24,
  scale = [1, 1, 1],
  floatSpeed = 0.9,
  floatOffset = 0,
}: SphericalPodProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * floatSpeed + floatOffset;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t) * 0.08;
      groupRef.current.rotation.y = t * 0.3;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.8 + Math.sin(t * 2.5) * 0.3;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Spherical Glossy Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 36, 36]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.14}
          metalness={0.06}
          clearcoat={0.9}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Equatorial Glowing Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.02, 0.013, 16, 48]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={1.0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ─── Floating Capsule Tracker ───────────────────────────────────────────────
function CapsuleTracker({
  position,
  rotation,
  floatOffset = 0,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  floatOffset?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.8 + floatOffset;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t) * 0.09;
      groupRef.current.rotation.z = rotation[2] + Math.sin(t * 0.6) * 0.1;
      groupRef.current.rotation.y = rotation[1] + Math.cos(t * 0.5) * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Lower Teal Half */}
      <mesh position={[0, -0.09, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.18, 20, 28]} />
        <meshPhysicalMaterial
          color={BRAND_COLORS.tealPrimary}
          roughness={0.16}
          clearcoat={0.85}
        />
      </mesh>

      {/* Upper Crisp White Half */}
      <mesh position={[0, 0.09, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.18, 20, 28]} />
        <meshPhysicalMaterial
          color={BRAND_COLORS.plasticWhite}
          roughness={0.14}
          clearcoat={0.9}
        />
      </mesh>

      {/* Status Glowing Ring at White Tip */}
      <mesh position={[0, 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.01, 16, 32]} />
        <meshStandardMaterial
          color={BRAND_COLORS.accentCyan}
          emissive={BRAND_COLORS.accentCyan}
          emissiveIntensity={1.4}
        />
      </mesh>
    </group>
  );
}

// ─── Floating Stylized Mini Pet Toy Pod ─────────────────────────────────────
function MiniPetToyPod({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.7 + 1.2;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t) * 0.06;
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Smooth Sphere Head — teal for brand consistency */}
      <mesh castShadow>
        <sphereGeometry args={[0.16, 28, 28]} />
        <meshPhysicalMaterial
          color={BRAND_COLORS.tealPrimary}
          roughness={0.18}
          clearcoat={0.8}
        />
      </mesh>
      {/* Rounded Left Ear */}
      <mesh position={[-0.07, 0.14, 0]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.045, 0.09, 16]} />
        <meshPhysicalMaterial color={BRAND_COLORS.tealDark} roughness={0.2} />
      </mesh>
      {/* Rounded Right Ear */}
      <mesh position={[0.07, 0.14, 0]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.045, 0.09, 16]} />
        <meshPhysicalMaterial color={BRAND_COLORS.tealDark} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ─── Floating Kibble Organic Pebble ────────────────────────────────────────
function FloatingKibble({
  position,
  floatOffset = 0,
  scale = 1,
}: {
  position: [number, number, number];
  floatOffset?: number;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.75 + floatOffset;
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t) * 0.05;
      meshRef.current.rotation.x = t * 0.4;
      meshRef.current.rotation.y = t * 0.3;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[0.09 * scale, 0.055 * scale, 0.09 * scale]}
      castShadow
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={BRAND_COLORS.kibbleBrown}
        roughness={0.7}
        metalness={0.05}
      />
    </mesh>
  );
}

// ─── Stylized Companion Figurine (Looking Up at Feeder) ────────────────────
function StylizedCatCompanion({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = 0.5 + Math.sin(t * 0.8) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={0.85}>
      {/* Body */}
      <mesh position={[0, 0.22, 0]} rotation={[0.4, 0, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.22, 16, 24]} />
        <meshPhysicalMaterial
          color="#F8F6F0"
          roughness={0.3}
          clearcoat={0.4}
        />
      </mesh>

      {/* Head tilted upward */}
      <group position={[0, 0.45, 0.08]} rotation={[-0.35, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshPhysicalMaterial
            color="#EAE3D2"
            roughness={0.3}
            clearcoat={0.4}
          />
        </mesh>
        {/* Left Ear */}
        <mesh position={[-0.07, 0.11, -0.02]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.045, 0.09, 12]} />
          <meshStandardMaterial color="#CBB99F" roughness={0.4} />
        </mesh>
        {/* Right Ear */}
        <mesh position={[0.07, 0.11, -0.02]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.045, 0.09, 12]} />
          <meshStandardMaterial color="#CBB99F" roughness={0.4} />
        </mesh>
      </group>

      {/* Curved Tail */}
      <mesh position={[0, 0.15, -0.16]} rotation={[-0.7, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.03, 0.2, 12, 16]} />
        <meshStandardMaterial color="#CBB99F" roughness={0.4} />
      </mesh>

      {/* Paws */}
      <mesh position={[-0.08, 0.05, 0.08]} castShadow>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      <mesh position={[0.08, 0.05, 0.08]} castShadow>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─── Central Futuristic Smart Feeder ───────────────────────────────────────
function CentralSmartFeeder() {
  const feederRef = useRef<THREE.Group>(null);
  const cameraLedRef = useRef<THREE.Mesh>(null);
  const indicatorBarRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (feederRef.current) {
      // Gentle majestic breathing float — raised 0.35 units to clear bottom edge
      feederRef.current.position.y = 0.3 + Math.sin(t * 0.7) * 0.05;
      feederRef.current.rotation.y = -0.38 + Math.sin(t * 0.35) * 0.05;
      feederRef.current.rotation.z = Math.sin(t * 0.5) * 0.015;
    }

    if (cameraLedRef.current) {
      const mat = cameraLedRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 1.0 + Math.sin(t * 2.2) * 0.3;
      }
    }

    if (indicatorBarRef.current) {
      const mat = indicatorBarRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.8 + Math.cos(t * 1.8) * 0.3;
      }
    }
  });

  return (
    <group ref={feederRef} position={[0.1, 0, 0]}>
      {/* ─── 1. UPPER HOPPER BODY (Vibrant Teal #00A86B) ─── */}
      <group position={[0, 0.5, 0]}>
        {/* Main Cylindrical Hopper with soft rounded taper */}
        <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.62, 0.68, 0.95, 64]} />
          <meshPhysicalMaterial
            color={BRAND_COLORS.tealPrimary}
            roughness={0.18}
            metalness={0.06}
            clearcoat={0.9}
            clearcoatRoughness={0.12}
          />
        </mesh>

        {/* Smooth Top Dome Lid */}
        <mesh castShadow position={[0, 0.62, 0]} scale={[1, 0.38, 1]}>
          <sphereGeometry args={[0.62, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color={BRAND_COLORS.tealPrimary}
            roughness={0.18}
            metalness={0.06}
            clearcoat={0.9}
            clearcoatRoughness={0.12}
          />
        </mesh>

        {/* Top Touch Sensor Button (Discreet embossed rounded disc) */}
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 32]} />
          <meshPhysicalMaterial
            color={BRAND_COLORS.tealDark}
            roughness={0.25}
            clearcoat={0.8}
          />
        </mesh>
        <mesh position={[0, 0.792, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.07, 0.008, 16, 32]} />
          <meshStandardMaterial
            color={BRAND_COLORS.accentAmber}
            emissive={BRAND_COLORS.accentAmber}
            emissiveIntensity={1.2}
          />
        </mesh>

        {/* ─── Front Camera & Sensor Pod ─── */}
        <group position={[0, 0.08, 0.65]} rotation={[-0.05, 0, 0]}>
          {/* Recessed Glossy Black Pill Housing */}
          <mesh castShadow>
            <capsuleGeometry args={[0.075, 0.16, 20, 32]} />
            <meshPhysicalMaterial
              color={BRAND_COLORS.darkLens}
              roughness={0.05}
              metalness={0.9}
              clearcoat={1.0}
            />
          </mesh>

          {/* Primary High-Res Camera Lens */}
          <mesh position={[0, 0.05, 0.05]}>
            <sphereGeometry args={[0.036, 24, 24]} />
            <meshPhysicalMaterial
              color="#020617"
              roughness={0.02}
              metalness={0.95}
              clearcoat={1.0}
            />
          </mesh>

          {/* Cyan Glow LED Ring around Camera */}
          <mesh ref={cameraLedRef} position={[0, 0.05, 0.06]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.042, 0.006, 16, 32]} />
            <meshStandardMaterial
              color={BRAND_COLORS.accentCyan}
              emissive={BRAND_COLORS.accentCyan}
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>

          {/* Secondary IR Sensor Lens */}
          <mesh position={[0, -0.05, 0.05]}>
            <sphereGeometry args={[0.026, 20, 20]} />
            <meshPhysicalMaterial
              color="#0F172A"
              roughness={0.08}
              metalness={0.8}
            />
          </mesh>
        </group>

        {/* Status Indicator Slit (Above Camera) */}
        <mesh
          ref={indicatorBarRef}
          position={[0, 0.38, 0.62]}
          rotation={[-0.05, 0, 0]}
        >
          <capsuleGeometry args={[0.02, 0.13, 16, 24]} />
          <meshStandardMaterial
            color={BRAND_COLORS.tealGlow}
            emissive={BRAND_COLORS.tealGlow}
            emissiveIntensity={1.0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ─── 2. CRISP WHITE DIVISION COLLAR ─── */}
      <mesh position={[0, 0.18, 0]}>
        <torusGeometry args={[0.685, 0.028, 20, 64]} />
        <meshPhysicalMaterial
          color={BRAND_COLORS.plasticWhite}
          roughness={0.12}
          clearcoat={0.95}
        />
      </mesh>

      {/* ─── 3. CRISP WHITE PLASTIC BASE & BOWL ─── */}
      <group position={[0, 0, 0]}>
        {/* Main Base Under Hopper */}
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.69, 0.72, 0.32, 64]} />
          <meshPhysicalMaterial
            color={BRAND_COLORS.plasticWhite}
            roughness={0.14}
            metalness={0.02}
            clearcoat={0.95}
            clearcoatRoughness={0.08}
          />
        </mesh>

        {/* Food Chute Opening in White Plastic */}
        <mesh position={[0, 0.05, 0.52]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.26, 0.18, 0.14]} />
          <meshPhysicalMaterial
            color="#E2E8F0"
            roughness={0.2}
            clearcoat={0.7}
          />
        </mesh>

        {/* Extended Base Dish Tray */}
        <mesh position={[0, -0.06, 0.48]} castShadow receiveShadow>
          <cylinderGeometry args={[0.52, 0.56, 0.22, 64]} />
          <meshPhysicalMaterial
            color={BRAND_COLORS.plasticWhite}
            roughness={0.14}
            clearcoat={0.95}
          />
        </mesh>

        {/* Feeding Bowl Curved Outer Rim */}
        <mesh position={[0, 0.05, 0.56]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.055, 24, 64]} />
          <meshPhysicalMaterial
            color={BRAND_COLORS.plasticWhite}
            roughness={0.12}
            clearcoat={1.0}
          />
        </mesh>

        {/* Feeding Bowl Interior Concave Depression */}
        <mesh
          position={[0, 0.04, 0.56]}
          rotation={[Math.PI, 0, 0]}
          scale={[1, 0.45, 1]}
          receiveShadow
        >
          <sphereGeometry args={[0.42, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color={BRAND_COLORS.plasticOffWhite}
            roughness={0.1}
            clearcoat={1.0}
          />
        </mesh>

        {/* Dispensed Kibble in Bowl */}
        <mesh position={[-0.04, 0.03, 0.54]} scale={[0.07, 0.045, 0.07]} castShadow>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={BRAND_COLORS.kibbleBrown} roughness={0.7} />
        </mesh>
        <mesh position={[0.07, 0.025, 0.59]} scale={[0.06, 0.04, 0.06]} castShadow>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={BRAND_COLORS.kibbleBrown} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Zero-Gravity Product Showcase Scene ───────────────────────────────────
function ZeroGravityProductShowcase() {
  return (
    <group position={[0, -0.2, 0]}>
      {/* 1. Central Hero: Futuristic Smart Feeder */}
      <CentralSmartFeeder />

      {/* 2. Floating Teardrop Health Sensor (Left) */}
      <TeardropSensor
        position={[-1.75, 0.35, 0.4]}
        rotation={[0.1, 0.4, -0.15]}
        tealBody={false}
        scale={0.95}
        floatSpeed={0.9}
        floatOffset={0.5}
      />

      {/* 3. Floating Teardrop Health Sensor (Right Teal) */}
      <TeardropSensor
        position={[1.65, 0.95, -0.2]}
        rotation={[-0.15, -0.3, 0.2]}
        tealBody={true}
        scale={0.85}
        floatSpeed={0.85}
        floatOffset={2.0}
      />

      {/* 4. Multi-colored Floating Spherical Smart Pods */}
      {/* Upper-Left Signature Teal Pod */}
      <SphericalPod
        position={[-1.6, 1.3, -0.4]}
        color={BRAND_COLORS.tealPrimary}
        ringColor={BRAND_COLORS.accentCyan}
        radius={0.25}
        floatSpeed={0.8}
        floatOffset={1.0}
      />

      {/* Mid-Left Crisp White Pod */}
      <SphericalPod
        position={[-1.3, 0.85, 0.8]}
        color={BRAND_COLORS.plasticWhite}
        ringColor={BRAND_COLORS.accentAmber}
        radius={0.2}
        floatSpeed={1.0}
        floatOffset={3.2}
      />

      {/* Lower-Left Glowing Teal Sensor Ring Pod */}
      <SphericalPod
        position={[-1.5, -0.65, 0.6]}
        color={BRAND_COLORS.tealPrimary}
        ringColor={BRAND_COLORS.tealGlow}
        radius={0.22}
        floatSpeed={0.75}
        floatOffset={4.5}
      />

      {/* Upper-Right Teal Pod (was sky-blue #7DD3FC) */}
      <SphericalPod
        position={[1.85, 1.35, -0.5]}
        color={BRAND_COLORS.tealPrimary}
        ringColor={BRAND_COLORS.tealGlow}
        radius={0.22}
        scale={[1, 0.7, 1]}
        floatSpeed={0.95}
        floatOffset={2.4}
      />

      {/* Mid-Right Teal Disc Pod (was cyan #38BDF8) */}
      <SphericalPod
        position={[1.5, -0.25, 0.7]}
        color="#00C880"
        ringColor={BRAND_COLORS.tealGlow}
        radius={0.24}
        scale={[1, 0.65, 1]}
        floatSpeed={0.85}
        floatOffset={0.8}
      />

      {/* Lower-Right Amber/White Sensor */}
      <SphericalPod
        position={[1.8, -0.85, 0.4]}
        color={BRAND_COLORS.plasticWhite}
        ringColor={BRAND_COLORS.accentAmber}
        radius={0.22}
        floatSpeed={1.1}
        floatOffset={1.7}
      />

      {/* 5. Dual-Tone Capsule Health Tracker */}
      <CapsuleTracker
        position={[1.85, 0.25, 0.6]}
        rotation={[0.3, -0.4, 0.5]}
        floatOffset={1.5}
      />

      {/* 6. Mini Pet Companion Toy Pod */}
      <MiniPetToyPod position={[-1.4, -0.15, 0.9]} />

      {/* 7. Zero-G Weightless Kibble Treats */}
      <FloatingKibble position={[1.5, 0.75, 0.1]} floatOffset={0.9} scale={1.2} />
      <FloatingKibble position={[-0.8, -0.7, 0.9]} floatOffset={2.5} scale={1.1} />

      {/* 8. Stylized Cat Figurine (Looking Up at Feeder) */}
      <StylizedCatCompanion position={[-1.0, -0.85, 0.9]} />
    </group>
  );
}

// ─── Parallax Group Wrapper ─────────────────────────────────────────────────
// Wraps children in a THREE.Group that tilts via MouseParallaxController.
function ParallaxGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  return (
    <group ref={groupRef}>
      <MouseParallaxController groupRef={groupRef} />
      {children}
    </group>
  );
}

// ─── Props Interface ────────────────────────────────────────────────────────
interface RightSceneProps {
  onContextLost?: () => void;
}

export const RightScene: React.FC<RightSceneProps> = ({ onContextLost }) => {
  const handleCreated = useCallback(
    (state: { gl: THREE.WebGLRenderer }) => {
      const canvas = state.gl.domElement;
      const onLost = (event: Event) => {
        event.preventDefault();
        console.warn("[SmartPetCare] WebGL context lost — remounting scene");
        onContextLost?.();
      };
      canvas.addEventListener("webglcontextlost", onLost);
      // Return cleanup so listener is removed when Canvas unmounts
      return () => canvas.removeEventListener("webglcontextlost", onLost);
    },
    [onContextLost]
  );

  return (
    <Canvas
      shadows
      camera={DEFAULT_CAMERA}
      dpr={RESPONSIVE_DPR}
      gl={{
        antialias: CANVAS_PERFORMANCE.antialias,
        powerPreference: CANVAS_PERFORMANCE.powerPreference,
        alpha: true,           // transparent — inherits dark bg from parent div
        premultipliedAlpha: false,
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ background: "transparent" }}
      className="w-full h-full"
      onCreated={handleCreated}
    >
      {/* Light mint background matching hero section */}
      <color attach="background" args={[CANVAS_BG]} />

      {/* ─── Professional Studio Lighting (tuned for light background) ─── */}
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#E8FAF4", "#A7F3D0", 0.6]} />

      {/* Key Studio Light — soft specular highlights along glossy curves */}
      <directionalLight
        position={[5, 7, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* Signature Teal Rim Light — highlighting product silhouettes */}
      <pointLight
        position={[-3.5, 2.5, -2.5]}
        intensity={2.0}
        color={BRAND_COLORS.tealPrimary}
        distance={12}
      />

      {/* Soft Cyan Fill Light */}
      <pointLight
        position={[3, -1.2, 2.5]}
        intensity={0.8}
        color={BRAND_COLORS.accentCyan}
        distance={10}
      />

      {/* Async boundary for 3D showcase and postprocessing */}
      <Suspense fallback={<SceneLoadingFallback />}>
        {/* Ground spatial reference shadow for zero-gravity depth */}
        <ContactShadows
          position={[0, -1.35, 0]}
          opacity={0.35}
          scale={20}
          blur={2.2}
          far={5}
        />

        {/* Mouse-parallax wrapper for entire showcase */}
        <ParallaxGroup>
          <ZeroGravityProductShowcase />
        </ParallaxGroup>

        {/* Postprocessing Bloom for glowing rings & indicator bars */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={BLOOM_CONFIG.luminanceThreshold}
            luminanceSmoothing={BLOOM_CONFIG.luminanceSmoothing}
            intensity={BLOOM_CONFIG.intensity}
          />
        </EffectComposer>
      </Suspense>

      <CameraController />
      <SceneCleanup />
    </Canvas>
  );
};

export default RightScene;
