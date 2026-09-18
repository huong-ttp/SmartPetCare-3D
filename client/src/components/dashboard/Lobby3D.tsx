"use client";

import React, { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  OrbitControls, 
  Float, 
  ContactShadows,
  useCursor,
  Html
} from "@react-three/drei";
import * as THREE from "three";
import { useRouter } from "next/navigation";

// --- Props for Interactive Stations ---
interface StationProps {
  position: [number, number, number];
  color: string;
  label: string;
  icon: string;
  badgeSubtext: string;
  onClick: () => void;
  children: React.ReactNode;
}

const InteractiveStation: React.FC<StationProps> = ({ 
  position, color, label, icon, badgeSubtext, onClick, children 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, 'pointer', 'auto');

  useFrame(() => {
    if (groupRef.current) {
      const targetScale = hovered ? 1.05 : 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group 
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Station furniture & objects */}
      {children}

      {/* Floating Interactive HTML Badge */}
      <Html center position={[0, 2.9, 0]} className="pointer-events-none select-none">
        <div
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer whitespace-nowrap ${
            hovered
              ? "bg-slate-900/95 text-white scale-110 border-emerald-400 shadow-emerald-500/25 ring-2 ring-emerald-500/30"
              : "bg-slate-900/80 text-slate-200 border-white/20 hover:border-white/40"
          }`}
        >
          <span className="text-base shrink-0">{icon}</span>
          <div className="flex flex-col text-left whitespace-nowrap">
            <span className="text-xs font-bold leading-tight tracking-wide whitespace-nowrap">{label}</span>
            <span className="text-[10px] text-slate-400 leading-none whitespace-nowrap">{badgeSubtext}</span>
          </div>
        </div>
      </Html>

      {/* Station Floor Pedestal & Ring */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.0, 2.1, 0.1, 32]} />
        <meshStandardMaterial 
          color={hovered ? color : "#1e293b"} 
          emissive={hovered ? color : "#0f172a"}
          emissiveIntensity={hovered ? 0.35 : 0.05}
          roughness={0.4} 
          metalness={0.2} 
        />
      </mesh>
    </group>
  );
};


// ==========================================
// 1. RECEPTION DESK (Lễ tân - Lịch hẹn)
// ==========================================
const ReceptionDesk = () => {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Desk counter base */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.9, 1.1]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Front accent glow bar */}
      <mesh position={[0, 0.6, 0.56]}>
        <boxGeometry args={[2.2, 0.15, 0.04]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.8} />
      </mesh>
      {/* Countertop */}
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.06, 1.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Computer monitor */}
      <mesh position={[-0.4, 1.35, 0.1]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.05]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Screen glow */}
      <mesh position={[-0.4, 1.35, 0.13]}>
        <planeGeometry args={[0.62, 0.42]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[-0.4, 1.1, 0.1]}>
        <cylinderGeometry args={[0.04, 0.12, 0.15, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Keyboard */}
      <mesh position={[-0.4, 1.06, 0.35]}>
        <boxGeometry args={[0.45, 0.02, 0.18]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      {/* Reception bell / desk plant */}
      <mesh position={[0.65, 1.18, 0.15]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.25, 16]} />
        <meshStandardMaterial color="#059669" roughness={0.3} />
      </mesh>
      {/* Office Chair behind */}
      <mesh position={[0, 0.75, -0.75]} castShadow>
        <boxGeometry args={[0.6, 0.65, 0.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.45, -0.6]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, -0.6]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
    </group>
  );
};


// ==========================================
// 2. DOCTOR ROOM (Phòng khám - Hồ sơ thú cưng)
// ==========================================
const DoctorRoomStation = () => {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Examination Table Base */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.8, 1.3]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Emerald Exam Mat */}
      <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 0.08, 1.15]} />
        <meshStandardMaterial color="#10b981" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Metallic Table Legs */}
      <mesh position={[-1.1, 0.2, 0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
      <mesh position={[1.1, 0.2, 0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
      <mesh position={[-1.1, 0.2, -0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
      <mesh position={[1.1, 0.2, -0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
      {/* Stylized Cute Pet Silhouette on Table */}
      <Float speed={2} rotationIntensity={0.05} floatIntensity={0.2} position={[-0.2, 1.15, 0]}>
        <group>
          {/* Pet body */}
          <mesh castShadow>
            <sphereGeometry args={[0.26, 16, 16]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.6} />
          </mesh>
          {/* Pet head */}
          <mesh position={[0.22, 0.2, 0]} castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.6} />
          </mesh>
          {/* Ears */}
          <mesh position={[0.26, 0.36, 0.1]}>
            <coneGeometry args={[0.06, 0.12, 8]} />
            <meshStandardMaterial color="#b45309" />
          </mesh>
          <mesh position={[0.26, 0.36, -0.1]}>
            <coneGeometry args={[0.06, 0.12, 8]} />
            <meshStandardMaterial color="#b45309" />
          </mesh>
        </group>
      </Float>
      {/* Medical Overhead Examination Lamp */}
      <group position={[0.9, 0, -0.6]}>
        <mesh position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.0, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[-0.3, 1.95, 0.3]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[-0.55, 1.85, 0.4]} rotation={[0, 0, -Math.PI / 6]}>
          <coneGeometry args={[0.22, 0.2, 16]} />
          <meshStandardMaterial color="#f8fafc" emissive="#10b981" emissiveIntensity={0.4} />
        </mesh>
      </group>
      {/* Vital signs monitor */}
      <group position={[-1.0, 0, -0.6]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[0.6, 0.45, 0.1]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 1.5, 0.06]}>
          <planeGeometry args={[0.52, 0.38]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.7} />
        </mesh>
      </group>
    </group>
  );
};


// ==========================================
// 3. PHARMACY (Nhà thuốc - Dịch vụ & Vắc xin)
// ==========================================
const PharmacyStation = () => {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Tall Medicine Display Cabinet in Back */}
      <group position={[0, 0, -0.6]}>
        {/* Main Cabinet Frame */}
        <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 2.3, 0.5]} />
          <meshStandardMaterial color="#8b5cf6" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Back panel inside */}
        <mesh position={[0, 1.25, 0.05]}>
          <boxGeometry args={[2.2, 2.1, 0.3]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.6} />
        </mesh>
        {/* Shelves */}
        <mesh position={[0, 0.7, 0.1]}>
          <boxGeometry args={[2.2, 0.05, 0.35]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0, 1.25, 0.1]}>
          <boxGeometry args={[2.2, 0.05, 0.35]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0, 1.8, 0.1]}>
          <boxGeometry args={[2.2, 0.05, 0.35]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        {/* Medicine Packages & Vials */}
        <mesh position={[-0.7, 0.85, 0.1]} castShadow>
          <boxGeometry args={[0.25, 0.25, 0.15]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[-0.35, 0.85, 0.1]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.15]} />
          <meshStandardMaterial color="#06b6d4" />
        </mesh>
        <mesh position={[0.2, 0.85, 0.1]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.25, 12]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
        <mesh position={[0.6, 0.85, 0.1]} castShadow>
          <boxGeometry args={[0.35, 0.22, 0.15]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        {/* Shelf 2 Vials */}
        <mesh position={[-0.5, 1.4, 0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.22, 12]} />
          <meshStandardMaterial color="#ec4899" />
        </mesh>
        <mesh position={[0, 1.4, 0.1]} castShadow>
          <boxGeometry args={[0.4, 0.24, 0.15]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
        <mesh position={[0.5, 1.4, 0.1]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.25, 12]} />
          <meshStandardMaterial color="#8b5cf6" />
        </mesh>
      </group>

      {/* Front Pharmacy Counter */}
      <mesh position={[0, 0.5, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.9, 0.6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      {/* Purple decorative cross on counter front */}
      <mesh position={[0, 0.55, 0.71]}>
        <boxGeometry args={[0.35, 0.12, 0.02]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#7c3aed" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0.71]}>
        <boxGeometry args={[0.12, 0.35, 0.02]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#7c3aed" emissiveIntensity={0.8} />
      </mesh>
      {/* Medicine box on counter */}
      <mesh position={[-0.5, 1.05, 0.4]} castShadow>
        <boxGeometry args={[0.3, 0.16, 0.2]} />
        <meshStandardMaterial color="#a855f7" />
      </mesh>
    </group>
  );
};


// ==========================================
// 4. PAYMENT COUNTER (Thanh toán - Hóa đơn)
// ==========================================
const PaymentCounter = () => {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Main Counter Desk */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.9, 1.1]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Dark Marble Countertop */}
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.06, 1.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Front Warm Accent Light Bar */}
      <mesh position={[0, 0.6, 0.56]}>
        <boxGeometry args={[2.0, 0.12, 0.04]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} />
      </mesh>
      {/* POS Terminal / Cash Register */}
      <group position={[-0.4, 1.15, 0.15]}>
        <mesh rotation={[-Math.PI / 8, 0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.15, 0.5]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Terminal Screen */}
        <mesh position={[0, 0.12, -0.05]} rotation={[-Math.PI / 8, 0, 0]}>
          <planeGeometry args={[0.38, 0.25]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.8} />
        </mesh>
      </group>
      {/* Credit Card Reader Pad */}
      <mesh position={[0.45, 1.08, 0.2]} rotation={[-Math.PI / 10, 0, 0]} castShadow>
        <boxGeometry args={[0.25, 0.06, 0.35]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      {/* Small Receipt Printer */}
      <mesh position={[0.45, 1.15, -0.2]} castShadow>
        <boxGeometry args={[0.32, 0.22, 0.32]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
    </group>
  );
};


// ==========================================
// 5. CLINIC WAITING BENCH & ENVIRONMENT
// ==========================================
const ClinicDecor = () => {
  return (
    <group>
      {/* Center Waiting Bench for Pets & Owners */}
      <group position={[0, 0, 0.5]}>
        {/* Bench seat */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 0.12, 0.8]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        {/* Bench legs */}
        <mesh position={[-1.1, 0.2, 0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        <mesh position={[1.1, 0.2, 0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        <mesh position={[-1.1, 0.2, -0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        <mesh position={[1.1, 0.2, -0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
      </group>

      {/* Decorative Indoor Plants */}
      <group position={[-7.5, 0, -2]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.3, 0.8, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.1, 0]} castShadow>
          <sphereGeometry args={[0.65, 12, 12]} />
          <meshStandardMaterial color="#15803d" roughness={0.6} />
        </mesh>
      </group>

      <group position={[7.5, 0, -2]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.3, 0.8, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.1, 0]} castShadow>
          <sphereGeometry args={[0.65, 12, 12]} />
          <meshStandardMaterial color="#15803d" roughness={0.6} />
        </mesh>
      </group>

      {/* Clinic Floor Guide Tracks connecting stations */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.28, 64]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};


// --- Fallback Loader for 3D ---
const CanvasLoader = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-300">Đang tải mô hình phòng khám 3D...</p>
      </div>
    </Html>
  );
};


// --- Camera Controller for station focus ---
function CameraFocusController({ 
  target, 
  isFocusing 
}: { 
  target: THREE.Vector3 | null; 
  isFocusing: boolean 
}) {
  useFrame(({ camera }) => {
    if (isFocusing && target) {
      const desiredCamPos = new THREE.Vector3(target.x, target.y + 2.5, target.z + 5.5);
      camera.position.lerp(desiredCamPos, 0.08);
      camera.lookAt(target.x, target.y + 0.8, target.z);
    }
  });
  return null;
}

// ==========================================
// MAIN 3D LOBBY SCENE
// ==========================================
export default function Lobby3D() {
  const router = useRouter();
  const [focusTarget, setFocusTarget] = useState<THREE.Vector3 | null>(null);
  const [isFocusing, setIsFocusing] = useState(false);

  const handleReceptionClick = () => {
    // Reception world coordinates (group shifted by 2.6 on x)
    const target = new THREE.Vector3(-4.8 + 2.6, 0.8, -2.5);
    setFocusTarget(target);
    setIsFocusing(true);
    setTimeout(() => {
      router.push("/appointments/create?from=lobby");
    }, 600);
  };

  return (
    <div className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden relative shadow-2xl border border-slate-800">
      {/* 3D Canvas */}
      <Canvas 
        shadows 
        camera={{ position: [2.6, 11, 17], fov: 42 }} 
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <Suspense fallback={<CanvasLoader />}>
          {/* Background color */}
          <color attach="background" args={["#090d16"]} />

          {/* Camera Focus Helper */}
          <CameraFocusController target={focusTarget} isFocusing={isFocusing} />

          {/* ========================================================== */}
          {/* STANDARD LIGHTING SYSTEM (Hệ thống chiếu sáng chuẩn)       */}
          {/* ========================================================== */}
          <ambientLight intensity={1.5} />
          <directionalLight 
            position={[10, 20, 15]} 
            intensity={2.0} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />
          <pointLight position={[-10, 10, -10]} intensity={1.0} color="#60a5fa" />
          <pointLight position={[10, 8, 10]} intensity={0.8} color="#34d399" />
          <pointLight position={[0, 6, 0]} intensity={0.6} color="#ffffff" />

          {/* Entire Clinic Room shifted to balance with left floating panel */}
          <group position={[2.6, 0, 0]}>
            {/* Main Clinic Floor */}
            <group position={[0, -0.05, 0]}>
              {/* Polished Clinic Floor Base */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[26, 20]} />
                <meshStandardMaterial 
                  color="#131d31" 
                  roughness={0.25} 
                  metalness={0.15} 
                />
              </mesh>

              {/* Grid Helper for futuristic clinic aesthetic */}
              <gridHelper args={[26, 26, "#334155", "#1e293b"]} position={[0, 0.01, 0]} />

              {/* Soft border rim for the room */}
              <mesh position={[0, 0.05, -10]}>
                <boxGeometry args={[26, 0.1, 0.2]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[-13, 0.05, 0]}>
                <boxGeometry args={[0.2, 0.1, 20]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[13, 0.05, 0]}>
                <boxGeometry args={[0.2, 0.1, 20]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.5} />
              </mesh>
            </group>

            {/* Clinic Decor, Waiting Bench & Pathways */}
            <ClinicDecor />

            {/* ========================================================== */}
            {/* 4 INTERACTIVE CLINIC ZONES (4 Khu vực chức năng phòng khám) */}
            {/* ========================================================== */}
            
            {/* 1. Lễ tân (Reception - Appointments) */}
            <InteractiveStation
              position={[-4.8, 0, -2.5]}
              color="#3b82f6"
              label="Lễ tân"
              badgeSubtext="Đặt lịch & Quầy tiếp đón"
              icon="📅"
              onClick={handleReceptionClick}
            >
              <ReceptionDesk />
            </InteractiveStation>

            {/* 2. Phòng khám (Doctor Room - Pets / Medical Records) */}
            <InteractiveStation
              position={[4.8, 0, -2.5]}
              color="#10b981"
              label="Phòng khám"
              badgeSubtext="Hồ sơ & Sức khỏe thú cưng"
              icon="🐶"
              onClick={() => router.push("/pets")}
            >
              <DoctorRoomStation />
            </InteractiveStation>

            {/* 3. Nhà thuốc (Pharmacy - Vaccines / Services) */}
            <InteractiveStation
              position={[4.8, 0, 4.5]}
              color="#8b5cf6"
              label="Nhà thuốc"
              badgeSubtext="Vắc xin & Dịch vụ khám"
              icon="💉"
              onClick={() => router.push("/services")}
            >
              <PharmacyStation />
            </InteractiveStation>

            {/* 4. Thanh toán (Payment / Cashier - Invoices) */}
            <InteractiveStation
              position={[-4.8, 0, 4.5]}
              color="#f59e0b"
              label="Thanh toán"
              badgeSubtext="Hóa đơn viện phí"
              icon="💳"
              onClick={() => router.push("/invoices")}
            >
              <PaymentCounter />
            </InteractiveStation>

            {/* Contact Shadows grounding the stations */}
            <ContactShadows 
              position={[0, -0.01, 0]} 
              opacity={0.65} 
              scale={26} 
              blur={1.8} 
              far={5} 
              resolution={512} 
              color="#000000"
            />
          </group>

          {/* OrbitControls to let user smoothly pan around the lobby */}
          {!isFocusing && (
            <OrbitControls 
              makeDefault 
              target={[2.6, 0, 0]}
              minPolarAngle={Math.PI / 6} 
              maxPolarAngle={Math.PI / 2.3}
              minDistance={8}
              maxDistance={25}
              enablePan={false}
              dampingFactor={0.05}
            />
          )}
        </Suspense>
      </Canvas>
      
      {/* Overlay Text instruction */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-300/80 text-xs pointer-events-none bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg flex items-center space-x-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Kéo chuột để xoay 360° • Cuộn chuột để phóng to/thu nhỏ • Nhấp vào khu vực để di chuyển</span>
      </div>
    </div>
  );
}
