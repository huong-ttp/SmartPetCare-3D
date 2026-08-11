import React from "react";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
};

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "" }) => {
  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>{children}</div>
  );
};

export default GlassCard;
