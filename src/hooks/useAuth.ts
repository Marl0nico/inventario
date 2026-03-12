import { useEffect } from "react"
import { useAuthStore } from "../store/useAuthStore"
import { supabase } from "../api/supabaseClient"

export function useAuth() {
  const {
    user,
    profile,
    permission,
    setUser,
    initializeAuth,
    isLoading,
    startSessionMonitoring,
    stopSessionMonitoring,
    resetInactivityTimer,
  } = useAuthStore()

  useEffect(() => {
    // Inicializar autenticación
    initializeAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          // Iniciar monitoreo cuando el usuario se autentica
          startSessionMonitoring()
        } else {
          setUser(null)
          // Detener monitoreo cuando se cierra sesión
          stopSessionMonitoring()
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
      stopSessionMonitoring()
    }
  }, [setUser, initializeAuth, startSessionMonitoring, stopSessionMonitoring])

  return {
    user,
    profile,
    permission,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: profile?.rol === "admin",
    canWrite: permission === "escritura",
    canRead: permission === "lectura",
    resetInactivityTimer,
  }
}
