"use client";

import React from "react";
import { AlertTriangle, Heart, FileText, CheckCircle2 } from "lucide-react";
import type { Pet } from "@/types/pet.type";
import { normalizeStringArray } from "@/utils/petHelpers";
import { cn } from "@/utils/cn";

interface PetDetailHealthInfoProps {
  pet: Pet;
}

function TagList({ items, emptyText, colorClass }: {
  items: string[];
  emptyText: string;
  colorClass: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 italic">
        <CheckCircle2 size={14} className="text-secondary shrink-0" />
        {emptyText}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
            colorClass
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export const PetDetailHealthInfo: React.FC<PetDetailHealthInfoProps> = ({ pet }) => {
  const allergies   = normalizeStringArray(pet.allergies);
  const conditions  = normalizeStringArray(pet.chronic_conditions);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
        <Heart size={17} className="text-rose-500" />
        Thông tin sức khỏe
      </h2>

      {/* Allergies */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-700">Dị ứng</h3>
        </div>
        <TagList
          items={allergies}
          emptyText="Không có dị ứng đã biết"
          colorClass="bg-amber-50 text-amber-700 border-amber-200"
        />
      </div>

      {/* Chronic conditions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart size={14} className="text-rose-400" />
          <h3 className="text-sm font-semibold text-slate-700">Bệnh mãn tính</h3>
        </div>
        <TagList
          items={conditions}
          emptyText="Không có bệnh mãn tính đã biết"
          colorClass="bg-rose-50 text-rose-700 border-rose-200"
        />
      </div>

      {/* Notes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={14} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Ghi chú đặc biệt</h3>
        </div>
        {pet.notes?.trim() ? (
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 rounded-xl p-4 border border-slate-100">
            {pet.notes}
          </p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-400 italic">
            <CheckCircle2 size={14} className="text-secondary shrink-0" />
            Chưa có ghi chú đặc biệt
          </div>
        )}
      </div>
    </div>
  );
};

export default PetDetailHealthInfo;
