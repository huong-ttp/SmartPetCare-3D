"use client";

import React from "react";
import { UserRole } from "@/types/user.type";
import { ShieldAlert, Stethoscope, User as UserIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface UserRoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: React.ReactNode;
  }
> = {
  owner: {
    label: "Chủ nuôi",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800/60",
    dot: "bg-sky-500",
    icon: <UserIcon size={12} className="stroke-[2.5]" />,
  },
  doctor: {
    label: "Bác sĩ thú y",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
    icon: <Stethoscope size={12} className="stroke-[2.5]" />,
  },
  admin: {
    label: "Quản trị viên",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/60",
    dot: "bg-purple-500",
    icon: <ShieldAlert size={12} className="stroke-[2.5]" />,
  },
};

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  role,
  size = "sm",
  showIcon = true,
  className,
}) => {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.owner;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full border transition-all shadow-xs",
        config.bg,
        config.text,
        config.border,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs sm:text-sm",
        className
      )}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export default UserRoleBadge;
