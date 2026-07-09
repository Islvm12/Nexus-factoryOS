// src/components/quality/FilterTabs.jsx
import React from "react";

export default function FilterTabs({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg2)]">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.name;
        return (
          <button
            key={filter.name}
            onClick={() => onFilterChange(filter.name)}
            className={`
              px-3 py-1 rounded-full border text-[11px] font-medium font-[var(--font-ui)] transition-colors duration-150
              ${
                isActive
                  ? "bg-[var(--blue-bg)] border-[var(--blue-dim)] text-[var(--blue)]"
                  : "bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg4)] hover:text-[var(--text-primary)]"
              }
            `}
          >
            {filter.name}
            <span className="ml-1 font-[var(--font-mono)] text-[9px] font-semibold opacity-90">
              {filter.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
