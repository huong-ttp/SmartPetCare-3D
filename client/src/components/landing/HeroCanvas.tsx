"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { isWebGLAvailable } from "@/lib/three-helpers";

// Dynamic import RightScene với ssr: false
const RightScene = dynamic(() => import("./RightScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0F172A]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#0EA5B7] rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Đang tải môi trường 3D...</p>
      </div>
    </div>
  ),
});

export const HeroCanvas: React.FC = () => {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  if (!hasWebGL) {
    // Fallback 2D nếu thiết bị không hỗ trợ WebGL
    return (
      <div className="w-full h-full bg-gradient-hero flex flex-col items-center justify-center p-8 text-center border-l border-white/10 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#0EA5B7]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#FB923C]/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 glass p-8 rounded-3xl max-w-md backdrop-blur-xl">
          <div className="w-20 h-20 mx-auto gradient-primary rounded-2xl flex items-center justify-center shadow-glow mb-6 text-white text-3xl font-bold">
            SPC
          </div>
          <h2 className="text-2xl font-heading font-bold text-white mb-4">
            SmartPetCare Ecosystem
          </h2>
          <p className="text-slate-300 mb-6">
            Nền tảng quản lý sức khỏe thú cưng toàn diện. <br/>
            (Chế độ xem 2D được bật do thiết bị không hỗ trợ WebGL 3D).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative z-10">
      <RightScene />
    </div>
  );
};

export default HeroCanvas;
