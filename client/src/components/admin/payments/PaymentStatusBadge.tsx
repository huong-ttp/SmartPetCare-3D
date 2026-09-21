"use client";

import React from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { PaymentStatus } from "@/types/payment.type";
import { cn } from "@/utils/cn";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  className,
}) => {
  switch (status) {
    case "pending":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs",
            className
          )}
        >
          <Clock size={13} className="text-amber-500 animate-pulse" />
          <span>Chờ xác nhận</span>
        </span>
      );

    case "success":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs",
            className
          )}
        >
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Thành công</span>
        </span>
      );

    case "failed":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs",
            className
          )}
        >
          <XCircle size={13} className="text-rose-500" />
          <span>Đã từ chối</span>
        </span>
      );

    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700",
            className
          )}
        >
          <span>{status}</span>
        </span>
      );
  }
};

export default PaymentStatusBadge;
