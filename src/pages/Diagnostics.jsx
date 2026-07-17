// src/pages/Diagnostics.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  Thermometer,
  Zap,
  Waves,
  Video,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
} from "lucide-react";

export default function Diagnostics() {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Live telemetry state
  const [sensors, setSensors] = useState({
    Curr_01: 0,
    Speed_01: 0,
    Temp_01: 0,
    Vib_01: 0,
    CAM_01_Active: false,
  });

  // Hardware safety thresholds based on your database configuration
  const THRESHOLDS = {
    Curr_01: { min: 0, max: 2.0, unit: "A", name: "Motor Current" },
    Speed_01: { min: 0, max: 0.35, unit: "M/S", name: "Belt Speed" },
    Temp_01: { min: 10.0, max: 50.0, unit: "°C", name: "Machine Temp" },
    Vib_01: { min: 0, max: 1.0, unit: "cm", name: "Chassis Vibration" },
  };

  const fetchTelemetry = async () => {
    const sessionId = user?.session_id || user?.id;
    if (!sessionId) return;

    try {
      const res = await fetch("/api/telemetry", {
        headers: {
          "x-session-id": sessionId,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const parsed = await res.json();
        const incomingDataArray =
          parsed.data || (Array.isArray(parsed) ? parsed : [parsed]);

        setSensors((prev) => {
          const newState = { ...prev, CAM_01_Active: true }; // Assume camera is active if we get data

          incomingDataArray.forEach((item) => {
            const id = item.sensor_id;
            if (id === "Curr_01") newState.Curr_01 = Number(item.current) || 0;
            if (id === "Temp_01")
              newState.Temp_01 = Number(item.temperature) || 0;
            if (id === "Speed_01")
              newState.Speed_01 = Number(item.speed_ms || item.rpm) || 0;
            if (id === "Vib_01")
              newState.Vib_01 =
                Number(
                  item.vibration_x || item.vibration_y || item.vibration_z,
                ) || 0;
          });

          return newState;
        });
        setLastUpdate(new Date());
      } else {
        setSensors((prev) => ({ ...prev, CAM_01_Active: false }));
      }
    } catch (e) {
      console.error("Diagnostic telemetry error", e);
      setSensors((prev) => ({ ...prev, CAM_01_Active: false }));
    } finally {
      setIsLoading(false);
    }
  };

  // Fast polling loop for real-time diagnostics
  useEffect(() => {
    let isMounted = true;
    let timerId;

    const poll = async () => {
      if (!isMounted) return;
      await fetchTelemetry();
      if (isMounted) {
        timerId = setTimeout(poll, 2000);
      }
    };

    poll();
    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [user?.session_id]);

  // Helper function to calculate health status
  const getHealthStatus = (id, value) => {
    const { min, max } = THRESHOLDS[id];
    const percentage = ((value - min) / (max - min)) * 100;

    if (percentage > 90)
      return {
        status: "CRITICAL",
        color: "var(--coral)",
        bg: "var(--coral-bg)",
        icon: AlertOctagon,
      };
    if (percentage > 75)
      return {
        status: "WARNING",
        color: "var(--amber)",
        bg: "var(--amber-bg)",
        icon: AlertTriangle,
      };
    return {
      status: "HEALTHY",
      color: "var(--teal)",
      bg: "var(--teal-bg)",
      icon: CheckCircle2,
    };
  };

  const renderDiagnosticCard = (id, icon) => {
    const value = sensors[id];
    const threshold = THRESHOLDS[id];
    const health = getHealthStatus(id, value);
    const Icon = health.icon;
    const MainIcon = icon;

    // Calculate progress bar width (clamped between 0 and 100)
    const pct = Math.min(
      Math.max(
        ((value - threshold.min) / (threshold.max - threshold.min)) * 100,
        0,
      ),
      100,
    );

    return (
      <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-5 shadow-sm transition-all hover:border-[var(--border-bright)] relative overflow-hidden">
        {/* Top Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--bg3)] text-[var(--text-secondary)]">
              <MainIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase font-semibold">
                {id}
              </div>
              <div className="text-[15px] font-semibold text-[var(--text-primary)]">
                {threshold.name}
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-[var(--font-mono)] font-bold tracking-wider border border-transparent"
            style={{
              backgroundColor: health.bg,
              color: health.color,
              borderColor: `${health.color}30`,
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {health.status}
          </div>
        </div>

        {/* Live Value & Thresholds */}
        <div className="mb-4">
          <div className="flex items-end gap-1 mb-1">
            <span
              className="text-3xl font-[var(--font-mono)] font-semibold tracking-tight"
              style={{ color: health.color }}
            >
              {value.toFixed(2)}
            </span>
            <span className="text-[13px] text-[var(--text-muted)] font-medium mb-1">
              {threshold.unit}
            </span>
          </div>
        </div>

        {/* Safety Range Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-[var(--font-mono)] text-[var(--text-muted)]">
            <span>Min: {threshold.min}</span>
            <span>Max: {threshold.max}</span>
          </div>
          <div className="h-2 w-full bg-[var(--bg4)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%`, backgroundColor: health.color }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-300 pb-10">
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1 font-semibold">
            Hardware Diagnostics
          </div>
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            Sensor Health Matrix
            {isLoading && (
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
            )}
          </h1>
          <div className="text-[12px] text-[var(--text-secondary)] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse"></span>
            Receiving telemetry
            {lastUpdate && (
              <span className="text-[var(--text-muted)]">
                — Last sync: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 1. CAMERA / EDGE DIAGNOSTIC */}
      <div className="mb-6">
        <div
          className={`border p-5 rounded-2xl shadow-sm flex items-center justify-between transition-colors ${
            sensors.CAM_01_Active
              ? "bg-[var(--teal)]/5 border-[var(--teal)]/20"
              : "bg-[var(--coral)]/5 border-[var(--coral)]/20"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${sensors.CAM_01_Active ? "bg-[var(--teal)]/10 text-[var(--teal)]" : "bg-[var(--coral)]/10 text-[var(--coral)]"}`}
            >
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-0.5">
                Primary Vision System (CAM_01)
              </h2>
              <p className="text-[12px] text-[var(--text-secondary)]">
                {sensors.CAM_01_Active
                  ? "Camera stream is active. YOLO inspection model is receiving frames."
                  : "Critical Fault: Camera stream disconnected or API unreachable."}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-[var(--font-mono)] font-bold tracking-wider border ${
                sensors.CAM_01_Active
                  ? "bg-[var(--teal)]/10 text-[var(--teal)] border-[var(--teal)]/20"
                  : "bg-[var(--coral)]/10 text-[var(--coral)] border-[var(--coral)]/20"
              }`}
            >
              {sensors.CAM_01_Active ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertOctagon className="w-4 h-4" />
              )}
              {sensors.CAM_01_Active ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SENSOR DIAGNOSTIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {renderDiagnosticCard("Speed_01", Activity)}
        {renderDiagnosticCard("Curr_01", Zap)}
        {renderDiagnosticCard("Temp_01", Thermometer)}
        {renderDiagnosticCard("Vib_01", Waves)}
      </div>
    </div>
  );
}
