export type Ciudad =
  | "AMBATO"
  | "QUITO"
  | "CUENCA"
  | "GUAYAQUIL"
  | "PORTOVIEJO"

export type EstadoFisico =
  | "BUENO"
  | "REGULAR"
  | "MALO"
  | "BAJA"
  | "NO ESPECIFICADO"
export interface Equipo {
  tipo_activo: string
  marca: string
  modelo: string | null
  codigo_bien: string
  numero_serie: string
  ubicacion_bien: string | null
  memoria_ram: string | null
  almacenamiento: string | null
  sistema_operativo: string | null
  nombre_equipo: string | null
  direccion_ip: string | null
  estado_fisico: EstadoFisico
  accesorios: string | null
  observaciones: string | null
  cedula_funcionario: string
  ciudad: Ciudad
}