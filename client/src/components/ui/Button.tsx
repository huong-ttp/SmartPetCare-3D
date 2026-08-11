"use client";

import React from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

type ButtonProps = Omit<HTMLMotionProps<"button">, "ref" | "children"> & {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  icon?: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  icon,
  ...rest
}) => {
  const base =
    "inline-flex items-center gap-3 rounded-full px-5 py-3 font-semibold transition-transform focus:outline-none";

  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-[#3B82F6] to-[#06b6d4] text-white shadow-lg hover:scale-105"
      : "bg-white/6 text-white border border-white/10 glass hover:scale-102";

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className={`${base} ${styles}`}
      {...rest}
    >
      {icon && <span className="opacity-90">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
};

export default Button;
