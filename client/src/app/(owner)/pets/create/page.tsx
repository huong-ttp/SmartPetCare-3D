"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { PetForm } from "@/components/pets/PetForm";

export default function CreatePetPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/pets"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>
      </div>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 rounded-3xl border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary text-white rounded-2xl shadow-md shadow-primary/20">
            <PlusCircle size={26} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Thêm thú cưng mới</h1>
            <p className="text-sm text-slate-500 mt-1">
              Đăng ký hồ sơ thú cưng để theo dõi lịch tiêm phòng, lịch khám và hồ sơ sức khỏe.
            </p>
          </div>
        </div>
      </div>

      {/* Shared PetForm in Create Mode */}
      <PetForm mode="create" />
    </div>
  );
}
