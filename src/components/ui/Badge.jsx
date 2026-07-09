// src/components/ui/Badge.jsx
import React from "react";

export default function Badge({ children, variant = "info", className = "" }) {
  const baseStyle =
    "px-2 py-0.5 rounded font-[var(--font-mono)] font-semibold text-[10px] uppercase tracking-wide border";

  const variants = {
    // Quality States
    pending: "bg-[var(--blue-bg)] text-[var(--blue)] border-[var(--blue-dim)]",
    flagged:
      "bg-[var(--coral-bg)] text-[var(--coral)] border-[var(--coral-dim)]",
    reviewed: "bg-[var(--teal-bg)] text-[var(--teal)] border-[var(--teal-dim)]",

    // Confidence / Severity
    high: "bg-[var(--teal-bg)] text-[var(--teal)] border-[var(--teal-dim)]",
    mid: "bg-[var(--amber-bg)] text-[var(--amber)] border-[var(--amber-dim)]",
    low: "bg-[var(--coral-bg)] text-[var(--coral)] border-[var(--coral-dim)]",

    // Info
    info: "bg-[var(--bg4)] text-[var(--text-secondary)] border-[var(--border)]",
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
