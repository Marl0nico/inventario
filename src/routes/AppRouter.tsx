import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "../components/ProtectedRoute"
import LoginPage from "../pages/LoginPage"
import RegisterFirstAdminPage from "../pages/RegisterFirstAdminPage"
import InventoryPage from "../pages/InventoryPage"
import UserHeader from "../components/layout/UserHeader"
import type { JSX } from "react"

export default function AppRouter(): JSX.Element {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-first-admin" element={<RegisterFirstAdminPage />} />

        {/* Protected Routes */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute
              element={
                <>
                  <UserHeader />
                  <InventoryPage />
                </>
              }
              requiredPermission="lectura"
            />
          }
        />

        {/* Redirect home to login */}
        <Route path="/" element={<Navigate to="/inventory" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}