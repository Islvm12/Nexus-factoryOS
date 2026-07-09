// src/components/layout/Header.jsx
// import React from "react";
import { Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext"; // <-- Import AuthContext

export default function Header() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth(); // <-- Extract the user

  // Safely extract the first two letters of the username, default to "OP"
  const initials = user?.username
    ? user.username.substring(0, 2).toUpperCase()
    : "OP";

  return (
    <header className="fixed top-0 left-0 right-0 h-[var(--header)] bg-[var(--bg1)] border-b border-[var(--border)] flex items-center px-5 justify-between z-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-300">
      {/* Left Side (Logo) */}
      <div>
        <div className="flex gap-4 items-center">
          <img
            src="/src/assets/logo.png"
            className="w-7 h-7"
            alt="Nexus Logo"
          />
          <span
            style={{ fontFamily: "var(--font-mono)" }}
            className="text-[13px] font-semibold text-[var(--text-primary)] h-fit tracking-[0.08em]"
          >
            NEXUS FACTORY<span className="text-(--blue)">OS</span>
          </span>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 py-1 px-2.5 bg-(--bg3) border border-[var(--border)] rounded font-(--font-mono) text-[11px] text-(--text-secondary) transition-colors">
          <div className="w-1 h-1 rounded-full bg-(--teal)"></div> CAM-01 · OK
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="relative w-8 h-8 rounded border border-[var(--border)] bg-[var(--bg3)] flex items-center justify-center hover:bg-[var(--bg4)] transition-colors ml-2"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-[var(--amber)]" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--blue)]" />
          )}
        </button>

        {/* Notification Bell */}
        <button className="relative w-8 h-8 rounded border border-[var(--border)] bg-[var(--bg3)] flex items-center justify-center hover:bg-[var(--bg4)] transition-colors">
          <Bell className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--coral)]"></div>
        </button>

        {/* User Avatar (Dynamic) */}
        <button className="w-7 h-7 rounded-full bg-(--blue-dim) border border-[var(--blue)] flex items-center justify-center text-[11px] font-semibold text-(--blue) font-[var(--font-mono)] transition-colors">
          {initials}
        </button>
      </div>
    </header>
  );
}
