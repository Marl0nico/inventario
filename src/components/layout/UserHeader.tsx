import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { useAuthStore } from "../../store/useAuthStore"
import { LogOut, Lock, ChevronDown, Shield } from "lucide-react"
import ChangePasswordModal from "../auth/ChangePasswordModal"

export default function UserHeader() {
  const navigate = useNavigate()
  const { user, profile, permission, isAdmin } = useAuth()
  const { logout } = useAuthStore()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  if (!user || !profile) return null

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 flex justify-between items-center">
          {/* Left side - Title */}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Sistema de Inventario</h1>
          </div>

          {/* Right side - User Menu */}
          <div className="flex items-center gap-4">
            {/* Permission Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              permission === "escritura"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}>
              {permission === "escritura" ? "✏️ Escritura" : "👁️ Lectura"}
            </div>

            {/* Admin Badge */}
            {isAdmin && (
              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center gap-1">
                <Shield size={14} />
                Admin
              </div>
            )}

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{profile.nombre_completo || "Usuario"}</p>
                  <p className="text-xs text-gray-600">{profile.email}</p>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-gray-600 transition ${isMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  {/* Profile Info Mobile */}
                  <div className="sm:hidden px-4 py-3 border-b border-gray-200">
                    <p className="font-medium text-gray-900">{profile.nombre_completo || "Usuario"}</p>
                    <p className="text-xs text-gray-600">{profile.email}</p>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => {
                      setIsChangePasswordModalOpen(true)
                      setIsMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 transition flex items-center gap-3 text-gray-700"
                  >
                    <Lock size={18} />
                    <span>Cambiar Contraseña</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 transition flex items-center gap-3 text-red-600 border-t border-gray-200"
                  >
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </>
  )
}
