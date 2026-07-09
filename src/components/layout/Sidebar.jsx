// src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LogIcon,
  SquaresFourIcon,
  GpsFixIcon,
  SlidersIcon,
  ChartBarIcon,
  GearSixIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { useInspection } from "../../context/InspectionContext"; // <-- Import Context

export default function Sidebar() {
  const { pendingCount } = useInspection(); // <-- Use the dynamic count

  const navLinks = [
    {
      section: "Monitor",
      items: [
        { name: "Dashboard", path: "/", icon: SquaresFourIcon },
        {
          name: "Quality Log",
          path: "/quality",
          icon: LogIcon,
          badge: pendingCount > 0 ? pendingCount : null,
        }, // Dynamic badge
        { name: "Diagnostics", path: "/diagnostics", icon: GpsFixIcon },
      ],
    },
    {
      section: "Manage",
      items: [
        { name: "Control", path: "/control", icon: SlidersIcon },
        { name: "Analytics", path: "/analytics", icon: ChartBarIcon },
      ],
    },
    {
      section: "System",
      items: [
        { name: "Settings", path: "/settings", icon: GearSixIcon },
        { name: "Simulator", path: "/simulator", icon: WrenchIcon },
      ],
    },
  ];

  return (
    <nav className="fixed top-[var(--header)] left-0 bottom-0 w-[var(--sidebar)] bg-[var(--bg1)] border-r border-[var(--border)] flex flex-col pt-4 pb-6 z-40 shadow-sm">
      {navLinks.map((group, idx) => (
        <div key={idx}>
          <div className="text-[9px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-[0.12em] uppercase px-5 py-2">
            {group.section}
          </div>

          {group.items.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2.5 px-5 py-2 text-[13px] shrink font-medium transition-colors border-l-2
                ${
                  isActive
                    ? "bg-[var(--blue-bg)] text-[var(--blue)] border-[var(--blue)]"
                    : "text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg3)] hover:text-[var(--text-primary)]"
                }
              `}
            >
              <item.icon size={18} weight="fill" />
              {item.name}
              {item.badge && (
                <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--coral-bg)] border border-[var(--coral-dim)] text-[var(--coral)]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
          {idx < navLinks.length - 1 && (
            <div className="h-px bg-[var(--border)] my-2"></div>
          )}
        </div>
      ))}

      {/* Uptime Widget */}
      <div className="mt-auto px-5 pt-4">
        <div className="p-2.5 bg-[var(--bg3)] border border-[var(--border)] rounded text-[11px]">
          <div className="text-[var(--text-muted)] font-[var(--font-mono)] text-[9px] tracking-wider mb-1">
            SYSTEM UPTIME
          </div>
          <div className="font-[var(--font-mono)] text-lg font-semibold text-[var(--teal)]">
            97.4<span className="text-[12px]">%</span>
          </div>
          <div className="h-[3px] bg-[var(--border)] rounded-sm mt-1.5 overflow-hidden">
            <div className="h-full bg-[var(--teal)] rounded-sm w-[97.4%]"></div>
          </div>
        </div>
      </div>
    </nav>
  );
}
