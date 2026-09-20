"use client";

import React, { Component, useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { isWebGLAvailable } from "@/lib/three-helpers";

// Dynamic import RightScene với ssr: false
const RightScene = dynamic(() => import("./RightScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#E8FAF4]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-[#00A86B] rounded-full animate-spin" />
        <p className="text-emerald-700 text-sm font-medium animate-pulse">Đang tải môi trường 3D…</p>
      </div>
    </div>
  ),
});

// ─── Error Boundary — chỉ dùng cho React render crashes ────────────────────
interface EBProps  { children: React.ReactNode; onReset: () => void; }
interface EBState  { hasError: boolean; }

class WebGLErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[SmartPetCare] 3D render error:", error, info);
    // Auto-attempt reset after 2 s
    setTimeout(() => {
      this.setState({ hasError: false });
      this.props.onReset();
    }, 2000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#E8FAF4]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-[#00A86B] rounded-full animate-spin" />
            <p className="text-emerald-700 text-sm">Đang khởi động lại scene 3D…</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main HeroCanvas ─────────────────────────────────────────────────────────
export const HeroCanvas: React.FC = () => {
  const [hasWebGL, setHasWebGL]   = useState(true);
  const [resetKey, setResetKey]   = useState(0);   // increment to force-remount scene
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setHasWebGL(isWebGLAvailable());
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // When WebGL context is lost: wait 1 s then remount the Canvas so the
  // browser creates a fresh context — no 2D fallback, no static image.
  const handleContextLost = useCallback(() => {
    console.warn("[SmartPetCare] WebGL context lost — scheduling scene remount");
    setTimeout(() => {
      if (mountedRef.current) {
        setResetKey((k) => k + 1);
      }
    }, 1000);
  }, []);

  const handleErrorReset = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  // Genuine no-WebGL device: minimal dark placeholder (no image)
  if (!hasWebGL) {
    return (
      <div className="w-full h-full bg-[#E8FAF4] flex items-center justify-center">
        <div className="text-center px-8">
          <div
            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl mb-5"
            style={{ background: "linear-gradient(135deg, #00A86B, #0EA5B7)" }}
          >
            SPC
          </div>
          <p className="text-emerald-700 text-sm leading-relaxed">
            Thiết bị không hỗ trợ WebGL 3D.
            <br />Vui lòng thử trên Chrome / Firefox mới nhất.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div key={resetKey} className="w-full h-full relative">
      <WebGLErrorBoundary onReset={handleErrorReset}>
        <RightScene onContextLost={handleContextLost} />
      </WebGLErrorBoundary>
    </div>
  );
};

export default HeroCanvas;
