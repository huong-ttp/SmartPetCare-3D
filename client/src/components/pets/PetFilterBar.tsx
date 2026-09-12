"use client";

import React from "react";
import { Search, X } from "lucide-react";
import type { PetSpecies } from "@/types/pet.type";
import { getSpeciesEmoji, getSpeciesLabel, SPECIES_BADGE_COLORS } from "@/utils/petHelpers";
import { cn } from "@/utils/cn";

const ALL_SPECIES: PetSpecies[] = ["dog", "cat", "bird", "rabbit", "hamster", "other"];

interface PetFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedSpecies: PetSpecies | "all";
  onSpeciesChange: (species: PetSpecies | "all") => void;
  /** counts per species for display */
  speciesCounts: Record<string, number>;
  totalCount: number;
}

export const PetFilterBar: React.FC<PetFilterBarProps> = ({
  search,
  onSearchChange,
  selectedSpecies,
  onSpeciesChange,
  speciesCounts,
  totalCount,
}) => {
  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          id="pet-search"
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên thú cưng..."
          className={cn(
            "w-full pl-10 pr-9 py-2.5 rounded-xl border text-sm",
            "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60",
            "transition-all duration-200"
          )}
          aria-label="Tìm kiếm thú cưng theo tên"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Xóa tìm kiếm"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Species filter pills */}
      <div className="flex flex-wrap gap-2">
        {/* "Tất cả" pill */}
        <button
          id="species-filter-all"
          onClick={() => onSpeciesChange("all")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
            selectedSpecies === "all"
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          🐾 Tất cả
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
              selectedSpecies === "all"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-500"
            )}
          >
            {totalCount}
          </span>
        </button>

        {ALL_SPECIES.map((sp) => {
          const count = speciesCounts[sp] ?? 0;
          const isActive = selectedSpecies === sp;
          const colors = SPECIES_BADGE_COLORS[sp];

          return (
            <button
              key={sp}
              id={`species-filter-${sp}`}
              onClick={() => onSpeciesChange(sp)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                isActive
                  ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm`
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {getSpeciesEmoji(sp)} {getSpeciesLabel(sp)}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    isActive ? "bg-white/30 text-inherit" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PetFilterBar;
