/**
 * three-helpers.ts
 * ----------------
 * Utility helpers cho Three.js / React Three Fiber setup.
 * Canvas phải được import với dynamic() + ssr:false từ component gọi.
 */

import type { RootState } from "@react-three/fiber";

// ─── Camera defaults ──────────────────────────────────────────────────────────

export const DEFAULT_CAMERA = {
  position: [3, 2, 4] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

// ─── DPR responsive (tránh over-render trên high-DPI displays) ───────────────

export const RESPONSIVE_DPR: [number, number] = [1, 2];

// ─── Lighting preset ─────────────────────────────────────────────────────────

export interface LightingConfig {
  ambientIntensity: number;
  directionalPosition: [number, number, number];
  directionalIntensity: number;
  pointPosition: [number, number, number];
  pointIntensity: number;
  pointColor: string;
}

export const DEFAULT_LIGHTING: LightingConfig = {
  ambientIntensity: 0.6,
  directionalPosition: [5, 5, 5],
  directionalIntensity: 0.8,
  pointPosition: [0, 2.5, 0],
  pointIntensity: 0.5,
  pointColor: "#0EA5B7",
};

// ─── OrbitControls defaults ──────────────────────────────────────────────────

export const DEFAULT_ORBIT_CONTROLS = {
  enableZoom: false,
  enablePan: false,
  enableRotate: true,
  rotateSpeed: 0.3,
  minPolarAngle: Math.PI / 4,    // 45°
  maxPolarAngle: Math.PI / 1.8,  // ~100°
  minAzimuthAngle: -Math.PI / 4, // -45°
  maxAzimuthAngle:  Math.PI / 4, //  45°
};

// ─── WebGL detection ─────────────────────────────────────────────────────────

/**
 * Kiểm tra WebGL có khả dụng hay không (chạy phía client).
 * Dùng để render fallback 2D nếu WebGL không hoạt động.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// ─── GL Cleanup ──────────────────────────────────────────────────────────────

/**
 * Dispose tất cả geometries + materials trong scene để tránh memory leak.
 * Gọi trong useEffect cleanup hoặc unmount.
 */
export function disposeScene(state: RootState): void {
  state.scene.traverse((obj) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any;
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) {
        o.material.forEach((m: { dispose: () => void }) => m.dispose());
      } else {
        o.material.dispose();
      }
    }
  });
  state.gl.dispose();
}
