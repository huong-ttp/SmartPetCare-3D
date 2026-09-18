"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3, AlertCircle, RefreshCw } from "lucide-react";
import { petService } from "@/services/petService";
import type { Pet } from "@/types/pet.type";
import { PetForm } from "@/components/pets/PetForm";
import { Skeleton } from "@/components/ui/Skeleton";

export default function EditPetPage() {
  const params = useParams();
  const router = useRouter();
  const petId = params?.id as string;

  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPet = async () => {
    if (!petId) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await petService.getById(petId);
      setPet(data);
    } catch (err: any) {
      console.error("Error loading pet details for editing:", err);
      setErrorMsg("Không tìm thấy thông tin thú cưng hoặc bạn không có quyền truy cập.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPet();
  }, [petId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={petId ? `/pets/${petId}` : "/pets"}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          {pet ? `Quay lại hồ sơ ${pet.name}` : "Quay lại"}
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-4">
            <Skeleton height={32} width="40%" />
            <Skeleton height={16} width="60%" />
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6">
            <Skeleton height={24} width="30%" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton height={48} />
              <Skeleton height={48} />
              <Skeleton height={48} />
              <Skeleton height={48} />
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && errorMsg && (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Không thể tải dữ liệu thú cưng</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">{errorMsg}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={fetchPet}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-600 transition-colors shadow-sm"
            >
              <RefreshCw size={15} />
              Thử lại
            </button>
            <button
              onClick={() => router.push("/pets")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Về danh sách thú cưng
            </button>
          </div>
        </div>
      )}

      {/* Form state */}
      {!isLoading && pet && (
        <>
          {/* Page Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 rounded-3xl border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary text-white rounded-2xl shadow-md shadow-primary/20">
                <Edit3 size={26} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Chỉnh sửa hồ sơ: {pet.name}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Cập nhật các thông tin cơ bản, hồ sơ y tế và đặc điểm nhận dạng.
                </p>
              </div>
            </div>
          </div>

          {/* Shared PetForm in Edit Mode */}
          <PetForm mode="edit" initialData={pet} petId={petId} />
        </>
      )}
    </div>
  );
}
