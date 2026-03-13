import { useState, useEffect } from "react"
import { useAuthStore } from "../store/useAuthStore"
import { useAuth } from "../hooks/useAuth"
import type { Profile } from "../types/auth"
import { Plus, Edit2, Trash2, X, Check, AlertCircle } from "lucide-react"
import Modal from "react-modal"
import { toast } from "react-toastify"

Modal.setAppElement("#root")

interface CreateUserFormData {
  email: string
  nombreCompleto: string
  rol: "admin" | "default"
}

interface ChangeRoleFormData {
  userId: string
  newRole: "admin" | "default"
  userName: string
}

export default function UsersManagement() {
  const { profile } = useAuth()
  const {
    createUserWithRole,
    getAllUsers,
    updateUserRole,
    deactivateUser,
    isLoading,
    error,
  } = useAuthStore()

  const [users, setUsers] = useState<Profile[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false)
  const [selectedUserForRole, setSelectedUserForRole] = useState<ChangeRoleFormData | null>(null)

  const [formData, setFormData] = useState<CreateUserFormData>({
    email: "",
    nombreCompleto: "",
    rol: "default",
  })

  // Cargar usuarios al montar componente
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setUsersLoading(true)
      const usuariosActuales = await getAllUsers()
      setUsers(usuariosActuales)
    } catch (error) {
      console.error("Error cargando usuarios:", error)
      toast.error("Error al cargar usuarios")
    } finally {
      setUsersLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.email.trim()) {
      toast.error("El correo es requerido")
      return
    }

    if (!formData.nombreCompleto.trim()) {
      toast.error("El nombre completo es requerido")
      return
    }

    if (!formData.email.includes("@")) {
      toast.error("Correo inválido")
      return
    }

    try {
      await createUserWithRole(formData.email, formData.nombreCompleto, formData.rol)
      toast.success(`Usuario ${formData.rol} creado. Se ha enviado un correo de confirmación a ${formData.email}`)
      
      // Limpiar formulario y recargar usuarios
      setFormData({ email: "", nombreCompleto: "", rol: "default" })
      setShowCreateModal(false)
      await loadUsers()
    } catch (error: any) {
      toast.error(error.message || "Error al crear usuario")
    }
  }

  const handleChangeRole = async () => {
    if (!selectedUserForRole) return

    try {
      await updateUserRole(selectedUserForRole.userId, selectedUserForRole.newRole)
      toast.success(`Rol actualizado a ${selectedUserForRole.newRole}`)
      
      setShowChangeRoleModal(false)
      setSelectedUserForRole(null)
      await loadUsers()
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar rol")
    }
  }

  const handleDeactivateUser = async (userId: string, userName: string) => {
    if (!window.confirm(`¿Desactivar a ${userName}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await deactivateUser(userId)
      toast.success("Usuario desactivado")
      await loadUsers()
    } catch (error: any) {
      toast.error(error.message || "Error al desactivar usuario")
    }
  }

  // Solo admins pueden acceder aquí
  if (profile?.rol !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={40} />
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-gray-600 mt-2">Solo administradores puede acceder a esta sección</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-1">Administra usuarios del sistema</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Crear Usuario
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {usersLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Correo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha de Creación</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.nombre_completo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.rol === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.rol === "admin" ? "Administrador" : "Estándar"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.fecha_creacion).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUserForRole({
                                userId: user.id,
                                newRole: user.rol === "admin" ? "default" : "admin",
                                userName: user.nombre_completo,
                              })
                              setShowChangeRoleModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Cambiar rol"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeactivateUser(user.id, user.nombre_completo)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Desactivar usuario"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>⚠️ Importante:</strong> Al crear un nuevo usuario, se envía un correo de confirmación a <strong>{formData.email || 'su correo'}</strong>. 
            El usuario debe confirmar su cuenta haciendo clic en el enlace del correo antes de poder iniciar sesión. 
            La contraseña temporal es <code className="bg-blue-100 px-2 py-1 rounded">53rC0p.2K26</code> y se recomienda cambiarla al primer login.
          </p>
        </div>
      </div>

      {/* Modal: Crear Usuario */}
      <Modal
        isOpen={showCreateModal}
        onRequestClose={() => {
          setShowCreateModal(false)
          setFormData({ email: "", nombreCompleto: "", rol: "default" })
        }}
        className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50"
        overlayClassName="fixed inset-0"
      >
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Crear Nuevo Usuario</h2>
            <button
              onClick={() => {
                setShowCreateModal(false)
                setFormData({ email: "", nombreCompleto: "", rol: "default" })
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={formData.nombreCompleto}
                onChange={(e) =>
                  setFormData({ ...formData, nombreCompleto: e.target.value })
                }
                placeholder="Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="usuario@sercop.gob.ec"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                value={formData.rol}
                onChange={(e) =>
                  setFormData({ ...formData, rol: e.target.value as "admin" | "default" })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Estándar (solo lectura)</option>
                <option value="admin">Administrador (CRUD)</option>
              </select>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
              <div className="mb-2">
                <p className="font-semibold">Contraseña temporal:</p>
                <code className="bg-white px-2 py-1 rounded border border-gray-200">53rC0p.2K26</code>
              </div>
              <p className="text-xs text-gray-600">
                ⚠️ Se enviará un correo de confirmación a <strong>{formData.email || 'su correo'}</strong>. 
                El usuario debe confirmar su cuenta antes de poder iniciar sesión.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? "Creando..." : "Crear Usuario"}
            </button>
          </form>
        </div>
      </Modal>

      {/* Modal: Cambiar Rol */}
      <Modal
        isOpen={showChangeRoleModal}
        onRequestClose={() => {
          setShowChangeRoleModal(false)
          setSelectedUserForRole(null)
        }}
        className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50"
        overlayClassName="fixed inset-0"
      >
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Cambiar Rol</h2>
            <button
              onClick={() => {
                setShowChangeRoleModal(false)
                setSelectedUserForRole(null)
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {selectedUserForRole && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  ¿Cambiar el rol de <strong>{selectedUserForRole.userName}</strong> de{" "}
                  <strong>{selectedUserForRole.newRole === "admin" ? "Estándar" : "Administrador"}</strong> a{" "}
                  <strong>{selectedUserForRole.newRole === "admin" ? "Administrador" : "Estándar"}</strong>?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowChangeRoleModal(false)
                    setSelectedUserForRole(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangeRole}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <Check size={18} />
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
