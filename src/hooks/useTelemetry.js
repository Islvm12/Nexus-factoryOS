// src/hooks/useTelemetry.js
import { useState, useEffect } from "react";

// Helper to generate initial random arrays
const generateSparkline = (base, variance, length = 24) =>
  Array.from({ length }, () => base + (Math.random() - 0.5) * variance);

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState({
    lat: generateSparkline(12, 4),
    rpm: generateSparkline(1850, 100),
    temp: generateSparkline(42, 6),
    thru: generateSparkline(18, 3),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        lat: [...prev.lat.slice(1), 12 + (Math.random() - 0.5) * 4],
        rpm: [...prev.rpm.slice(1), 1850 + (Math.random() - 0.5) * 100],
        temp: [...prev.temp.slice(1), 42 + (Math.random() - 0.5) * 6],
        thru: [...prev.thru.slice(1), 18 + (Math.random() - 0.5) * 3],
      }));
    }, 2000); // Updates every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return telemetry;
}
