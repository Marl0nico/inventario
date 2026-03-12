import { useState, useEffect } from "react"
import { AlertCircle, Check } from "lucide-react"
import type { Equipo } from "../types/inventory"

interface Props {
  equipo: Equipo | null
  onSave: (equipo: Partial<Equipo>) => void
  onCancel: () => void
}

interface ValidationErrors {
  [key: string]: string
}

const REQUIRED_FIELDS = ["tipo_activo", "marca", "codigo_bien", "numero_serie", "cedula_funcionario", "ciudad", "estado_fisico"]

export default function EquipoForm({ equipo, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Equipo>>(equipo || {})
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  useEffect(() => setForm(equipo || {}), [equipo])

  const handleChange = (field: keyof Equipo, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    // Validar el campo mientras se escribe
    if (touched.has(field)) {
      validateField(field, value)
    }
  }

  const handleBlur = (field: keyof Equipo) => {
    setTouched(prev => new Set(prev).add(field))
    validateField(field, form[field])
  }

  const validateField = (field: keyof Equipo, value: any) => {
    const newErrors = { ...errors }

    if (REQUIRED_FIELDS.includes(field) && !value) {
      newErrors[field] = "Este campo es obligatorio"
    } else {
      delete newErrors[field]
    }

    // Validaciones específicas
    if (field === "cedula_funcionario" && value && !/^\d{8,10}$/.test(value)) {
      newErrors[field] = "Cédula inválida (8-10 dígitos)"
    }
    if (field === "direccion_ip" && value && !/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
      newErrors[field] = "IP inválida (ej: 192.168.1.1)"
    }

    setErrors(newErrors)
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    REQUIRED_FIELDS.forEach(field => {
      if (!form[field as keyof Equipo]) {
        newErrors[field] = "Este campo es obligatorio"
      }
    })

    // Validaciones específicas
    if (form.cedula_funcionario && !/^\d{8,10}$/.test(form.cedula_funcionario)) {
      newErrors.cedula_funcionario = "Cédula inválida"
    }
    if (form.direccion_ip && !/^(\d{1,3}\.){3}\d{1,3}$|^$/.test(form.direccion_ip)) {
      newErrors.direccion_ip = "IP inválida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(form)
    }
  }

  const renderFormField = (
    label: string,
    field: keyof Equipo,
    type: "text" | "select" = "text",
    options?: { label: string; value: string }[],
    required = false,
    disabled = false,
  ) => {
    const hasError = touched.has(field) && errors[field]

    return (
      <div key={field} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {type === "text" ? (
          <input
            type="text"
            placeholder={label}
            value={form[field] || ""}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            disabled={disabled}
            className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
              disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
            } ${
              hasError
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
            }`}
          />
        ) : (
          <select
            value={form[field] || ""}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            disabled={disabled}
            className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
              disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
            } ${
              hasError
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
            }`}
          >
            <option value="">Seleccione {label.toLowerCase()}</option>
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        {hasError && (
          <div className="flex items-center mt-1.5 text-red-500 text-sm">
            <AlertCircle size={16} className="mr-1.5" />
            {errors[field]}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {equipo ? "Editar Equipo" : "Crear Equipo"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-2xl font-light"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto pr-4">
        {/* Información Física */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
            Información Física
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFormField("Tipo de Activo", "tipo_activo", "text", undefined, true)}
            {renderFormField("Marca", "marca", "text", undefined, true)}
            {renderFormField("Modelo", "modelo", "text")}
            {renderFormField("Código Bien", "codigo_bien", "text", undefined, true)}
            {renderFormField("Número de Serie", "numero_serie", "text", undefined, true, !!equipo)}
            {renderFormField("Ubicación", "ubicacion_bien", "text")}
          </div>
        </div>

        {/* Especificaciones Técnicas */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
            Especificaciones Técnicas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFormField("Memoria RAM", "memoria_ram", "text")}
            {renderFormField("Almacenamiento", "almacenamiento", "text")}
            {renderFormField("Sistema Operativo", "sistema_operativo", "text")}
            {renderFormField("Nombre del Equipo", "nombre_equipo", "text")}
          </div>
        </div>

        {/* Configuración de Red */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
            Configuración de Red
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFormField("Dirección IP", "direccion_ip", "text")}
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
            Información Adicional
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFormField("Accesorios", "accesorios", "text")}
            {renderFormField("Observaciones", "observaciones", "text")}
            {renderFormField("Cédula Funcionario", "cedula_funcionario", "text", undefined, true)}
            {renderFormField("Ciudad", "ciudad", "select", [
              { label: "AMBATO", value: "AMBATO" },
              { label: "QUITO", value: "QUITO" },
              { label: "CUENCA", value: "CUENCA" },
              { label: "GUAYAQUIL", value: "GUAYAQUIL" },
              { label: "PORTOVIEJO", value: "PORTOVIEJO" },
            ], true)}
            {renderFormField("Estado Físico", "estado_fisico", "select", [
              { label: "BUENO", value: "BUENO" },
              { label: "REGULAR", value: "REGULAR" },
              { label: "MALO", value: "MALO" },
              { label: "BAJA", value: "BAJA" },
            ], true)}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t pt-6">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 font-medium flex items-center gap-2"
        >
          <Check size={18} />
          Guardar
        </button>
      </div>
    </div>
  )
}
