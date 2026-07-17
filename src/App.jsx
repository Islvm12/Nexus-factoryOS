// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { InspectionProvider } from "./context/InspectionContext"; // <-- 1. Import the new Provider
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Diagnostics from "./pages/Diagnostics";
import Analytics from "./pages/Analytics";
import QualityLog from "./pages/QualityLog";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Control from "./pages/Control";
import Simulator from "./pages/Simulator";

// Protects routes from unauthenticated users
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// The shell wrapper for authenticated pages
const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Sidebar />
      <main className="mt-[var(--header)] ml-[var(--sidebar)] p-8 flex-1">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {/* 2. Wrap the Routes inside the InspectionProvider */}
          <InspectionProvider>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes inside the Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quality"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <QualityLog />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/control"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Control />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Analytics />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/diagnostics"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Diagnostics />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/simulator"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Simulator />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </InspectionProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
