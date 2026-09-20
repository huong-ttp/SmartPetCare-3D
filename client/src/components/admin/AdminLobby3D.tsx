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
import { AdminOverview } from "@/services/adminService";

// --- Props for Interactive Stations ---
interface StationProps {
  position: [number, number, number];
  color: string;
  label: string;
  icon: string;
  badgeSubtext: string;
  statBadge?: string;
  onClick: () => void;
  children: React.ReactNode;
}

const InteractiveAdminStation: React.FC<StationProps> = ({ 
  position, color, label, icon, badgeSubtext, statBadge, onClick, children 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, "pointer", "auto");

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
      {children}

      {/* Floating Interactive 3D Label & Live Stat */}
      <Html center position={[0, 3.1, 0]} className="pointer-events-none select-none">
        <div
          className={`flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer ${
            hovered ? "scale-110" : "scale-100"
          }`}
        >
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border shadow-xl backdrop-blur-md whitespace-nowrap ${
              hovered
                ? "bg-slate-900/95 text-white border-cyan-400 shadow-cyan-500/30 ring-2 ring-cyan-500/40"
                : "bg-slate-900/85 text-slate-100 border-white/20"
            }`}
          >
            <span className="text-base shrink-0">{icon}</span>
            <div className="flex flex-col text-left whitespace-nowrap">
              <span className="text-xs font-bold leading-tight tracking-wide">{label}</span>
              <span className="text-[10px] text-slate-400 leading-none">{badgeSubtext}</span>
            </div>
          </div>
          {statBadge && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md backdrop-blur-sm border ${
                hovered
                  ? "bg-cyan-500 text-slate-950 border-cyan-300 font-bold"
                  : "bg-slate-800/90 text-cyan-300 border-cyan-500/30"
              }`}
            >
              {statBadge}
            </span>
          )}
        </div>
      </Html>

      {/* Station Floor Pedestal & Ring */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.0, 2.1, 0.1, 32]} />
        <meshStandardMaterial 
          color={hovered ? color : "#1e293b"} 
          emissive={hovered ? color : "#0f172a"}
          emissiveIntensity={hovered ? 0.45 : 0.08}
          roughness={0.35} 
          metalness={0.25} 
        />
      </mesh>
    </group>
  );
};

// ==========================================
// 1. USERS & STAFF MANAGEMENT HUB
// ==========================================
const UsersStation = () => {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Curved Modern Tech Desk */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.9, 1.1]} />
        <meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Front Glowing Light Strip */}
      <mesh position={[0, 0.6, 0.56]}>
        <boxGeometry args={[2.2, 0.12, 0.04]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.9} />
      </mesh>
      {/* Glass / White Countertop */}
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.06, 1.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Holographic User Podiums (stylized avatars) */}
      <Float speed={2.5} rotationIntensity={0.1} floatIntensity={0.3} position={[0, 1.6, 0.1]}>
        <group>
          {/* Central Admin Hologram Badge */}
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.04, 24]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </Float>
      {/* Dual Curved Screens */}
      <mesh position={[-0.6, 1.3, 0.1]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.65, 0.45, 0.05]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[-0.6, 1.3, 0.13]} rotation={[0, 0.2, 0]}>
        <planeGeometry args={[0.58, 0.38]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0.6, 1.3, 0.1]} rotation={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[0.65, 0.45, 0.05]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0.6, 1.3, 0.13]} rotation={[0, -0.2, 0]}>
        <planeGeometry args={[0.58, 0.38]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
};

// ==========================================
// 2. APPOINTMENTS OPERATIONS DESK
// ==========================================
const AppointmentsStation = () => {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Operational Dispatch Table */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.9, 1.2]} />
        <meshStandardMaterial color="#059669" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Emerald Top Panel */}
      <mesh position={[0, 0.98, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.06, 1.25]} />
        <meshStandardMaterial color="#10b981" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Big Master Schedule Screen */}
      <group position={[0, 1.5, -0.3]}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.8, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[1.5, 0.7]} />
          <meshStandardMaterial color="#34d399" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>
      </group>
      {/* Holographic Radar / Beacon */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2} position={[0.6, 1.3, 0.2]}>
        <mesh>
          <torusGeometry args={[0.2, 0.03, 16, 32]} />
          <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.9} />
        </mesh>
      </Float>
      {/* Communication terminal */}
      <mesh position={[-0.6, 1.1, 0.2]} castShadow>
        <boxGeometry args={[0.4, 0.15, 0.3]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
};

// ==========================================
// 3. SERVICES & MEDICAL REPOSITORY
// ==========================================
const ServicesStation = () => {
  return (
    <group position={[0, 0.1, 0]}>
      {/* High-tech Medicine & Service Dispenser */}
      <group position={[0, 0, -0.5]}>
        <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 2.3, 0.5]} />
          <meshStandardMaterial color="#7c3aed" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.25, 0.05]}>
          <boxGeometry args={[2.2, 2.1, 0.3]} />
          <meshStandardMaterial color="#1e1b4b" />
        </mesh>
        {/* Illuminated shelves with vaccine packs */}
        <mesh position={[0, 0.8, 0.1]}>
          <boxGeometry args={[2.1, 0.04, 0.35]} />
          <meshStandardMaterial color="#ffffff" emissive="#c084fc" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 1.4, 0.1]}>
          <boxGeometry args={[2.1, 0.04, 0.35]} />
          <meshStandardMaterial color="#ffffff" emissive="#c084fc" emissiveIntensity={0.3} />
        </mesh>
        {/* Stylized vaccine vials */}
        <mesh position={[-0.5, 0.95, 0.1]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.25, 12]} />
          <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0.95, 0.1]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.25, 12]} />
          <meshStandardMaterial color="#a855f7" emissive="#9333ea" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.5, 0.95, 0.1]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.25, 12]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.5} />
        </mesh>
      </group>
      {/* Catalog Counter */}
      <mesh position={[0, 0.5, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.9, 0.6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>
      {/* Purple Glowing Medical Cross */}
      <mesh position={[0, 0.55, 0.71]}>
        <boxGeometry args={[0.36, 0.12, 0.02]} />
        <meshStandardMaterial color="#a855f7" emissive="#9333ea" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0, 0.55, 0.71]}>
        <boxGeometry args={[0.12, 0.36, 0.02]} />
        <meshStandardMaterial color="#a855f7" emissive="#9333ea" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
};

// ==========================================
// 4. FINANCIAL & INVOICES VAULT
// ==========================================
const FinanceStation = () => {
  return (
    <group position={[0, 0.1, 0]}>
      {/* High-security Gold & Dark Counter */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.9, 1.1]} />
        <meshStandardMaterial color="#d97706" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Granite Countertop */}
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.06, 1.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Gold Amber Glowing Bar */}
      <mesh position={[0, 0.6, 0.56]}>
        <boxGeometry args={[2.0, 0.12, 0.04]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.9} />
      </mesh>
      {/* Floating Gold Coin / Vault Token */}
      <Float speed={3} rotationIntensity={0.3} floatIntensity={0.2} position={[0, 1.6, 0]}>
        <mesh rotation={[0, 0, Math.PI / 6]} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.06, 24]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>
      {/* POS Terminal & Invoice scanner */}
      <mesh position={[-0.45, 1.15, 0.15]} rotation={[-Math.PI / 8, 0, 0]} castShadow>
        <boxGeometry args={[0.45, 0.15, 0.45]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-0.45, 1.25, 0.15]} rotation={[-Math.PI / 8, 0, 0]}>
        <planeGeometry args={[0.36, 0.22]} />
        <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
};

// ==========================================
// 5. CENTRAL COMMAND HOLOGRAM CORE
// ==========================================
const CentralAdminCore = () => {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.4;
    if (ring2Ref.current) ring2Ref.current.rotation.y += delta * 0.3;
  });

  return (
    <group position={[0, 0.1, 1.0]}>
      {/* Central Cyber Platform Base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.7, 0.12, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Core Glowing Rings */}
      <mesh ref={ring1Ref} position={[0, 0.8, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.9, 0.02, 16, 48]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.9} />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 0.8, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[0.7, 0.02, 16, 48]} />
        <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.9} />
      </mesh>
      {/* Central Floating Hologram Sphere */}
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.25} position={[0, 0.8, 0]}>
        <mesh>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#60a5fa" emissive="#2563eb" emissiveIntensity={0.9} wireframe />
        </mesh>
      </Float>
    </group>
  );
};

// --- Fallback Loader for 3D ---
const CanvasLoader = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-300">Đang khởi tạo không gian Admin 3D...</p>
      </div>
    </Html>
  );
};

// ==========================================
// MAIN ADMIN 3D LOBBY COMPONENT
// ==========================================
interface AdminLobby3DProps {
  overview?: AdminOverview;
}

export default function AdminLobby3D({ overview }: AdminLobby3DProps) {
  const router = useRouter();

  return (
    <div className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden relative shadow-2xl border border-slate-800">
      <Canvas 
        shadows 
        camera={{ position: [2.0, 12, 18], fov: 42 }} 
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <color attach="background" args={["#080c14"]} />

          {/* Lighting */}
          <ambientLight intensity={1.6} />
          <directionalLight 
            position={[12, 22, 16]} 
            intensity={2.2} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />
          <pointLight position={[-10, 10, -10]} intensity={1.2} color="#38bdf8" />
          <pointLight position={[10, 8, 10]} intensity={1.0} color="#34d399" />
          <pointLight position={[0, 8, 0]} intensity={0.8} color="#a855f7" />

          {/* Scene Floor & Elements */}
          <group position={[2.4, 0, 0]}>
            {/* Polished Command Center Grid Floor */}
            <group position={[0, -0.05, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[28, 22]} />
                <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.3} />
              </mesh>
              <gridHelper args={[28, 28, "#38bdf8", "#1e293b"]} position={[0, 0.01, 0]} />

              {/* Glowing Perimeter Accent Lines */}
              <mesh position={[0, 0.05, -11]}>
                <boxGeometry args={[28, 0.1, 0.2]} />
                <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.6} />
              </mesh>
              <mesh position={[-14, 0.05, 0]}>
                <boxGeometry args={[0.2, 0.1, 22]} />
                <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.6} />
              </mesh>
              <mesh position={[14, 0.05, 0]}>
                <boxGeometry args={[0.2, 0.1, 22]} />
                <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.6} />
              </mesh>
            </group>

            {/* Central Hologram Core */}
            <CentralAdminCore />

            {/* 4 Interactive Admin Stations */}
            {/* 1. Users Station */}
            <InteractiveAdminStation
              position={[-4.8, 0, -2.5]}
              color="#3b82f6"
              label="Quản lý Người dùng"
              badgeSubtext="Tài khoản & Bác sĩ"
              statBadge={overview ? `${overview.totalUsers} Người dùng` : undefined}
              icon="👥"
              onClick={() => router.push("/admin/users")}
            >
              <UsersStation />
            </InteractiveAdminStation>

            {/* 2. Appointments Station */}
            <InteractiveAdminStation
              position={[4.8, 0, -2.5]}
              color="#10b981"
              label="Quản lý Lịch hẹn"
              badgeSubtext="Hôm nay & Điều phối"
              statBadge={overview ? `${overview.todayAppointments} Hôm nay` : undefined}
              icon="📅"
              onClick={() => router.push("/admin/appointments")}
            >
              <AppointmentsStation />
            </InteractiveAdminStation>

            {/* 3. Services Station */}
            <InteractiveAdminStation
              position={[4.8, 0, 4.5]}
              color="#8b5cf6"
              label="Dịch vụ & Tiêm chủng"
              badgeSubtext="Vắc xin & Danh mục khám"
              statBadge={overview ? `${overview.vaccinesDue} Vắc xin đến hạn` : undefined}
              icon="💉"
              onClick={() => router.push("/admin/services")}
            >
              <ServicesStation />
            </InteractiveAdminStation>

            {/* 4. Finance Station */}
            <InteractiveAdminStation
              position={[-4.8, 0, 4.5]}
              color="#f59e0b"
              label="Tài chính & Hóa đơn"
              badgeSubtext="Doanh thu & Thanh toán"
              statBadge={overview ? `${overview.unpaidInvoices} Chờ thanh toán` : undefined}
              icon="💳"
              onClick={() => router.push("/admin/invoices")}
            >
              <FinanceStation />
            </InteractiveAdminStation>

            {/* Ground Contact Shadows */}
            <ContactShadows 
              position={[0, -0.01, 0]} 
              opacity={0.6} 
              scale={28} 
              blur={1.8} 
              far={5} 
              resolution={512} 
              color="#000000"
            />
          </group>

          {/* 360° OrbitControls */}
          <OrbitControls 
            makeDefault 
            target={[2.4, 0, 0]}
            minPolarAngle={Math.PI / 6} 
            maxPolarAngle={Math.PI / 2.3}
            minDistance={9}
            maxDistance={26}
            enablePan={false}
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>

      {/* Interactive Helper Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-300/80 text-xs pointer-events-none bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg flex items-center space-x-2">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>Kéo chuột xoay 360° • Cuộn chuột để zoom • Nhấp vào trạm để điều hướng nhanh</span>
      </div>
    </div>
  );
}
