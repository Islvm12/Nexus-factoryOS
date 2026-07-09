// src/context/InspectionContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const InspectionContext = createContext();

export const useInspection = () => useContext(InspectionContext);

export const InspectionProvider = ({ children }) => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    // 1. ULTRA-SAFE GUARD: Extract the session ID and stop immediately if it is not ready
    const sessionId = user?.session_id || user?.id;

    if (!sessionId) {
      // Silently wait. The useEffect will re-trigger this function the millisecond the user logs in.
      return;
    }

    try {
      const res = await fetch(
        "/api/inspections/pending-review?page=1&size=100",
        {
          headers: {
            "x-session-id": sessionId,
            "Content-Type": "application/json",
          },
        },
      );

      if (res.ok) {
        const data = await res.json();

        // 2. Count the data accurately based on your API structure
        let count = 0;
        if (data && typeof data.total === "number") {
          count = data.total;
        } else if (data && typeof data.count === "number") {
          count = data.count;
        } else if (Array.isArray(data)) {
          count = data.length;
        } else if (data && Array.isArray(data.items)) {
          count = data.items.length;
        } else if (data && Array.isArray(data.data)) {
          count = data.data.length;
        }

        setPendingCount(count);
      }
    } catch (error) {
      console.error("Failed to fetch pending count", error);
    }
  };

  // 3. Dependency Array: Run this effect ONLY when the session ID changes
  useEffect(() => {
    fetchPendingCount();

    // Auto-refresh the count every 15 seconds
    const interval = setInterval(fetchPendingCount, 15000);
    return () => clearInterval(interval);
  }, [user?.session_id]);

  return (
    <InspectionContext.Provider
      value={{ pendingCount, refreshPendingCount: fetchPendingCount }}
    >
      {children}
    </InspectionContext.Provider>
  );
};
