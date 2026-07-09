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
      const res = await fetch("/api/inspections/pending-review", {
        headers: {
          "x-session-id": sessionId,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data);

        // 2. Count the data accurately based on your API structure
        let count = data.meta.total_count;
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
    const interval = setInterval(fetchPendingCount, 10000);
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
