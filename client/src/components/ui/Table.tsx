"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface TableColumn<T> {
  key: string;
  title: string | React.ReactNode;
  dataIndex?: keyof T;
  render?: (record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (record: T) => string;
  loading?: boolean;
  emptyText?: string;
  className?: string;
  onRowClick?: (record: T) => void;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyText = "Không có dữ liệu",
  className,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-slate-200 bg-white", className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-6 py-4 whitespace-nowrap",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                  col.className
                )}
                style={{ width: col.width }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-[#0EA5B7] rounded-full animate-spin" />
                  Đang tải...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, idx) => (
              <tr
                key={rowKey(record)}
                onClick={() => onRowClick?.(record)}
                className={cn(
                  "bg-white transition-colors duration-150",
                  onRowClick ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/50"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-6 py-4",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(record, idx)
                      : col.dataIndex
                      ? (record[col.dataIndex] as React.ReactNode)
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
