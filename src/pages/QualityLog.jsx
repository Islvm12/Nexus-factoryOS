// src/pages/QualityLog.jsx
import React, { useState, useEffect } from "react";
import Button from "../components/ui/Button";
import QualityCard from "../features/quality/QualityCard";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function QualityLog() {
  const { user, logout } = useAuth();

  // --- TAB & PAGINATION STATE ---
  const [mainTab, setMainTab] = useState("Pending"); // "Pending" or "Reviewed"
  const [subTab, setSubTab] = useState("Good"); // "Good", "Defected", "Invalid"
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchInspections = async () => {
    setIsLoading(true);
    try {
      // Determine which API endpoint to hit based on the active main tab
      const endpoint =
        mainTab === "Pending"
          ? `/api/inspections/pending-review?page=${page}&size=${PAGE_SIZE}`
          : `/api/inspections/reviewed?page=${page}&size=${PAGE_SIZE}&status_filter=${subTab}`;

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

      // Filter out items without valid images locally just to keep the UI clean
      const dataWithImages = dataArray.filter(
        (item) =>
          item.cv_image_url &&
          item.cv_image_url !== "string" &&
          item.cv_image_url.trim() !== "",
      );

      const mappedData = dataWithImages.map((item) => {
        // UI Status relies purely on the Tab structure or raw API status
        const uiStatus =
          mainTab === "Pending" ? "Pending" : item.status || subTab;

        const displayId = `PRD-${String(item.inspection_id).padStart(5, "0")}`;
        const timeString = new Date(item.inspected_at).toLocaleTimeString(
          "en-GB",
          { hour: "2-digit", minute: "2-digit", second: "2-digit" },
        );

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

      setInspections(mappedData);
      setApiError(null);
    } catch (error) {
      console.error("Quality Log Fetch Failed:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch whenever a tab or page changes
  useEffect(() => {
    fetchInspections();
  }, [mainTab, subTab, page, user?.session_id]);

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
            Page {page}
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

        {/* NESTED SUB-TABS (Only shows if "Reviewed" is active) */}
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
          {inspections.length > 0 ? (
            inspections.map((item) => (
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
                found on this page.
              </span>
            </div>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--bg1)]">
          <Button
            variant="default"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="text-[12px]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          <span className="text-[12px] font-[var(--font-mono)] font-semibold text-[var(--text-secondary)]">
            PAGE {page}
          </span>

          <Button
            variant="default"
            onClick={() => setPage((p) => p + 1)}
            disabled={inspections.length < PAGE_SIZE || isLoading}
            className="text-[12px]"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
