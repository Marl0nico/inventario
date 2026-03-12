import type { User } from "@supabase/supabase-js"

export interface Profile {
  id: string
  email: string
  nombre_completo: string | null
  rol: "admin" | "default"
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface UserPermission {
  id: string
  user_id: string
  permiso_tipo: "lectura" | "escritura"
  recurso: string
  creado_en: string
  creado_por: string | null
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  permission: "lectura" | "escritura" | null
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterFirstAdminData {
  email: string
  password: string
  confirmPassword: string
  nombreCompleto: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
