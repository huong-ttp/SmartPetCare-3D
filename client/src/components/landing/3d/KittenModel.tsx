"use client";

import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { playPetSound } from "@/utils/petSound";

interface KittenModelProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  floatSpeed?: number;
  floatOffset?: number;
}

export const KittenModel: React.FC<KittenModelProps> = ({
  position,
  rotation = [0, 0, 0],
  scale = 0.026,
  floatSpeed = 0.95,
  floatOffset = 0.8,
}) => {
  const { scene } = useGLTF("/models3d/kitten.glb");
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const groupRef = useRef<THREE.Group>(null);
  const modelWrapperRef = useRef<THREE.Group>(null);
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const jumpTimer = useRef(0);
  const currentRotation = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime() * floatSpeed + floatOffset;

    let jumpY = 0;
    if (clicked) {
      jumpTimer.current += delta * 6;
      jumpY = Math.sin(jumpTimer.current) * 0.35;
      if (jumpTimer.current >= Math.PI) {
        jumpTimer.current = 0;
        setClicked(false);
      }
    }

    if (groupRef.current) {
      // Floating bobbing
      groupRef.current.position.y = position[1] + Math.sin(time) * 0.16 + jumpY;
      groupRef.current.position.x = position[0] + Math.cos(time * 0.6) * 0.08;
      groupRef.current.rotation.z = rotation[2] + Math.sin(time * 0.7) * 0.04;
    }

    // Model tracks mouse cursor
    if (modelWrapperRef.current) {
      const px = state.pointer.x;
      const py = state.pointer.y;

      const targetYaw = rotation[1] + THREE.MathUtils.clamp((px * 2 - position[0] * 0.3) * 0.55, -0.65, 0.65);
      const targetPitch = rotation[0] + THREE.MathUtils.clamp((-py * 2 + position[1] * 0.2) * 0.4, -0.4, 0.4);

      currentRotation.current.y = THREE.MathUtils.lerp(currentRotation.current.y, targetYaw, 0.08);
      currentRotation.current.x = THREE.MathUtils.lerp(currentRotation.current.x, targetPitch, 0.08);

      modelWrapperRef.current.rotation.y = currentRotation.current.y;
      modelWrapperRef.current.rotation.x = currentRotation.current.x;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setClicked(true);
    jumpTimer.current = 0;
    playPetSound(0.7);
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <group
        ref={modelWrapperRef}
        rotation={rotation}
        scale={scale * (hovered ? 1.1 : 1)}
      >
        <primitive object={clonedScene} position={[0, -0.2, 0]} />
      </group>
    </group>
  );
};

useGLTF.preload("/models3d/kitten.glb");
