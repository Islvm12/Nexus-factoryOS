// src/components/ui/Toggle.jsx
import React from "react";

export default function Toggle({ isOn, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`
        w-10 h-5.5 rounded-full relative cursor-pointer shrink-0 transition-colors duration-200
        ${isOn ? "bg-(--teal-dim)" : "bg-(--border-bright)"}
      `}
    >
      <div
        className={`
        absolute top-0.75 w-4 h-4 rounded-full transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.1)]
        ${isOn ? "left-5.25 bg-(--teal)" : "left-0.75 bg-(--bg2)"}
      `}
      ></div>
    </div>
  );
}
