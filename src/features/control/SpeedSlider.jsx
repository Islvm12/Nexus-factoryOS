// src/features/control/SpeedSlider.jsx
import React from "react";
import { Zap } from "lucide-react";

export default function SpeedSlider({
  targetSpeedPct,
  currentSpeedPct,
  onSpeedChange,
}) {
  const MAX_RPM = 400;
  const targetRPM = Math.round((targetSpeedPct / 100) * MAX_RPM);
  const currentRPM = Math.round((currentSpeedPct / 100) * MAX_RPM);

  return (
    <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg3)] border border-[var(--border)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[var(--text-secondary)]" />
          </div>
          <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">
            Machine Parameters
          </h2>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Current Speed
          </div>
          <div className="text-2xl font-[var(--font-mono)] font-bold text-[var(--text-primary)] flex items-baseline justify-end gap-1.5">
            {currentRPM}{" "}
            <span className="text-[12px] text-[var(--text-muted)] font-sans font-semibold">
              RPM
            </span>
          </div>
        </div>
      </div>

      <div className="px-1">
        <div className="flex justify-between items-end mb-3">
          <label className="text-[12px] font-semibold text-[var(--text-secondary)]">
            Target Speed
          </label>
          <span className="text-[13px] font-bold text-[var(--blue)] font-[var(--font-mono)]">
            {targetRPM} RPM
          </span>
        </div>

        <div className="relative w-full h-8 flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={targetSpeedPct}
            onChange={(e) => onSpeedChange(parseInt(e.target.value, 10))}
            className="absolute w-full h-2 appearance-none bg-[var(--bg4)] rounded-full outline-none z-20 cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--blue) ${targetSpeedPct}%, var(--bg4) ${targetSpeedPct}%)`,
            }}
          />
          <style jsx="true">{`
            input[type="range"]::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              background: var(--blue);
              border-radius: 50%;
              cursor: pointer;
              border: 2px solid var(--bg1);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            input[type="range"]::-moz-range-thumb {
              width: 16px;
              height: 16px;
              background: var(--blue);
              border-radius: 50%;
              cursor: pointer;
              border: 2px solid var(--bg1);
            }
          `}</style>
        </div>

        <div className="flex justify-between items-center mt-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
          <span>Idle</span>
          <span>Max Load</span>
        </div>
      </div>
    </div>
  );
}
