import { useAuthStore } from "../store/useAuthStore"

export function useAuth() {
  const {
    user,
    profile,
    permission,
    isLoading,
    resetInactivityTimer,
  } = useAuthStore()

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