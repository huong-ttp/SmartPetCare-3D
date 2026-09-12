/**
 * petHelpers.ts
 * Helper functions for pet labels, species badges, gender display.
 */

import type { PetSpecies, PetGender } from "@/types/pet.type";

// ─── Species ──────────────────────────────────────────────────────────────────

export const SPECIES_LABELS: Record<PetSpecies, string> = {
  dog:     "Chó",
  cat:     "Mèo",
  bird:    "Chim",
  rabbit:  "Thỏ",
  hamster: "Hamster",
  other:   "Khác",
};

export const SPECIES_EMOJIS: Record<PetSpecies, string> = {
  dog:     "🐶",
  cat:     "🐱",
  bird:    "🐦",
  rabbit:  "🐰",
  hamster: "🐹",
  other:   "🐾",
};

/** Tailwind color classes for species badge background/text */
export const SPECIES_BADGE_COLORS: Record<PetSpecies, { bg: string; text: string; border: string }> = {
  dog:     { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200" },
  cat:     { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  bird:    { bg: "bg-sky-100",    text: "text-sky-700",    border: "border-sky-200" },
  rabbit:  { bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-200" },
  hamster: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  other:   { bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-200" },
};

export function getSpeciesLabel(species: PetSpecies): string {
  return SPECIES_LABELS[species] ?? species;
}

export function getSpeciesEmoji(species: PetSpecies): string {
  return SPECIES_EMOJIS[species] ?? "🐾";
}

// ─── Gender ───────────────────────────────────────────────────────────────────

export const GENDER_LABELS: Record<PetGender, string> = {
  male:    "Đực",
  female:  "Cái",
  unknown: "Chưa rõ",
};

export const GENDER_EMOJIS: Record<PetGender, string> = {
  male:    "♂",
  female:  "♀",
  unknown: "?",
};

export const GENDER_BADGE_COLORS: Record<PetGender, { bg: string; text: string; border: string }> = {
  male:    { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200" },
  female:  { bg: "bg-rose-100",   text: "text-rose-700",   border: "border-rose-200" },
  unknown: { bg: "bg-slate-100",  text: "text-slate-500",  border: "border-slate-200" },
};

export function getGenderLabel(gender: PetGender): string {
  return GENDER_LABELS[gender] ?? gender;
}

// ─── Weight ───────────────────────────────────────────────────────────────────

export function formatWeight(weight_kg?: number): string {
  if (weight_kg == null) return "Chưa có dữ liệu";
  return `${weight_kg.toLocaleString("vi-VN")} kg`;
}

// ─── Allergies / Conditions ───────────────────────────────────────────────────

/**
 * Normalize allergies or chronic_conditions (string or array) → string[]
 */
export function normalizeStringArray(value?: string | string[]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}
