"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-xl",
  xl: "w-20 h-20 text-3xl",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name?: string): string {
  const colors = [
    "from-[#0EA5B7] to-[#22C55E]",
    "from-[#FB923C] to-[#0EA5B7]",
    "from-[#22C55E] to-[#0EA5B7]",
    "from-purple-500 to-[#0EA5B7]",
    "from-pink-500 to-[#FB923C]",
  ];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = "md",
  className,
}) => {
  const initials = getInitials(name);
  const gradient = getColorFromName(name);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? name ?? "Avatar"}
        className={cn(
          "rounded-full object-cover flex-shrink-0",
          SIZE_CLASSES[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0",
        "bg-gradient-to-br text-white font-semibold select-none",
        gradient,
        SIZE_CLASSES[size],
        className
      )}
      aria-label={name ?? "Avatar"}
      role="img"
    >
      {initials}
    </div>
  );
};

export default Avatar;
