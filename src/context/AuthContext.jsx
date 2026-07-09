// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    // Check if user is already logged in from a previous session
    const savedUser = localStorage.getItem("nexus-user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const logout = async () => {
    try {
      // 1. Tell the backend to destroy the session
      // Switched to /api proxy to avoid CORS and attached the session_id
      await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          session_id: user?.session_id, // Tell backend which session to kill
        },
      });
    } catch (error) {
      console.error("Failed to communicate with logout API:", error);
    } finally {
      // 2. Always clear local state regardless of API success
      setUser(null);
      localStorage.removeItem("nexus-user");
      navigate("/login");
    }
  };

  const login = async (username, password) => {
    try {
      // Using the /api proxy we set up earlier for Render
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await response.json();

      // 🛑 CRITICAL UPDATE: Extracting the new session_id from your API response
      const userData = {
        id: data.user_id, // Added for backward compatibility with older components
        user_id: data.user_id,
        username: data.username,
        role: data.role,
        session_id: data.session_id, // <--- The key needed for all other requests!
      };

      // Save to state so the app updates immediately
      setUser(userData);
      // Save to localStorage so the session_id survives page refreshes
      localStorage.setItem("nexus-user", JSON.stringify(userData));

      navigate("/"); // Redirect to dashboard on success

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
