// src/hooks/useInventory.ts
import { useEffect, useState } from "react"
import { supabase } from "../api/supabaseClient"
import type { Equipo, Ciudad, EstadoFisico } from "../types/inventory"

interface FilterOptions {
  ciudad?: Ciudad
  estado?: EstadoFisico
  tipoActivo?: string
  search?: string
}

export function useInventory(pageSize = 50) {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<FilterOptions>({})

  const fetchEquipos = async () => {
    setLoading(true)
    let query = supabase.from("equipos").select("*", { count: "exact" })

    // Aplicar filtros
    if (filters.ciudad) query = query.eq("ciudad", filters.ciudad)
    if (filters.estado) query = query.eq("estado_fisico", filters.estado)
    if (filters.tipoActivo) query = query.eq("tipo_activo", filters.tipoActivo)
    if (filters.search) {
      query = query.or(
        `codigo_bien.ilike.%${filters.search}%,numero_serie.ilike.%${filters.search}%`
      )
    }

    // Paginación
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) setError(error.message)
    else {
      setEquipos(data as Equipo[])
      if (count !== null) setTotal(count)
    }

    setLoading(false)
  }

  const createEquipo = async (nuevo: Partial<Equipo>) => {
    const { error } = await supabase.from("equipos").insert([nuevo])
    if (error) setError(error.message)
    else fetchEquipos()
  }

  const updateEquipo = async (numero_serie: string, cambios: Partial<Equipo>) => {
    const { error } = await supabase
      .from("equipos")
      .update(cambios)
      .eq("numero_serie", numero_serie)
    if (error) setError(error.message)
    else fetchEquipos()
  }

  const deleteEquipo = async (numero_serie: string) => {
    const { error } = await supabase
      .from("equipos")
      .update({ activo: false })
      .eq("numero_serie", numero_serie)
    if (error) setError(error.message)
    else fetchEquipos()
  }

  useEffect(() => {
    fetchEquipos()
  }, [page, filters])

  return {
    equipos,
    loading,
    error,
    page,
    pageSize,
    total,
    setPage,
    setFilters,
    createEquipo,
    updateEquipo,
    deleteEquipo,
  }
}