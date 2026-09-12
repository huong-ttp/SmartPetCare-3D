"use client";

import React from "react";
import Link from "next/link";
import {
  Cake, Scale, Dna, Palette, Cpu, Info, ExternalLink, Venus, Mars, HelpCircle, CheckCircle2
} from "lucide-react";
import type { Pet } from "@/types/pet.type";
import { formatDate, calcAge } from "@/utils/formatDate";
import {
  getSpeciesLabel,
  getSpeciesEmoji,
  getGenderLabel,
  GENDER_BADGE_COLORS,
  SPECIES_BADGE_COLORS,
  formatWeight,
} from "@/utils/petHelpers";
import { cn } from "@/utils/cn";

interface FieldRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}

function FieldRow({ icon, label, value, className }: FieldRowProps) {
  return (
    <div className={cn("flex items-start gap-3 py-3.5 border-b border-slate-50 last:border-0", className)}>
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <div className="text-sm font-medium text-slate-800">{value}</div>
      </div>
    </div>
  );
}

interface PetDetailBasicInfoProps {
  pet: Pet;
}

export const PetDetailBasicInfo: React.FC<PetDetailBasicInfoProps> = ({ pet }) => {
  const speciesColors = SPECIES_BADGE_COLORS[pet.species];
  const genderColors  = GENDER_BADGE_COLORS[pet.gender];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Info size={17} className="text-primary" />
        Thông tin cơ bản
      </h2>

      <div className="divide-y divide-slate-50">
        {/* Name */}
        <FieldRow
          icon={<Dna size={16} />}
          label="Tên"
          value={<span className="font-bold text-slate-900 text-base">{pet.name}</span>}
        />

        {/* Species */}
        <FieldRow
          icon={<span className="text-base">{getSpeciesEmoji(pet.species)}</span>}
          label="Loài"
          value={
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                speciesColors.bg, speciesColors.text, speciesColors.border
              )}
            >
              {getSpeciesEmoji(pet.species)} {getSpeciesLabel(pet.species)}
            </span>
          }
        />

        {/* Breed */}
        <FieldRow
          icon={<Dna size={16} />}
          label="Giống"
          value={pet.breed || <span className="text-slate-400">—</span>}
        />

        {/* Gender */}
        <FieldRow
          icon={
            pet.gender === "male"
              ? <Mars size={16} />
              : pet.gender === "female"
              ? <Venus size={16} />
              : <HelpCircle size={16} />
          }
          label="Giới tính"
          value={
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                genderColors.bg, genderColors.text, genderColors.border
              )}
            >
              {getGenderLabel(pet.gender)}
            </span>
          }
        />

        {/* Birthday */}
        <FieldRow
          icon={<Cake size={16} />}
          label="Ngày sinh"
          value={
            pet.date_of_birth
              ? <>{formatDate(pet.date_of_birth)} <span className="text-slate-400 font-normal">(Khoảng {calcAge(pet.date_of_birth)})</span></>
              : <span className="text-slate-400">Chưa rõ</span>
          }
        />

        {/* Weight — readonly */}
        <div className="flex items-start gap-3 py-3.5 border-b border-slate-50">
          <span className="text-slate-400 mt-0.5 shrink-0"><Scale size={16} /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-xs text-slate-400">Cân nặng</p>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Chỉ đọc
              </span>
            </div>
            <p className="text-sm font-medium text-slate-800">
              {formatWeight(pet.weight_kg)}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-xs text-slate-400">Cập nhật gần nhất từ hồ sơ khám / nhật ký sức khỏe.</p>
              <Link
                href={`/pets/${pet.id}/health-logs`}
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                Xem lịch sử cân nặng
                <ExternalLink size={11} />
              </Link>
            </div>
          </div>
        </div>

        {/* Color */}
        <FieldRow
          icon={<Palette size={16} />}
          label="Màu lông"
          value={pet.color || <span className="text-slate-400">—</span>}
        />

        {/* Microchip */}
        <FieldRow
          icon={<Cpu size={16} />}
          label="Mã microchip"
          value={
            pet.microchip_number
              ? <span className="font-mono text-xs tracking-wider text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">{pet.microchip_number}</span>
              : <span className="text-slate-400">—</span>
          }
        />

        {/* Neutered */}
        <FieldRow
          icon={<CheckCircle2 size={16} className={pet.is_neutered ? "text-secondary" : "text-slate-300"} />}
          label="Triệt sản"
          value={
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                pet.is_neutered
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              )}
            >
              {pet.is_neutered ? "Đã triệt sản" : "Chưa triệt sản"}
            </span>
          }
        />
      </div>
    </div>
  );
};

export default PetDetailBasicInfo;
