import { Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { Loader } from "lucide-react"

interface ProtectedRouteProps {
  element: React.ReactElement
  requiredPermission?: "lectura" | "escritura"
  requiredRole?: "admin" | "default"
}

export default function ProtectedRoute({
  element,
  requiredPermission,
  requiredRole,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, user, permission, profile } = useAuth()

  // 1. Mientras carga la sesión inicial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // 2. No autenticado - redirigir a login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // 3. Validar que tenga profile (datos cargados)
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
          <p className="text-gray-600">Cargando datos del usuario...</p>
        </div>
      </div>
    )
  }

  // 4. Validar permiso requerido
  if (requiredPermission && permission !== requiredPermission && requiredPermission !== "lectura") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500">
            Tu permiso actual: <strong>{permission}</strong>
          </p>
        </div>
      </div>
    )
  }

  // 5. Validar rol requerido
  if (requiredRole && profile.rol !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">
            Solo {requiredRole}s pueden acceder a esta página.
          </p>
          <p className="text-sm text-gray-500">
            Tu rol actual: <strong>{profile.rol}</strong>
          </p>
        </div>
      </div>
    )
  }

  // 6. Autenticado y con permisos - mostrar contenido
  return element
}
