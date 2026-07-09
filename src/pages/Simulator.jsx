// src/pages/Simulator.jsx
import React, { useState, useRef } from "react";
import Button from "../components/ui/Button";
import {
  AlertCircle,
  Upload,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Simulator() {
  const { user, logout } = useAuth();

  // --- FORM STATE ---
  const [sensorId, setSensorId] = useState("CAM_01");
  const [status, setStatus] = useState("Good");
  const [defectType, setDefectType] = useState("");
  const [confidenceScore, setConfidenceScore] = useState(95);
  const [imageFile, setImageFile] = useState(null);

  // --- UI STATE ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const clearForm = () => {
    setStatus("Good");
    setDefectType("");
    setConfidenceScore(95);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Build the multipart/form-data payload
    const formData = new FormData();
    formData.append("sensor_id", sensorId);
    formData.append("status", status);

    // According to previous logic, Good items shouldn't have a defect type.
    // If it's not good, we append the specific defect.
    if (status !== "Good" && defectType) {
      formData.append("defect_type", defectType);
    }

    formData.append("confidence_score", confidenceScore);

    if (imageFile) {
      formData.append("image_file", imageFile);
    }

    try {
      const response = await fetch("/api/inspections", {
        method: "POST",
        headers: {
          "x-session-id": user?.session_id,
          // Note: Do NOT set Content-Type for FormData. The browser sets it automatically with the boundary.
        },
        body: formData,
      });

      if (response.status === 401) return logout();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Server rejected the simulation: ${response.status}`,
        );
      }

      setSuccessMessage("Test inspection injected successfully!");
      clearForm();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Simulation failed:", error);
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-2xl">
      {/* PAGE HEADER */}
      <div className="mb-6">
        <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase font-semibold">
          Developer Tools
        </div>
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight">
          Inspection Simulator
        </h1>
        <p className="text-[12px] text-[var(--text-secondary)] mt-1">
          Manually inject test records into the backend to test the Quality Log
          and Dashboard.
        </p>
      </div>

      {/* FEEDBACK BANNERS */}
      {errorMessage && (
        <div className="mb-6 p-3 bg-[var(--coral-bg)] border border-[var(--coral-dim)] rounded-[var(--radius)] text-[13px] text-[var(--coral)] font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3 bg-[var(--teal-bg)] border border-[var(--teal-dim)] rounded-[var(--radius)] text-[13px] text-[var(--teal)] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* SIMULATOR FORM */}
      <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] bg-[var(--bg3)] flex items-center gap-2">
          <Upload className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
            Construct Inspection Payload
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {/* Sensor ID */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Sensor ID <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                type="text"
                required
                value={sensorId}
                onChange={(e) => setSensorId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg0)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] transition-colors font-[var(--font-mono)]"
              />
            </div>

            {/* Confidence Score */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                AI Confidence ({confidenceScore}%){" "}
                <span className="text-[var(--coral)]">*</span>
              </label>
              <div className="flex items-center h-[38px]">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  required
                  value={confidenceScore}
                  onChange={(e) => setConfidenceScore(e.target.value)}
                  className="w-full h-2 bg-[var(--bg4)] rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Status Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Inspection Status <span className="text-[var(--coral)]">*</span>
              </label>
              <select
                required
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (e.target.value === "Good") setDefectType("");
                }}
                className="w-full px-3 py-2 bg-[var(--bg0)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] transition-colors cursor-pointer"
              >
                <option value="Good">Good (Pass)</option>
                <option value="Defected">Defected (Fail)</option>
              </select>
            </div>

            {/* Defect Type (Only show if Status is Defected) */}
            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${status === "Good" ? "text-[var(--text-muted)] opacity-50" : "text-[var(--text-muted)]"}`}
              >
                Defect Type{" "}
                {status !== "Good" && (
                  <span className="text-[var(--coral)]">*</span>
                )}
              </label>
              <select
                disabled={status === "Good"}
                required={status !== "Good"}
                value={defectType}
                onChange={(e) => setDefectType(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg0)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  Select defect...
                </option>
                <option value="scratch">Scratch</option>
                <option value="dent">Dent</option>
                <option value="label defect">Label Defect</option>
              </select>
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="pt-2">
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Simulated Camera Capture (Image)
            </label>

            <div className="flex items-center justify-center w-full">
              <label
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${imageFile ? "border-[var(--blue)] bg-[var(--blue-bg)]" : "border-[var(--border-bright)] bg-[var(--bg0)] hover:bg-[var(--bg3)]"}`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {imageFile ? (
                    <>
                      <ImageIcon className="w-8 h-8 text-[var(--blue)] mb-2" />
                      <p className="text-[13px] font-semibold text-[var(--blue)]">
                        {imageFile.name}
                      </p>
                      <p className="text-[11px] text-[var(--blue)] opacity-70 mt-1">
                        Click to replace file
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                      <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-1">
                        <span className="font-bold text-[var(--text-primary)]">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        PNG, JPG, or JPEG
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 mt-4 border-t border-[var(--border)] flex justify-end gap-3">
            <Button
              type="button"
              variant="default"
              onClick={clearForm}
              disabled={isSubmitting}
            >
              Reset Payload
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="min-w-[160px] flex justify-center"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Inject Inspection"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
