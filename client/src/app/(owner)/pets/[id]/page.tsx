"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, RefreshCw, Dog } from "lucide-react";
import { motion } from "framer-motion";
import { petService } from "@/services/petService";
import type { Pet } from "@/types/pet.type";
import { PetDetailBasicInfo } from "@/components/pets/PetDetailBasicInfo";
import { PetDetailHealthInfo } from "@/components/pets/PetDetailHealthInfo";
import { PetDetailNavTabs } from "@/components/pets/PetDetailNavTabs";
import { DeletePetModal } from "@/components/pets/DeletePetModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  getSpeciesEmoji,
  getSpeciesLabel,
  SPECIES_BADGE_COLORS,
} from "@/utils/petHelpers";
import { cn } from "@/utils/cn";

// ─── Skeleton layout matching the page structure ─────────────────────────────

function PetDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <Skeleton rounded="lg" width={80} height={80} />
          <div className="flex-1 space-y-3">
            <Skeleton height={28} width="50%" />
            <Skeleton height={16} width="30%" />
            <div className="flex gap-2">
              <Skeleton height={24} width={80} rounded="full" />
              <Skeleton height={24} width={60} rounded="full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton height={36} width={100} rounded="md" />
            <Skeleton height={36} width={80} rounded="md" />
          </div>
        </div>
      </div>
      {/* Two section cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <Skeleton height={20} width="40%" />
            <Skeleton height={12} count={5} gap={10} />
          </div>
        ))}
      </div>
      {/* Nav tabs skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <Skeleton rounded="lg" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton height={14} width="70%" />
              <Skeleton height={11} width="90%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Not Found / 403 state ────────────────────────────────────────────────────

function PetNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-6 text-4xl">
        🐾
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy thú cưng</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        Thú cưng này không tồn tại, đã bị xóa, hoặc bạn không có quyền xem hồ sơ này.
      </p>
      <Link
        href="/pets"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-600 shadow-sm transition-all"
      >
        <ArrowLeft size={15} />
        Quay lại danh sách thú cưng
      </Link>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function PetErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
        <RefreshCw size={24} className="text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Đã xảy ra lỗi</h2>
      <p className="text-sm text-slate-500 max-w-xs mb-5">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-600 transition-colors"
      >
        <RefreshCw size={14} />
        Thử lại
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PetDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const { success: showSuccess, error: showError } = useToast();

  const petId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [pet, setPet]               = useState<Pet | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showDelete, setShowDelete]   = useState(false);
  const [isDeleting, setIsDeleting]   = useState(false);

  // ─── Fetch pet ────────────────────────────────────────────────────────────

  const loadPet = useCallback(async () => {
    if (!petId) return;
    setIsLoading(true);
    setNotFound(false);
    setFetchError(null);
    try {
      const data = await petService.getById(petId);
      setPet(data);
    } catch (err: unknown) {
      const errMsg = (err instanceof Error) ? err.message : String(err);
      if (errMsg === "NOT_FOUND" || (err as { response?: { status?: number } })?.response?.status === 404
        || (err as { response?: { status?: number } })?.response?.status === 403) {
        setNotFound(true);
      } else {
        setFetchError("Không thể tải thông tin thú cưng. Vui lòng thử lại.");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!pet) return;
    setIsDeleting(true);
    try {
      await petService.delete(pet.id);
      showSuccess(`Đã xóa "${pet.name}" thành công.`);
      router.push("/pets");
    } catch (err) {
      showError("Không thể xóa thú cưng. Vui lòng thử lại.");
      console.error(err);
      setIsDeleting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading)  return <PetDetailSkeleton />;
  if (notFound)   return <PetNotFound />;
  if (fetchError) return <PetErrorState message={fetchError} onRetry={loadPet} />;
  if (!pet)       return null;

  const speciesColors = SPECIES_BADGE_COLORS[pet.species];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/pets"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        Danh sách thú cưng
      </Link>

      {/* ── Hero header card ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-slate-50 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 opacity-10 text-9xl flex items-center justify-center">
            {getSpeciesEmoji(pet.species)}
          </div>
        </div>

        <div className="px-6 pb-6 relative">
          {/* Avatar — overlaps gradient */}
          <div className="absolute -top-10 left-6">
            {pet.avatar_url ? (
              <img
                src={pet.avatar_url}
                alt={pet.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border-4 border-white shadow-md",
                  speciesColors.bg
                )}
              >
                {getSpeciesEmoji(pet.species)}
              </div>
            )}
          </div>

          {/* Pet info + action buttons */}
          <div className="pt-14 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{pet.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                    speciesColors.bg, speciesColors.text, speciesColors.border
                  )}
                >
                  {getSpeciesEmoji(pet.species)} {getSpeciesLabel(pet.species)}
                </span>
                {pet.breed && (
                  <span className="text-sm text-slate-500">{pet.breed}</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                id="edit-pet-btn"
                href={`/pets/${pet.id}/edit`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
              >
                <Pencil size={15} />
                Chỉnh sửa
              </Link>
              <button
                id="delete-pet-btn"
                onClick={() => setShowDelete(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all duration-200 shadow-sm"
              >
                <Trash2 size={15} />
                Xóa
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Info sections ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        <PetDetailBasicInfo pet={pet} />
        <PetDetailHealthInfo pet={pet} />
      </motion.div>

      {/* ── Navigation tabs ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
      >
        <PetDetailNavTabs petId={pet.id} />
      </motion.div>

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      <DeletePetModal
        isOpen={showDelete}
        petName={pet.name}
        isDeleting={isDeleting}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
