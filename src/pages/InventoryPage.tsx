import { useState, useEffect, useRef } from "react"
import { useInventory } from "../hooks/useInventory"
import type { Equipo, Ciudad, EstadoFisico } from "../types/inventory"
import { Edit2, Trash2, Eye, Plus, X } from "lucide-react"
import Modal from "react-modal"
import { toast } from "react-toastify"
import EquipoForm from "./EquipoForm"
import { useAuth } from "../hooks/useAuth"
Modal.setAppElement("#root") // importante para accesibilidad

export default function InventoryPage() {
  const { profile } = useAuth()
  const {
    equipos,
    page,
    pageSize,
    total,
    setPage,
    setFilters,
    createEquipo,
    updateEquipo,
    deleteEquipo,
  } = useInventory(50)
  
  // Solo admins pueden crear, editar y eliminar
  const isAdmin = profile?.rol === "admin"

  // Filtros
  const [search, setSearch] = useState("")
  const [ciudad, setCiudad] = useState<null | Ciudad>(null)
  const [estado, setEstado] = useState<null | EstadoFisico>(null)
  const [tipoActivo, setTipoActivo] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"crear" | "editar" | "ver" | "eliminar">("ver")
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null)

  // Ref para el debounce de búsqueda
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPages = Math.ceil(total / pageSize)

  // Detectar si hay filtros activos
  const hasActiveFilters = search || ciudad || estado || tipoActivo

  // Aplicar filtros en tiempo real
  const applyFiltersRealTime = (searchValue: string, ciudadValue: Ciudad | null, estadoValue: EstadoFisico | null, tipoValue: string) => {
    setFilters({
      search: searchValue || undefined,
      ciudad: ciudadValue || undefined,
      estado: estadoValue || undefined,
      tipoActivo: tipoValue || undefined,
    })
    setPage(1)
  }

  // Debounce para la búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      applyFiltersRealTime(search, ciudad, estado, tipoActivo)
    }, 500) // 500ms de espera antes de buscar

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [search])

  // Aplicar filtros cuando cambian otros filtros (sin debounce)
  useEffect(() => {
    applyFiltersRealTime(search, ciudad, estado, tipoActivo)
  }, [ciudad, estado, tipoActivo])

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearch("")
    setCiudad(null)
    setEstado(null)
    setTipoActivo("")
    toast.info("Filtros eliminados")
  }

  const openModal = (type: "crear" | "editar" | "ver" | "eliminar", equipo?: Equipo) => {
    setModalType(type)
    setSelectedEquipo(equipo || null)
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)

  const handleDelete = async () => {
    if (!selectedEquipo) return
    await deleteEquipo(selectedEquipo.numero_serie)
    toast.success("Registro desactivado")
    closeModal()
  }

  const handleSave = async (equipo: Partial<Equipo>) => {
    try {
      if (modalType === "crear") {
        await createEquipo(equipo)
        toast.success("Registro creado")
      } else if (modalType === "editar" && selectedEquipo) {
        await updateEquipo(selectedEquipo.numero_serie, equipo)
        toast.success("Registro actualizado")
      }
      closeModal()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Sistema de Inventario
          </h1>
          <p className="text-gray-600 mt-2">Gestiona tu inventario de equipos tecnológicos</p>
        </div>

        {/* Filtros y buscador */}
        <div className="mb-6 bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código o número de serie..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  title="Limpiar búsqueda"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <select
              value={ciudad || ""}
              onChange={(e) =>
                setCiudad(e.target.value ? (e.target.value as Ciudad) : null)
              }
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">Filtrar por ciudad</option>
              <option value="AMBATO">AMBATO</option>
              <option value="QUITO">QUITO</option>
              <option value="CUENCA">CUENCA</option>
              <option value="GUAYAQUIL">GUAYAQUIL</option>
              <option value="PORTOVIEJO">PORTOVIEJO</option>
            </select>
            <select
              value={estado || ""}
              onChange={(e) =>
                setEstado(e.target.value ? (e.target.value as EstadoFisico) : null)
              }
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">Filtrar por estado</option>
              <option value="BUENO">BUENO</option>
              <option value="REGULAR">REGULAR</option>
              <option value="MALO">MALO</option>
              <option value="BAJA">BAJA</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <input
              type="text"
              value={tipoActivo}
              onChange={(e) => setTipoActivo(e.target.value)}
              placeholder="Filtrar por tipo de activo"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
              >
                <X size={18} /> Limpiar Filtros
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => openModal("crear")}
                className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
              >
                <Plus size={18} /> Nuevo Equipo
              </button>
            )}

          </div>

          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              ✓ Filtros activos aplicándose en tiempo real
            </div>
          )}
        </div>

        {/* Total de registros */}
        <div className="mb-4 text-lg font-semibold text-gray-700">
          Total de registros: <span className="text-blue-600">{total}</span>
        </div>

        {/* Tabla con responsividad */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[700px] sm:max-h-screen">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Tipo</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Marca</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Modelo</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Código</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">N° Serie</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Ubicación</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">RAM</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Almacenamiento</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">SO</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Equipo</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">IP</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Estado</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Accesorios</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Notas</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Cédula</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Ciudad</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equipos.map((equipo, index) => (
                  <tr
                    key={equipo.numero_serie}
                    className="border-b border-gray-200 hover:bg-blue-50 transition"
                  >
                    <td className="px-3 py-4 text-sm text-gray-700 font-medium">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600">{equipo.tipo_activo}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{equipo.marca}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{equipo.modelo}</td>
                    <td className="px-3 py-4 text-sm font-mono text-gray-600">{equipo.codigo_bien}</td>
                    <td className="px-3 py-4 text-sm font-mono text-gray-600">{equipo.numero_serie}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{equipo.ubicacion_bien}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{equipo.memoria_ram}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{equipo.almacenamiento}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{equipo.sistema_operativo}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{equipo.nombre_equipo}</td>
                    <td className="px-3 py-4 text-sm font-mono text-gray-600">{equipo.direccion_ip}</td>
                    <td className="px-3 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        equipo.estado_fisico === "BUENO" ? "bg-green-100 text-green-800" :
                        equipo.estado_fisico === "REGULAR" ? "bg-yellow-100 text-yellow-800" :
                        equipo.estado_fisico === "MALO" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {equipo.estado_fisico}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600">{equipo.accesorios}</td>
                    <td className="px-3 py-4 text-sm text-gray-600 max-w-xs truncate">{equipo.observaciones}</td>
                    <td className="px-3 py-4 text-sm font-mono text-gray-600">{equipo.cedula_funcionario}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{equipo.ciudad}</td>

                    {/* Acciones */}
                    <td className="px-3 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          title="Ver detalles"
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                          onClick={() => openModal("ver", equipo)}
                        >
                          <Eye size={18} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              title="Editar"
                              className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition"
                              onClick={() => openModal("editar", equipo)}
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              title="Desactivar"
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                              onClick={() => openModal("eliminar", equipo)}
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row justify-center items-center mt-6 gap-3 flex-wrap">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition font-medium"
          >
            Primera
          </button>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition font-medium"
          >
            Anterior
          </button>

          <span className="text-gray-700 font-medium">Página {page} de {totalPages}</span>

          <input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="border border-gray-300 px-3 py-2 w-20 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition font-medium"
          >
            Siguiente
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition font-medium"
          >
            Última
          </button>
        </div>
      </div>

      {/* Modales */}
      <Modal
        isOpen={modalOpen}
        onRequestClose={closeModal}
        className="outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 sm:p-0 animate-fade-in"
        style={{
          overlay: {
            animation: "fadeIn 0.2s ease-in-out",
          },
          content: {
            animation: "slideUp 0.3s ease-out",
          },
        }}
      >
        {/* Modal Ver Detalles */}
        {modalType === "ver" && selectedEquipo && (
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Detalles del Equipo</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información General */}
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Información Física
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Tipo de Activo</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedEquipo.tipo_activo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Marca</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedEquipo.marca}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Modelo</p>
                      <p className="text-sm text-gray-900">{selectedEquipo.modelo || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Número de Serie</p>
                      <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">{selectedEquipo.numero_serie}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Identificación
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Código Bien</p>
                      <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">{selectedEquipo.codigo_bien}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Ubicación</p>
                      <p className="text-sm text-gray-900">{selectedEquipo.ubicacion_bien || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Estado Físico</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedEquipo.estado_fisico === "BUENO" ? "bg-green-100 text-green-800" :
                        selectedEquipo.estado_fisico === "REGULAR" ? "bg-yellow-100 text-yellow-800" :
                        selectedEquipo.estado_fisico === "MALO" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {selectedEquipo.estado_fisico}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Especificaciones Técnicas */}
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Especificaciones Técnicas
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">RAM</p>
                      <p className="text-sm text-gray-900">{selectedEquipo.memoria_ram || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Almacenamiento</p>
                      <p className="text-sm text-gray-900">{selectedEquipo.almacenamiento || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Sistema Operativo</p>
                      <p className="text-sm text-gray-900">{selectedEquipo.sistema_operativo || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuración de Red */}
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Configuración de Red
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Nombre del Equipo</p>
                      <p className="text-sm text-gray-900 font-mono">{selectedEquipo.nombre_equipo || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Dirección IP</p>
                      <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">{selectedEquipo.direccion_ip || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="space-y-4 md:col-span-2">
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Información Adicional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Accesorios</p>
                      <p className="text-sm text-gray-900">{selectedEquipo.accesorios || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Cédula del Funcionario</p>
                      <p className="text-sm text-gray-900 font-mono">{selectedEquipo.cedula_funcionario}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Ciudad</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedEquipo.ciudad}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Observaciones</p>
                      <p className="text-sm text-gray-900">{selectedEquipo.observaciones || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 font-medium"
                onClick={closeModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal Eliminar/Desactivar */}
        {modalType === "eliminar" && selectedEquipo && (
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl animate-slideUp">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-lg mb-4">
              <Trash2 className="text-red-600" size={24} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Confirmar Desactivación
            </h2>
            <p className="text-gray-600 text-center text-sm mb-6">
              ¿Está seguro de que desea desactivar este registro?
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Número de Serie</p>
                <p className="text-sm font-mono font-semibold text-gray-900">
                  {selectedEquipo.numero_serie}
                </p>
                <p className="text-xs text-gray-500 mt-2">{selectedEquipo.marca} {selectedEquipo.modelo}</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mb-6">
              Esta acción desactivará el registro. Puede reactivarlo posteriormente si es necesario.
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 font-medium"
                onClick={handleDelete}
              >
                Desactivar
              </button>
            </div>
          </div>
        )}

        {/* Modal Crear/Editar */}
        {(modalType === "crear" || (modalType === "editar" && selectedEquipo)) && (
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            <EquipoForm
              equipo={selectedEquipo || null}
              onCancel={closeModal}
              onSave={handleSave}
            />
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-in-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}