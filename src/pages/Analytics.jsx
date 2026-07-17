// src/pages/Analytics.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Calendar,
  Filter,
  Activity,
  Target,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function Analytics() {
  const { user, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Filters
  const [yieldTimeframe, setYieldTimeframe] = useState("days"); // 'hours', 'days', 'months'
  const [radarDays, setRadarDays] = useState(7);

  // Data States
  const [hourlyDefects, setHourlyDefects] = useState([]);
  const [aiConfidence, setAiConfidence] = useState([]);
  const [yieldTrend, setYieldTrend] = useState([]);
  const [defectDistribution, setDefectDistribution] = useState([]);

  // Colors for charts mapping to our industrial CSS variables
  const CHART_COLORS = {
    teal: "#14b8a6",
    coral: "#f43f5e",
    blue: "#3b82f6",
    amber: "#f59e0b",
    purple: "#8b5cf6",
    gray: "#64748b",
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setApiError(null);
    const sessionId = user?.session_id || user?.id;

    if (!sessionId) return;

    try {
      const headers = {
        "x-session-id": sessionId,
        "Content-Type": "application/json",
      };

      // Fetch all three APIs simultaneously for performance
      const [hourlyRes, radarRes, inspectionsRes] = await Promise.all([
        fetch("/api/analytics/hourly-defects", { headers }),
        fetch(`/api/analytics/ai-confidence?days=${radarDays}`, { headers }),
        fetch("/api/inspections", { headers }),
      ]);

      if (hourlyRes.status === 401) return logout();

      if (!hourlyRes.ok || !radarRes.ok || !inspectionsRes.ok) {
        throw new Error("Failed to fetch one or more analytics endpoints.");
      }

      const hourlyData = await hourlyRes.json();
      const radarData = await radarRes.json();
      const inspectionsData = await inspectionsRes.json();

      // 1. Process Hourly Defects
      if (hourlyData.trend) {
        setHourlyDefects(hourlyData.trend);
      }

      // 2. Process AI Confidence (Radar)
      if (radarData.stats) {
        // The API sends percentages, we just pass them directly to the chart
        setAiConfidence(radarData.stats);
      }

      // 3. Process Yield Trend from Inspections
      processYieldData(inspectionsData, yieldTimeframe);

      // 4. Process Bonus Chart: Defect Distribution
      processDefectDistribution(inspectionsData);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when the radar timeframe changes
  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line
  }, [radarDays, user?.session_id]);

  // Re-process yield locally without re-fetching if only the yield timeframe changes
  useEffect(() => {
    fetch("/api/inspections", { headers: { "x-session-id": user?.session_id } })
      .then((res) => res.json())
      .then((data) => processYieldData(data, yieldTimeframe))
      .catch(() => {});
  }, [yieldTimeframe]);

  // --- DATA AGGREGATORS ---

  const processYieldData = (inspections, timeframe) => {
    if (!Array.isArray(inspections)) return;

    const grouped = {};

    inspections.forEach((insp) => {
      const dateObj = new Date(insp.inspected_at);
      let key = "";

      if (timeframe === "hours") {
        key = `${dateObj.getHours()}:00`;
      } else if (timeframe === "days") {
        key = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else if (timeframe === "months") {
        key = dateObj.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      }

      if (!grouped[key]) {
        grouped[key] = { name: key, total: 0, good: 0 };
      }

      grouped[key].total += 1;
      if (insp.status === "Good" || insp.status === "fresh") {
        grouped[key].good += 1;
      }
    });

    // Convert object to array and calculate yield percentage
    const processedTrend = Object.values(grouped).map((item) => ({
      name: item.name,
      Yield: Number(((item.good / item.total) * 100).toFixed(1)),
      DefectRate: Number(
        (((item.total - item.good) / item.total) * 100).toFixed(1),
      ),
    }));

    setYieldTrend(processedTrend);
  };

  const processDefectDistribution = (inspections) => {
    if (!Array.isArray(inspections)) return;

    const counts = {};
    inspections.forEach((insp) => {
      if (insp.status !== "Good" && insp.status !== "fresh") {
        const type = insp.defect_type || insp.status || "Unknown";
        counts[type] = (counts[type] || 0) + 1;
      }
    });

    const dist = Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color:
        Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
    }));

    setDefectDistribution(dist);
  };

  // --- CUSTOM TOOLTIPS ---

  const RadarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--bg2)] border border-[var(--border)] p-3 rounded-lg shadow-xl text-[12px]">
          <p className="font-bold text-[var(--text-primary)] mb-1 uppercase tracking-wider">
            {data.category}
          </p>
          <p className="text-[var(--blue)] font-semibold">
            Confidence: {data.average_confidence}%
          </p>
          <p className="text-[var(--text-secondary)]">
            Sample Count:{" "}
            <span className="font-mono text-[var(--text-primary)]">
              {data.sample_count}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in duration-300 pb-10">
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1 font-semibold">
            System Intelligence
          </div>
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            Analytics & Reports
            {isLoading && (
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
            )}
          </h1>
        </div>
      </div>

      {apiError && (
        <div className="mb-6 p-4 bg-[var(--coral-bg)] border border-[var(--coral-dim)] rounded-xl text-[13px] text-[var(--coral)] font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. PRODUCTION YIELD TREND */}
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl shadow-sm p-5 col-span-1 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--teal)]" />
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                Production Yield Trend
              </h2>
            </div>
            {/* Filter Dropdown */}
            <select
              value={yieldTimeframe}
              onChange={(e) => setYieldTimeframe(e.target.value)}
              className="bg-[var(--bg0)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] rounded-lg px-3 py-1.5 outline-none focus:border-[var(--blue)] cursor-pointer"
            >
              <option value="hours">By Hour</option>
              <option value="days">By Day</option>
              <option value="months">By Month</option>
            </select>
          </div>
          <div className="h-[300px] w-full text-[11px] font-[var(--font-mono)]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={yieldTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--text-muted)"
                  tick={{ fill: "var(--text-secondary)" }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fill: "var(--text-secondary)" }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg2)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ fontSize: "13px", fontWeight: "bold" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Yield"
                  stroke={CHART_COLORS.teal}
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: CHART_COLORS.teal,
                    strokeWidth: 2,
                    stroke: "var(--bg1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="DefectRate"
                  stroke={CHART_COLORS.coral}
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: CHART_COLORS.coral,
                    strokeWidth: 2,
                    stroke: "var(--bg1)",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. HOURLY DEFECT TREND (24h) */}
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-[var(--coral)]" />
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
              Hourly Defect Trend (Last 24h)
            </h2>
          </div>
          <div className="h-[280px] w-full text-[11px] font-[var(--font-mono)]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourlyDefects}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="hour_label"
                  stroke="var(--text-muted)"
                  tick={{ fill: "var(--text-secondary)" }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fill: "var(--text-secondary)" }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--bg3)" }}
                  contentStyle={{
                    backgroundColor: "var(--bg2)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="defect_count"
                  fill={CHART_COLORS.coral}
                  radius={[4, 4, 0, 0]}
                  name="Defects"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. AI CONFIDENCE RADAR */}
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--blue)]" />
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                AI Model Confidence
              </h2>
            </div>
            <select
              value={radarDays}
              onChange={(e) => setRadarDays(Number(e.target.value))}
              className="bg-[var(--bg0)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] rounded-lg px-3 py-1.5 outline-none focus:border-[var(--blue)] cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[290px] w-full text-[10px] font-bold font-[var(--font-mono)]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="75%"
                data={aiConfidence}
              >
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "var(--text-primary)" }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "var(--text-muted)" }}
                />
                <Radar
                  name="Confidence %"
                  dataKey="average_confidence"
                  stroke={CHART_COLORS.blue}
                  fill={CHART_COLORS.blue}
                  fillOpacity={0.4}
                />
                <Tooltip content={<RadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. BONUS: DEFECT DISTRIBUTION (PIE) */}
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl shadow-sm p-5 col-span-1 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-[var(--amber)]" />
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
              Historical Defect Distribution
            </h2>
          </div>
          <div className="h-[250px] w-full text-[12px] font-[var(--font-mono)] flex items-center">
            {defectDistribution.length === 0 ? (
              <div className="w-full text-center text-[var(--text-muted)] italic">
                No defect data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {defectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg2)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "var(--text-primary)" }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
