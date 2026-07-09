// src/components/shared/Sparkline.jsx
import React from "react";

export default function Sparkline({ data, colorVar }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Map data to SVG coordinates (100x32 viewbox)
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 32 - ((val - min) / range) * 26 - 3; // Scale to height 32, with padding
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="h-8 w-full mt-2">
      <svg
        className="w-full h-full overflow-visible"
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke={`var(${colorVar})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
