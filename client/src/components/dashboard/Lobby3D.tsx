"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  useCursor,
  Html
} from "@react-three/drei";
import * as THREE from "three";
import { useRouter } from "next/navigation";

// --- Props for Interactive Stations ---
interface StationProps {
  position: [number, number, number];
  accentColor: string;
  label: string;
  icon: string;
  badgeSubtext: string;
  onClick: () => void;
  children: React.ReactNode;
}

const InteractiveStation: React.FC<StationProps> = ({
  position, accentColor, label, icon, badgeSubtext, onClick, children
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const clickTimeRef = useRef<number>(0);
  useCursor(hovered, 'pointer', 'auto');

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      if (isClicked) {
        // Punchy click bounce animation
        const elapsed = time - clickTimeRef.current;
        const progress = Math.min(elapsed / 0.6, 1);
        const bounceScale = 1 + Math.sin(progress * Math.PI) * 0.12;
        const bounceY = position[1] + Math.sin(progress * Math.PI) * 0.18;

        groupRef.current.scale.set(bounceScale, bounceScale, bounceScale);
        groupRef.current.position.y = bounceY;

        // Animate ground ripple wave
        if (rippleRef.current) {
          const rippleScale = 1 + progress * 1.5;
          rippleRef.current.scale.set(rippleScale, rippleScale, 1);
          const mat = rippleRef.current.material as THREE.MeshBasicMaterial;
          if (mat) {
            mat.opacity = Math.max(0, (1 - progress) * 0.85);
          }
        }
      } else {
        // Smooth hover transition
        const targetScale = hovered ? 1.05 : 1.0;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1], 0.12);

        if (rippleRef.current) {
          rippleRef.current.scale.set(1, 1, 1);
          const mat = rippleRef.current.material as THREE.MeshBasicMaterial;
          if (mat) mat.opacity = 0;
        }
      }
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isClicked) return;
    setIsClicked(true);
    clickTimeRef.current = performance.now() / 1000;
    onClick();
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Furniture & Medical Equipment */}
      {children}

      {/* Floating Interactive Badge (Warm Modern Clinic Theme) */}
      <Html center position={[0, 2.9, 0]} className="pointer-events-none select-none">
        <div
          className={`flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full border shadow-md backdrop-blur-md transition-all duration-300 cursor-pointer whitespace-nowrap ${isClicked
            ? "bg-emerald-600 text-white scale-110 border-white shadow-emerald-500/40 ring-4 ring-emerald-400/30 animate-pulse"
            : hovered
              ? "bg-white text-slate-900 scale-105 border-emerald-500 shadow-lg shadow-emerald-600/20 ring-2 ring-emerald-500/25"
              : "bg-white/95 text-slate-800 border-stone-200/90 hover:border-emerald-400 shadow-sm"
            }`}
        >
          <span className="text-base shrink-0">{icon}</span>
          <div className="flex flex-col text-left whitespace-nowrap">
            <span className="text-xs font-bold leading-tight tracking-tight text-slate-900">
              {isClicked ? `Đang mở ${label}...` : label}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium leading-none">
              {isClicked ? "Vui lòng chờ giây lát" : badgeSubtext}
            </span>
          </div>
        </div>
      </Html>

      {/* Ground Station Pedestal in Warm Ceramic Tone */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[2.0, 2.1, 0.08, 36]} />
        <meshStandardMaterial
          color={hovered || isClicked ? "#fdfbf7" : "#f4eee5"}
          roughness={0.4}
          metalness={0.02}
        />
      </mesh>

      {/* Station Outer Accent Ring */}
      <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.92, 2.02, 36]} />
        <meshStandardMaterial
          color={hovered || isClicked ? accentColor : "#cbd5e1"}
          emissive={hovered || isClicked ? accentColor : "#a8a29e"}
          emissiveIntensity={hovered || isClicked ? 0.7 : 0.08}
          roughness={0.3}
        />
      </mesh>

      {/* Ground Click Ripple Mesh */}
      <mesh ref={rippleRef} position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 2.15, 36]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};


// ==========================================
// 1. RECEPTION DESK (Lễ tân - Tiếp đón & Lịch hẹn)
// ==========================================
const ReceptionDesk = () => {
  return (
    <group position={[0, 0.08, 0]}>
      {/* Modern Warm White Reception Desk Base */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.95, 1.1]} />
        <meshStandardMaterial color="#faf8f5" roughness={0.3} metalness={0.02} />
      </mesh>

      {/* Front Soothing Sage Green Wainscot Accent Panel */}
      <mesh position={[0, 0.52, 0.56]}>
        <boxGeometry args={[2.3, 0.75, 0.04]} />
        <meshStandardMaterial color="#5b7569" roughness={0.4} />
      </mesh>

      {/* Warm Golden/Amber LED Accent Stripe on Front */}
      <mesh position={[0, 0.93, 0.57]}>
        <boxGeometry args={[2.3, 0.06, 0.02]} />
        <meshStandardMaterial color="#fef08a" emissive="#d97706" emissiveIntensity={0.65} />
      </mesh>

      {/* Natural Warm Oak Wood Countertop */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.06, 1.2]} />
        <meshStandardMaterial color="#c99d6f" roughness={0.35} />
      </mesh>

      {/* Desktop PC Monitor */}
      <group position={[-0.4, 1.1, 0.1]}>
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[0.75, 0.48, 0.05]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Screen with Clinic Schedule UI */}
        <mesh position={[0, 0.32, 0.03]}>
          <planeGeometry args={[0.7, 0.43]} />
          <meshStandardMaterial color="#f1f5f9" emissive="#10b981" emissiveIntensity={0.3} />
        </mesh>
        {/* Stand */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.04, 0.1, 0.16, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} />
        </mesh>
      </group>

      {/* Keyboard */}
      <mesh position={[-0.4, 1.09, 0.35]}>
        <boxGeometry args={[0.42, 0.02, 0.16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>

      {/* Brass Check-in Service Bell */}
      <mesh position={[0.7, 1.12, 0.2]} castShadow>
        <sphereGeometry args={[0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0.7, 1.08, 0.2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.02, 16]} />
        <meshStandardMaterial color="#78350f" metalness={0.8} />
      </mesh>

      {/* Desk Succulent Plant in Warm Clay Pot */}
      <group position={[0.65, 1.08, -0.2]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.09, 0.2, 16]} />
          <meshStandardMaterial color="#e7ded5" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#16a34a" roughness={0.6} />
        </mesh>
      </group>

      {/* Medical Reception Chair in Warm Wood & Earthy Tone */}
      <group position={[0, 0, -0.65]}>
        <mesh position={[0, 0.48, 0]} castShadow>
          <boxGeometry args={[0.55, 0.08, 0.5]} />
          <meshStandardMaterial color="#6d5345" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.8, -0.22]} castShadow>
          <boxGeometry args={[0.55, 0.6, 0.08]} />
          <meshStandardMaterial color="#6d5345" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.44, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
};


// ==========================================
// 2. DOCTOR EXAM ROOM (Phòng khám thú y)
// ==========================================
const DoctorRoomStation = () => {
  return (
    <group position={[0, 0.08, 0]}>
      {/* Warm White Veterinary Examination Table Base */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.8, 1.2]} />
        <meshStandardMaterial color="#faf8f5" roughness={0.25} metalness={0.02} />
      </mesh>

      {/* Soothing Deep Sage Teal Exam Mat */}
      <mesh position={[0, 0.93, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.06, 1.05]} />
        <meshStandardMaterial color="#52796f" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Chrome Table Legs */}
      {[-1.05, 1.05].map((x, i) =>
        [-0.45, 0.45].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.25, z]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.15} />
          </mesh>
        ))
      )}

      {/* Stethoscope resting on table */}
      <mesh position={[-0.6, 0.97, 0.2]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <ringGeometry args={[0.12, 0.16, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.6} />
      </mesh>

      {/* Medical Clipboard */}
      <mesh position={[0.6, 0.97, 0.1]} rotation={[-Math.PI / 2, 0, -0.2]}>
        <planeGeometry args={[0.35, 0.48]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>

      {/* Warm Overhanging Articulated Examination Lamp */}
      <group position={[0.9, 0, -0.5]}>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 2.2, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        <mesh position={[-0.35, 2.15, 0.3]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        <mesh position={[-0.6, 2.05, 0.4]} rotation={[0, 0, -Math.PI / 6]}>
          <coneGeometry args={[0.22, 0.22, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#fef08a" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* IV Drip Stand (Cột truyền dịch y tế) */}
      <group position={[-1.15, 0, -0.5]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 2.2, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[0.35, 0.03, 0.03]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        {/* Saline IV Drip Bag */}
        <mesh position={[-0.14, 1.95, 0]}>
          <boxGeometry args={[0.16, 0.26, 0.06]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.85} roughness={0.1} />
        </mesh>
        {/* Medical Green cross on IV bag */}
        <mesh position={[-0.14, 1.95, 0.035]}>
          <boxGeometry args={[0.08, 0.025, 0.005]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
        <mesh position={[-0.14, 1.95, 0.035]}>
          <boxGeometry args={[0.025, 0.08, 0.005]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
      </group>

      {/* Vital Signs Monitor */}
      <group position={[1.15, 0, 0.4]}>
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.3, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.35, 0]} castShadow>
          <boxGeometry args={[0.55, 0.42, 0.12]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Calming Green ECG Heartbeat Screen */}
        <mesh position={[0, 1.35, 0.07]}>
          <planeGeometry args={[0.48, 0.35]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
};


// ==========================================
// 3. VET PHARMACY (Nhà thuốc thú y & Vắc xin)
// ==========================================
const PharmacyStation = () => {
  return (
    <group position={[0, 0.08, 0]}>
      {/* Clean Warm Medical Cabinet */}
      <group position={[0, 0, -0.6]}>
        <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 2.3, 0.5]} />
          <meshStandardMaterial color="#faf8f5" roughness={0.25} metalness={0.02} />
        </mesh>
        {/* Warm cream interior background */}
        <mesh position={[0, 1.25, 0.05]}>
          <boxGeometry args={[2.3, 2.1, 0.3]} />
          <meshStandardMaterial color="#f5efe6" roughness={0.4} />
        </mesh>
        {/* Natural Warm Wood Shelves */}
        {[0.7, 1.25, 1.8].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0.1]}>
            <boxGeometry args={[2.3, 0.04, 0.35]} />
            <meshStandardMaterial color="#c99d6f" roughness={0.35} />
          </mesh>
        ))}

        {/* Medicine Boxes on Shelves in Coordinated Healthcare Palette */}
        <mesh position={[-0.7, 0.85, 0.1]} castShadow>
          <boxGeometry args={[0.26, 0.24, 0.14]} />
          <meshStandardMaterial color="#10b981" roughness={0.4} />
        </mesh>
        <mesh position={[-0.35, 0.85, 0.1]} castShadow>
          <boxGeometry args={[0.28, 0.2, 0.14]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </mesh>
        <mesh position={[0.2, 0.86, 0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.24, 12]} />
          <meshStandardMaterial color="#0d9488" roughness={0.3} />
        </mesh>
        <mesh position={[0.6, 0.85, 0.1]} castShadow>
          <boxGeometry args={[0.32, 0.22, 0.14]} />
          <meshStandardMaterial color="#5b7569" roughness={0.4} />
        </mesh>

        {/* Shelf 2 Vials and bottles */}
        <mesh position={[-0.6, 1.4, 0.1]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.22, 12]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.4, 0.1]} castShadow>
          <boxGeometry args={[0.38, 0.22, 0.14]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.4} />
        </mesh>
        <mesh position={[0.55, 1.4, 0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.24, 12]} />
          <meshStandardMaterial color="#10b981" roughness={0.3} />
        </mesh>
      </group>

      {/* Front Pharmacy Dispensing Counter */}
      <mesh position={[0, 0.5, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 0.9, 0.6]} />
        <meshStandardMaterial color="#faf8f5" roughness={0.25} />
      </mesh>

      {/* Front Medical Green Cross Emblem */}
      <mesh position={[0, 0.55, 0.71]}>
        <boxGeometry args={[0.35, 0.12, 0.02]} />
        <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.65} />
      </mesh>
      <mesh position={[0, 0.55, 0.71]}>
        <boxGeometry args={[0.12, 0.35, 0.02]} />
        <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.65} />
      </mesh>

      {/* Vaccine Transport Cooler Box on Counter */}
      <group position={[-0.55, 1.05, 0.4]}>
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.24, 0.25]} />
          <meshStandardMaterial color="#5b7569" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[0.4, 0.04, 0.27]} />
          <meshStandardMaterial color="#faf8f5" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};


// ==========================================
// 4. CASHIER & BILLING (Quầy thanh toán & Viện phí)
// ==========================================
const PaymentCounter = () => {
  return (
    <group position={[0, 0.08, 0]}>
      {/* Main Counter Desk in Warm White */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.95, 1.1]} />
        <meshStandardMaterial color="#faf8f5" roughness={0.3} metalness={0.02} />
      </mesh>

      {/* Front Calming Sage Green Panel */}
      <mesh position={[0, 0.52, 0.56]}>
        <boxGeometry args={[2.1, 0.75, 0.04]} />
        <meshStandardMaterial color="#5b7569" roughness={0.4} />
      </mesh>

      {/* Natural Oak Wood Countertop */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.06, 1.2]} />
        <meshStandardMaterial color="#c99d6f" roughness={0.35} />
      </mesh>

      {/* POS Touchscreen Cashier Terminal */}
      <group position={[-0.45, 1.15, 0.15]}>
        <mesh rotation={[-Math.PI / 7, 0, 0]} castShadow>
          <boxGeometry args={[0.48, 0.16, 0.45]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.12, -0.05]} rotation={[-Math.PI / 7, 0, 0]}>
          <planeGeometry args={[0.42, 0.26]} />
          <meshStandardMaterial color="#ecfdf5" emissive="#10b981" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Contactless Chip / QR Reader */}
      <mesh position={[0.4, 1.1, 0.2]} rotation={[-Math.PI / 10, 0, 0]} castShadow>
        <boxGeometry args={[0.26, 0.05, 0.35]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Thermal Receipt Printer with Paper Slip */}
      <group position={[0.4, 1.16, -0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.2, 0.28]} />
          <meshStandardMaterial color="#475569" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.11, 0.04]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[0.18, 0.14]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
};


// ==========================================
// 5. CENTER MASCOT PET (Bé cưng trung tâm & Khu chờ)
// ==========================================
interface CenterPetMascotProps {
  totalPets: number;
  onPetClick: () => void;
}

const CenterPetMascot: React.FC<CenterPetMascotProps> = ({ totalPets, onPetClick }) => {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const clickTimeRef = useRef<number>(0);
  useCursor(hovered, 'pointer', 'auto');

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Idle Breathing & Tail Wagging
    if (tailRef.current) {
      const wagSpeed = hovered ? 16 : 8;
      tailRef.current.rotation.y = Math.sin(time * wagSpeed) * 0.45;
    }

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(time * 2.5) * 0.06;
      headRef.current.position.y = 0.52 + Math.sin(time * 3) * 0.02;
    }

    if (groupRef.current) {
      if (clicked) {
        // Happy jump animation on click!
        const elapsed = time - clickTimeRef.current;
        const progress = Math.min(elapsed / 0.6, 1);
        const jumpY = Math.sin(progress * Math.PI) * 0.4;
        groupRef.current.position.y = jumpY;
        const jumpScale = 1 + Math.sin(progress * Math.PI) * 0.15;
        groupRef.current.scale.set(jumpScale, jumpScale, jumpScale);
      } else {
        const hoverScale = hovered ? 1.08 : 1.0;
        groupRef.current.scale.lerp(new THREE.Vector3(hoverScale, hoverScale, hoverScale), 0.1);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
      }
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (clicked) return;
    setClicked(true);
    clickTimeRef.current = performance.now() / 1000;
    onPetClick();
  };

  return (
    <group position={[0, 0, 0.6]}>
      {/* Cozy Circular Waiting Rug (Plush Warm Beige Texture) */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[2.3, 2.3, 0.04, 36]} />
        <meshStandardMaterial color="#e3d7c7" roughness={0.85} />
      </mesh>

      {/* Decorative Paw Pattern in Rug Center in Warm Mocha Brown */}
      <mesh position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 24]} />
        <meshStandardMaterial color="#7d5e46" />
      </mesh>
      {[-0.22, -0.08, 0.08, 0.22].map((x, i) => (
        <mesh key={i} position={[x, 0.052, -0.35 + Math.abs(x) * 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.09, 16]} />
          <meshStandardMaterial color="#7d5e46" />
        </mesh>
      ))}

      {/* Waiting Bench behind pet in Scandinavian Wood Finish */}
      <group position={[0, 0, -1.2]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.1, 0.7]} />
          <meshStandardMaterial color="#b48858" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.85, -0.3]} castShadow>
          <boxGeometry args={[2.4, 0.7, 0.1]} />
          <meshStandardMaterial color="#b48858" roughness={0.45} />
        </mesh>
        {[-1.0, 1.0].map((x, i) => (
          <mesh key={i} position={[x, 0.22, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.45, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Hospital Water Dispenser */}
      <group position={[-1.7, 0, -1.2]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#faf8f5" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.75, 0.18]}>
          <boxGeometry args={[0.26, 0.22, 0.08]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Clear Aqua Water Bottle on Top */}
        <mesh position={[0, 1.45, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.5, 16]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.75} roughness={0.1} />
        </mesh>
      </group>

      {/* Potted Indoor Hospital Plant with Lush Natural Leaves */}
      <group position={[1.7, 0, -1.2]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.2, 0.7, 16]} />
          <meshStandardMaterial color="#d7ccc8" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow>
          <sphereGeometry args={[0.4, 12, 12]} />
          <meshStandardMaterial color="#15803d" roughness={0.65} />
        </mesh>
      </group>

      {/* 🐾 THE CUTE 3D MASCOT PET */}
      <group
        ref={groupRef}
        position={[0, 0, 0.1]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* Pet Body */}
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[0.5, 0.38, 0.7]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.6} />
        </mesh>
        {/* White Chest */}
        <mesh position={[0, 0.3, 0.36]}>
          <planeGeometry args={[0.34, 0.26]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.5} />
        </mesh>

        {/* 4 Little Paws */}
        {[-0.2, 0.2].map((x, i) =>
          [-0.24, 0.24].map((z, j) => (
            <mesh key={`${i}-${j}`} position={[x, 0.1, z]} castShadow>
              <cylinderGeometry args={[0.07, 0.08, 0.2, 12]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.6} />
            </mesh>
          ))
        )}

        {/* Animated Head */}
        <group ref={headRef} position={[0, 0.52, 0.3]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.36, 0.38]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.6} />
          </mesh>
          {/* Snout */}
          <mesh position={[0, -0.06, 0.22]} castShadow>
            <boxGeometry args={[0.24, 0.18, 0.18]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.5} />
          </mesh>
          {/* Cute Black Nose */}
          <mesh position={[0, 0.01, 0.32]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} />
          </mesh>
          {/* Eyes */}
          {[-0.11, 0.11].map((x, i) => (
            <mesh key={i} position={[x, 0.08, 0.2]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial color="#0f172a" roughness={0.1} />
            </mesh>
          ))}
          {/* Perky Ears */}
          {[-0.15, 0.15].map((x, i) => (
            <group key={i} position={[x, 0.24, 0]}>
              <mesh rotation={[0, 0, x > 0 ? -0.2 : 0.2]} castShadow>
                <coneGeometry args={[0.1, 0.2, 4]} />
                <meshStandardMaterial color="#d97706" roughness={0.6} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Animated Wagging Tail */}
        <group ref={tailRef} position={[0, 0.4, -0.35]}>
          <mesh position={[0, 0.12, -0.1]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.03, 0.26, 12]} />
            <meshStandardMaterial color="#d97706" roughness={0.6} />
          </mesh>
        </group>

        {/* Floating Badge above Mascot Pet */}
        <Html center position={[0, 1.45, 0]} className="pointer-events-none select-none">
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full border shadow-md backdrop-blur-md transition-all duration-300 cursor-pointer whitespace-nowrap ${hovered || clicked
              ? "bg-amber-600 text-white scale-110 border-white shadow-amber-500/30 ring-2 ring-amber-400/30"
              : "bg-white/95 text-slate-800 border-amber-300 shadow-sm"
              }`}
          >
            <span className="text-sm">🐾</span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold leading-tight text-slate-900">
                {totalPets > 0 ? `${totalPets} bé cưng đang theo dõi` : "Chào mừng bạn!"}
              </span>
              <span className={`text-[9px] ${hovered || clicked ? "text-amber-100" : "text-amber-700 font-medium"}`}>
                Nhấp để xem hồ sơ sức khỏe
              </span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};


// ==========================================
// 6. ENCLOSED CLINIC ROOM IN SCANDINAVIAN THEME (Không gian ấm cúng, thân thiện)
// ==========================================
const EnclosedHospitalRoom = () => {
  const clockSecondRef = useRef<THREE.Mesh>(null);

  // Group and overlay refs for see-through cutaway walls
  const leftWallRef = useRef<THREE.Group>(null);
  const rightWallRef = useRef<THREE.Group>(null);
  const leftSignRef = useRef<HTMLDivElement>(null);

  // Current running opacities (1.0 = solid opaque)
  const leftOpacityRef = useRef<number>(1.0);
  const rightOpacityRef = useRef<number>(1.0);

  // Initialize alpha blending on wall materials once on mount
  useEffect(() => {
    [leftWallRef.current, rightWallRef.current].forEach((grp) => {
      if (!grp) return;
      grp.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              mat.transparent = true;
              mat.needsUpdate = true;
            });
          } else {
            mesh.material.transparent = true;
            mesh.material.needsUpdate = true;
          }
        }
      });
    });
  }, []);

  useFrame(({ camera, clock }) => {
    if (clockSecondRef.current) {
      clockSecondRef.current.rotation.z = -clock.getElapsedTime() * 1.2;
    }

    // Camera X position triggers see-through when user rotates:
    // When camera rotates left (camera.position.x < -3.0), left wall blocks vision -> fade it out!
    const leftTarget = camera.position.x < -3.0
      ? THREE.MathUtils.clamp((camera.position.x - (-8.0)) / 5.0, 0.12, 1.0)
      : 1.0;

    // When camera rotates right (camera.position.x > 3.0), right wall blocks vision -> fade it out!
    const rightTarget = camera.position.x > 3.0
      ? THREE.MathUtils.clamp((8.0 - camera.position.x) / 5.0, 0.12, 1.0)
      : 1.0;

    // Smoothly apply Left Wall see-through
    if (leftWallRef.current && Math.abs(leftOpacityRef.current - leftTarget) > 0.005) {
      leftOpacityRef.current = THREE.MathUtils.lerp(leftOpacityRef.current, leftTarget, 0.14);
      const op = leftOpacityRef.current;
      leftWallRef.current.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          if (mesh.userData.baseOpacity === undefined) {
            mesh.userData.baseOpacity = (mesh.material as THREE.Material).opacity ?? 1.0;
          }
          const base = mesh.userData.baseOpacity;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.opacity = base * op;
              m.depthWrite = op > 0.45;
            });
          } else {
            mesh.material.opacity = base * op;
            mesh.material.depthWrite = op > 0.45;
          }
        }
      });

      if (leftSignRef.current) {
        leftSignRef.current.style.opacity = Math.max(0.08, op).toFixed(2);
        leftSignRef.current.style.pointerEvents = op < 0.4 ? "none" : "auto";
      }
    }

    // Smoothly apply Right Wall see-through
    if (rightWallRef.current && Math.abs(rightOpacityRef.current - rightTarget) > 0.005) {
      rightOpacityRef.current = THREE.MathUtils.lerp(rightOpacityRef.current, rightTarget, 0.14);
      const op = rightOpacityRef.current;
      rightWallRef.current.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          if (mesh.userData.baseOpacity === undefined) {
            mesh.userData.baseOpacity = (mesh.material as THREE.Material).opacity ?? 1.0;
          }
          const base = mesh.userData.baseOpacity;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.opacity = base * op;
              m.depthWrite = op > 0.45;
            });
          } else {
            mesh.material.opacity = base * op;
            mesh.material.depthWrite = op > 0.45;
          }
        }
      });
    }
  });

  return (
    <group>
      {/* Warm Light Oak Wood Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 22]} />
        <meshStandardMaterial
          color="#ded2c3"
          roughness={0.65}
          metalness={0.02}
        />
      </mesh>

      {/* Subtle Warm Tile / Plank Joint Lines */}
      <gridHelper args={[26, 26, "#cbbba8", "#ddd3c4"]} position={[0, 0.01, 0]} />

      {/* ========================================================== */}
      {/* 1. BACK ENCLOSED WALL (Tường sau)                          */}
      {/* ========================================================== */}
      <group position={[0, 0, -11]}>
        {/* Upper Wall (Warm Off-White / Ivory) */}
        <mesh position={[0, 3.8, 0]} receiveShadow>
          <boxGeometry args={[26, 7.6, 0.4]} />
          <meshStandardMaterial color="#faf8f5" roughness={0.4} />
        </mesh>

        {/* Lower Wainscot (Soothing Sage Green Ốp tường) */}
        <mesh position={[0, 0.9, 0.21]} receiveShadow>
          <boxGeometry args={[26, 1.8, 0.05]} />
          <meshStandardMaterial color="#587568" roughness={0.35} />
        </mesh>

        {/* Polished Crisp White Moulding Chair Rail */}
        <mesh position={[0, 1.82, 0.23]}>
          <boxGeometry args={[26, 0.08, 0.04]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>

        {/* Warm Oak Baseboard along bottom */}
        <mesh position={[0, 0.1, 0.23]}>
          <boxGeometry args={[26, 0.2, 0.04]} />
          <meshStandardMaterial color="#8c6e54" roughness={0.35} />
        </mesh>

        {/* Main Hospital Signboard in Modern Forest & Slate Style */}
        <group position={[0, 4.8, 0.22]}>
          <mesh>
            <boxGeometry args={[10.5, 1.2, 0.06]} />
            <meshStandardMaterial color="#334155" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <boxGeometry args={[10.3, 1.0, 0.01]} />
            <meshStandardMaterial color="#243831" />
          </mesh>
          <Html center position={[0, 0, 0.05]} className="pointer-events-none select-none">
            <div className="flex items-center space-x-3 px-6 py-2 whitespace-nowrap text-white">
              <span className="text-2xl">🏥</span>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-white drop-shadow">
                  BỆNH VIỆN THÚ Y SMARTPETCARE
                </span>
                <span className="text-[10px] text-emerald-300 tracking-widest font-semibold uppercase">
                  VETERINARY HOSPITAL & WELLNESS CLINIC
                </span>
              </div>
            </div>
          </Html>
        </group>

        {/* Hospital Wall Clock */}
        <group position={[8.2, 4.8, 0.22]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
            <meshStandardMaterial color="#78716c" metalness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <circleGeometry args={[0.42, 32]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.1, 0.06]}>
            <boxGeometry args={[0.04, 0.2, 0.01]} />
            <meshStandardMaterial color="#1c1917" />
          </mesh>
          <mesh position={[0.08, 0, 0.06]}>
            <boxGeometry args={[0.16, 0.03, 0.01]} />
            <meshStandardMaterial color="#1c1917" />
          </mesh>
          <group ref={clockSecondRef} position={[0, 0, 0.07]}>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.015, 0.26, 0.01]} />
              <meshStandardMaterial color="#ef4444" />
            </mesh>
          </group>
        </group>
      </group>

      {/* Back upper beam */}
      <mesh position={[0, 7.4, -11]}>
        <boxGeometry args={[26, 0.4, 0.6]} />
        <meshStandardMaterial color="#8c6e54" />
      </mesh>

      {/* ========================================================== */}
      {/* 2. LEFT ENCLOSED WALL (Tường trái - Tự động xuyên thấu)     */}
      {/* ========================================================== */}
      <group ref={leftWallRef}>
        <group position={[-13, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          {/* Upper Wall */}
          <mesh position={[0, 3.8, 0]} receiveShadow>
            <boxGeometry args={[22, 7.6, 0.4]} />
            <meshStandardMaterial color="#faf8f5" roughness={0.4} />
          </mesh>
          {/* Lower Wainscot */}
          <mesh position={[0, 0.9, 0.21]} receiveShadow>
            <boxGeometry args={[22, 1.8, 0.05]} />
            <meshStandardMaterial color="#587568" roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.82, 0.23]}>
            <boxGeometry args={[22, 0.08, 0.04]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          {/* Hospital Double Emergency Doors (Cửa vào phòng Cấp cứu / ICU) */}
          <group position={[-1.5, 1.45, 0.22]}>
            {/* Outer Door Frame in Warm Wood */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[3.2, 2.9, 0.08]} />
              <meshStandardMaterial color="#574438" roughness={0.4} />
            </mesh>
            {/* Left Door */}
            <mesh position={[-0.75, 0, 0.04]} castShadow>
              <boxGeometry args={[1.4, 2.7, 0.05]} />
              <meshStandardMaterial color="#735c4c" roughness={0.4} />
            </mesh>
            {/* Right Door */}
            <mesh position={[0.75, 0, 0.04]} castShadow>
              <boxGeometry args={[1.4, 2.7, 0.05]} />
              <meshStandardMaterial color="#735c4c" roughness={0.4} />
            </mesh>
            {/* Glass Vision Panels on Doors */}
            <mesh position={[-0.75, 0.45, 0.07]}>
              <boxGeometry args={[0.5, 0.9, 0.02]} />
              <meshStandardMaterial color="#e2e8f0" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0.75, 0.45, 0.07]}>
              <boxGeometry args={[0.5, 0.9, 0.02]} />
              <meshStandardMaterial color="#e2e8f0" transparent opacity={0.5} />
            </mesh>
            {/* Chrome Push Bars */}
            <mesh position={[-0.75, -0.15, 0.09]}>
              <boxGeometry args={[1.1, 0.06, 0.04]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            <mesh position={[0.75, -0.15, 0.09]}>
              <boxGeometry args={[1.1, 0.06, 0.04]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            {/* Exit / Room Sign above Door */}
            <mesh position={[0, 1.65, 0.08]}>
              <boxGeometry args={[2.0, 0.35, 0.04]} />
              <meshStandardMaterial color="#284b3d" emissive="#16a34a" emissiveIntensity={0.35} />
            </mesh>
            <Html center position={[0, 1.65, 0.12]} className="pointer-events-none select-none">
              <div ref={leftSignRef} className="transition-opacity duration-150">
                <span className="text-[10px] font-bold text-white whitespace-nowrap uppercase tracking-wider">
                  🚪 CẤP CỨU & NỘI TRÚ (ICU)
                </span>
              </div>
            </Html>
          </group>

          {/* Medical Certifications / Charts on Left Wall */}
          <group position={[5.0, 3.8, 0.22]}>
            <mesh>
              <boxGeometry args={[1.2, 1.6, 0.03]} />
              <meshStandardMaterial color="#78716c" />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[1.05, 1.45]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
          <group position={[6.8, 3.8, 0.22]}>
            <mesh>
              <boxGeometry args={[1.2, 1.6, 0.03]} />
              <meshStandardMaterial color="#78716c" />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[1.05, 1.45]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        </group>

        {/* Left upper beam */}
        <mesh position={[-13, 7.4, 0]}>
          <boxGeometry args={[0.6, 0.4, 22]} />
          <meshStandardMaterial color="#8c6e54" />
        </mesh>
      </group>

      {/* ========================================================== */}
      {/* 3. RIGHT ENCLOSED WALL (Tường phải - Tự động xuyên thấu)    */}
      {/* ========================================================== */}
      <group ref={rightWallRef}>
        <group position={[13, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Upper Wall */}
          <mesh position={[0, 3.8, 0]} receiveShadow>
            <boxGeometry args={[22, 7.6, 0.4]} />
            <meshStandardMaterial color="#faf8f5" roughness={0.4} />
          </mesh>
          {/* Lower Wainscot */}
          <mesh position={[0, 0.9, 0.21]} receiveShadow>
            <boxGeometry args={[22, 1.8, 0.05]} />
            <meshStandardMaterial color="#587568" roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.82, 0.23]}>
            <boxGeometry args={[22, 0.08, 0.04]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          {/* Large Hospital Windows with Soft Daylight Tint Glass */}
          {[-3.5, 3.5].map((posZ, idx) => (
            <group key={idx} position={[posZ, 3.8, 0.22]}>
              {/* White Window Frame */}
              <mesh>
                <boxGeometry args={[3.8, 2.6, 0.06]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} />
              </mesh>
              {/* Soft Daylight Glass Panels */}
              <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[3.5, 2.3]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.4} roughness={0.1} />
              </mesh>
              {/* Window Cross Grids */}
              <mesh position={[0, 0, 0.035]}>
                <boxGeometry args={[3.5, 0.05, 0.02]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, 0, 0.035]}>
                <boxGeometry args={[0.05, 2.3, 0.02]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}
        </group>

        {/* Right upper beam */}
        <mesh position={[13, 7.4, 0]}>
          <boxGeometry args={[0.6, 0.4, 22]} />
          <meshStandardMaterial color="#8c6e54" />
        </mesh>
      </group>

      {/* ========================================================== */}
      {/* 4. CROSS CEILING OVERHEAD BEAMS                           */}
      {/* ========================================================== */}
      <group position={[0, 7.4, 0]}>
        {/* Cross Ceiling Hospital Warm LED Light Fixtures */}
        {[-5.0, 0, 5.0].map((z, idx) => (
          <group key={idx} position={[0, 0, z]}>
            {/* Beam bar connecting left and right */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[26, 0.12, 0.15]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            {/* Recessed Warm LED Panel Light in Center */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[6.0, 0.08, 0.6]} />
              <meshStandardMaterial color="#ffffff" emissive="#fef3c7" emissiveIntensity={0.7} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Gentle Sage Floor Ring connecting stations */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 3.86, 64]} />
        <meshStandardMaterial color="#88a096" emissive="#587568" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
};


// --- Fallback Loader for 3D ---
const CanvasLoader = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center space-y-2 bg-white/95 p-4 rounded-2xl shadow-lg border border-stone-200">
        <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-800">Đang tải không gian bệnh viện 3D...</p>
      </div>
    </Html>
  );
};


// --- Smooth Camera Controller for station click focus ---
function CameraFocusController({
  target,
  isFocusing
}: {
  target: THREE.Vector3 | null;
  isFocusing: boolean
}) {
  useFrame(({ camera }) => {
    if (isFocusing && target) {
      // Smoothly glide camera toward selected station
      const desiredCamPos = new THREE.Vector3(target.x * 0.75, target.y + 3.2, target.z + 5.5);
      camera.position.lerp(desiredCamPos, 0.08);
      camera.lookAt(target.x, target.y + 0.9, target.z);
    }
  });
  return null;
}


// ==========================================
// MAIN 3D HOSPITAL LOBBY COMPONENT
// ==========================================
export interface Lobby3DProps {
  totalPets?: number;
}

export default function Lobby3D({ totalPets = 0 }: Lobby3DProps) {
  const router = useRouter();
  const [focusTarget, setFocusTarget] = useState<THREE.Vector3 | null>(null);
  const [isFocusing, setIsFocusing] = useState(false);

  // Navigate with smooth click camera animation
  const handleStationClick = (targetPos: [number, number, number], route: string) => {
    const target = new THREE.Vector3(...targetPos);
    setFocusTarget(target);
    setIsFocusing(true);

    // Wait for the tactile click animation + camera glide
    setTimeout(() => {
      router.push(route);
    }, 620);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#fbf9f5]">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 9.5, 16.5], fov: 40 }}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15
        }}
      >
        <Suspense fallback={<CanvasLoader />}>
          {/* Warm Ambient Canvas Color */}
          <color attach="background" args={["#fbf9f5"]} />

          {/* Camera Smooth Focus Controller */}
          <CameraFocusController target={focusTarget} isFocusing={isFocusing} />

          {/* ========================================================== */}
          {/* WARM DAYLIGHT CLINIC LIGHTING SYSTEM                       */}
          {/* ========================================================== */}
          <ambientLight intensity={1.7} color="#fff6ec" />
          <directionalLight
            position={[10, 20, 14]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
            color="#fffdfa"
          />
          <pointLight position={[-8, 7, -6]} intensity={0.8} color="#fed7aa" />
          <pointLight position={[8, 7, 6]} intensity={0.8} color="#fef3c7" />
          <pointLight position={[0, 6.5, 0]} intensity={0.9} color="#ffffff" />

          {/* Centered Enclosed Hospital Room in Scandinavian Theme */}
          <group position={[0, 0, 0]}>
            {/* Enclosed Walls (Back, Left, Right), Floor, Clock & Ceiling Beams */}
            <EnclosedHospitalRoom />

            {/* Center Area: Mascot Pet, Waiting Bench, Water Dispenser, Plant */}
            <CenterPetMascot
              totalPets={totalPets}
              onPetClick={() => handleStationClick([0, 0.4, 0.6], "/pets")}
            />

            {/* ========================================================== */}
            {/* 4 INTERACTIVE HOSPITAL STATIONS                            */}
            {/* ========================================================== */}

            {/* 1. Lễ tân (Reception - Appointments) */}
            <InteractiveStation
              position={[-5.2, 0, -2.5]}
              accentColor="#10b981"
              label="Lễ tân"
              badgeSubtext="Đặt lịch & Quầy tiếp đón"
              icon="📅"
              onClick={() => handleStationClick([-5.2, 0.8, -2.5], "/appointments/create?from=lobby")}
            >
              <ReceptionDesk />
            </InteractiveStation>

            {/* 2. Phòng khám (Doctor Exam Room - Pets & Health) */}
            <InteractiveStation
              position={[5.2, 0, -2.5]}
              accentColor="#0d9488"
              label="Phòng khám"
              badgeSubtext="Hồ sơ & Sức khỏe thú cưng"
              icon="🩺"
              onClick={() => handleStationClick([5.2, 0.8, -2.5], "/pets")}
            >
              <DoctorRoomStation />
            </InteractiveStation>

            {/* 3. Nhà thuốc (Pharmacy - Vaccines & Services) */}
            <InteractiveStation
              position={[5.2, 0, 4.2]}
              accentColor="#16a34a"
              label="Nhà thuốc"
              badgeSubtext="Vắc xin & Dịch vụ khám"
              icon="💊"
              onClick={() => handleStationClick([5.2, 0.8, 4.2], "/services")}
            >
              <PharmacyStation />
            </InteractiveStation>

            {/* 4. Thanh toán (Cashier - Hospital Invoices) */}
            <InteractiveStation
              position={[-5.2, 0, 4.2]}
              accentColor="#d97706"
              label="Thanh toán"
              badgeSubtext="Hóa đơn viện phí"
              icon="💳"
              onClick={() => handleStationClick([-5.2, 0.8, 4.2], "/invoices")}
            >
              <PaymentCounter />
            </InteractiveStation>

            {/* Soft Warm Contact Shadows on Floor */}
            <ContactShadows
              position={[0, -0.01, 0]}
              opacity={0.28}
              scale={26}
              blur={2.0}
              far={5}
              resolution={512}
              color="#4a3e35"
            />
          </group>

          {/* OrbitControls: Giới hạn góc nhìn mặt tiền an toàn, không mở 360 */}
          {!isFocusing && (
            <OrbitControls
              makeDefault
              target={[0, 1.0, 0]}
              minPolarAngle={Math.PI / 4.5}
              maxPolarAngle={Math.PI / 2.3}
              minAzimuthAngle={-Math.PI / 5}
              maxAzimuthAngle={Math.PI / 5}
              minDistance={10}
              maxDistance={22}
              enablePan={false}
              dampingFactor={0.06}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Bottom Hint Banner in Warm Glassmorphism */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-700 text-xs pointer-events-none bg-white/95 px-4 py-2 rounded-full backdrop-blur-md border border-stone-200/90 shadow-md flex items-center space-x-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-medium">Kéo chuột để quan sát • Cuộn chuột để phóng to/thu nhỏ • Nhấp vào khu vực để chuyển trang</span>
      </div>
    </div>
  );
}
