// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sparkline from "../components/shared/Sparkline";
import Button from "../components/ui/Button";
import {
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [sysStatus, setSysStatus] = useState({
    isRunning: false,
    operatorId: null,
  });

  const [metrics, setMetrics] = useState({
    total: 0,
    good: 0,
    defect: 0,
    yieldRate: 0,
    pareto: [],
  });

  const [timelineData, setTimelineData] = useState({
    segments: [],
    labels: [],
    startLabel: "",
    endLabel: "",
  });

  // --- LIVE TELEMETRY STATE ---
  const [liveSensors, setLiveSensors] = useState({
    Curr_01: { current: 0, history: Array(20).fill(0) },
    Speed_01: { current: 0, history: Array(20).fill(0) },
    Temp_01: { current: 0, history: Array(20).fill(0) },
    Vib_01: { current: 0, history: Array(20).fill(0) },
  });

  const parseDBTime = (dateStr) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.replace(/Z$/, "").replace(/\+00:00$/, "");
    return new Date(cleanStr).getTime();
  };

  // ==========================================
  // 1. SLOW POLLING: DASHBOARD STATS (Every 10s)
  // ==========================================
  const fetchDashboardData = async () => {
    const sessionId = user?.session_id || user?.id;
    if (!sessionId) return;

    try {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      const requestOptions = {
        headers: {
          "x-session-id": sessionId,
          "Content-Type": "application/json",
        },
      };

      const [statusRes, timelineRes, inspRes] = await Promise.all([
        fetch("/api/session-status", requestOptions),
        fetch(`/api/motor/timeline?date=${todayStr}`, requestOptions),
        fetch("/api/inspections", requestOptions),
      ]);

      if (
        statusRes.status === 401 ||
        timelineRes.status === 401 ||
        inspRes.status === 401
      ) {
        return logout();
      }

      if (!statusRes.ok)
        throw new Error(`Status API Error: ${statusRes.status}`);
      if (!timelineRes.ok)
        throw new Error(`Timeline API Error: ${timelineRes.status}`);
      if (!inspRes.ok)
        throw new Error(`Inspections API Error: ${inspRes.status}`);

      const statusData = await statusRes.json();
      const rawTimelineData = await timelineRes.json();
      const inspData = await inspRes.json();

      setSysStatus({
        isRunning: statusData.is_running,
        operatorId: statusData.operator_id || "N/A",
      });

      // Timeline Logic
      const startTime = new Date(now);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(now);
      endTime.setHours(23, 59, 59, 999);
      const totalMs = 24 * 60 * 60 * 1000;
      const changePoints = [];
      const segments = [];

      if (rawTimelineData.status === "success" && rawTimelineData.timeline) {
        rawTimelineData.timeline.forEach((period) => {
          const sStart = parseDBTime(period.start_time);
          const sEnd = period.end_time
            ? parseDBTime(period.end_time)
            : now.getTime();
          const constrainedStart = Math.max(sStart, startTime.getTime());
          const constrainedEnd = Math.min(sEnd, now.getTime());

          if (constrainedEnd > constrainedStart) {
            segments.push({
              state: period.state,
              start: constrainedStart,
              end: constrainedEnd,
            });
            changePoints.push(constrainedStart);
            if (constrainedEnd < now.getTime())
              changePoints.push(constrainedEnd);
          }
        });
      }

      const lastSegmentEnd =
        segments.length > 0
          ? segments[segments.length - 1].end
          : startTime.getTime();
      if (lastSegmentEnd < now.getTime()) {
        segments.push({
          state: "STOPPED",
          start: lastSegmentEnd,
          end: now.getTime(),
        });
      }

      if (now.getTime() < endTime.getTime()) {
        segments.push({
          state: "Future",
          start: now.getTime(),
          end: endTime.getTime(),
        });
      }

      const formatTooltip = (ts) =>
        new Date(ts).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

      const finalSegments = segments.map((seg) => {
        let classes =
          "h-full transition-all duration-1000 opacity-90 hover:opacity-100 border-r border-[var(--bg2)] last:border-r-0 ";
        let styles = { width: `${((seg.end - seg.start) / totalMs) * 100}%` };

        if (seg.state === "RUNNING") classes += "bg-[var(--teal)]";
        else if (seg.state === "ERROR") classes += "bg-[var(--coral)]";
        else if (seg.state === "STOPPED" || seg.state === "OFFLINE")
          classes += "bg-[var(--border-bright)]";
        else if (seg.state === "Future") {
          styles.backgroundImage =
            "repeating-linear-gradient(45deg, var(--border) 0, var(--border) 2px, transparent 2px, transparent 6px)";
          styles.opacity = 0.6;
        }

        return {
          type: classes,
          style: styles,
          state: seg.state,
          tooltip: `${seg.state}: ${formatTooltip(seg.start)} — ${formatTooltip(seg.end)}`,
          durationMs: seg.end - seg.start,
        };
      });

      const uniquePoints = [...new Set(changePoints)].sort((a, b) => a - b);
      const validLabels = [];
      let lastLabelPos = -20;

      uniquePoints.forEach((ts) => {
        const pos = ((ts - startTime.getTime()) / totalMs) * 100;
        if (pos > 3 && pos < 97 && pos - lastLabelPos > 1.5) {
          validLabels.push({ time: formatTooltip(ts), pos });
          lastLabelPos = pos;
        }
      });

      setTimelineData({
        segments: finalSegments,
        labels: validLabels,
        startLabel: "12:00 AM",
        endLabel: "11:59 PM",
      });

      // Metrics Logic
      const totalUnits = Array.isArray(inspData) ? inspData.length : 0;
      const goodUnitsList = Array.isArray(inspData)
        ? inspData.filter(
            (item) => item.status === "Good" || item.status === "fresh",
          )
        : [];
      const defectUnitsList = Array.isArray(inspData)
        ? inspData.filter(
            (item) =>
              item.status && item.status !== "Good" && item.status !== "fresh",
          )
        : [];

      const goodCount = goodUnitsList.length;
      const defectCount = defectUnitsList.length;
      const calculatedYield =
        totalUnits > 0 ? ((goodCount / totalUnits) * 100).toFixed(1) : 0;

      const defectCounts = {};
      defectUnitsList.forEach((item) => {
        const category = item.defect_type || item.status || "Unknown Defect";
        defectCounts[category] = (defectCounts[category] || 0) + 1;
      });

      const paretoColors = [
        "bg-[var(--coral)]",
        "bg-[var(--amber)]",
        "bg-[var(--blue)]",
        "bg-[var(--blue-dim)]",
        "bg-[var(--border-bright)]",
      ];

      const topDefects = Object.entries(defectCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item, index) => ({
          rank: String(index + 1).padStart(2, "0"),
          name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
          count: item.count,
          pct: Math.round((item.count / defectCount) * 100),
          color: paretoColors[index % paretoColors.length],
        }));

      setMetrics({
        total: totalUnits,
        good: goodCount,
        defect: defectCount,
        yieldRate: calculatedYield,
        pareto: topDefects,
      });
      setApiError(null);
    } catch (error) {
      console.error("Dashboard Fetch Failed:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timerId;

    const pollData = async () => {
      if (!isMounted) return;
      await fetchDashboardData();
      if (isMounted) {
        timerId = setTimeout(pollData, 10000);
      }
    };

    pollData();
    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [user?.session_id]);

  // ==========================================
  // 2. FAST POLLING: TELEMETRY (Every 2s via REST)
  // ==========================================
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

        // Extract the data array based on your InfluxDB API screenshot
        const incomingDataArray =
          parsed.data || (Array.isArray(parsed) ? parsed : [parsed]);

        setLiveSensors((prev) => {
          const newState = { ...prev };

          incomingDataArray.forEach((item) => {
            const id = item.sensor_id;
            if (newState[id]) {
              let val = 0;

              // Extract the exact value fields
              if (id === "Curr_01") val = item.current || 0;
              if (id === "Temp_01") val = item.temperature || 0;
              if (id === "Speed_01") val = item.speed_ms || item.rpm || 0;
              if (id === "Vib_01")
                val =
                  item.vibration_x || item.vibration_y || item.vibration_z || 0;

              // Ensure we don't accidentally display 'null'
              val = Number(val) || 0;

              const newHistory = [...newState[id].history, val].slice(-20);
              newState[id] = { current: val, history: newHistory };
            }
          });

          return newState;
        });
      }
    } catch (e) {
      console.error("Telemetry fetch error", e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let telemetryTimerId;

    const pollTelemetry = async () => {
      if (!isMounted) return;
      await fetchTelemetry();
      if (isMounted) {
        telemetryTimerId = setTimeout(pollTelemetry, 2000); // Poll every 2 seconds
      }
    };

    pollTelemetry();
    return () => {
      isMounted = false;
      clearTimeout(telemetryTimerId);
    };
  }, [user?.session_id]);

  const runMs = timelineData.segments
    .filter((s) => s.state === "RUNNING")
    .reduce((acc, s) => acc + s.durationMs, 0);
  const idleMs = timelineData.segments
    .filter((s) => s.state === "STOPPED" || s.state === "OFFLINE")
    .reduce((acc, s) => acc + s.durationMs, 0);
  const errMs = timelineData.segments
    .filter((s) => s.state === "ERROR")
    .reduce((acc, s) => acc + s.durationMs, 0);
  const formatHM = (ms) =>
    `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;

  return (
    <div className="animate-in fade-in duration-300">
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1 font-semibold">
            Operational Overview
          </div>
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight mb-1">
            Dashboard
          </h1>
          <div className="text-[12px] text-[var(--text-secondary)] flex items-center gap-2">
            <span>Line 3 · Shift A</span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></span>
            <span className="flex items-center gap-1.5">
              System {sysStatus.isRunning ? "Running" : "Idle"}
              <span
                className={`w-2 h-2 rounded-full ${sysStatus.isRunning ? "bg-[var(--teal)] animate-pulse" : "bg-[var(--border-bright)]"}`}
              ></span>
            </span>
            {isLoading && (
              <RefreshCw className="w-3 h-3 ml-2 animate-spin text-[var(--text-muted)]" />
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="default">
            <Filter className="w-3.5 h-3.5" /> Filter
          </Button>
          <Button variant="primary">
            <Download className="w-3.5 h-3.5" /> Export Report
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="mb-5 p-3 bg-[var(--coral-bg)] border border-[var(--coral-dim)] rounded-[var(--radius)] text-[12px] text-[var(--coral)] font-medium flex items-center gap-2">
          <span className="font-bold">API Connection Failed:</span> {apiError}.
        </div>
      )}

      {/* 1. METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="relative bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-sm overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-[var(--blue)]">
          <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-2 font-semibold">
            Total Units
          </div>
          <div className="text-[28px] font-[var(--font-mono)] font-semibold text-[var(--text-primary)] tracking-tight">
            {metrics.total.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-0.5 font-[var(--font-mono)] text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[var(--blue)]/10 text-[var(--blue)]">
              Live
            </span>{" "}
            all time
          </div>
        </div>

        <div className="relative bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-sm overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-[var(--teal)]">
          <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-2 font-semibold">
            Good Units
          </div>
          <div className="text-[28px] font-[var(--font-mono)] font-semibold text-[var(--teal)] tracking-tight">
            {metrics.good.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-0.5 font-[var(--font-mono)] text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[var(--teal)]/10 text-[var(--teal)]">
              <ArrowUpRight className="w-3 h-3" /> {metrics.yieldRate}%
            </span>{" "}
            pass rate
          </div>
        </div>

        <div className="relative bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-sm overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-[var(--coral)]">
          <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-2 font-semibold">
            Defects
          </div>
          <div className="text-[28px] font-[var(--font-mono)] font-semibold text-[var(--coral)] tracking-tight">
            {metrics.defect.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-0.5 font-[var(--font-mono)] text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[var(--coral)]/10 text-[var(--coral)]">
              <ArrowDownRight className="w-3 h-3" />{" "}
              {(100 - metrics.yieldRate).toFixed(1)}%
            </span>{" "}
            defect rate
          </div>
        </div>

        <div className="relative bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-sm overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-[var(--purple)]">
          <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-2 font-semibold">
            Yield Rate
          </div>
          <div className="text-[28px] font-[var(--font-mono)] font-semibold text-[var(--purple)] tracking-tight">
            {metrics.yieldRate}
            <span className="text-base font-medium">%</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-0.5 font-[var(--font-mono)] text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[var(--teal)]/10 text-[var(--teal)]">
              <ArrowUpRight className="w-3 h-3" /> Target 95%
            </span>
          </div>
        </div>
      </div>

      {/* 2. TIMELINE + DEFECTS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 mb-5">
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] shadow-sm flex flex-col">
          <div className="flex justify-between items-center p-3.5 border-b border-[var(--border)]">
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">
              Production Timeline
            </span>
            <span className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] font-medium">
              Daily 24h Cycle
            </span>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center">
            <div className="relative h-8 mb-2 w-full text-[9px] font-[var(--font-mono)] text-[var(--text-muted)] font-semibold tracking-widest">
              <div className="absolute left-0 bottom-0 text-[var(--text-secondary)] flex flex-col items-start">
                <span>{timelineData.startLabel}</span>
                <div className="w-[1px] h-1.5 bg-[var(--border-bright)] mt-0.5"></div>
              </div>
              {timelineData.labels?.map((lbl, i) => (
                <div
                  key={i}
                  className="absolute flex flex-col items-center -translate-x-1/2"
                  style={{
                    left: `${lbl.pos}%`,
                    bottom: i % 2 === 0 ? "0" : "14px",
                  }}
                >
                  <span className="bg-[var(--bg2)] px-1 rounded shadow-sm z-10 text-[var(--text-secondary)]">
                    {lbl.time}
                  </span>
                  <div
                    className={`w-[1px] bg-[var(--border)] mt-0.5 ${i % 2 === 0 ? "h-1.5" : "h-[18px]"}`}
                  ></div>
                </div>
              ))}
              <div className="absolute right-0 bottom-0 text-[var(--text-secondary)] flex flex-col items-end">
                <span>{timelineData.endLabel}</span>
                <div className="w-[1px] h-1.5 bg-[var(--border-bright)] mt-0.5"></div>
              </div>
            </div>
            <div className="flex h-6 rounded bg-[var(--bg4)] overflow-hidden border border-[var(--border)] relative z-10">
              {timelineData.segments.length > 0 ? (
                timelineData.segments.map((seg, i) => (
                  <div
                    key={i}
                    className={seg.type}
                    style={seg.style}
                    title={seg.tooltip}
                  ></div>
                ))
              ) : (
                <div className="w-full h-full bg-[var(--border-bright)]"></div>
              )}
            </div>
            <div className="flex justify-center gap-5 mt-4 text-[10px] text-[var(--text-secondary)] font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-[var(--teal)]"></div>
                Running
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-[var(--border-bright)] border border-[var(--border)]"></div>
                Idle
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-[var(--coral)] border border-[var(--border)]"></div>
                Error
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--border)] p-3 px-4 flex gap-8 font-[var(--font-mono)]">
            <div>
              <div className="text-[9px] text-[var(--text-muted)] mb-1">
                RUNNING
              </div>
              <div className="text-[11px] text-[var(--teal)]">
                {formatHM(runMs)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-[var(--text-muted)] mb-1">
                IDLE
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                {formatHM(idleMs)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-[var(--text-muted)] mb-1">
                ERROR
              </div>
              <div className="text-[11px] text-[var(--coral)]">
                {formatHM(errMs)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] shadow-sm">
          <div className="flex justify-between items-center p-3.5 border-b border-[var(--border)]">
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">
              Defect Frequency
            </span>
            <span className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] font-medium">
              Live Pareto
            </span>
          </div>
          <div className="p-4 pt-2">
            {metrics.pareto.length === 0 ? (
              <div className="text-[12px] text-[var(--text-muted)] italic py-4 text-center">
                No defects detected yet.
              </div>
            ) : (
              metrics.pareto.map((def, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 py-2.5 border-b border-[var(--border)] last:border-0"
                >
                  <div className="w-5 text-center font-[var(--font-mono)] text-[10px] font-semibold text-[var(--text-muted)]">
                    {def.rank}
                  </div>
                  <div className="flex-1 text-[12px] font-medium text-[var(--text-secondary)] truncate">
                    {def.name}
                  </div>
                  <div className="w-[70px] h-1.5 rounded-full bg-[var(--bg4)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${def.color}`}
                      style={{ width: `${def.pct}%` }}
                    ></div>
                  </div>
                  <div className="w-8 text-right font-[var(--font-mono)] text-[11px] font-semibold text-[var(--text-primary)]">
                    {def.count}
                  </div>
                  <div className="w-9 text-right font-[var(--font-mono)] text-[10px] text-[var(--text-muted)]">
                    {def.pct}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. LIVE SENSOR TELEMETRY (REST POLLING) */}
      <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] shadow-sm mb-5">
        <div className="flex justify-between items-center p-3.5 border-b border-[var(--border)]">
          <span className="text-[12px] font-semibold text-[var(--text-primary)] flex items-center gap-2">
            Live Telemetry
          </span>
          <span className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] animate-[pulse_1s_ease-in-out_infinite]"></span>{" "}
            Polling via REST
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-[var(--bg0)] rounded-b-[var(--radius)]">
          {/* CURRENT */}
          <div className="bg-[var(--bg3)] border border-[var(--border)] rounded p-3">
            <div className="text-[9px] font-[var(--font-mono)] font-semibold text-[var(--text-muted)] tracking-widest uppercase mb-1">
              Motor Current · Curr_01
            </div>
            <div className="text-xl font-[var(--font-mono)] font-semibold text-[var(--text-primary)] mb-1">
              {liveSensors.Curr_01.current.toFixed(2)}
              <span className="text-[11px] text-[var(--text-muted)] font-medium ml-1">
                A
              </span>
            </div>
            <Sparkline data={liveSensors.Curr_01.history} colorVar="--blue" />
          </div>

          {/* MOTOR SPEED */}
          <div className="bg-[var(--bg3)] border border-[var(--border)] rounded p-3">
            <div className="text-[9px] font-[var(--font-mono)] font-semibold text-[var(--text-muted)] tracking-widest uppercase mb-1">
              Belt Speed · Speed_01
            </div>
            <div className="text-xl font-[var(--font-mono)] font-semibold text-[var(--blue)] mb-1">
              {liveSensors.Speed_01.current.toFixed(2)}
              <span className="text-[11px] text-[var(--text-muted)] font-medium ml-1">
                M/S
              </span>
            </div>
            <Sparkline data={liveSensors.Speed_01.history} colorVar="--blue" />
          </div>

          {/* TEMPERATURE */}
          <div className="bg-[var(--bg3)] border border-[var(--border)] rounded p-3">
            <div className="text-[9px] font-[var(--font-mono)] font-semibold text-[var(--text-muted)] tracking-widest uppercase mb-1">
              Machine Temp · Temp_01
            </div>
            <div className="text-xl font-[var(--font-mono)] font-semibold text-[var(--teal)] mb-1">
              {liveSensors.Temp_01.current.toFixed(1)}
              <span className="text-[11px] text-[var(--text-muted)] font-medium ml-1">
                °C
              </span>
            </div>
            <Sparkline data={liveSensors.Temp_01.history} colorVar="--teal" />
          </div>

          {/* VIBRATION */}
          <div className="bg-[var(--bg3)] border border-[var(--border)] rounded p-3">
            <div className="text-[9px] font-[var(--font-mono)] font-semibold text-[var(--text-muted)] tracking-widest uppercase mb-1">
              Chassis Vib · Vib_01
            </div>
            <div className="text-xl font-[var(--font-mono)] font-semibold text-[var(--purple)] mb-1">
              {liveSensors.Vib_01.current.toFixed(2)}
              <span className="text-[11px] text-[var(--text-muted)] font-medium ml-1">
                cm
              </span>
            </div>
            <Sparkline data={liveSensors.Vib_01.history} colorVar="--purple" />
          </div>
        </div>
      </div>
    </div>
  );
}
