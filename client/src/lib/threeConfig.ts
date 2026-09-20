/**
 * threeConfig.ts
 * Constants & scene configuration cho SmartPetCare 3D.
 */

/** Background color của canvas (light mint để đồng nhất hero section) */
export const CANVAS_BG = "#E8FAF4";

/** Bloom post-processing defaults (giảm intensity cho nền sáng) */
export const BLOOM_CONFIG = {
  luminanceThreshold: 0.6,
  luminanceSmoothing: 0.9,
  intensity: 0.25,
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
  // Smart Feeder & Zero-Gravity Showcase Tokens
  tealPrimary: "#00A86B",
  tealGlow: "#00E599",
  tealDark: "#007A4D",
  plasticWhite: "#F0FDF4",       // nhẹ mint-white, tránh lẫn nền sáng
  plasticOffWhite: "#E2F5EC",
  kibbleBrown: "#7A5533",        // tối hơn để tương phản nền sáng
  accentCyan: "#0EA5E9",         // đậm hơn cho nền sáng
  accentAmber: "#D97706",        // đậm hơn cho nền sáng
  accentRose: "#E11D48",
  darkLens: "#0B0F19",
  heroBackground: "#E8FAF4",     // nền hero section đồng nhất
} as const;

/** Canvas performance settings */
export const CANVAS_PERFORMANCE = {
  /** Tắt antialias trên mobile để tăng hiệu năng */
  antialias: true,
  /** Power preference */
  powerPreference: "high-performance" as const,
} as const;
