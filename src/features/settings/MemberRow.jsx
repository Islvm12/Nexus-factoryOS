// src/features/settings/MemberRow.jsx
import React from "react";
import { Trash2, Loader2, Edit2 } from "lucide-react";

export default function MemberRow({
  id,
  initials,
  name,
  role,
  isAdmin,
  isSelf,
  onDelete,
  onEdit,
  isDeleting,
}) {
  // Map specific roles to our Light/Dark Mode CSS variables
  const themes = {
    admin: {
      avatar: "bg-[var(--blue-dim)] text-[var(--blue)]",
      badge: "bg-[var(--blue-bg)] text-[var(--blue)] border-[var(--blue-dim)]",
    },
    operator: {
      avatar: "bg-[var(--teal-dim)] text-[var(--teal)]",
      badge: "bg-[var(--teal-bg)] text-[var(--teal)] border-[var(--teal-dim)]",
    },
    "ai specialist": {
      avatar: "bg-[var(--amber-dim)] text-[var(--amber)]",
      badge:
        "bg-[var(--amber-bg)] text-[var(--amber)] border-[var(--amber-dim)]",
    },
    viewer: {
      avatar: "bg-[var(--bg4)] text-[var(--text-secondary)]",
      badge: "bg-[var(--bg4)] text-[var(--text-muted)] border-[var(--border)]",
    },
  };

  const displayRole = role ? String(role) : "Viewer";
  // Convert the API role to lowercase to safely match our theme object keys
  const safeRoleType = displayRole.toLowerCase();
  const theme = themes[safeRoleType] || themes.viewer;
  const displayInitials =
    initials || (name ? String(name).substring(0, 2).toUpperCase() : "U");

  // YOUR RULE: Only Admins can modify users, and no one can modify an Admin.
  const canModify = isAdmin && displayRole !== "Admin";

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 border-b border-[var(--border)] last:border-none hover:bg-[var(--bg3)] transition-colors rounded-sm">
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-[var(--font-mono)] font-semibold shrink-0 ${theme.avatar}`}
      >
        {displayInitials}
      </div>

      {/* User Details */}
      <div className="flex-1 truncate">
        <div className="flex items-center gap-2">
          <div className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight truncate">
            {name}
            {isSelf && (
              <span className="ml-1 text-[var(--text-muted)] font-normal italic">
                (You)
              </span>
            )}
          </div>
          <span
            className={`px-1.5 py-[1px] rounded-sm text-[9px] font-[var(--font-mono)] font-semibold shrink-0 border ${theme.badge}`}
          >
            {displayRole}
          </span>
        </div>
        <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] mt-0.5">
          ID: {id}
        </div>
      </div>

      {/* Action Buttons (Edit & Delete) */}
      {canModify && (
        <div className="ml-2 flex items-center gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            disabled={isDeleting}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--blue)] hover:bg-[var(--blue-bg)] rounded transition-colors disabled:opacity-50"
            title="Edit User"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(id, name)}
            disabled={isDeleting}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--coral)] hover:bg-[var(--coral-bg)] rounded transition-colors disabled:opacity-50"
            title="Delete User"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
