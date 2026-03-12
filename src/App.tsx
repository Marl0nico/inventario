import { useEffect } from "react"
import AppRouter from "./routes/AppRouter"
import { useAuthStore } from "./store/useAuthStore"
import { supabase } from "./api/supabaseClient"

function App() {
  const { 
    initializeAuth, 
    setUser, 
    startSessionMonitoring, 
    stopSessionMonitoring 
  } = useAuthStore()

  useEffect(() => {
    // 1. Inicializar autenticación una sola vez al abrir la app
    initializeAuth()

    // 2. Escuchar cambios de autenticación globales
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          startSessionMonitoring()
        } else {
          setUser(null)
          stopSessionMonitoring()
        }
      }
    )

    // 3. Limpieza global (solo ocurre si cierras la app)
    return () => {
      subscription?.unsubscribe()
      stopSessionMonitoring()
    }
  }, [initializeAuth, setUser, startSessionMonitoring, stopSessionMonitoring])

  return <AppRouter />
}

export default App