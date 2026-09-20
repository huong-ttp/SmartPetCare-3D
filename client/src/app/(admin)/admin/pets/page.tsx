"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  Filter,
  Dog,
  Cat,
  Sparkles,
  Eye,
  Edit2,
  Trash2,
  Scale,
  User,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  X,
  Plus,
  Heart,
  Cpu,
  Lock,
} from "lucide-react";
import type { Pet, PetSpecies, PetFilterParams, PetPagination } from "@/types/pet.type";
import { adminService } from "@/services/adminService";
import { petService } from "@/services/petService";
import { useToast } from "@/components/ui/Toast";
import AdminPetDetailModal from "@/components/admin/pets/AdminPetDetailModal";
import AdminEditPetModal from "@/components/admin/pets/AdminEditPetModal";
import AdminDeletePetModal from "@/components/admin/pets/AdminDeletePetModal";
import {
  SPECIES_LABELS,
  SPECIES_EMOJIS,
  SPECIES_BADGE_COLORS,
  GENDER_BADGE_COLORS,
  getSpeciesLabel,
  getSpeciesEmoji,
  getGenderLabel,
  formatWeight,
} from "@/utils/petHelpers";
import { cn } from "@/utils/cn";

export default function AdminPetsPage() {
  const toast = useToast();

  // Data & State
  const [pets, setPets] = useState<Pet[]>([]);
  const [pagination, setPagination] = useState<PetPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");

  // Modals state
  const [viewPet, setViewPet] = useState<Pet | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [editPet, setEditPet] = useState<Pet | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deletePet, setDeletePet] = useState<Pet | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Pets using admin.service.listPets(filters)
  const fetchPets = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setErrorMessage("");

      try {
        const filters: PetFilterParams = {
          search: debouncedSearch || undefined,
          species: speciesFilter !== "all" ? speciesFilter : undefined,
          page: pagination.page,
          limit: pagination.limit,
        };

        const res = await adminService.listPets(filters);
        setPets(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err: any) {
        console.error("Failed to fetch pets list:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            "Không thể tải danh sách thú cưng. Vui lòng kiểm tra kết nối hệ thống."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, speciesFilter, pagination.page, pagination.limit]
  );

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPets(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSpeciesFilter("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Open View Modal with fresh details via petService.getById(id)
  const handleOpenView = async (pet: Pet) => {
    try {
      const freshPet = await petService.getById(pet.id);
      setViewPet(freshPet);
    } catch (err) {
      console.warn("Falling back to row pet data for view:", err);
      setViewPet(pet);
    }
    setIsViewModalOpen(true);
  };

  // Open Edit Modal with fresh details via petService.getById(id)
  const handleOpenEdit = async (pet: Pet) => {
    try {
      const freshPet = await petService.getById(pet.id);
      setEditPet(freshPet);
    } catch (err) {
      console.warn("Falling back to row pet data for edit:", err);
      setEditPet(pet);
    }
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (pet: Pet) => {
    setDeletePet(pet);
    setIsDeleteModalOpen(true);
  };

  // Callback when Pet is updated
  const handlePetUpdated = (updatedPet: Pet) => {
    setPets((prev) =>
      prev.map((p) => (String(p.id) === String(updatedPet.id) ? { ...p, ...updatedPet } : p))
    );
    // Refresh to keep server state in sync
    fetchPets(false);
  };

  // Callback when Pet is deleted
  const handlePetDeleted = (deletedPetId: string) => {
    setPets((prev) => prev.filter((p) => String(p.id) !== String(deletedPetId)));
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = pagination.total || pets.length;
    const dogs = pets.filter((p) => p.species === "dog").length;
    const cats = pets.filter((p) => p.species === "cat").length;
    const other = pets.filter((p) => p.species !== "dog" && p.species !== "cat").length;
    const withChip = pets.filter((p) => !!p.microchip_number || !!(p as any).microchip_id).length;
    return { total, dogs, cats, other, withChip };
  }, [pets, pagination.total]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 text-xl">
              🐾
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Quản lý thú cưng (Pet Management)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Theo dõi hồ sơ thú cưng, thông tin chủ nuôi, tình trạng giống loài và lịch sử y tế
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer",
              (isRefreshing || isLoading) && "opacity-60 cursor-not-allowed"
            )}
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              size={15}
              className={cn((isRefreshing || isLoading) && "animate-spin text-cyan-600")}
            />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total Pets */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng thú cưng</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{pagination.total}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-lg">
            🐾
          </div>
        </div>

        {/* Dogs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Chó (Canine)</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{metrics.dogs}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Dog size={18} />
          </div>
        </div>

        {/* Cats */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Mèo (Feline)</p>
            <p className="text-xl font-bold text-purple-600 mt-0.5">{metrics.cats}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Cat size={18} />
          </div>
        </div>

        {/* With Microchip */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Đã gắn Microchip</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{metrics.withChip}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Cpu size={18} />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box: Pet name or Owner name */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo tên thú cưng hoặc tên chủ sở hữu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Species Dropdown & Reset */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Loài:</span>
              <select
                value={speciesFilter}
                onChange={(e) => {
                  setSpeciesFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả loài thú cưng</option>
                <option value="dog">🐶 Chó (Dog)</option>
                <option value="cat">🐱 Mèo (Cat)</option>
                <option value="bird">🦜 Chim (Bird)</option>
                <option value="rabbit">🐰 Thỏ (Rabbit)</option>
                <option value="hamster">🐹 Hamster</option>
                <option value="other">🐾 Khác (Other)</option>
              </select>
            </div>

            {(debouncedSearch || speciesFilter !== "all") && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                title="Xóa bộ lọc"
              >
                <X size={13} />
                <span>Đặt lại lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Badges */}
        {(debouncedSearch || speciesFilter !== "all") && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs text-slate-500">
            <span>Đang lọc theo:</span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium">
                Từ khóa: &quot;{debouncedSearch}&quot;
                <button
                  onClick={() => setSearchQuery("")}
                  className="hover:text-cyan-900 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}
            {speciesFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                Loài: {SPECIES_LABELS[speciesFilter as PetSpecies] || speciesFilter}
                <button
                  onClick={() => setSpeciesFilter("all")}
                  className="hover:text-purple-900 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Error State */}
        {errorMessage && (
          <div className="p-6 text-center space-y-3 bg-red-50/50 border-b border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Có lỗi xảy ra khi tải dữ liệu
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{errorMessage}</p>
            <button
              onClick={() => fetchPets()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Tên thú cưng (Pet Name)</th>
                <th className="py-3.5 px-4">Chủ sở hữu (Owner)</th>
                <th className="py-3.5 px-4">Loài (Species)</th>
                <th className="py-3.5 px-4">Giống (Breed)</th>
                <th className="py-3.5 px-4">Giới tính</th>
                <th className="py-3.5 px-4">Cân nặng (Cache)</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // SKELETON LOADING STATE
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="w-24 h-3.5 bg-slate-200 rounded" />
                          <div className="w-16 h-2.5 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-28 h-3.5 bg-slate-200 rounded mb-1" />
                      <div className="w-20 h-2.5 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-5 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-20 h-3.5 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-14 h-5 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-14 h-4 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="w-20 h-7 bg-slate-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : pets.length === 0 ? (
                // EMPTY STATE
                <tr>
                  <td colSpan={7} className="py-16 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-3xl mb-3">
                      🐾
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">
                      Không tìm thấy thú cưng nào
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-4">
                      {debouncedSearch || speciesFilter !== "all"
                        ? "Không có hồ sơ thú cưng nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn."
                        : "Chưa có dữ liệu thú cưng nào được đăng ký trong hệ thống."}
                    </p>
                    {(debouncedSearch || speciesFilter !== "all") && (
                      <button
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={13} />
                        <span>Đặt lại tìm kiếm & lọc</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                // PET ROWS
                pets.map((pet) => {
                  const speciesBadge =
                    SPECIES_BADGE_COLORS[pet.species as keyof typeof SPECIES_BADGE_COLORS] || {
                      bg: "bg-slate-100",
                      text: "text-slate-700",
                      border: "border-slate-200",
                    };

                  const genderBadge =
                    GENDER_BADGE_COLORS[pet.gender as keyof typeof GENDER_BADGE_COLORS] || {
                      bg: "bg-slate-100",
                      text: "text-slate-700",
                      border: "border-slate-200",
                    };

                  return (
                    <tr
                      key={pet.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Pet Name & Avatar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center text-lg shrink-0 shadow-2xs">
                            {pet.avatar_url ? (
                              <img
                                src={pet.avatar_url}
                                alt={pet.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{getSpeciesEmoji(pet.species)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors flex items-center gap-1.5">
                              <span>{pet.name}</span>
                              {pet.is_neutered && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"
                                  title="Đã triệt sản"
                                />
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              #{pet.id}
                              {pet.microchip_number && (
                                <span className="ml-1.5 text-slate-500">
                                  • Chip: {pet.microchip_number}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <User size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                              {pet.owner_name || "Chưa gán chủ"}
                            </p>
                            {pet.owner_phone && (
                              <p className="text-[11px] text-slate-400">
                                {pet.owner_phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Species */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
                            speciesBadge.bg,
                            speciesBadge.text,
                            speciesBadge.border
                          )}
                        >
                          <span>{getSpeciesEmoji(pet.species)}</span>
                          <span>{getSpeciesLabel(pet.species)}</span>
                        </span>
                      </td>

                      {/* Breed */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-medium">
                          {pet.breed || "—"}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                            genderBadge.bg,
                            genderBadge.text,
                            genderBadge.border
                          )}
                        >
                          {getGenderLabel(pet.gender)}
                        </span>
                      </td>

                      {/* Weight (Readonly, Cached) */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900">
                          <Scale size={13} className="text-amber-600" />
                          <span className="font-bold font-mono text-xs">
                            {pet.weight_kg !== undefined ? `${pet.weight_kg} kg` : "—"}
                          </span>
                          <span
                            className="text-[9px] uppercase font-bold text-amber-600/80 tracking-wide ml-0.5"
                            title="Cân nặng được cache tự động từ hồ sơ khám bệnh/bệnh án mới nhất"
                          >
                            Cache
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Button */}
                          <button
                            onClick={() => handleOpenView(pet)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
                            title="Xem chi tiết thú cưng"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(pet)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleOpenDelete(pet)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa thú cưng"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Total & Current items summary */}
          <div className="text-slate-500 text-center sm:text-left">
            Hiển thị{" "}
            <span className="font-semibold text-slate-800">
              {pets.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-800">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-bold text-slate-900">{pagination.total}</span> thú cưng
          </div>

          {/* Controls: Rows per page & Navigation */}
          <div className="flex items-center gap-3">
            {/* Page Size Select */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="hidden sm:inline">Số dòng:</span>
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    limit: Number(e.target.value),
                    page: 1,
                  }))
                }
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Page Nav */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Trang đầu"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-700 bg-white rounded-lg border border-slate-200">
                {pagination.page} / {pagination.totalPages || 1}
              </span>

              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Trang tiếp"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.totalPages }))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Trang cuối"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AdminPetDetailModal
        isOpen={isViewModalOpen}
        pet={viewPet}
        onClose={() => setIsViewModalOpen(false)}
        onEdit={(pet) => handleOpenEdit(pet)}
      />

      <AdminEditPetModal
        isOpen={isEditModalOpen}
        pet={editPet}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handlePetUpdated}
      />

      <AdminDeletePetModal
        isOpen={isDeleteModalOpen}
        pet={deletePet}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handlePetDeleted}
      />
    </div>
  );
}
