"use client";

import React, { useId, useMemo } from "react";
import { motion } from "framer-motion";

interface PawData {
  id: number;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  size: number; // pixels
  rotate: number; // initial degrees
  colorFrom: string;
  colorTo: string;
  duration: number; // seconds
  delay: number;
  floatY: number; // vertical sway px
  floatX: number; // horizontal sway px
  rotateDelta: number; // rotational sway degrees
  opacity: number;
}

interface PuffyPawProps {
  id: string;
  size: number;
  colorFrom: string;
  colorTo: string;
  opacity?: number;
}

const PuffyPaw: React.FC<PuffyPawProps> = ({
  id,
  size,
  colorFrom,
  colorTo,
  opacity = 0.9,
}) => {
  const gradId = `paw-grad-${id}`;
  const highlightId = `paw-hl-${id}`;
  const shadowId = `paw-sh-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
      className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-transform select-none pointer-events-none"
    >
      <defs>
        {/* Main Base 3D Gradient */}
        <linearGradient id={gradId} x1="15%" y1="10%" x2="90%" y2="95%">
          <stop offset="0%" stopColor={colorFrom} />
          <stop offset="100%" stopColor={colorTo} />
        </linearGradient>

        {/* Soft 3D Specular Puffy Highlight */}
        <radialGradient id={highlightId} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        {/* 3D Clay Soft Shadow */}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        {/* ─── TOE 1 (Far Left) ─── */}
        <ellipse
          cx="22"
          cy="36"
          rx="9"
          ry="13"
          transform="rotate(-22 22 36)"
          fill={`url(#${gradId})`}
        />
        <ellipse
          cx="20"
          cy="31"
          rx="4.5"
          ry="7"
          transform="rotate(-22 20 31)"
          fill={`url(#${highlightId})`}
        />

        {/* ─── TOE 2 (Mid Left) ─── */}
        <ellipse
          cx="40"
          cy="22"
          rx="10"
          ry="14"
          transform="rotate(-7 40 22)"
          fill={`url(#${gradId})`}
        />
        <ellipse
          cx="38"
          cy="18"
          rx="5"
          ry="7.5"
          transform="rotate(-7 38 18)"
          fill={`url(#${highlightId})`}
        />

        {/* ─── TOE 3 (Mid Right) ─── */}
        <ellipse
          cx="60"
          cy="22"
          rx="10"
          ry="14"
          transform="rotate(7 60 22)"
          fill={`url(#${gradId})`}
        />
        <ellipse
          cx="58"
          cy="18"
          rx="5"
          ry="7.5"
          transform="rotate(7 58 18)"
          fill={`url(#${highlightId})`}
        />

        {/* ─── TOE 4 (Far Right) ─── */}
        <ellipse
          cx="78"
          cy="36"
          rx="9"
          ry="13"
          transform="rotate(22 78 36)"
          fill={`url(#${gradId})`}
        />
        <ellipse
          cx="76"
          cy="31"
          rx="4.5"
          ry="7"
          transform="rotate(22 76 31)"
          fill={`url(#${highlightId})`}
        />

        {/* ─── MAIN PALM PAD (Metacarpal) ─── */}
        <path
          d="M 50,51 C 39,43 26,45 22,57 C 17,71 21,83 31,89 C 41,95 59,95 69,89 C 79,83 83,71 78,57 C 74,45 61,43 50,51 Z"
          fill={`url(#${gradId})`}
        />
        {/* Palm Puffy 3D Highlight */}
        <ellipse
          cx="45"
          cy="64"
          rx="14"
          ry="10"
          transform="rotate(-8 45 64)"
          fill={`url(#${highlightId})`}
        />
      </g>
    </svg>
  );
};

export const FloatingPawsBackground: React.FC = () => {
  const baseId = useId();

  // 14 Bàn chân mèo với màu sắc biến thiên mượt mà từ #60A5FA (blue-400) sang #34D399 (emerald-400)
  // Phân bổ: các góc, viền ngoài và ngay phía sau bảng đăng nhập để nhìn xuyên qua kính mờ.
  const paws: PawData[] = useMemo(
    () => [
      // 1. Bên trái card (lộ 1 phần giống hình mẫu)
      {
        id: 1,
        x: 18,
        y: 42,
        size: 110,
        rotate: -20,
        colorFrom: "#60A5FA",
        colorTo: "#38BDF8",
        duration: 8.5,
        delay: 0,
        floatY: 14,
        floatX: 6,
        rotateDelta: 5,
        opacity: 0.95,
      },
      // 2. Bên phải card (lộ 1 phần nhô ra giống hình mẫu)
      {
        id: 2,
        x: 77,
        y: 48,
        size: 130,
        rotate: 15,
        colorFrom: "#38BDF8",
        colorTo: "#2DD4BF",
        duration: 9.2,
        delay: 0.8,
        floatY: 16,
        floatX: -7,
        rotateDelta: -6,
        opacity: 0.92,
      },
      // 3. Phía sau bảng trung tâm - trên (nhìn xuyên qua kính mờ)
      {
        id: 3,
        x: 46,
        y: 24,
        size: 85,
        rotate: -8,
        colorFrom: "#818CF8",
        colorTo: "#60A5FA",
        duration: 7.8,
        delay: 1.5,
        floatY: 12,
        floatX: 5,
        rotateDelta: 4,
        opacity: 0.85,
      },
      // 4. Phía sau bảng trung tâm - góc dưới (nhìn xuyên qua kính mờ)
      {
        id: 4,
        x: 52,
        y: 72,
        size: 90,
        rotate: 18,
        colorFrom: "#2DD4BF",
        colorTo: "#34D399",
        duration: 10.4,
        delay: 0.4,
        floatY: -15,
        floatX: 6,
        rotateDelta: -5,
        opacity: 0.82,
      },
      // 5. Phía sau bảng trung tâm - giữa trái
      {
        id: 5,
        x: 38,
        y: 56,
        size: 70,
        rotate: -12,
        colorFrom: "#38BDF8",
        colorTo: "#34D399",
        duration: 8.0,
        delay: 2.1,
        floatY: 10,
        floatX: -4,
        rotateDelta: 4,
        opacity: 0.78,
      },
      // 6. Phía sau bảng trung tâm - giữa phải
      {
        id: 6,
        x: 63,
        y: 54,
        size: 75,
        rotate: 22,
        colorFrom: "#60A5FA",
        colorTo: "#2DD4BF",
        duration: 9.6,
        delay: 1.2,
        floatY: -12,
        floatX: 5,
        rotateDelta: -4,
        opacity: 0.75,
      },
      // 7. Góc dưới bên phải (lớn, bồng bềnh êm ái)
      {
        id: 7,
        x: 72,
        y: 82,
        size: 115,
        rotate: 28,
        colorFrom: "#2DD4BF",
        colorTo: "#34D399",
        duration: 11.0,
        delay: 0.5,
        floatY: 18,
        floatX: -8,
        rotateDelta: 6,
        opacity: 0.9,
      },
      // 8. Góc dưới bên trái (nhỏ nhắn, giống hình mẫu)
      {
        id: 8,
        x: 23,
        y: 78,
        size: 70,
        rotate: -28,
        colorFrom: "#60A5FA",
        colorTo: "#818CF8",
        duration: 8.8,
        delay: 2.6,
        floatY: -13,
        floatX: 6,
        rotateDelta: -5,
        opacity: 0.88,
      },
      // 9. Đỉnh bảng phía trên bên phải
      {
        id: 9,
        x: 69,
        y: 18,
        size: 80,
        rotate: 14,
        colorFrom: "#60A5FA",
        colorTo: "#38BDF8",
        duration: 9.0,
        delay: 1.7,
        floatY: 11,
        floatX: 4,
        rotateDelta: 4,
        opacity: 0.8,
      },
      // 10. Đỉnh trên cùng viền giữa (nhỏ nhắn như hình mẫu)
      {
        id: 10,
        x: 48,
        y: 8,
        size: 55,
        rotate: -5,
        colorFrom: "#34D399",
        colorTo: "#6EE7B7",
        duration: 7.5,
        delay: 0.2,
        floatY: 8,
        floatX: -4,
        rotateDelta: -3,
        opacity: 0.85,
      },
      // 11. Góc trên bên trái (rộng mở)
      {
        id: 11,
        x: 8,
        y: 15,
        size: 95,
        rotate: -35,
        colorFrom: "#38BDF8",
        colorTo: "#2DD4BF",
        duration: 12.0,
        delay: 1.0,
        floatY: 15,
        floatX: 7,
        rotateDelta: 5,
        opacity: 0.85,
      },
      // 12. Góc trên bên phải xa
      {
        id: 12,
        x: 88,
        y: 12,
        size: 85,
        rotate: 30,
        colorFrom: "#60A5FA",
        colorTo: "#34D399",
        duration: 10.2,
        delay: 2.3,
        floatY: -14,
        floatX: -6,
        rotateDelta: -6,
        opacity: 0.8,
      },
      // 13. Góc đáy dưới bên trái
      {
        id: 13,
        x: 8,
        y: 84,
        size: 80,
        rotate: 20,
        colorFrom: "#34D399",
        colorTo: "#2DD4BF",
        duration: 9.8,
        delay: 1.9,
        floatY: 12,
        floatX: -5,
        rotateDelta: 4,
        opacity: 0.85,
      },
      // 14. Viền phải cạnh dưới
      {
        id: 14,
        x: 90,
        y: 72,
        size: 65,
        rotate: -15,
        colorFrom: "#60A5FA",
        colorTo: "#38BDF8",
        duration: 8.2,
        delay: 3.0,
        floatY: -10,
        floatX: 4,
        rotateDelta: -4,
        opacity: 0.82,
      },
    ],
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {paws.map((paw) => {
        const uniqueId = `${baseId}-paw-${paw.id}`;
        return (
          <motion.div
            key={paw.id}
            initial={{
              x: 0,
              y: 0,
              rotate: paw.rotate,
            }}
            animate={{
              y: [0, -paw.floatY, 0, paw.floatY * 0.7, 0],
              x: [0, paw.floatX, 0, -paw.floatX * 0.7, 0],
              rotate: [
                paw.rotate,
                paw.rotate + paw.rotateDelta,
                paw.rotate,
                paw.rotate - paw.rotateDelta * 0.8,
                paw.rotate,
              ],
            }}
            transition={{
              duration: paw.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: paw.delay,
            }}
            style={{
              position: "absolute",
              left: `${paw.x}%`,
              top: `${paw.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <PuffyPaw
              id={uniqueId}
              size={paw.size}
              colorFrom={paw.colorFrom}
              colorTo={paw.colorTo}
              opacity={paw.opacity}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingPawsBackground;
