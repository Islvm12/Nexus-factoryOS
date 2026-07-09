// src/components/ui/Card.jsx
import React from "react";

export function Card({ children, className = "", topAccent }) {
  // topAccent can be 'amber', 'teal', 'coral', or 'blue' for the metric cards
  const accentMap = {
    amber: "before:bg-[var(--amber)]",
    teal: "before:bg-[var(--teal)]",
    coral: "before:bg-[var(--coral)]",
    blue: "before:bg-[var(--blue)]",
  };

  return (
    <div
      className={`
      relative bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]
      ${topAccent ? `before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 ${accentMap[topAccent]}` : ""}
      ${className}
    `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, rightAction }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
      <div>
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] font-[var(--font-mono)] font-medium text-[var(--text-muted)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  );
}
