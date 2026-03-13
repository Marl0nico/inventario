import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"
import { Eye, EyeOff, Loader, AlertCircle, Mail } from "lucide-react"
import { toast } from "react-toastify"
import type { LoginCredentials } from "../types/auth"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, error, clearError, resendConfirmationEmail, isLoading } = useAuthStore()

  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [emailForResend, setEmailForResend] = useState("")

  // Mostrar errores en toast y detectar si es por email no confirmado
  useEffect(() => {
    if (error && isSubmitting) {
      if (error.includes("email no ha sido confirmada") || error.includes("Email not confirmed")) {
        setEmailNotConfirmed(true)
        setEmailForResend(formData.email)
      } else {
        toast.error(error)
      }
    }
  }, [error, isSubmitting, formData.email])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    clearError()
    setEmailNotConfirmed(false)
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
      toast.success("¡Sesión iniciada correctamente!")
      navigate("/inventory")
    } catch (err: any) {
      setIsSubmitting(false)
      const errorMessage = err.message || "Error al iniciar sesión"
      console.error("❌ Error capturado en handleSubmit:", errorMessage)
      
      if (errorMessage.includes("email no ha sido confirmada") || errorMessage.includes("Email not confirmed")) {
        setEmailNotConfirmed(true)
        setEmailForResend(formData.email)
      } else {
        toast.error(errorMessage)
      }
    }
  }

  const handleResendEmail = async () => {
    if (!emailForResend) {
      toast.error("No hay correo para reenviar")
      return
    }

    setIsResendingEmail(true)
    try {
      await resendConfirmationEmail(emailForResend)
      toast.success("✅ Correo de confirmación reenviado. Verifica tu bandeja de entrada.")
    } catch (err: any) {
      toast.error(err.message || "Error al reenviar correo")
    } finally {
      setIsResendingEmail(false)
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

          {/* Mensaje: Email no confirmado */}
          {emailNotConfirmed && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Cuenta no confirmada</h3>
                  <p className="text-sm text-amber-800 mb-4">
                    Tu correo aún no ha sido confirmado. Hemos enviado un enlace de confirmación a <strong>{emailForResend}</strong>. Haz clic en el enlace para verificar tu cuenta.
                  </p>
                  <button
                    onClick={handleResendEmail}
                    disabled={isResendingEmail || isLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded transition disabled:opacity-50"
                  >
                    <Mail size={16} />
                    {isResendingEmail ? "Reenviando..." : "Reenviar correo"}
                  </button>
                </div>
              </div>
            </div>
          )}

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
            <li>✓ Debes confirmar tu cuenta haciendo clic en el enlace del correo</li>
            <li>✓ Revisa tu bandeja de spam si no ves el correo</li>
            <li>✓ Los datos del inventario son confidenciales</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
