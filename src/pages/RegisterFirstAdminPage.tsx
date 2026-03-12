import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"
import { AlertCircle, Eye, EyeOff, Loader, CheckCircle } from "lucide-react"
import { toast } from "react-toastify"
import type { RegisterFirstAdminData } from "../types/auth"

export default function RegisterFirstAdminPage() {
  const navigate = useNavigate()
  const { signUp, error, clearError } = useAuthStore()

  const [formData, setFormData] = useState<RegisterFirstAdminData>({
    email: "",
    password: "",
    confirmPassword: "",
    nombreCompleto: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.nombreCompleto) {
      return "Por favor completa todos los campos"
    }

    if (!formData.email.endsWith("@sercop.gob.ec") && !formData.email.endsWith("@gmail.com")) {
      return "El correo debe ser de dominio @sercop.gob.ec o @gmail.com"
    }

    if (formData.password !== formData.confirmPassword) {
      return "Las contraseñas no coinciden"
    }

    if (formData.password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      console.log("📝 Registrando nuevo admin...")
      await signUp(formData.email, formData.password, formData.nombreCompleto)
      setRegistrationSuccess(true)
      toast.success("¡Registro exitoso! Por favor verifica tu correo")
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (err: any) {
      setIsSubmitting(false)
      const errorMessage = err.message || "Error al registrar"
      console.error("❌ Error capturado en handleSubmit:", errorMessage)
      toast.error(errorMessage)
    }
  }

  // Pantalla de éxito
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl p-8 sm:p-10 text-center">
            <CheckCircle className="text-green-600 mx-auto mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Registro Exitoso!</h1>
            <p className="text-gray-600 mb-4">
              Se ha enviado un correo de verificación a:
            </p>
            <p className="text-lg font-semibold text-blue-600 mb-6">{formData.email}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                Por favor, verifica tu correo y haz clic en el enlace de confirmación.
              </p>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Serás redirigido al login en 3 segundos...
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Registrar Admin
            </h1>
            <p className="text-gray-600 text-sm">
              Crea la cuenta del primer administrador del sistema
            </p>
          </div>

          {/* Warning */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>Importante:</strong> Esta es la creación del primer administrador. Después de esto, solo los admins podrán crear nuevos usuarios.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                placeholder="Juan Pérez García"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

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
                placeholder="usuario@sercop.gob.ec"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                ✓ @sercop.gob.ec o @gmail.com
              </p>
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
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres
              </p>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm leading-relaxed">
                <strong>📧 Importante:</strong> Se enviará un correo de verificación a tu dirección de correo. Debes hacer clic en el enlace para confirmar tu cuenta antes de poder iniciar sesión.
              </p>
            </div>

            {/* Botón Registro */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrarse como Admin"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>¿Ya tienes cuenta?</p>
            <button
              onClick={() => navigate("/login")}
              className="text-purple-600 hover:text-purple-700 font-semibold transition"
            >
              Inicia Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
