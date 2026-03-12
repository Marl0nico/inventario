import { create } from "zustand"
import { supabase } from "../api/supabaseClient"
import type { AuthState, LoginCredentials, Profile, UserPermission } from "../types/auth"

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  signUp: (email: string, password: string, nombreCompleto: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  fetchUserProfile: () => Promise<void>
  fetchUserPermission: () => Promise<void>
  clearError: () => void
  setUser: (user: any) => void
  initializeAuth: () => Promise<void>
  resetInactivityTimer: () => void
  startSessionMonitoring: () => void
  stopSessionMonitoring: () => void
}

// Variables globales para timeout de sesión
let inactivityTimer: ReturnType<typeof setInterval> | null = null
let lastActivityTime: number = Date.now()
const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutos en milisegundos

// Función de manejador de actividad - debe ser la MISMA referencia para poder remover el listener
let activityHandler: (() => void) | null = null
const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "click"]

// Función auxiliar para timeout en promesas
function promiseWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ])
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  permission: null,
  isLoading: true, // Inicia en true para verificar sesión
  error: null,

  setUser: (user) => {
    set({ user })
  },

  initializeAuth: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        set({ user: session.user })
        const state = get()
        await Promise.all([
          state.fetchUserProfile(),
          state.fetchUserPermission(),
        ])
      } else {
        set({ user: null, profile: null, permission: null })
      }
    } catch (error: any) {
      console.error("Error initializing auth:", error.message)
      set({ user: null, profile: null, permission: null })
    } finally {
      set({ isLoading: false })
    }
  },

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null })
    try {
      console.log("📝 Iniciando login con:", credentials.email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw new Error(error.message || "Error al iniciar sesión")
      }

      if (!data.user) {
        throw new Error("No se pudo obtener la información del usuario")
      }

      console.log("✅ Usuario autenticado:", data.user.email)
      set({ user: data.user, isLoading: false, error: null })

      // Obtener perfil y permisos en paralelo (sin bloquear la navegación)
      console.log("📦 Cargando perfil y permisos...")
      const state = get()
      
      // Estas promesas se ejecutan pero no bloqueamos el login esperandolas
      Promise.allSettled([
        promiseWithTimeout(state.fetchUserProfile(), 5000),
        promiseWithTimeout(state.fetchUserPermission(), 5000),
      ]).then(() => {
        console.log("✨ Perfil y permisos cargados")
        get().startSessionMonitoring()
      }).catch(err => {
        console.error("⚠️ Error cargando perfil/permisos, continuando:", err)
        get().startSessionMonitoring()
      })

    } catch (error: any) {
      console.error("❌ Error en login:", error.message)
      set({ 
        error: error.message || "Error al iniciar sesión", 
        isLoading: false,
        user: null,
      })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null })
    try {
      get().stopSessionMonitoring()
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      set({
        user: null,
        profile: null,
        permission: null,
        isLoading: false,
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  signUp: async (email: string, password: string, nombreCompleto: string) => {
    set({ isLoading: true, error: null })
    try {
      console.log("📝 Registrando nuevo admin:", email)

      // Validar dominio de email
      if (!email.endsWith("@sercop.gob.ec") && !email.endsWith("@gmail.com")) {
        throw new Error("El correo debe ser de dominio @sercop.gob.ec o @gmail.com")
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo: nombreCompleto,
            rol: "admin",
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (error) throw error

      console.log("✅ Usuario registrado:", email)
      if (data.user) {
        set({ user: data.user })
      }

      set({ isLoading: false, error: null })
      console.log("✨ Registro completado")
    } catch (error: any) {
      console.error("❌ Error en signup:", error.message)
      set({ error: error.message || "Error al registrar", isLoading: false })
      throw error
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null })
    try {
      const user = get().user
      if (!user) throw new Error("Usuario no autenticado")

      // Primero, verificar que la contraseña actual es correcta
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error("Contraseña actual incorrecta")
      }

      // Cambiar contraseña
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
    } catch (error: any) {
      set({ error: error.message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUserProfile: async () => {
    try {
      const user = get().user
      if (!user) {
        set({ profile: null })
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error fetching profile:", error.message)
        set({ profile: null })
        return
      }

      set({ profile: data as Profile })
    } catch (error: any) {
      console.error("Error fetching profile:", error.message)
      set({ profile: null })
    }
  },

  fetchUserPermission: async () => {
    try {
      const user = get().user
      if (!user) {
        set({ permission: null })
        return
      }

      const { data, error } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", user.id)
        .eq("recurso", "inventario")
        .single()

      if (error) {
        // PGRST116 = no rows found - normal para usuarios nuevos
        if (error.code === "PGRST116") {
          set({ permission: "lectura" }) // Default
          return
        }
        console.error("Error fetching permission:", error.message)
        set({ permission: "lectura" }) // Default por seguridad
        return
      }

      set({ permission: (data as UserPermission)?.permiso_tipo || "lectura" })
    } catch (error: any) {
      console.error("Error fetching permission:", error.message)
      set({ permission: "lectura" }) // Default por seguridad
    }
  },

  resetInactivityTimer: () => {
    lastActivityTime = Date.now()
    console.log("⏱️ Timer de inactividad reiniciado")
  },

  startSessionMonitoring: () => {
    console.log("🔍 Iniciando monitoreo de sesión (5 minutos de inactividad)")
    
    // Limpiar timer anterior si existe
    if (inactivityTimer) {
      clearInterval(inactivityTimer)
    }

    // Limpiar listeners anteriores si existen
    if (activityHandler) {
      activityEvents.forEach(event => {
        document.removeEventListener(event, activityHandler!)
      })
    }

    lastActivityTime = Date.now()
    
    // Crear el handler de actividad FUERA de los listeners para poder removerlo después
    activityHandler = () => {
      get().resetInactivityTimer()
    }

    // Agregar event listeners para detectar actividad
    activityEvents.forEach(event => {
      document.addEventListener(event, activityHandler!)
    })

    // Verificar inactividad cada minuto
    inactivityTimer = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityTime
      const remaining = INACTIVITY_TIMEOUT - timeSinceLastActivity

      if (remaining <= 0) {
        console.warn("⚠️ Sesión cerrada por inactividad (5 minutos)")
        get().stopSessionMonitoring()
        get().logout()
      } else {
        console.log(`⏰ Tiempo restante antes de logout: ${Math.round(remaining / 1000)} segundos`)
      }
    }, 60000) // Verificar cada minuto
  },

  stopSessionMonitoring: () => {
    console.log("🛑 Pausando monitoreo de sesión")
    
    if (inactivityTimer) {
      clearInterval(inactivityTimer)
      inactivityTimer = null
    }

    // Remover event listeners usando la referencia guardada
    if (activityHandler) {
      activityEvents.forEach(event => {
        document.removeEventListener(event, activityHandler!)
      })
      activityHandler = null
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))