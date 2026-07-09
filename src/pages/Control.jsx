// src/pages/Control.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { AlertCircle } from "lucide-react";
import HoldControlButton from "../features/control/HoldControlButton";
import SpeedSlider from "../features/control/SpeedSlider";

export default function Control() {
  const { user, logout } = useAuth();

  const [isRunning, setIsRunning] = useState(false);
  const [targetSpeedPct, setTargetSpeedPct] = useState(100);
  const [currentSpeedPct, setCurrentSpeedPct] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const speedDebounceRef = useRef(null);

  // --- API: MOTOR START/STOP ---
  const handleMotorControl = async (command) => {
    setIsProcessing(true);
    setApiError(null);
    try {
      const response = await fetch("/api/motor/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": user?.session_id,
        },
        body: JSON.stringify({ command }),
      });

      if (response.status === 401) return logout();
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to ${command} motor.`);
      }

      setIsRunning(command === "START");
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- API: SET BELT SPEED ---
  const handleSpeedChange = (newPct) => {
    setTargetSpeedPct(newPct);

    // Debounce the API call so we don't spam the server while dragging
    if (speedDebounceRef.current) clearTimeout(speedDebounceRef.current);

    speedDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/belt/speed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": user?.session_id,
          },
          body: JSON.stringify({ speed_percentage: newPct }),
        });

        if (response.status === 401) return logout();
        if (!response.ok) throw new Error("Failed to set belt speed.");
      } catch (error) {
        setApiError(error.message);
      }
    }, 300);
  };

  // Simulate current speed smoothly catching up to target speed for UI feedback
  useEffect(() => {
    const catchupInterval = setInterval(() => {
      setCurrentSpeedPct((prev) => {
        if (!isRunning) return prev > 0 ? prev - 2 : 0;
        if (prev < targetSpeedPct) return Math.min(prev + 1.5, targetSpeedPct);
        if (prev > targetSpeedPct) return Math.max(prev - 1.5, targetSpeedPct);
        return prev;
      });
    }, 50);
    return () => clearInterval(catchupInterval);
  }, [targetSpeedPct, isRunning]);

  return (
    <div className="animate-in fade-in duration-300 max-w-full mx-auto pb-10">
      <div className="mb-8">
        <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1 font-semibold">
          Hardware Interface
        </div>
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight">
          Machine Control
        </h1>
      </div>

      {apiError && (
        <div className="mb-6 p-4 bg-[var(--coral-bg)] border border-[var(--coral-dim)] rounded-[var(--radius)] text-[13px] text-[var(--coral)] font-medium flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* START/STOP COMPONENT */}
      <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl shadow-sm p-12 mb-6 flex flex-col items-center justify-center min-h-[300px]">
        <HoldControlButton
          isRunning={isRunning}
          isProcessing={isProcessing}
          onCommand={handleMotorControl}
        />
      </div>

      {/* SPEED SLIDER COMPONENT */}
      <SpeedSlider
        targetSpeedPct={targetSpeedPct}
        currentSpeedPct={currentSpeedPct}
        onSpeedChange={handleSpeedChange}
      />
    </div>
  );
}
