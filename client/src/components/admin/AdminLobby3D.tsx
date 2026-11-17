"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  OrbitControls, 
  useCursor, 
  Html,
  ContactShadows 
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { AdminOverview } from "@/services/adminService";

export type AdminStationId = "users" | "appointments" | "services" | "finance";

interface AdminLobby3DProps {
  overview?: AdminOverview;
  selectedStation?: AdminStationId | null;
  onSelectStation?: (stationId: AdminStationId | null) => void;
}

// =========================================================================
// CAMERA CONTROLLER WITH SMOOTH LERP FOR STATION INSPECTION
// =========================================================================
interface CameraControllerProps {
  selectedStation: AdminStationId | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

const STATION_CAMERA_TARGETS: Record<AdminStationId, { pos: [number, number, number]; lookAt: [number, number, number] }> = {
  users: {
    pos: [-5.0, 3.8, 1.8],
    lookAt: [-5.5, 1.1, -3.5],
  },
  appointments: {
    pos: [5.0, 3.8, 1.8],
    lookAt: [5.5, 1.1, -3.5],
  },
  finance: {
    pos: [-5.0, 4.0, 8.8],
    lookAt: [-5.5, 1.1, 4.0],
  },
  services: {
    pos: [5.0, 4.0, 8.8],
    lookAt: [5.5, 1.1, 4.0],
  },
};

const DEFAULT_CAMERA = {
  pos: new THREE.Vector3(0, 10.5, 16.5),
  lookAt: new THREE.Vector3(0, 1.0, 0),
};

const CameraController: React.FC<CameraControllerProps> = ({ selectedStation, controlsRef }) => {
  const { camera } = useThree();
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    isTransitioningRef.current = true;
    const timer = setTimeout(() => {
      isTransitioningRef.current = false;
    }, 1200);
    return () => clearTimeout(timer);
  }, [selectedStation]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls || !isTransitioningRef.current) return;

    if (selectedStation && STATION_CAMERA_TARGETS[selectedStation]) {
      const targetConfig = STATION_CAMERA_TARGETS[selectedStation];
      const targetPos = new THREE.Vector3(...targetConfig.pos);
      const targetLookAt = new THREE.Vector3(...targetConfig.lookAt);

      camera.position.lerp(targetPos, 0.08);
      controls.target.lerp(targetLookAt, 0.08);
      controls.update();
    } else if (!selectedStation) {
      camera.position.lerp(DEFAULT_CAMERA.pos, 0.06);
      controls.target.lerp(DEFAULT_CAMERA.lookAt, 0.06);
      controls.update();
    }
  });

  return null;
};

// =========================================================================
// INTERACTIVE CLINIC STATION WRAPPER (Hit-Box + Clinic Pedestal + Badges)
// =========================================================================
interface StationProps {
  id: AdminStationId;
  position: [number, number, number];
  accentColor: string;
  label: string;
  icon: string;
  badgeSubtext: string;
  statBadge?: string;
  isSelected: boolean;
  onSelect: (id: AdminStationId) => void;
  children: React.ReactNode;
}

const InteractiveAdminStation: React.FC<StationProps> = ({
  id,
  position,
  accentColor,
  label,
  icon,
  badgeSubtext,
  statBadge,
  isSelected,
  onSelect,
  children,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, "pointer", "auto");

  useFrame(() => {
    if (groupRef.current) {
      const targetScale = isSelected ? 1.05 : hovered ? 1.025 : 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    }
    if (ringRef.current && (isSelected || hovered)) {
      ringRef.current.rotation.z += 0.015;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 100% Reliable Invisible Hit-Box covering entire station */}
      <mesh
        position={[0, 1.4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[2.4, 2.4, 3.0, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Realistic Hospital Furniture & Medical Equipment */}
      {children}

      {/* Floating Modern Clinic Badge & Live Stats */}
      <Html center position={[0, 3.25, 0]} className="select-none z-10 pointer-events-auto">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(id);
          }}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 cursor-pointer ${
            isSelected ? "scale-110 drop-shadow-xl" : hovered ? "scale-105" : "scale-100"
          }`}
        >
          {/* Main Station Pill in Warm Clinic Aesthetic */}
          <div
            className={`flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full border shadow-lg backdrop-blur-md whitespace-nowrap transition-all ${
              isSelected
                ? "bg-slate-900 text-white border-emerald-400 ring-4 ring-emerald-500/30 shadow-emerald-600/30"
                : hovered
                ? "bg-white text-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-400/25"
                : "bg-white/95 text-slate-800 border-stone-200/90 shadow-sm"
            }`}
          >
            <span className="text-base shrink-0">{icon}</span>
            <div className="flex flex-col text-left whitespace-nowrap">
              <span className={`text-xs font-bold leading-tight tracking-tight ${isSelected ? "text-white" : "text-slate-900"}`}>
                {label}
              </span>
              <span className={`text-[10px] font-medium leading-none ${isSelected ? "text-emerald-300" : "text-emerald-700"}`}>
                {badgeSubtext}
              </span>
            </div>
            {isSelected && (
              <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            )}
          </div>

          {/* Real-time KPI Data Badge */}
          {statBadge && (
            <div
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-sm border transition-all ${
                isSelected
                  ? "bg-emerald-600 text-white border-emerald-400"
                  : hovered
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-white/90 text-emerald-800 border-stone-200"
              }`}
            >
              {statBadge}
            </div>
          )}

          {/* Hover Hint */}
          {(hovered || isSelected) && (
            <span className="text-[9px] font-semibold text-slate-600 bg-white/95 px-2 py-0.5 rounded-md border border-stone-200 shadow-sm animate-fade-in">
              {isSelected ? "Đang chọn trạm • Nhấn 'Toàn cảnh' để thoát" : "Nhấn để kiểm tra chi tiết"}
            </span>
          )}
        </div>
      </Html>

      {/* Warm Ceramic Hospital Pedestal */}
      <mesh
        position={[0, 0.04, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[2.1, 2.2, 0.08, 36]} />
        <meshStandardMaterial
          color={hovered || isSelected ? "#fdfbf7" : "#f4eee5"}
          roughness={0.4}
          metalness={0.02}
        />
      </mesh>

      {/* Station Outer Accent Ring */}
      <mesh ref={ringRef} position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.02, 2.12, 36]} />
        <meshStandardMaterial
          color={hovered || isSelected ? accentColor : "#cbd5e1"}
          emissive={hovered || isSelected ? accentColor : "#a8a29e"}
          emissiveIntensity={hovered || isSelected ? 0.7 : 0.08}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
};

// =========================================================================
// 1. RECEPTION DESK & USERS STATION (Quầy Lễ Tân & Tiếp Đón)
// =========================================================================
const ReceptionDeskStation = () => {
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
        <mesh position={[0, 0.32, 0.03]}>
          <planeGeometry args={[0.7, 0.43]} />
          <meshStandardMaterial color="#f1f5f9" emissive="#10b981" emissiveIntensity={0.3} />
        </mesh>
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

// =========================================================================
// 2. DOCTOR EXAM ROOM & APPOINTMENTS (Phòng Khám Thú Y & Bác Sĩ)
// =========================================================================
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
          <meshStandardMaterial color="#ffffff" emissive="#fef08a" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* IV Drip Stand */}
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
        <mesh position={[-0.14, 1.95, 0]}>
          <boxGeometry args={[0.16, 0.26, 0.06]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.85} roughness={0.1} />
        </mesh>
        {/* Medical Green Cross on IV bag */}
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
        <mesh position={[0, 1.35, 0.07]}>
          <planeGeometry args={[0.48, 0.35]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
};

// =========================================================================
// 3. VET PHARMACY & VACCINES (Nhà Thuốc Thú Y & Vắc Xin)
// =========================================================================
const PharmacyStation = () => {
  return (
    <group position={[0, 0.08, 0]}>
      {/* Clean Warm Medical Cabinet */}
      <group position={[0, 0, -0.6]}>
        <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 2.3, 0.5]} />
          <meshStandardMaterial color="#faf8f5" roughness={0.25} metalness={0.02} />
        </mesh>
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

        {/* Medicine Boxes on Shelves */}
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

// =========================================================================
// 4. CASHIER & FINANCIAL HUB (Quầy Thu Ngân & Viện Phí)
// =========================================================================
const PaymentCounterStation = () => {
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

// =========================================================================
// 5. CENTER CLINIC LOUNGE & PET MASCOT (Khu vực trung tâm phòng khám)
// =========================================================================
interface CenterClinicProps {
  totalPets: number;
}

const CenterClinicIsland: React.FC<CenterClinicProps> = ({ totalPets }) => {
  return (
    <group position={[0, 0.04, 0.2]}>
      {/* Soft Woven Clinic Area Rug */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.2, 0.02, 36]} />
        <meshStandardMaterial color="#e5ddd0" roughness={0.8} />
      </mesh>

      {/* Center Medical Kiosk Pod / Information Pedestal */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.85, 24]} />
        <meshStandardMaterial color="#faf8f5" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.58, 0.05, 24]} />
        <meshStandardMaterial color="#c99d6f" roughness={0.35} />
      </mesh>

      {/* Center Digital Clinic Tablet */}
      <group position={[0, 1.05, 0]} rotation={[-0.3, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.38, 0.04]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.5, 0.33]} />
          <meshStandardMaterial color="#ecfdf5" emissive="#10b981" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Center Clinic Status Pill */}
      <Html center position={[0, 1.55, 0]} className="pointer-events-none select-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-stone-200 shadow-md backdrop-blur-md whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-800 tracking-wide">
            {totalPets > 0 ? `${totalPets} Thú Cưng Đang Chăm Sóc` : "Hệ Thống Sẵn Sàng Tiếp Đón"}
          </span>
        </div>
      </Html>
    </group>
  );
};

// =========================================================================
// 6. ENCLOSED VETERINARY CLINIC ROOM (Căn phòng phòng khám thú y thực tế)
// =========================================================================
const EnclosedHospitalRoom = () => {
  const clockSecondRef = useRef<THREE.Mesh>(null);
  const leftWallRef = useRef<THREE.Group>(null);
  const rightWallRef = useRef<THREE.Group>(null);
  const leftOpacityRef = useRef<number>(1.0);
  const rightOpacityRef = useRef<number>(1.0);

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

    const leftTarget = camera.position.x < -3.0
      ? THREE.MathUtils.clamp((camera.position.x - (-8.0)) / 5.0, 0.15, 1.0)
      : 1.0;

    const rightTarget = camera.position.x > 3.0
      ? THREE.MathUtils.clamp((8.0 - camera.position.x) / 5.0, 0.15, 1.0)
      : 1.0;

    if (leftWallRef.current && Math.abs(leftOpacityRef.current - leftTarget) > 0.005) {
      leftOpacityRef.current = THREE.MathUtils.lerp(leftOpacityRef.current, leftTarget, 0.14);
      const op = leftOpacityRef.current;
      leftWallRef.current.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.opacity = op;
              m.depthWrite = op > 0.45;
            });
          } else {
            mesh.material.opacity = op;
            mesh.material.depthWrite = op > 0.45;
          }
        }
      });
    }

    if (rightWallRef.current && Math.abs(rightOpacityRef.current - rightTarget) > 0.005) {
      rightOpacityRef.current = THREE.MathUtils.lerp(rightOpacityRef.current, rightTarget, 0.14);
      const op = rightOpacityRef.current;
      rightWallRef.current.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.opacity = op;
              m.depthWrite = op > 0.45;
            });
          } else {
            mesh.material.opacity = op;
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
        <meshStandardMaterial color="#ded2c3" roughness={0.65} metalness={0.02} />
      </mesh>

      {/* Subtle Warm Tile / Plank Joint Lines */}
      <gridHelper args={[26, 26, "#cbbba8", "#ddd3c4"]} position={[0, 0.01, 0]} />

      {/* ================= 1. BACK ENCLOSED WALL ================= */}
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

        {/* Warm Oak Baseboard */}
        <mesh position={[0, 0.1, 0.23]}>
          <boxGeometry args={[26, 0.2, 0.04]} />
          <meshStandardMaterial color="#8c6e54" roughness={0.35} />
        </mesh>

        {/* Main Hospital Signboard */}
        <group position={[0, 4.8, 0.22]}>
          <mesh>
            <boxGeometry args={[11.5, 1.2, 0.06]} />
            <meshStandardMaterial color="#334155" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <boxGeometry args={[11.3, 1.0, 0.01]} />
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
                  TRUNG TÂM QUẢN TRỊ & ĐIỀU HÀNH BỆNH VIỆN THÚ Y
                </span>
              </div>
            </div>
          </Html>
        </group>

        {/* Hospital Wall Clock */}
        <group position={[8.5, 4.8, 0.22]}>
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

      {/* ================= 2. LEFT WALL (ICU Emergency Doors) ================= */}
      <group ref={leftWallRef}>
        <group position={[-13, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 3.8, 0]} receiveShadow>
            <boxGeometry args={[22, 7.6, 0.4]} />
            <meshStandardMaterial color="#faf8f5" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.9, 0.21]} receiveShadow>
            <boxGeometry args={[22, 1.8, 0.05]} />
            <meshStandardMaterial color="#587568" roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.82, 0.23]}>
            <boxGeometry args={[22, 0.08, 0.04]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          {/* Double Emergency Doors */}
          <group position={[-1.5, 1.45, 0.22]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[3.2, 2.9, 0.08]} />
              <meshStandardMaterial color="#574438" roughness={0.4} />
            </mesh>
            <mesh position={[-0.75, 0, 0.04]} castShadow>
              <boxGeometry args={[1.4, 2.7, 0.05]} />
              <meshStandardMaterial color="#735c4c" roughness={0.4} />
            </mesh>
            <mesh position={[0.75, 0, 0.04]} castShadow>
              <boxGeometry args={[1.4, 2.7, 0.05]} />
              <meshStandardMaterial color="#735c4c" roughness={0.4} />
            </mesh>
            <mesh position={[-0.75, 0.45, 0.07]}>
              <boxGeometry args={[0.5, 0.9, 0.02]} />
              <meshStandardMaterial color="#e2e8f0" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0.75, 0.45, 0.07]}>
              <boxGeometry args={[0.5, 0.9, 0.02]} />
              <meshStandardMaterial color="#e2e8f0" transparent opacity={0.5} />
            </mesh>
            {/* Exit / Room Sign */}
            <mesh position={[0, 1.65, 0.08]}>
              <boxGeometry args={[2.0, 0.35, 0.04]} />
              <meshStandardMaterial color="#284b3d" emissive="#16a34a" emissiveIntensity={0.35} />
            </mesh>
            <Html center position={[0, 1.65, 0.12]} className="pointer-events-none select-none">
              <span className="text-[10px] font-bold text-white whitespace-nowrap uppercase tracking-wider">
                🚪 PHÒNG NỘI TRÚ & CẤP CỨU
              </span>
            </Html>
          </group>
        </group>

        {/* Left upper beam */}
        <mesh position={[-13, 7.4, 0]}>
          <boxGeometry args={[0.6, 0.4, 22]} />
          <meshStandardMaterial color="#8c6e54" />
        </mesh>
      </group>

      {/* ================= 3. RIGHT WALL (Daylight Windows) ================= */}
      <group ref={rightWallRef}>
        <group position={[13, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 3.8, 0]} receiveShadow>
            <boxGeometry args={[22, 7.6, 0.4]} />
            <meshStandardMaterial color="#faf8f5" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.9, 0.21]} receiveShadow>
            <boxGeometry args={[22, 1.8, 0.05]} />
            <meshStandardMaterial color="#587568" roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.82, 0.23]}>
            <boxGeometry args={[22, 0.08, 0.04]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          {/* Large Hospital Windows */}
          {[-3.5, 3.5].map((posZ, idx) => (
            <group key={idx} position={[posZ, 3.8, 0.22]}>
              <mesh>
                <boxGeometry args={[3.8, 2.6, 0.06]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[3.5, 2.3]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.4} roughness={0.1} />
              </mesh>
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

      {/* ================= 4. OVERHEAD CEILING BEAMS ================= */}
      <group position={[0, 7.4, 0]}>
        {[-5.0, 0, 5.0].map((z, idx) => (
          <group key={idx} position={[0, 0, z]}>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[26, 0.12, 0.15]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[6.0, 0.08, 0.6]} />
              <meshStandardMaterial color="#ffffff" emissive="#fef3c7" emissiveIntensity={0.65} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Sage Floor Ring Connecting All Stations */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 3.86, 64]} />
        <meshStandardMaterial color="#88a096" emissive="#587568" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
};

// =========================================================================
// CANVAS FALLBACK LOADER
// =========================================================================
const CanvasLoader = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Đang khởi tạo phòng bệnh viện thú y...</p>
      </div>
    </Html>
  );
};

// =========================================================================
// MAIN ADMIN 3D LOBBY COMPONENT
// =========================================================================
export default function AdminLobby3D({
  overview,
  selectedStation = null,
  onSelectStation,
}: AdminLobby3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStationClick = (id: AdminStationId) => {
    if (onSelectStation) {
      onSelectStation(id);
    }
  };

  return (
    <div className="w-full h-full bg-[#fbf9f5] rounded-2xl overflow-hidden relative shadow-2xl border border-stone-200/90">
      <Canvas
        shadows
        camera={{ position: [0, 10.5, 16.5], fov: 40 }}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <Suspense fallback={<CanvasLoader />}>
          {/* Warm Daylight Ambient Canvas Background */}
          <color attach="background" args={["#fbf9f5"]} />

          {/* Warm Daylight Clinic Lighting */}
          <ambientLight intensity={1.7} color="#fff6ec" />
          <directionalLight
            position={[10, 20, 14]}
            intensity={2.2}
            castShadow
            color="#fffaf0"
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />
          <pointLight position={[-8, 8, -4]} intensity={0.9} color="#fff1e6" />
          <pointLight position={[8, 8, -4]} intensity={0.8} color="#e6f4ea" />
          <pointLight position={[-8, 8, 4]} intensity={0.9} color="#fef3c7" />
          <pointLight position={[8, 8, 4]} intensity={0.8} color="#f3e8ff" />

          {/* Realistic Enclosed Hospital Clinic Room */}
          <EnclosedHospitalRoom />

          {/* 1. Reception Desk & Users Station (Front-Left) */}
          <InteractiveAdminStation
            id="users"
            position={[-5.5, 0, -3.5]}
            accentColor="#3b82f6"
            label="Quầy Lễ Tân & Tiếp Đón"
            icon="👥"
            badgeSubtext="Tài khoản & Bác sĩ"
            statBadge={`${overview?.totalUsers ?? 0} Tài khoản`}
            isSelected={selectedStation === "users"}
            onSelect={handleStationClick}
          >
            <ReceptionDeskStation />
          </InteractiveAdminStation>

          {/* 2. Doctor Exam Room & Appointments (Front-Right) */}
          <InteractiveAdminStation
            id="appointments"
            position={[5.5, 0, -3.5]}
            accentColor="#10b981"
            label="Phòng Khám & Điều Phối"
            icon="📅"
            badgeSubtext="Hôm nay & Ca trực bác sĩ"
            statBadge={`${overview?.todayAppointments ?? 0} Lịch hôm nay`}
            isSelected={selectedStation === "appointments"}
            onSelect={handleStationClick}
          >
            <DoctorRoomStation />
          </InteractiveAdminStation>

          {/* 3. Vet Pharmacy & Vaccine Vault (Back-Right) */}
          <InteractiveAdminStation
            id="services"
            position={[5.5, 0, 4.0]}
            accentColor="#8b5cf6"
            label="Nhà Thuốc & Vắc Xin"
            icon="💉"
            badgeSubtext="Kho vắc xin & Bệnh án"
            statBadge={`${overview?.vaccinesDue ?? 0} Vắc xin đến hạn`}
            isSelected={selectedStation === "services"}
            onSelect={handleStationClick}
          >
            <PharmacyStation />
          </InteractiveAdminStation>

          {/* 4. Cashier & Financial Counter (Back-Left) */}
          <InteractiveAdminStation
            id="finance"
            position={[-5.5, 0, 4.0]}
            accentColor="#f59e0b"
            label="Quầy Thu Ngân & Viện Phí"
            icon="💳"
            badgeSubtext="Hóa đơn & Doanh thu"
            statBadge={`${formatCurrency(overview?.revenue?.month ?? 0)}`}
            isSelected={selectedStation === "finance"}
            onSelect={handleStationClick}
          >
            <PaymentCounterStation />
          </InteractiveAdminStation>

          {/* Center Clinic Lounge & Pet Kiosk */}
          <CenterClinicIsland totalPets={overview?.totalPets ?? 0} />

          {/* Soft Ground Contact Shadows */}
          <ContactShadows
            position={[0, 0.02, 0]}
            opacity={0.5}
            scale={26}
            blur={1.8}
            far={10}
            resolution={1024}
            color="#574438"
          />

          {/* Smooth Camera Focus Controller */}
          <CameraController selectedStation={selectedStation} controlsRef={controlsRef} />

          {/* Orbit Controls with Locked Safe Angles to prevent Side Wall Obstruction */}
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={selectedStation ? 3 : 7}
            maxDistance={selectedStation ? 9 : 19}
            minAzimuthAngle={-Math.PI / 5.14} // Khóa góc xoay ngang tối đa -35°
            maxAzimuthAngle={Math.PI / 5.14}  // Khóa góc xoay ngang tối đa +35°
            minPolarAngle={Math.PI / 4}       // Khóa góc ngẩng tối thiểu 45°
            maxPolarAngle={Math.PI / 2.5}     // Khóa góc chúi tối đa 72° (không chìm xuống sàn)
            rotateSpeed={0.5}
            zoomSpeed={0.8}
            dampingFactor={0.08}
            enabled={true}
          />
        </Suspense>
      </Canvas>

      {/* Bottom Floating Clinic Navigation Tip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10 hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full border border-stone-200/90 text-[11px] text-slate-700 shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
        <span>Kéo chuột xoay phối cảnh • Cuộn để zoom • Nhấp vào trạm để kiểm tra chi tiết & hành động nhanh</span>
      </div>
    </div>
  );
}
