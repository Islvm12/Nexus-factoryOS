// src/features/control/HoldControlButton.jsx
import React, { useState, useRef } from "react";
import { Power, Check, Pause, Loader2 } from "lucide-react";

export default function HoldControlButton({
  isRunning,
  isProcessing,
  onCommand,
}) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);

  const startHold = (command) => {
    if (isProcessing) return;
    setHoldProgress(0);

    const intervalTime = 10;
    const totalHoldTime = 800; // 800ms hold requirement
    let currentProgress = 0;

    holdIntervalRef.current = setInterval(() => {
      currentProgress += (intervalTime / totalHoldTime) * 100;
      setHoldProgress(Math.min(currentProgress, 100));
    }, intervalTime);

    holdTimerRef.current = setTimeout(() => {
      clearInterval(holdIntervalRef.current);
      setHoldProgress(100);
      onCommand(command); // Tell the parent to fire the API
      setTimeout(() => setHoldProgress(0), 300); // Reset progress visually
    }, totalHoldTime);
  };

  const cancelHold = () => {
    clearTimeout(holdTimerRef.current);
    clearInterval(holdIntervalRef.current);
    if (!isProcessing) setHoldProgress(0);
  };

  if (!isRunning) {
    return (
      <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
        <button
          onMouseDown={() => startHold("START")}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={(e) => {
            e.preventDefault();
            startHold("START");
          }}
          onTouchEnd={cancelHold}
          disabled={isProcessing}
          className="relative w-28 h-28 rounded-full bg-[var(--bg1)] border-[2px] border-[var(--border-bright)] shadow-md flex items-center justify-center overflow-hidden transition-transform active:scale-95 disabled:opacity-50 select-none cursor-pointer group"
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-[var(--blue-dim)] transition-all duration-75 ease-linear"
            style={{ height: `${holdProgress}%` }}
          />
          <Power
            className={`w-10 h-10 relative z-10 transition-colors ${holdProgress > 50 ? "text-[var(--blue)]" : "text-[var(--text-muted)] group-hover:text-[var(--blue)]"}`}
          />
        </button>
        <div className="mt-6 text-[13px] font-bold text-[var(--text-secondary)] tracking-widest uppercase font-[var(--font-mono)]">
          {isProcessing ? "Starting..." : "Hold to Start"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md animate-in zoom-in-95 duration-300">
      <div className="relative w-32 h-32 rounded-full border-[4px] border-[var(--teal)] flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.15)] mb-8">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-[var(--teal)] flex items-center justify-center mb-1 shadow-sm">
            <Check className="w-5 h-5 text-white stroke-[3px]" />
          </div>
          <div className="text-[14px] font-bold text-[var(--teal)] uppercase tracking-wider">
            Running
          </div>
          <div className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">
            tap below to stop
          </div>
        </div>
      </div>

      <button
        onMouseDown={() => startHold("STOP")}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={(e) => {
          e.preventDefault();
          startHold("STOP");
        }}
        onTouchEnd={cancelHold}
        disabled={isProcessing}
        className="relative w-full h-14 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center overflow-hidden transition-transform active:scale-[0.98] select-none cursor-pointer group shadow-sm"
      >
        <div
          className="absolute left-0 top-0 bottom-0 bg-[#FCD34D] transition-all duration-75 ease-linear"
          style={{ width: `${holdProgress}%` }}
        />
        <div className="relative z-10 flex items-center gap-2 text-[#D97706] font-bold tracking-widest text-[13px]">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
          {isProcessing ? "STOPPING..." : "HOLD TO PAUSE"}
        </div>
      </button>
    </div>
  );
}
