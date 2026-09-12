"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Scale, Venus, Mars, HelpCircle, CheckCircle2 } from "lucide-react";
import type { Pet } from "@/types/pet.type";
import { calcAge } from "@/utils/formatDate";
import {
  getSpeciesLabel,
  getSpeciesEmoji,
  SPECIES_BADGE_COLORS,
  getGenderLabel,
  GENDER_BADGE_COLORS,
  formatWeight,
} from "@/utils/petHelpers";
import { cn } from "@/utils/cn";

interface PetCardProps {
  pet: Pet;
}

function GenderIcon({ gender }: { gender: Pet["gender"] }) {
  if (gender === "male") return <Mars size={12} className="inline -mt-0.5" />;
  if (gender === "female") return <Venus size={12} className="inline -mt-0.5" />;
  return <HelpCircle size={12} className="inline -mt-0.5" />;
}

export const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  const speciesColors = SPECIES_BADGE_COLORS[pet.species];
  const genderColors  = GENDER_BADGE_COLORS[pet.gender];

  return (
    <Link href={`/pets/${pet.id}`} className="block group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-lg group-hover:border-primary/30 transition-all duration-300 overflow-hidden"
      >
        {/* Top accent bar */}
        <div className={cn("h-1.5 w-full", speciesColors.bg)} />

        <div className="p-5">
          {/* Avatar + basic info header */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              {pet.avatar_url ? (
                <img
                  src={pet.avatar_url}
                  alt={pet.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100"
                />
              ) : (
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2",
                    speciesColors.bg,
                    speciesColors.border
                  )}
                >
                  {getSpeciesEmoji(pet.species)}
                </div>
              )}
              {/* Neutered badge */}
              {pet.is_neutered && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full shadow border border-slate-100 p-0.5">
                  <CheckCircle2 size={14} className="text-secondary" />
                </div>
              )}
            </div>

            {/* Name + species badge */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-primary transition-colors">
                {pet.name}
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {/* Species badge */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                    speciesColors.bg, speciesColors.text, speciesColors.border
                  )}
                >
                  {getSpeciesEmoji(pet.species)} {getSpeciesLabel(pet.species)}
                </span>
                {/* Gender badge */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                    genderColors.bg, genderColors.text, genderColors.border
                  )}
                >
                  <GenderIcon gender={pet.gender} />
                  {getGenderLabel(pet.gender)}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-50 my-4" />

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {/* Breed */}
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Giống</p>
              <p className="font-medium text-slate-700 truncate">{pet.breed || "—"}</p>
            </div>

            {/* Age */}
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Tuổi</p>
              <p className="font-medium text-slate-700">{calcAge(pet.date_of_birth)}</p>
            </div>

            {/* Weight */}
            <div className="col-span-2">
              <div className="flex items-center gap-1.5 mt-1">
                <Scale size={13} className="text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500">{formatWeight(pet.weight_kg)}</span>
                <span className="text-xs text-slate-300 italic ml-auto">chỉ đọc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom hover indicator */}
        <div className="h-0.5 bg-gradient-to-r from-primary to-secondary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </motion.div>
    </Link>
  );
};

export default PetCard;
