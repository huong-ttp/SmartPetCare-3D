"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  OrbitControls, 
  Environment, 
  Text, 
  Float, 
  ContactShadows,
  useCursor,
  Bounds
} from "@react-three/drei";
import * as THREE from "three";
import { useRouter } from "next/navigation";

// --- Interactive Object Component ---
interface InteractiveObjectProps {
  position: [number, number, number];
  color: string;
  label: string;
  icon?: string;
  onClick: () => void;
  geometry: "box" | "cylinder" | "sphere";
}

const InteractiveObject: React.FC<InteractiveObjectProps> = ({ 
  position, color, label, icon, onClick, geometry 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, 'pointer', 'auto');

  // Simple animation on hover
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(
          hovered ? 1.1 : 1, 
          hovered ? 1.1 : 1, 
          hovered ? 1.1 : 1
        ), 
        0.1
      );
      if (geometry === "box") {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
          meshRef.current.rotation.y, 
          hovered ? Math.PI / 8 : 0, 
          0.1
        );
      }
    }
  });

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={() => setHovered(false)}
          castShadow
          receiveShadow
        >
          {geometry === "box" && <boxGeometry args={[2, 2, 2]} />}
          {geometry === "cylinder" && <cylinderGeometry args={[1, 1, 2.5, 32]} />}
          {geometry === "sphere" && <sphereGeometry args={[1.2, 32, 32]} />}
          
          <meshStandardMaterial 
            color={color} 
            emissive={hovered ? color : "#000000"} 
            emissiveIntensity={hovered ? 0.4 : 0} 
            roughness={0.2} 
            metalness={0.8} 
          />
        </mesh>

        {/* Label floating above the object */}
        <Text
          position={[0, 2, 0]}
          fontSize={0.4}
          color={hovered ? "#ffffff" : "#cccccc"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {icon ? `${icon} ${label}` : label}
        </Text>
      </Float>
    </group>
  );
};


// --- Main Scene ---
export default function Lobby3D() {
  const router = useRouter();

  return (
    <div className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden relative">
      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [0, 8, 15], fov: 45 }}>
        <color attach="background" args={["#0f172a"]} /> {/* slate-900 */}
        <fog attach="fog" args={["#0f172a", 15, 40]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          castShadow 
          position={[5, 10, 5]} 
          intensity={1.5} 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, 5, -10]} intensity={1} color="#0EA5B7" />
        <pointLight position={[10, 5, 10]} intensity={1} color="#10B981" />

        <Bounds fit clip observe margin={1.2}>
          <group position={[0, -1, 0]}>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.2} />
            </mesh>

            {/* Grid Helper for aesthetic */}
            <gridHelper args={[50, 50, "#334155", "#1e293b"]} position={[0, -0.99, 0]} />

            {/* Placeholders for interaction */}
            
            {/* Reception (Appointments) */}
            <InteractiveObject 
              position={[-4, 0, -2]} 
              color="#3b82f6" // blue
              label="Lễ tân" 
              icon="📅"
              geometry="box"
              onClick={() => router.push("/appointments")}
            />

            {/* Doctor Room (Pets/Medical) */}
            <InteractiveObject 
              position={[4, 0, -4]} 
              color="#10b981" // emerald
              label="Phòng khám" 
              icon="🐶"
              geometry="sphere"
              onClick={() => router.push("/pets")}
            />

            {/* Pharmacy (Vaccines/Services) */}
            <InteractiveObject 
              position={[5, 0, 3]} 
              color="#8b5cf6" // violet
              label="Nhà thuốc" 
              icon="💉"
              geometry="cylinder"
              onClick={() => router.push("/services")} // Assumes a services or pharmacy route
            />

            {/* Payment Counter (Invoices) */}
            <InteractiveObject 
              position={[-5, 0, 4]} 
              color="#f59e0b" // amber
              label="Thanh toán" 
              icon="💳"
              geometry="box"
              onClick={() => router.push("/invoices")}
            />
          </group>
        </Bounds>

        <ContactShadows position={[0, -1.9, 0]} opacity={0.4} scale={40} blur={2} far={4} />
        
        {/* OrbitControls to let user pan around the lobby */}
        <OrbitControls 
          makeDefault 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2 - 0.1}
          enableZoom={false}
          enablePan={false}
        />
        <Environment preset="city" />
      </Canvas>
      
      {/* Overlay Text instruction */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs pointer-events-none bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
        Kéo thả để xoay góc nhìn • Nhấn vào các khu vực để di chuyển
      </div>
    </div>
  );
}
