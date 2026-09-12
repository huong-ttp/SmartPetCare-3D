"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Dog } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { petService } from "@/services/petService";
import type { Pet, PetSpecies } from "@/types/pet.type";
import { PetCard } from "@/components/pets/PetCard";
import { PetFilterBar } from "@/components/pets/PetFilterBar";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

export default function PetsPage() {
  const { error: showError } = useToast();

  const [pets, setPets]           = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch]                         = useState("");
  const [selectedSpecies, setSelectedSpecies]       = useState<PetSpecies | "all">("all");

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const loadPets = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await petService.list();
      setPets(data);
    } catch (err: unknown) {
      const msg = "Không thể tải danh sách thú cưng. Vui lòng thử lại.";
      setFetchError(msg);
      showError(msg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  // ─── Filtering ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return pets.filter((p) => {
      const matchName    = p.name.toLowerCase().includes(search.toLowerCase());
      const matchSpecies = selectedSpecies === "all" || p.species === selectedSpecies;
      return matchName && matchSpecies;
    });
  }, [pets, search, selectedSpecies]);

  const speciesCounts = useMemo(() => {
    return pets.reduce<Record<string, number>>((acc, p) => {
      acc[p.species] = (acc[p.species] ?? 0) + 1;
      return acc;
    }, {});
  }, [pets]);

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const isFiltering = search !== "" || selectedSpecies !== "all";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thú cưng của tôi</h1>
          {!isLoading && !fetchError && (
            <p className="text-sm text-slate-500 mt-0.5">
              {pets.length > 0
                ? `${pets.length} thú cưng đang được quản lý`
                : "Chưa có thú cưng nào"}
            </p>
          )}
        </div>

        <Link
          id="add-pet-btn"
          href="/pets/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary-600 hover:shadow-md transition-all duration-200 active:scale-95"
        >
          <Plus size={17} />
          Thêm thú cưng
        </Link>
      </div>

      {/* Filter bar — only when not loading and no hard error */}
      {!isLoading && !fetchError && pets.length > 0 && (
        <PetFilterBar
          search={search}
          onSearchChange={setSearch}
          selectedSpecies={selectedSpecies}
          onSpeciesChange={setSelectedSpecies}
          speciesCounts={speciesCounts}
          totalCount={pets.length}
        />
      )}

      {/* ── Loading skeleton ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────────────── */}
      {!isLoading && fetchError && (
        <EmptyState
          title="Đã xảy ra lỗi"
          description={fetchError}
          icon={<RefreshCw size={28} />}
          action={
            <button
              onClick={loadPets}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-600 transition-colors"
            >
              <RefreshCw size={15} />
              Thử lại
            </button>
          }
        />
      )}

      {/* ── Empty state: 0 pets total ─────────────────────────────────────── */}
      {!isLoading && !fetchError && pets.length === 0 && (
        <EmptyState
          title="Chưa có thú cưng nào"
          description="Hãy thêm thú cưng đầu tiên để bắt đầu quản lý hồ sơ sức khỏe."
          icon={<Dog size={28} />}
          action={
            <Link
              href="/pets/create"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-600 shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <Plus size={16} />
              Thêm thú cưng
            </Link>
          }
        />
      )}

      {/* ── Empty state: no filter match ──────────────────────────────────── */}
      {!isLoading && !fetchError && pets.length > 0 && filtered.length === 0 && (
        <EmptyState
          title="Không tìm thấy thú cưng phù hợp"
          description={`Không có thú cưng nào khớp với bộ lọc hiện tại.`}
          icon={<Dog size={28} />}
          action={
            <button
              onClick={() => { setSearch(""); setSelectedSpecies("all"); }}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          }
        />
      )}

      {/* ── Pet grid ──────────────────────────────────────────────────────── */}
      {!isLoading && !fetchError && filtered.length > 0 && (
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((pet, i) => (
              <motion.div
                key={pet.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 24 }}
              >
                <PetCard pet={pet} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
