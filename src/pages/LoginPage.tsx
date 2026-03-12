import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"
import { Eye, EyeOff, Loader } from "lucide-react"
import { toast } from "react-toastify"
import type { LoginCredentials } from "../types/auth"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, user, error, clearError } = useAuthStore()

  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cuando el usuario se autentica, navegar a inventory
  useEffect(() => {
    if (user && !isSubmitting) {
      console.log("✅ Usuario detectado, navegando a inventory...")
      toast.success("¡Sesión iniciada correctamente!")
      navigate("/inventory")
    }
  }, [user, navigate, isSubmitting])

  // Mostrar errores en toast
  useEffect(() => {
    if (error && isSubmitting) {
      toast.error(error)
    }
  }, [error, isSubmitting])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    clearError()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error("Por favor completa todos los campos")
      return
    }

    setIsSubmitting(true)
    try {
      console.log("🔐 Iniciando login...")
      await login(formData)
      console.log("✨ Login exitoso, navegando...")
      // La navegación se hace automáticamente via useEffect cuando user cambia
    } catch (err: any) {
      setIsSubmitting(false)
      const errorMessage = err.message || "Error al iniciar sesión"
      console.error("❌ Error capturado en handleSubmit:", errorMessage)
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema de Inventario
            </h1>
            <p className="text-gray-600">Inicia sesión para continuar</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="correo@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Botón Login */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>¿Es tu primer acceso?</p>
            <button
              onClick={() => navigate("/register-first-admin")}
              disabled={isSubmitting}
              className="text-blue-600 hover:text-blue-700 font-semibold transition disabled:opacity-50"
            >
              Registrar primer administrador
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-lg p-6 text-white">
          <h3 className="font-semibold mb-3">ℹ️ Información importante</h3>
          <ul className="space-y-2 text-sm leading-relaxed">
            <li>✓ Usa tu correo @sercop.gob.ec o @gmail.com</li>
            <li>✓ Recuerda verificar tu cuenta por correo</li>
            <li>✓ Los datos del inventario son confidenciales</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
