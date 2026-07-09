// src/components/ui/Button.jsx
import React from "react";

export default function Button({
  children,
  variant = "default",
  className = "",
  onClick,
  ...props
}) {
  const baseStyle =
    "flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-sm)] border text-[12px] font-[var(--font-ui)] font-medium cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]";

  const variants = {
    default:
      "bg-[var(--bg2)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-bright)] hover:text-[var(--text-primary)] hover:bg-[var(--bg3)]",
    primary:
      "bg-[var(--blue-bg)] border-[var(--blue-dim)] text-[var(--blue)] hover:bg-[#DBEAFE] hover:border-[var(--blue)] dark:hover:bg-[var(--blue-dim)]",
    amber:
      "bg-[var(--amber-bg)] border-[var(--amber-dim)] text-[var(--amber)] hover:bg-[#FEF3C7] hover:border-[var(--amber)] dark:hover:bg-[var(--amber-dim)]",
    teal: "bg-[var(--teal-bg)] border-[var(--teal-dim)] text-[var(--teal)] hover:bg-[#D1FAE5] hover:border-[var(--teal)] dark:hover:bg-[var(--teal-dim)]",
    estop:
      "bg-[var(--coral)] border-none text-white font-[var(--font-mono)] font-semibold tracking-wider px-7 py-3 hover:bg-[#E11D48] shadow-[0_2px_4px_rgba(244,63,94,0.3)] hover:shadow-[0_4px_8px_rgba(225,29,72,0.4)]",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
