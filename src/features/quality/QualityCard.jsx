// src/features/quality/QualityCard.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Clock,
  Check,
  Edit2,
  Tag,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useInspection } from "../../context/InspectionContext"; // Import to update count

export default function QualityCard({ item, onActionComplete }) {
  const { user } = useAuth();
  const { refreshPendingCount } = useInspection(); // Call this when action finishes

  const [isRelabelModalOpen, setIsRelabelModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // Fullscreen state
  const [newLabel, setNewLabel] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const AVAILABLE_LABELS = [
    "Good",
    "Scratch",
    "Dent",
    "Label Defect",
    "Invalid",
  ];
  const isInvalid = item.status?.toLowerCase() === "invalid";
  const isPending = item.status?.toLowerCase() === "pending"; // Helper for button logic

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "pending")
      return "text-[var(--amber)] border-[var(--amber)]/30 bg-[var(--amber)]/10";
    if (s === "good")
      return "text-[var(--teal)] border-[var(--teal)]/30 bg-[var(--teal)]/10";
    if (s === "defected")
      return "text-[var(--coral)] border-[var(--coral)]/30 bg-[var(--coral)]/10";
    if (s === "invalid")
      return "text-[var(--text-secondary)] border-[var(--border-bright)] bg-[var(--bg3)]";
    return "text-[var(--text-muted)] border-[var(--border)] bg-[var(--bg3)]";
  };

  const getConfidenceColor = (score) => {
    if (score >= 90) return "text-[var(--teal)] border-[var(--teal)]";
    if (score >= 60) return "text-[var(--amber)] border-[var(--amber)]";
    return "text-[var(--coral)] border-[var(--coral)]";
  };

  const executeApiAction = async (endpoint, method, body = null) => {
    setIsProcessing(true);
    try {
      const options = {
        method,
        headers: {
          "x-session-id": user?.session_id,
          "Content-Type": "application/json",
        },
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(
        `/api/inspections/${item.id}${endpoint}`,
        options,
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          `Server says: ${errorData.detail || "Unknown Backend Error"}`,
        );
      }

      setIsRelabelModalOpen(false);
      refreshPendingCount(); // Update the sidebar badge!
      if (onActionComplete) onActionComplete();
    } catch (error) {
      alert(`Action failed -> ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => executeApiAction("/confirm", "PUT");

  const handleRelabelSubmit = () => {
    if (!newLabel) return alert("Please select a new label.");
    let statusPayload = "Defected";
    if (newLabel === "Good") statusPayload = "Good";
    if (newLabel === "Invalid") statusPayload = "Invalid";

    const payload = { status: statusPayload };
    if (statusPayload === "Defected") payload.defect_type = newLabel;

    executeApiAction("/edit", "PUT", payload);
  };

  const imageUrl =
    item.imageUrl || item.raw?.cv_image_url || item.raw?.image_path;
  const isValidImage = imageUrl && imageUrl.startsWith("http");

  return (
    <>
      <div
        className={`bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-3 shadow-sm transition-all relative ${isInvalid ? "opacity-75 grayscale-[50%]" : "hover:border-[var(--border-bright)]"}`}
      >
        {/* Image Placeholder Area (Now Clickable) */}
        <div
          onClick={() => isValidImage && setIsImageModalOpen(true)}
          className={`w-full h-40 bg-[var(--bg4)] rounded-xl relative overflow-hidden flex items-center justify-center mb-4 border border-[var(--border)] ${isValidImage ? "cursor-pointer hover:opacity-90" : ""}`}
        >
          {isValidImage ? (
            <img
              src={imageUrl}
              alt={item.label}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-20 h-20 border-[2px] border-dashed border-[var(--border-bright)] rounded-full flex items-center justify-center text-[var(--text-muted)] font-medium text-sm flex-col gap-1">
              <ImageIcon className="w-5 h-5 opacity-50" />
            </div>
          )}

          <div className="absolute top-2 right-2 bg-[var(--bg1)] px-2 py-1 rounded-md shadow-sm border border-[var(--border)] flex items-center gap-1.5 font-[var(--font-mono)] font-bold text-[11px]">
            <span className={getConfidenceColor(item.confidence).split(" ")[0]}>
              {item.confidence}%
            </span>
            <div
              className={`w-3 h-3 rounded-full border-[2px] ${getConfidenceColor(item.confidence)}`}
            ></div>
          </div>
        </div>

        {/* Card Info */}
        <div className="px-1 mb-4 flex items-center gap-3">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)] truncate flex-1">
            {item.label}
          </h3>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-[var(--font-mono)] font-semibold border ${getStatusColor(item.status)}`}
          >
            {item.status.toUpperCase()}
          </span>
        </div>

        <div className="px-1 mb-5 flex items-center text-[var(--text-secondary)] text-[11px] font-[var(--font-mono)] font-medium">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {item.time}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Edit button is ALWAYS visible, and no longer disabled for invalid items */}
          <button
            onClick={() => setIsRelabelModalOpen(true)}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              !isPending
                ? "bg-[var(--bg3)] hover:bg-[var(--border)] text-[var(--text-primary)]"
                : "bg-[var(--bg3)] hover:bg-[var(--border)] text-[var(--text-primary)]"
            }`}
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>

          {/* Confirm Button is ONLY visible if Pending */}
          {isPending && (
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-[1.5] flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[var(--blue)]/10 hover:bg-[var(--blue)]/20 text-[var(--blue)] font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3px]" />
              )}
              Confirm
            </button>
          )}
        </div>
      </div>

      {/* FULLSCREEN IMAGE MODAL */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imageUrl}
            alt={item.label}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking the image itself
          />
        </div>
      )}

      {/* RELABEL MODAL */}
      {isRelabelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[var(--amber)]/10 p-6 flex flex-col items-center border-b border-[var(--amber)]/20">
              <div className="w-12 h-12 bg-[var(--bg1)] rounded-full flex items-center justify-center mb-3 shadow-sm text-[var(--amber)] border border-[var(--border)]">
                <Tag className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Relabel Item
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-2 mb-6">
                {AVAILABLE_LABELS.map((labelOption) => (
                  <button
                    key={labelOption}
                    onClick={() => setNewLabel(labelOption)}
                    className={`p-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      newLabel === labelOption
                        ? "border-[var(--amber)] bg-[var(--amber)]/10 text-[var(--amber)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg3)]"
                    }`}
                  >
                    {labelOption}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsRelabelModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[var(--border)] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg3)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRelabelSubmit}
                  disabled={!newLabel || isProcessing}
                  className="flex-[1.5] py-2.5 rounded-lg bg-[var(--amber)] hover:opacity-80 text-white font-bold transition-opacity shadow-sm disabled:opacity-50 flex justify-center items-center"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Update Label"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
