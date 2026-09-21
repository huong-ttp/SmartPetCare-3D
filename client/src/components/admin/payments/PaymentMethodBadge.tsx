"use client";

import React from "react";
import { Banknote, Building2, ExternalLink } from "lucide-react";
import { PaymentMethod } from "@/types/payment.type";
import { cn } from "@/utils/cn";

interface PaymentMethodBadgeProps {
  method: PaymentMethod;
  transactionRef?: string;
  className?: string;
  showRefBadge?: boolean;
}

export const PaymentMethodBadge: React.FC<PaymentMethodBadgeProps> = ({
  method,
  transactionRef,
  className,
  showRefBadge = true,
}) => {
  if (method === "cash") {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70",
            className
          )}
        >
          <Banknote size={13} className="text-emerald-600" />
          <span>Tiền mặt</span>
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70",
          className
        )}
      >
        <Building2 size={13} className="text-blue-600" />
        <span>Chuyển khoản</span>
      </span>
      {showRefBadge && transactionRef && (
        <span className="text-[11px] font-mono text-slate-500 bg-slate-100/90 border border-slate-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
          <span className="text-slate-400">Ref:</span>
          <strong className="text-slate-700 font-semibold">{transactionRef}</strong>
        </span>
      )}
    </div>
  );
};

export default PaymentMethodBadge;
