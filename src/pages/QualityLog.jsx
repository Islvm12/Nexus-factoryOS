// src/pages/QualityLog.jsx
import React, { useState, useEffect } from "react";
import Button from "../components/ui/Button";
import QualityCard from "../features/quality/QualityCard";
import { useAuth } from "../context/AuthContext";
import { Search, Database, RefreshCw } from "lucide-react";

// Helper function to calculate relative "time ago"
const getTimeAgo = (dateString) => {
  if (!dateString) return "Unknown time";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

export default function QualityLog() {
  const { user, logout } = useAuth();

  // --- TAB & PAGINATION STATE ---
  const [mainTab, setMainTab] = useState("Pending");
  const [subTab, setSubTab] = useState("Good");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Store ALL inspections fetched from the API
  const [allInspections, setAllInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchInspections = async () => {
    setIsLoading(true);
    try {
      // API no longer supports page/size parameters, fetch all based on status
      const endpoint =
        mainTab === "Pending"
          ? `/api/inspections/pending-review`
          : `/api/inspections/reviewed?status_filter=${subTab}`;

      const res = await fetch(endpoint, {
        headers: {
          "x-session-id": user?.session_id,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) return logout();
      if (!res.ok) throw new Error(`API Error: ${res.status}`);

      const data = await res.json();
      const dataArray = Array.isArray(data)
        ? data
        : data.items || data.data || [];

      // Filter valid images and sort from NEWEST to OLDEST
      const validAndSortedData = dataArray
        .filter(
          (item) =>
            item.cv_image_url &&
            item.cv_image_url !== "string" &&
            item.cv_image_url.trim() !== "",
        )
        .sort((a, b) => new Date(b.inspected_at) - new Date(a.inspected_at));

      const mappedData = validAndSortedData.map((item) => {
        const uiStatus =
          mainTab === "Pending" ? "Pending" : item.status || subTab;
        const displayId = `PRD-${String(item.inspection_id).padStart(5, "0")}`;

        // Apply "Time Ago" formatting here
        const timeString = getTimeAgo(item.inspected_at);

        const rawLabel = item.defect_type || item.status || "Unknown";
        const displayLabel =
          rawLabel === "Good" || rawLabel === "fresh" || rawLabel === "None"
            ? "Pass — No defect"
            : rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

        return {
          id: item.inspection_id,
          displayId,
          label: displayLabel,
          confidence: Number(item.confidence_score?.toFixed(1) || 0),
          time: timeString,
          status: uiStatus,
          imageUrl: item.cv_image_url,
          raw: item,
        };
      });

      setAllInspections(mappedData);
      setApiError(null);
    } catch (error) {
      console.error("Quality Log Fetch Failed:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch ONLY when tabs change (remove 'page' from dependencies)
  useEffect(() => {
    fetchInspections();
  }, [mainTab, subTab, user?.session_id]);

  // --- CLIENT-SIDE PAGINATION LOGIC ---
  const totalPages = Math.ceil(allInspections.length / PAGE_SIZE);
  const currentInspections = allInspections.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="animate-in fade-in duration-300 pb-10">
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase font-semibold">
            Review Station
          </div>
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            Quality Log
            {isLoading && (
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
            )}
          </h1>
          <p className="text-[12px] text-[var(--text-secondary)] font-medium">
            Viewing {mainTab} {mainTab === "Reviewed" ? `(${subTab})` : ""} ·
            Page {page} of {totalPages || 1}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="default">
            <Search className="w-3.5 h-3.5" /> Search ID
          </Button>
          <Button variant="primary">
            <Database className="w-3.5 h-3.5" /> Send to Dataset
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="mb-5 p-3 bg-[var(--coral-bg)] border border-[var(--coral-dim)] rounded-[var(--radius)] text-[12px] text-[var(--coral)] font-medium flex items-center gap-2">
          <span className="font-bold">API Connection Failed:</span> {apiError}.
        </div>
      )}

      {/* MAIN DATA PANEL */}
      <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] shadow-sm overflow-hidden">
        {/* TOP LEVEL TABS */}
        <div className="flex items-center gap-6 px-5 border-b border-[var(--border)] bg-[var(--bg1)]">
          <button
            onClick={() => {
              setMainTab("Pending");
              setPage(1);
            }}
            className={`py-3.5 text-[13px] font-semibold border-b-2 transition-colors ${
              mainTab === "Pending"
                ? "border-[var(--blue)] text-[var(--blue)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => {
              setMainTab("Reviewed");
              setPage(1);
            }}
            className={`py-3.5 text-[13px] font-semibold border-b-2 transition-colors ${
              mainTab === "Reviewed"
                ? "border-[var(--blue)] text-[var(--blue)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Reviewed
          </button>
        </div>

        {/* NESTED SUB-TABS */}
        {mainTab === "Reviewed" && (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg2)]">
            {["Good", "Defected", "Invalid"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSubTab(tab);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded text-[11px] font-[var(--font-mono)] font-bold uppercase tracking-wider transition-colors ${
                  subTab === tab
                    ? "bg-[var(--blue-bg)] text-[var(--blue)] border border-[var(--blue-dim)]"
                    : "bg-[var(--bg3)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg4)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 min-h-[400px] content-start">
          {currentInspections.length > 0 ? (
            currentInspections.map((item) => (
              <QualityCard
                key={item.id}
                item={item}
                onActionComplete={fetchInspections}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-[var(--text-muted)] gap-2">
              <Database className="w-8 h-8 opacity-20" />
              <span className="text-[13px] italic">
                No {mainTab.toLowerCase()}{" "}
                {mainTab === "Reviewed" ? subTab.toLowerCase() : ""} records
                found.
              </span>
            </div>
          )}
        </div>

        {/* NEW NUMBERED PAGINATION CONTROLS */}
        {totalPages > 0 && (
          <div className="flex items-center justify-center gap-3 p-5 border-t border-[var(--border)] bg-[var(--bg1)]">
            {page > 1 && (
              <button
                onClick={() => setPage((p) => p - 1)}
                className="text-[15px] font-medium text-[var(--blue)] hover:underline px-2"
              >
                Prev
              </button>
            )}

            {/* Render page numbers up to a maximum of 10 for clean layout */}
            {Array.from(
              { length: Math.min(10, totalPages) },
              (_, i) => i + 1,
            ).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`text-[16px] px-1 font-semibold transition-colors ${
                  page === num
                    ? "text-[var(--coral)]"
                    : "text-[var(--blue)] hover:text-[var(--blue-dim)] hover:underline"
                }`}
              >
                {num}
              </button>
            ))}

            {page < totalPages && (
              <button
                onClick={() => setPage((p) => p + 1)}
                className="text-[15px] font-medium text-[var(--blue)] hover:underline px-2"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
