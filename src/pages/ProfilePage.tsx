import { useState } from "react"
import { useAuth } from "../hooks/useAuth"
import { useAuthStore } from "../store/useAuthStore"
import { Edit2, Lock, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "react-toastify"

export default function ProfilePage() {
  const { profile, user } = useAuth()
  const { changePassword, isLoading, error } = useAuthStore()

  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!passwordData.currentPassword.trim()) {
      toast.error("Ingresa tu contraseña actual")
      return
    }

    if (!passwordData.newPassword.trim()) {
      toast.error("Ingresa una nueva contraseña")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("La nueva contraseña debe ser diferente a la actual")
      return
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword)
      toast.success("Contraseña actualizada correctamente")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setIsEditingPassword(false)
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar la contraseña")
    }
  }

  if (!profile || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Gestiona tu información personal y contraseña</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Información del Perfil */}
        <div className="bg-white shadow rounded-lg p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Información Personal</h2>

          <div className="space-y-6">
            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                <p className="text-gray-900 font-medium">{profile.nombre_completo || "—"}</p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                <p className="text-gray-900 font-mono">{user.email}</p>
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    profile.rol === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {profile.rol === "admin" ? "Administrador" : "Estándar"}
                </span>
              </div>
            </div>

            {/* Fecha de Creación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Creación
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-gray-900">
                    {new Date(profile.fecha_creacion).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Última Actualización */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Última Actualización
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-gray-900">
                    {new Date(profile.fecha_actualizacion).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    size={20}
                    className={profile.activo ? "text-green-600" : "text-red-600"}
                  />
                  <span className={`font-medium ${profile.activo ? "text-green-600" : "text-red-600"}`}>
                    {profile.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cambiar Contraseña */}
        <div className="bg-white shadow rounded-lg p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Seguridad</h2>
            {!isEditingPassword && (
              <button
                onClick={() => setIsEditingPassword(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition font-medium"
              >
                <Edit2 size={18} />
                Cambiar Contraseña
              </button>
            )}
          </div>

          {!isEditingPassword ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Se recomienda cambiar tu contraseña regularmente para mantener tu cuenta segura.
              </p>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Contraseña Actual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  placeholder="Ingresa tu contraseña actual"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Ingresa tu nueva contraseña"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirma tu nueva contraseña"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPassword(false)
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  <Lock size={18} />
                  {isLoading ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info adicional para admins */}
        {profile.rol === "admin" && (
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <strong>Como Administrador:</strong> Tienes acceso adicional a la gestión de usuarios.
              Puedes crear nuevos usuarios, cambiar sus roles y desactivarlos desde la sección de{" "}
              <strong>Usuarios</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
