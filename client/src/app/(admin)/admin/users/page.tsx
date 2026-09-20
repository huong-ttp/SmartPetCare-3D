"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  User,
  UserRole,
  UserFilterParams,
  UserPagination,
} from "@/types/user.type";
import { adminService } from "@/services/adminService";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import UserRoleBadge from "@/components/admin/users/UserRoleBadge";
import UserStatusBadge from "@/components/admin/users/UserStatusBadge";
import CreateUserModal from "@/components/admin/users/CreateUserModal";
import EditUserModal from "@/components/admin/users/EditUserModal";
import ConfirmChangeRoleModal from "@/components/admin/users/ConfirmChangeRoleModal";
import ConfirmDeactivateModal from "@/components/admin/users/ConfirmDeactivateModal";
import {
  Search,
  UserPlus,
  RefreshCw,
  Filter,
  Users,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Unlock,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "-";
  }
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  // Data & loading state
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<UserPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: User;
    targetRole: UserRole;
  } | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users from API
  const fetchUsers = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setErrorMsg("");

      try {
        const filters: UserFilterParams = {
          search: debouncedSearch || undefined,
          role: roleFilter !== "all" ? roleFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page: pagination.page,
          limit: pagination.limit,
        };

        const res = await adminService.listUsers(filters);
        setUsers(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err: any) {
        console.error("Failed to fetch users:", err);
        setErrorMsg(
          err?.response?.data?.message ||
            "Không thể tải danh sách người dùng. Vui lòng kiểm tra kết nối hệ thống."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, roleFilter, statusFilter, pagination.page, pagination.limit]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const currentAdminId = useMemo(() => {
    return String(currentUser?.user_id || currentUser?.id || "");
  }, [currentUser]);

  const isSelf = (targetUser: User) => {
    const targetId = String(targetUser.user_id || targetUser.id || "");
    return targetId !== "" && targetId === currentAdminId;
  };

  // Copy email helper
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.info(`Đã sao chép email: ${email}`);
  };

  // Handle Quick Activate
  const handleActivate = async (targetUser: User) => {
    try {
      const targetId = targetUser.user_id || targetUser.id;
      const updated = await adminService.toggleUserActive(targetId, true);
      toast.success(
        `Đã kích hoạt lại tài khoản "${targetUser.full_name}".`,
        "Kích hoạt thành công"
      );
      setUsers((prev) =>
        prev.map((u) =>
          String(u.user_id || u.id) === String(targetId)
            ? { ...u, is_active: true, updated_at: updated.updated_at }
            : u
        )
      );
    } catch (err: any) {
      console.error("Failed to activate user:", err);
      toast.error(
        err?.response?.data?.message ||
          "Không thể kích hoạt tài khoản. Vui lòng thử lại sau.",
        "Lỗi thao tác"
      );
    }
  };

  // Quick stats computed from current page or counts
  const stats = useMemo(() => {
    const total = pagination.total || users.length;
    const owners = users.filter((u) => u.role === "owner").length;
    const doctors = users.filter((u) => u.role === "doctor").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const active = users.filter((u) => u.is_active).length;
    return { total, owners, doctors, admins, active };
  }, [users, pagination.total]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Quản lý người dùng
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Xem danh sách, phân quyền vai trò, quản lý trạng thái tài khoản và
                khởi tạo nhân sự mới
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

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <UserPlus size={16} />
            <span>+ Tạo tài khoản mới</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng tài khoản</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {pagination.total}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Bác sĩ thú y</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">
              {stats.doctors}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Stethoscope size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Quản trị viên</p>
            <p className="text-xl font-bold text-purple-600 mt-0.5">
              {stats.admins}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Đang hoạt động</p>
            <p className="text-xl font-bold text-cyan-600 mt-0.5">
              {stats.active} / {users.length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo họ tên hoặc email người dùng..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-400 text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="owner">Chủ nuôi (owner)</option>
              <option value="doctor">Bác sĩ (doctor)</option>
              <option value="admin">Quản trị viên (admin)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs font-medium text-slate-500">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã vô hiệu hóa</option>
            </select>
          </div>

          {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Đã xảy ra lỗi</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
          </div>
          <button
            onClick={() => fetchUsers()}
            className="px-3 py-1 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Họ và tên</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Số điện thoại</th>
                <th className="px-5 py-3.5">Địa chỉ</th>
                <th className="px-5 py-3.5">Vai trò</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Ngày tạo</th>
                <th className="px-5 py-3.5">Cập nhật</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Loading State */}
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-36 bg-slate-200 rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-5 w-20 bg-slate-200 rounded-full" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-5 w-24 bg-slate-200 rounded-full" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-8 w-24 bg-slate-200 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                /* Empty State */
                <tr>
                  <td colSpan={9} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Users size={28} />
                      </div>
                      <h4 className="text-base font-semibold text-slate-800">
                        Không tìm thấy người dùng
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                          ? "Không có tài khoản nào phù hợp với bộ lọc tìm kiếm hiện tại."
                          : "Hiện tại chưa có dữ liệu tài khoản người dùng trong hệ thống."}
                      </p>
                      {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors cursor-pointer"
                        >
                          Xóa bộ lọc tìm kiếm
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                /* Data Rows */
                users.map((item) => {
                  const self = isSelf(item);

                  return (
                    <tr
                      key={String(item.user_id || item.id)}
                      className={cn(
                        "hover:bg-slate-50/70 transition-colors",
                        self && "bg-cyan-50/20"
                      )}
                    >
                      {/* Full Name */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs",
                              item.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : item.role === "doctor"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-sky-100 text-sky-700"
                            )}
                          >
                            {item.full_name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{item.full_name}</span>
                              {self && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              #{item.user_id || item.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 group text-slate-700 font-medium">
                          <span>{item.email}</span>
                          <button
                            onClick={() => handleCopyEmail(item.email)}
                            className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                            title="Sao chép email"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        {item.phone || <span className="text-slate-300">-</span>}
                      </td>

                      {/* Address */}
                      <td className="px-5 py-4 max-w-[200px] truncate text-slate-600" title={item.address || ""}>
                        {item.address || <span className="text-slate-300">-</span>}
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <UserRoleBadge role={item.role} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <UserStatusBadge isActive={item.is_active} size="sm" />
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {formatDate(item.created_at)}
                      </td>

                      {/* Updated At */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {formatDate(item.updated_at)}
                      </td>

                      {/* Action Column */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Role Selector */}
                          <div
                            className="relative inline-block"
                            title={
                              self
                                ? "Không thể tự đổi vai trò của chính mình"
                                : "Thay đổi vai trò người dùng"
                            }
                          >
                            <select
                              value={item.role}
                              disabled={self}
                              onChange={(e) => {
                                const newRole = e.target.value as UserRole;
                                if (newRole !== item.role) {
                                  setRoleChangeTarget({
                                    user: item,
                                    targetRole: newRole,
                                  });
                                }
                              }}
                              className={cn(
                                "text-xs font-semibold py-1.5 px-2 rounded-lg border transition-all cursor-pointer",
                                self
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70"
                                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-400"
                              )}
                            >
                              <option value="owner">Chủ nuôi</option>
                              <option value="doctor">Bác sĩ</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>

                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingUser(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 hover:border-cyan-200 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Toggle Active/Inactive Button */}
                          {item.is_active ? (
                            <button
                              onClick={() => {
                                if (!self) setDeactivatingUser(item);
                              }}
                              disabled={self}
                              className={cn(
                                "p-1.5 rounded-lg border transition-colors cursor-pointer",
                                self
                                  ? "border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed"
                                  : "border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                              )}
                              title={
                                self
                                  ? "Không thể tự vô hiệu hóa tài khoản của chính mình"
                                  : "Vô hiệu hóa tài khoản này"
                              }
                            >
                              <Lock size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(item)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-pointer"
                              title="Kích hoạt lại tài khoản"
                            >
                              <Unlock size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <span className="font-semibold text-slate-900">
              {users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
            </span>
            <span>-</span>
            <span className="font-semibold text-slate-900">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            <span>trong tổng số</span>
            <span className="font-semibold text-slate-900">
              {pagination.total}
            </span>
            <span>người dùng</span>

            <span className="mx-2 text-slate-300">|</span>

            <span>Mỗi trang:</span>
            <select
              value={pagination.limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setPagination((prev) => ({
                  ...prev,
                  limit: newLimit,
                  page: 1,
                }));
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 cursor-pointer focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Page Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(prev.page - 1, 1),
                }))
              }
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg">
              {pagination.page} / {pagination.totalPages || 1}
            </span>

            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.page + 1, pagination.totalPages),
                }))
              }
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang kế tiếp"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: pagination.totalPages,
                }))
              }
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang cuối"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          fetchUsers();
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={(updated) => {
          setUsers((prev) =>
            prev.map((u) =>
              String(u.user_id || u.id) === String(updated.user_id || updated.id)
                ? { ...u, ...updated }
                : u
            )
          );
        }}
      />

      {/* Confirm Change Role Modal */}
      <ConfirmChangeRoleModal
        isOpen={!!roleChangeTarget}
        user={roleChangeTarget?.user || null}
        targetRole={roleChangeTarget?.targetRole || null}
        onClose={() => setRoleChangeTarget(null)}
        onSuccess={(updated) => {
          setUsers((prev) =>
            prev.map((u) =>
              String(u.user_id || u.id) === String(updated.user_id || updated.id)
                ? {
                    ...u,
                    role: updated.role,
                    role_updated_by: updated.role_updated_by,
                    role_updated_at: updated.role_updated_at,
                    updated_at: updated.updated_at,
                  }
                : u
            )
          );
        }}
      />

      {/* Confirm Deactivate Modal */}
      <ConfirmDeactivateModal
        isOpen={!!deactivatingUser}
        user={deactivatingUser}
        onClose={() => setDeactivatingUser(null)}
        onSuccess={(updated) => {
          setUsers((prev) =>
            prev.map((u) =>
              String(u.user_id || u.id) === String(updated.user_id || updated.id)
                ? { ...u, is_active: false, updated_at: updated.updated_at }
                : u
            )
          );
        }}
      />
    </div>
  );
}
