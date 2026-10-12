"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PetProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  name?: string;
  furColor?: string;
  earType?: "floppy" | "pointy";
  collarColor?: string;
  floatSpeed?: number;
  floatOffset?: number;
}

// ─── Floating Heart & Sparkle Particle ───────────────────────────────────────
function FloatingHeart({ active, position }: { active: boolean; position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef<number>(0);

  useFrame((state) => {
    if (!meshRef.current) return;
    if (active) {
      if (startTime.current === 0) startTime.current = state.clock.getElapsedTime();
      const elapsed = state.clock.getElapsedTime() - startTime.current;
      meshRef.current.visible = elapsed < 1.8;
      meshRef.current.position.y = position[1] + elapsed * 0.7;
      meshRef.current.position.x = position[0] + Math.sin(elapsed * 5) * 0.18;
      meshRef.current.scale.setScalar(Math.max(0, (1 - elapsed / 1.8) * 0.35));
    } else {
      startTime.current = 0;
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} position={position} visible={false}>
      <sphereGeometry args={[0.22, 16, 16]} />
      <meshStandardMaterial color="#FF3366" emissive="#FF3366" emissiveIntensity={0.9} />
    </mesh>
  );
}

// ─── 1. CUTE SHIBA / GOLDEN PUPPY ─────────────────────────────────────────────
export const CutePuppy: React.FC<PetProps> = ({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  name = "Mochi",
  furColor = "#F59E0B",
  earType = "pointy",
  collarColor = "#EF4444",
  floatSpeed = 1.0,
  floatOffset = 0,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);

  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const jumpTimer = useRef(0);
  const currentRotation = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime() * floatSpeed + floatOffset;

    let jumpY = 0;
    if (clicked) {
      jumpTimer.current += delta * 6;
      jumpY = Math.sin(jumpTimer.current) * 0.4;
      if (jumpTimer.current >= Math.PI) {
        jumpTimer.current = 0;
        setClicked(false);
      }
    }

    // Floating bobbing & gentle roll
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(time) * 0.18 + jumpY;
      groupRef.current.position.x = position[0] + Math.cos(time * 0.7) * 0.08;
      groupRef.current.rotation.z = rotation[2] + Math.sin(time * 0.8) * 0.05;
      groupRef.current.rotation.y = rotation[1] + Math.cos(time * 0.5) * 0.06;
    }

    // Happy tail wagging
    if (tailRef.current) {
      const wagSpeed = hovered || clicked ? 16 : 8;
      const wagAmp = hovered ? 0.6 : 0.4;
      tailRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * wagSpeed) * wagAmp;
    }

    // Ear subtle bounce
    if (leftEarRef.current && rightEarRef.current) {
      const earBounce = Math.sin(time * 2.5) * 0.08;
      leftEarRef.current.rotation.z = earBounce;
      rightEarRef.current.rotation.z = -earBounce;
    }

    // Head directly looks at mouse pointer
    if (headRef.current) {
      const px = state.pointer.x;
      const py = state.pointer.y;

      const targetYaw = THREE.MathUtils.clamp((px * 2.5 - position[0] * 0.3) * 0.7, -0.9, 0.9);
      const targetPitch = THREE.MathUtils.clamp((-py * 2.2 + position[1] * 0.25) * 0.6, -0.6, 0.6);

      currentRotation.current.y = THREE.MathUtils.lerp(currentRotation.current.y, targetYaw, 0.08);
      currentRotation.current.x = THREE.MathUtils.lerp(currentRotation.current.x, targetPitch, 0.08);

      headRef.current.rotation.y = currentRotation.current.y;
      headRef.current.rotation.x = currentRotation.current.x;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setClicked(true);
    jumpTimer.current = 0;
  };

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale * (hovered ? 1.08 : 1)}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <FloatingHeart active={clicked || hovered} position={[0, 0.9, 0]} />

      {/* ─── PUPPY BODY (Chubby Horizontal Puppy Torso) ─── */}
      <group position={[0, -0.05, 0]}>
        {/* Main Torso */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.26, 0.38, 16, 20]} />
          <meshPhysicalMaterial color={furColor} roughness={0.4} clearcoat={0.3} />
        </mesh>

        {/* Cream Belly */}
        <mesh position={[0, -0.08, 0.02]} scale={[0.85, 0.6, 0.9]}>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshPhysicalMaterial color="#FEF3C7" roughness={0.45} />
        </mesh>

        {/* Red Collar */}
        <mesh position={[0, 0.16, 0.18]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.22, 0.035, 16, 32]} />
          <meshStandardMaterial color={collarColor} roughness={0.3} />
        </mesh>
        {/* Golden Bell */}
        <mesh position={[0, 0.04, 0.34]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#FBBF24" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* ─── 4 CUTE PUPPY PAWS ─── */}
        <mesh position={[-0.16, -0.24, 0.18]} castShadow>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#FFFBEB" roughness={0.4} />
        </mesh>
        <mesh position={[0.16, -0.24, 0.18]} castShadow>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#FFFBEB" roughness={0.4} />
        </mesh>
        <mesh position={[-0.17, -0.22, -0.16]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#FFFBEB" roughness={0.4} />
        </mesh>
        <mesh position={[0.17, -0.22, -0.16]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#FFFBEB" roughness={0.4} />
        </mesh>

        {/* ─── WAGGING TAIL ─── */}
        <group ref={tailRef} position={[0, 0.1, -0.28]} rotation={[-0.7, 0, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.05, 0.24, 12, 16]} />
            <meshStandardMaterial color={furColor} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color="#FFFBEB" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* ─── PUPPY HEAD GROUP (Directly Looks at Mouse Cursor) ─── */}
      <group ref={headRef} position={[0, 0.38, 0.16]}>
        {/* Head Sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.33, 28, 28]} />
          <meshPhysicalMaterial color={furColor} roughness={0.4} clearcoat={0.3} />
        </mesh>

        {/* Cream Muzzle */}
        <mesh position={[0, -0.06, 0.22]} scale={[1.2, 0.85, 1]}>
          <sphereGeometry args={[0.18, 20, 20]} />
          <meshPhysicalMaterial color="#FEF3C7" roughness={0.4} />
        </mesh>

        {/* Black Button Nose */}
        <mesh position={[0, -0.02, 0.38]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.1} metalness={0.3} />
        </mesh>

        {/* Left Puppy Eye */}
        <group position={[-0.13, 0.08, 0.28]}>
          <mesh>
            <sphereGeometry args={[0.048, 18, 18]} />
            <meshStandardMaterial color="#0F172A" roughness={0.1} />
          </mesh>
          <mesh position={[-0.015, 0.018, 0.038]}>
            <sphereGeometry args={[0.016, 10, 10]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.012, -0.012, 0.038]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>

        {/* Right Puppy Eye */}
        <group position={[0.13, 0.08, 0.28]}>
          <mesh>
            <sphereGeometry args={[0.048, 18, 18]} />
            <meshStandardMaterial color="#0F172A" roughness={0.1} />
          </mesh>
          <mesh position={[-0.015, 0.018, 0.038]}>
            <sphereGeometry args={[0.016, 10, 10]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.012, -0.012, 0.038]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>

        {/* Ears */}
        {earType === "pointy" ? (
          <>
            <group ref={leftEarRef} position={[-0.2, 0.28, 0]}>
              <mesh rotation={[0, 0, 0.25]}>
                <coneGeometry args={[0.11, 0.24, 16]} />
                <meshStandardMaterial color={furColor} roughness={0.4} />
              </mesh>
            </group>
            <group ref={rightEarRef} position={[0.2, 0.28, 0]}>
              <mesh rotation={[0, 0, -0.25]}>
                <coneGeometry args={[0.11, 0.24, 16]} />
                <meshStandardMaterial color={furColor} roughness={0.4} />
              </mesh>
            </group>
          </>
        ) : (
          <>
            <group ref={leftEarRef} position={[-0.28, 0.16, 0.02]}>
              <mesh rotation={[0.2, 0, 0.4]}>
                <capsuleGeometry args={[0.075, 0.22, 12, 16]} />
                <meshStandardMaterial color={furColor} roughness={0.4} />
              </mesh>
            </group>
            <group ref={rightEarRef} position={[0.28, 0.16, 0.02]}>
              <mesh rotation={[0.2, 0, -0.4]}>
                <capsuleGeometry args={[0.075, 0.22, 12, 16]} />
                <meshStandardMaterial color={furColor} roughness={0.4} />
              </mesh>
            </group>
          </>
        )}
      </group>
    </group>
  );
};

// ─── 2. CUTE FLUFFY CAT ───────────────────────────────────────────────────────
export const CuteKitty: React.FC<PetProps> = ({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  name = "Bông",
  furColor = "#FFFFFF",
  collarColor = "#00A86B",
  floatSpeed = 0.9,
  floatOffset = 1.5,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const jumpTimer = useRef(0);
  const currentRotation = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime() * floatSpeed + floatOffset;

    let jumpY = 0;
    if (clicked) {
      jumpTimer.current += delta * 6;
      jumpY = Math.sin(jumpTimer.current) * 0.4;
      if (jumpTimer.current >= Math.PI) {
        jumpTimer.current = 0;
        setClicked(false);
      }
    }

    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(time) * 0.16 + jumpY;
      groupRef.current.position.x = position[0] + Math.cos(time * 0.6) * 0.07;
      groupRef.current.rotation.z = rotation[2] + Math.sin(time * 0.7) * 0.04;
      groupRef.current.rotation.y = rotation[1] + Math.cos(time * 0.4) * 0.06;
    }

    // Graceful curling tail wave
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 4) * 0.35;
      tailRef.current.rotation.z = 0.3 + Math.cos(state.clock.getElapsedTime() * 3) * 0.15;
    }

    // Head directly looks at mouse pointer
    if (headRef.current) {
      const px = state.pointer.x;
      const py = state.pointer.y;

      const targetYaw = THREE.MathUtils.clamp((px * 2.5 - position[0] * 0.3) * 0.7, -0.9, 0.9);
      const targetPitch = THREE.MathUtils.clamp((-py * 2.2 + position[1] * 0.25) * 0.6, -0.6, 0.6);

      currentRotation.current.y = THREE.MathUtils.lerp(currentRotation.current.y, targetYaw, 0.08);
      currentRotation.current.x = THREE.MathUtils.lerp(currentRotation.current.x, targetPitch, 0.08);

      headRef.current.rotation.y = currentRotation.current.y;
      headRef.current.rotation.x = currentRotation.current.x;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setClicked(true);
    jumpTimer.current = 0;
  };

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale * (hovered ? 1.08 : 1)}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <FloatingHeart active={clicked || hovered} position={[0, 0.9, 0]} />

      {/* ─── CAT BODY ─── */}
      <group position={[0, -0.05, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.22, 0.36, 16, 20]} />
          <meshPhysicalMaterial color={furColor} roughness={0.35} clearcoat={0.3} />
        </mesh>

        {/* Collar & Bell */}
        <mesh position={[0, 0.15, 0.16]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.2, 0.03, 16, 32]} />
          <meshStandardMaterial color={collarColor} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.04, 0.31]}>
          <sphereGeometry args={[0.048, 16, 16]} />
          <meshStandardMaterial color="#FBBF24" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Paws */}
        <mesh position={[-0.13, -0.22, 0.16]} castShadow>
          <sphereGeometry args={[0.075, 14, 14]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        <mesh position={[0.13, -0.22, 0.16]} castShadow>
          <sphereGeometry args={[0.075, 14, 14]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        <mesh position={[-0.14, -0.2, -0.15]} castShadow>
          <sphereGeometry args={[0.08, 14, 14]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        <mesh position={[0.14, -0.2, -0.15]} castShadow>
          <sphereGeometry args={[0.08, 14, 14]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>

        {/* Curved Tail */}
        <group ref={tailRef} position={[0, 0.08, -0.25]} rotation={[-0.6, 0, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.04, 0.36, 12, 20]} />
            <meshStandardMaterial color={furColor} roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* ─── HEAD GROUP (Directly Looks at Mouse Cursor) ─── */}
      <group ref={headRef} position={[0, 0.36, 0.14]}>
        {/* Cat Head Sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.3, 28, 28]} />
          <meshPhysicalMaterial color={furColor} roughness={0.35} clearcoat={0.3} />
        </mesh>

        {/* Ears with Pink Inner Pads */}
        <mesh position={[-0.16, 0.25, 0.02]} rotation={[0, 0, 0.25]}>
          <coneGeometry args={[0.09, 0.2, 16]} />
          <meshStandardMaterial color={furColor} roughness={0.4} />
        </mesh>
        <mesh position={[-0.16, 0.24, 0.05]} rotation={[0, 0, 0.25]}>
          <coneGeometry args={[0.06, 0.15, 16]} />
          <meshStandardMaterial color="#F472B6" roughness={0.5} />
        </mesh>

        <mesh position={[0.16, 0.25, 0.02]} rotation={[0, 0, -0.25]}>
          <coneGeometry args={[0.09, 0.2, 16]} />
          <meshStandardMaterial color={furColor} roughness={0.4} />
        </mesh>
        <mesh position={[0.16, 0.24, 0.05]} rotation={[0, 0, -0.25]}>
          <coneGeometry args={[0.06, 0.15, 16]} />
          <meshStandardMaterial color="#F472B6" roughness={0.5} />
        </mesh>

        {/* Tiny Pink Nose */}
        <mesh position={[0, -0.01, 0.3]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.035, 0.035, 12]} />
          <meshStandardMaterial color="#F472B6" roughness={0.3} />
        </mesh>

        {/* Big Aqua Eyes */}
        <group position={[-0.12, 0.06, 0.26]}>
          <mesh>
            <sphereGeometry args={[0.046, 18, 18]} />
            <meshStandardMaterial color="#0EA5E9" roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0.035]} scale={[0.5, 1, 0.2]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color="#020617" />
          </mesh>
          <mesh position={[-0.012, 0.015, 0.04]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>

        <group position={[0.12, 0.06, 0.26]}>
          <mesh>
            <sphereGeometry args={[0.046, 18, 18]} />
            <meshStandardMaterial color="#0EA5E9" roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0.035]} scale={[0.5, 1, 0.2]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color="#020617" />
          </mesh>
          <mesh position={[-0.012, 0.015, 0.04]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>
      </group>
    </group>
  );
};
