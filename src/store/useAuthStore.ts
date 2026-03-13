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
  createUserWithRole: (email: string, nombreCompleto: string, rol: "admin" | "default") => Promise<string>
  getAllUsers: () => Promise<Profile[]>
  updateUserRole: (userId: string, newRole: "admin" | "default") => Promise<void>
  deactivateUser: (userId: string) => Promise<void>
  resendConfirmationEmail: (email: string) => Promise<void>
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
        // Detectar error específico de email no confirmado
        if (error.message.includes("Email not confirmed")) {
          throw new Error(`Tu cuenta aún no ha sido confirmada. Revisa tu correo electrónico (${credentials.email}) para confirmar tu cuenta. Si no ves el correo, verifica tu bandeja de spam.`)
        }
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

  // ========== CRUD de Usuarios (Fase 3) ==========
  
  createUserWithRole: async (email: string, nombreCompleto: string, rol: "admin" | "default") => {
    set({ isLoading: true, error: null })
    try {
      const defaultPassword = import.meta.env.VITE_DEFAULT_PASSWORD;
      
      console.log(`📝 Creando usuario ${rol}: ${email}`)

      // Validar dominio de email
      if (!email.endsWith("@sercop.gob.ec") && !email.endsWith("@gmail.com")) {
        throw new Error("El correo debe ser de dominio @sercop.gob.ec o @gmail.com")
      }

      // Crear usuario usando signUp (envía correo de confirmación automáticamente)
      // NO usamos admin.createUser porque requiere service_role en el cliente
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: defaultPassword,
        options: {
          data: {
            nombre_completo: nombreCompleto,
            rol: rol,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario")
      }

      console.log(`📧 Correo de confirmación enviado a: ${email}`)

      // Crear perfil en BD
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: email,
          nombre_completo: nombreCompleto,
          rol: rol,
          activo: true,
        })

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Crear permisos en BD
      const permiso_tipo = rol === "admin" ? "escritura" : "lectura"
      const { error: permError } = await supabase
        .from("user_permissions")
        .insert({
          user_id: authData.user.id,
          permiso_tipo: permiso_tipo,
          recurso: "inventario",
          creado_por: get().user?.id || null,
        })

      if (permError) {
        console.warn("⚠️ Aviso al crear permisos:", permError.message)
        // No lanzamos error aquí porque el usuario se creó correctamente
      }

      console.log(`✅ Usuario ${rol} creado: ${email} - Correo de confirmación enviado`)
      set({ isLoading: false })
      return authData.user.id
    } catch (error: any) {
      console.error("❌ Error creando usuario:", error.message)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  getAllUsers: async () => {
    try {
      const user = get().user
      if (!user) throw new Error("Usuario no autenticado")

      // Verificar que sea admin
      const profile = get().profile
      if (profile?.rol !== "admin") {
        throw new Error("Solo admins pueden listar usuarios")
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("activo", true)
        .order("fecha_creacion", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data as Profile[]
    } catch (error: any) {
      console.error("❌ Error listando usuarios:", error.message)
      set({ error: error.message })
      throw error
    }
  },

  updateUserRole: async (userId: string, newRole: "admin" | "default") => {
    set({ isLoading: true, error: null })
    try {
      const user = get().user
      if (!user) throw new Error("Usuario no autenticado")

      // Verificar que sea admin
      const profile = get().profile
      if (profile?.rol !== "admin") {
        throw new Error("Solo admins pueden cambiar roles")
      }

      console.log(`🔄 Cambiando rol de usuario ${userId} a ${newRole}`)

      // Actualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ rol: newRole })
        .eq("id", userId)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Actualizar permisos
      const permiso_tipo = newRole === "admin" ? "escritura" : "lectura"
      const { error: permError } = await supabase
        .from("user_permissions")
        .update({ permiso_tipo })
        .eq("user_id", userId)
        .eq("recurso", "inventario")

      if (permError) {
        console.warn("⚠️ Aviso al actualizar permisos:", permError.message)
      }

      console.log(`✅ Rol actualizado a ${newRole}`)
      set({ isLoading: false })
    } catch (error: any) {
      console.error("❌ Error actualizando rol:", error.message)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  deactivateUser: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const user = get().user
      if (!user) throw new Error("Usuario no autenticado")

      // Verificar que sea admin
      const profile = get().profile
      if (profile?.rol !== "admin") {
        throw new Error("Solo admins pueden desactivar usuarios")
      }

      // No permitir desactivar a sí mismo
      if (userId === user.id) {
        throw new Error("No puedes desactivarte a ti mismo")
      }

      console.log(`🗑️ Desactivando usuario ${userId}`)

      // Soft-delete: marcar como inactivo
      const { error } = await supabase
        .from("profiles")
        .update({ activo: false })
        .eq("id", userId)

      if (error) {
        throw new Error(error.message)
      }

      console.log(`✅ Usuario desactivado`)
      set({ isLoading: false })
    } catch (error: any) {
      console.error("❌ Error desactivando usuario:", error.message)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  resendConfirmationEmail: async (email: string) => {
    set({ isLoading: true, error: null })
    try {
      console.log(`📧 Reenviando correo de confirmación a: ${email}`)

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (error) {
        throw new Error(error.message || "Error al reenviar correo")
      }

      console.log(`✅ Correo de confirmación reenviado`)
      set({ isLoading: false, error: null })
    } catch (error: any) {
      console.error("❌ Error reenviando correo:", error.message)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },
}))