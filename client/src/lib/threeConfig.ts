/**
 * threeConfig.ts
 * Constants & scene configuration cho SmartPetCare 3D.
 */

/** Background color của canvas (dark navy theo brand) */
export const CANVAS_BG = "#0F172A";

/** Bloom post-processing defaults */
export const BLOOM_CONFIG = {
  luminanceThreshold: 0.5,
  luminanceSmoothing: 0.9,
  intensity: 0.35,
} as const;

/** Màu sắc brand cho 3D objects */
export const BRAND_COLORS = {
  primary: "#0EA5B7",
  secondary: "#22C55E",
  accent: "#FB923C",
  navy: "#0F172A",
  desktopGlow: "#0ea5b7",
  cross: "#ef4444",
  examTable: "#ffffff",
  desk: "#2b2b2b",
  cabinet: "#94a3b8",
  plant: "#6ee7b7",
  dog: "#d97706",
  cat: "#60a5fa",
} as const;

/** Canvas performance settings */
export const CANVAS_PERFORMANCE = {
  /** Tắt antialias trên mobile để tăng hiệu năng */
  antialias: true,
  /** Power preference */
  powerPreference: "high-performance" as const,
} as const;
