// src/pages/Login.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Activity, Lock, User, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg0)] flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-12 h-12 bg-[var(--blue)] rounded-[var(--radius)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--blue-dim)]">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div className="font-[var(--font-mono)] text-xl font-bold tracking-wider text-[var(--text-primary)]">
          NEXUS <span className="text-[var(--blue)]">FACTORY</span>OS
        </div>
        <div className="text-[var(--text-muted)] text-[11px] font-[var(--font-mono)] tracking-[0.2em] mt-2 uppercase font-semibold">
          Secure Authorization
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] shadow-xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 tracking-tight">
            System Login
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-[var(--coral-bg)] border border-[var(--coral-dim)] rounded-[var(--radius-sm)] flex items-start gap-2.5 text-[var(--coral)] text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1.5 font-semibold">
                Operator ID / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--blue)] transition-colors font-medium"
                  placeholder="e.g., admin"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1.5 font-semibold">
                Access Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--blue)] transition-colors font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[var(--blue)] text-white font-[var(--font-ui)] font-semibold rounded-[var(--radius-sm)] hover:bg-[#2563EB] disabled:opacity-70 disabled:cursor-not-allowed transition-all mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                "Initialize Session"
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="bg-[var(--bg3)] px-8 py-4 border-t border-[var(--border)] text-center">
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)]">
            Unauthorized access is strictly prohibited. Activity is logged.
          </p>
        </div>
      </div>
    </div>
  );
}
