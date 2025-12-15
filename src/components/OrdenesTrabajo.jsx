import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Wrench, 
  Microscope, 
  Brain, 
  ClipboardList, 
  Kanban as KanbanIcon, 
  Users, 
  Settings,
  Search,
  RefreshCw,
  Download,
  Printer,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import ModalDetalleOrden from './ModalDetalleOrden';
import * as XLSX from 'xlsx';
import './OrdenesTrabajo.css';

const OrdenesTrabajo = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tipoVista, setTipoVista] = useState('taller');
  const [ordenes, setOrdenes] = useState([]);
  const [filtros, setFiltros] = useState({
    texto: '',
    estado: 'todos',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const estadosTaller = [
    { valor: 'todos', etiqueta: 'Todos los estados' },
    { valor: 'pendiente', etiqueta: 'Recepcionado' },
    { valor: 'en_proceso', etiqueta: 'En Diagnóstico' },
    { valor: 'diagnosticado', etiqueta: 'Aprobado' },
    { valor: 'reparando', etiqueta: 'En Reparación' },
    { valor: 'completado', etiqueta: 'Completado' },
    { valor: 'entregado', etiqueta: 'Entregado' }
  ];

  const estadosLaboratorio = [
    { valor: 'todos', etiqueta: 'Todos los estados' },
    { valor: 'pendiente', etiqueta: 'Recepcionada' },
    { valor: 'en_revision', etiqueta: 'En Diagnóstico' },
    { valor: 'diagnosticado', etiqueta: 'Diagnosticada' },
    { valor: 'reparando', etiqueta: 'En Reparación' },
    { valor: 'completado', etiqueta: 'Completada' },
    { valor: 'entregado', etiqueta: 'Entregada' }
  ];

  const estadosOpciones = tipoVista === 'taller' ? estadosTaller : estadosLaboratorio;

  const getMenuItemsByRole = () => {
    const allItems = [
      { id: 'recepcion-vehiculo', nombre: 'Recepción Vehículo', icono: <Car size={20} />, roles: ['admin'], path: '/servicio-taller' },
      { id: 'recepcion-laboratorio', nombre: 'Recepción Laboratorio', icono: <Microscope size={20} />, roles: ['admin'], path: '/servicio-taller' },
      { id: 'diagnostico-tecnico', nombre: 'Diagnóstico Técnico', icono: <Wrench size={20} />, roles: ['admin', 'mecanico'], path: '/servicio-taller' },
      { id: 'cotizaciones', nombre: 'Cotizaciones', icono: <ClipboardList size={20} />, roles: ['admin'], path: '/servicio-taller' },
      { id: 'ordenes-trabajo', nombre: 'Órdenes de Trabajo', icono: <ClipboardList size={20} />, roles: ['admin', 'mecanico'], path: '/taller/ordenes' },
      { id: 'kanban-tareas', nombre: 'Kanban de Tareas', icono: <KanbanIcon size={20} />, roles: ['admin', 'mecanico'], path: '/taller/kanban' },
      { id: 'diagnostico-ia', nombre: 'Diagnóstico con IA', icono: <Brain size={20} />, roles: ['admin', 'mecanico'], path: '/servicio-taller' },
      { id: 'escaneo', nombre: 'Escaneo 3D', icono: <KanbanIcon size={20} />, roles: ['admin'], path: '/servicio-taller' },
      { id: 'gestion-usuarios', nombre: 'Gestión de Usuarios', icono: <Users size={20} />, roles: ['admin'], path: '/servicio-taller' },
      { id: 'kpis-taller', nombre: 'KPIs Taller', icono: <KanbanIcon size={20} />, roles: ['admin'], path: '/servicio-taller' },
      { id: 'configuracion-taller', nombre: 'Configuración Taller', icono: <Settings size={20} />, roles: ['admin'], path: '/servicio-taller' }
    ];

    return allItems.filter(item => item.roles.includes(profile?.rol));
  };

  const menuItems = getMenuItemsByRole();

  useEffect(() => {
    cargarOrdenes();
  }, [tipoVista]);

  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      const tabla = tipoVista === 'taller' ? 'recepcion_vehiculos' : 'recepcion_laboratorio';
      
      let query;
      
      if (tipoVista === 'taller') {
        query = supabase
          .from(tabla)
          .select(`
            *,
            cliente:perfiles!recepcion_vehiculos_cliente_id_fkey(nombre_completo, telefono, email),
            vehiculo:vehiculos(marca, modelo, placa, año),
            mecanico:perfiles!recepcion_vehiculos_mecanico_asignado_id_fkey(nombre_completo)
          `);
      } else {
        query = supabase
          .from(tabla)
          .select(`
            *,
            cliente:perfiles!recepcion_laboratorio_cliente_id_fkey(nombre_completo, telefono, email),
            mecanico:perfiles!recepcion_laboratorio_mecanico_asignado_id_fkey(nombre_completo)
          `);
      }

      const { data, error } = await query.order('fecha_creacion', { ascending: false });

      if (error) throw error;

      setOrdenes(data || []);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      alert('Error al cargar las órdenes de trabajo');
    } finally {
      setLoading(false);
    }
  };

  const ordenesFiltradas = ordenes.filter(orden => {
    const textoLower = filtros.texto.toLowerCase();
    const cumpleTexto = !filtros.texto || 
      orden.orden_numero?.toLowerCase().includes(textoLower) ||
      orden.nombre_cliente?.toLowerCase().includes(textoLower) ||
      orden.vehiculo?.placa?.toLowerCase().includes(textoLower) ||
      orden.tipo_pieza?.toLowerCase().includes(textoLower);

    const cumpleEstado = filtros.estado === 'todos' || orden.estado === filtros.estado;

    const cumpleFechaDesde = !filtros.fechaDesde || 
      new Date(orden.fecha_creacion) >= new Date(filtros.fechaDesde);

    const cumpleFechaHasta = !filtros.fechaHasta || 
      new Date(orden.fecha_creacion) <= new Date(filtros.fechaHasta);

    return cumpleTexto && cumpleEstado && cumpleFechaDesde && cumpleFechaHasta;
  });

  const getEstadoBadge = (estado) => {
    const colores = {
      'pendiente': '#3b82f6',
      'en_proceso': '#0891b2',
      'en_revision': '#f59e0b',
      'diagnosticado': '#0d9488',
      'reparando': '#ea580c',
      'completado': '#16a34a',
      'entregado': '#64748b'
    };

    const etiquetas = {
      'pendiente': 'Recepcionado',
      'en_proceso': 'En Diagnóstico',
      'en_revision': 'En Revisión',
      'diagnosticado': 'Diagnosticado',
      'reparando': 'En Reparación',
      'completado': 'Completado',
      'entregado': 'Entregado'
    };

    return (
      <span 
        className="estado-badge"
        style={{ backgroundColor: colores[estado] || '#64748b' }}
      >
        {etiquetas[estado] || estado}
      </span>
    );
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportarExcel = () => {
    if (ordenesFiltradas.length === 0) {
      alert('No hay órdenes para exportar');
      return;
    }

    // Preparar datos para Excel
    const datosExcel = ordenesFiltradas.map(orden => {
      const base = {
        'N° Orden': orden.orden_numero,
        'Cliente': orden.nombre_cliente,
        'Teléfono': orden.telefono_cliente || orden.cliente?.telefono || '-',
        'Estado': orden.estado,
        'Técnico': orden.mecanico?.nombre_completo || 'Sin asignar',
        'Costo Estimado': Number(orden.costo_estimado || 0).toFixed(2),
        'Costo Final': orden.costo_final ? Number(orden.costo_final).toFixed(2) : '-',
        'Fecha Recepción': formatearFecha(orden.fecha_creacion),
        'Última Actualización': formatearFecha(orden.ultima_actualizacion)
      };

      if (tipoVista === 'taller') {
        return {
          ...base,
          'Vehículo': orden.vehiculo ? `${orden.vehiculo.marca} ${orden.vehiculo.modelo}` : '-',
          'Placa': orden.vehiculo?.placa || '-',
          'Año': orden.vehiculo?.año || '-',
        };
      } else {
        return {
          ...base,
          'Tipo Pieza': orden.tipo_pieza || '-',
          'Marca Pieza': orden.marca_pieza || '-',
          'Modelo Origen': orden.modelo_origen || '-',
        };
      }
    });

    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tipoVista === 'taller' ? 'Órdenes Taller' : 'Órdenes Laboratorio');

    // Ajustar ancho de columnas
    const maxWidth = 20;
    const wscols = Object.keys(datosExcel[0] || {}).map(() => ({ wch: maxWidth }));
    ws['!cols'] = wscols;

    // Descargar archivo
    const nombreArchivo = `Ordenes_${tipoVista === 'taller' ? 'Taller' : 'Laboratorio'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  const imprimirOrden = (orden) => {
    // Crear ventana de impresión
    const ventanaImpresion = window.open('', '_blank');
    
    const contenidoHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orden de Trabajo - ${orden.orden_numero}</title>
        <style>
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #1e40af;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .orden-numero {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin: 15px 0;
          }
          .seccion {
            margin-bottom: 20px;
          }
          .seccion-titulo {
            background: #f3f4f6;
            padding: 8px 12px;
            font-weight: bold;
            color: #1e40af;
            border-left: 4px solid #1e40af;
            margin-bottom: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
          }
          .info-item {
            padding: 5px 0;
          }
          .info-label {
            font-weight: bold;
            color: #666;
            font-size: 11px;
          }
          .info-value {
            color: #333;
            margin-top: 2px;
          }
          .problema {
            background: #f9fafb;
            padding: 10px;
            border-left: 3px solid #3b82f6;
            margin: 10px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          .firmas {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 50px;
          }
          .firma {
            text-align: center;
          }
          .firma-linea {
            border-top: 1px solid #333;
            margin: 40px 20px 5px 20px;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Taller Freno Centro</h1>
          <p>Sistema de Gestión de Órdenes de Trabajo</p>
        </div>

        <div class="orden-numero">ORDEN: ${orden.orden_numero}</div>

        <div class="seccion">
          <div class="seccion-titulo">INFORMACIÓN DEL CLIENTE</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nombre:</div>
              <div class="info-value">${orden.nombre_cliente || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Teléfono:</div>
              <div class="info-value">${orden.telefono_cliente || orden.cliente?.telefono || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email:</div>
              <div class="info-value">${orden.email_cliente || orden.cliente?.email || '-'}</div>
            </div>
          </div>
        </div>

        ${tipoVista === 'taller' ? `
          <div class="seccion">
            <div class="seccion-titulo">INFORMACIÓN DEL VEHÍCULO</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Marca/Modelo:</div>
                <div class="info-value">${orden.vehiculo ? `${orden.vehiculo.marca} ${orden.vehiculo.modelo}` : '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Placa:</div>
                <div class="info-value">${orden.vehiculo?.placa || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Año:</div>
                <div class="info-value">${orden.vehiculo?.año || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Kilometraje:</div>
                <div class="info-value">${orden.kilometraje ? `${orden.kilometraje} km` : '-'}</div>
              </div>
            </div>
          </div>
        ` : `
          <div class="seccion">
            <div class="seccion-titulo">INFORMACIÓN DE LA PIEZA</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Tipo de Pieza:</div>
                <div class="info-value">${orden.tipo_pieza || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Marca:</div>
                <div class="info-value">${orden.marca_pieza || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Modelo Origen:</div>
                <div class="info-value">${orden.modelo_origen || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Número de Parte:</div>
                <div class="info-value">${orden.numero_parte || '-'}</div>
              </div>
            </div>
          </div>
        `}

        <div class="seccion">
          <div class="seccion-titulo">DESCRIPCIÓN DEL PROBLEMA</div>
          <div class="problema">${orden.descripcion_problema || 'Sin descripción'}</div>
        </div>

        ${orden.diagnostico_tecnico ? `
          <div class="seccion">
            <div class="seccion-titulo">DIAGNÓSTICO TÉCNICO</div>
            <div class="problema">${orden.diagnostico_tecnico}</div>
          </div>
        ` : ''}

        ${orden.trabajo_realizado ? `
          <div class="seccion">
            <div class="seccion-titulo">TRABAJO REALIZADO</div>
            <div class="problema">${orden.trabajo_realizado}</div>
          </div>
        ` : ''}

        <div class="seccion">
          <div class="seccion-titulo">INFORMACIÓN ADICIONAL</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Estado:</div>
              <div class="info-value">${orden.estado}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Técnico Asignado:</div>
              <div class="info-value">${orden.mecanico?.nombre_completo || 'Sin asignar'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Costo Estimado:</div>
              <div class="info-value">Bs. ${Number(orden.costo_estimado || 0).toFixed(2)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Costo Final:</div>
              <div class="info-value">${orden.costo_final ? `Bs. ${Number(orden.costo_final).toFixed(2)}` : 'Pendiente'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fecha de Recepción:</div>
              <div class="info-value">${formatearFecha(orden.fecha_creacion)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Última Actualización:</div>
              <div class="info-value">${formatearFecha(orden.ultima_actualizacion)}</div>
            </div>
          </div>
        </div>

        <div class="firmas">
          <div class="firma">
            <div class="firma-linea"></div>
            <p>Firma del Cliente</p>
          </div>
          <div class="firma">
            <div class="firma-linea"></div>
            <p>Firma del Técnico</p>
          </div>
        </div>

        <div class="footer">
          <p>Taller Freno Centro - Sistema de Gestión Automotriz</p>
          <p>Documento generado el ${new Date().toLocaleDateString('es-BO')} a las ${new Date().toLocaleTimeString('es-BO')}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    ventanaImpresion.document.write(contenidoHTML);
    ventanaImpresion.document.close();
  };

  const abrirModal = (orden) => {
    setOrdenSeleccionada(orden);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setOrdenSeleccionada(null);
  };

  return (
    <div className="servicio-taller-page">
      <div className="taller-header">
        <div className="taller-header-content">
          <h1>Servicio de Taller Freno Centro</h1>
          <p>Sección Actual: Órdenes de Trabajo</p>
        </div>
      </div>

      <div className="taller-container">
        <aside className="taller-sidebar">
          <h3 className="sidebar-title">Menú Taller</h3>
          <nav className="sidebar-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`sidebar-item ${item.id === 'ordenes-trabajo' ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.icono}
                <span>{item.nombre}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="taller-content">
          <div className="ordenes-container">
            <div className="ordenes-controls">
              <div className="vista-toggle">
                <button 
                  className={`toggle-btn ${tipoVista === 'taller' ? 'active taller' : ''}`}
                  onClick={() => setTipoVista('taller')}
                >
                  <Car size={18} /> Taller (OT)
                </button>
                <button 
                  className={`toggle-btn ${tipoVista === 'laboratorio' ? 'active laboratorio' : ''}`}
                  onClick={() => setTipoVista('laboratorio')}
                >
                  <Wrench size={18} /> Laboratorio (OR)
                </button>
              </div>
            </div>

            <div className="ordenes-filters">
              <div className="filter-group">
                <Search size={20} className="filter-icon" />
                <input
                  type="text"
                  placeholder="Buscar por N° orden, cliente, placa..."
                  value={filtros.texto}
                  onChange={(e) => setFiltros({...filtros, texto: e.target.value})}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  className="filter-select"
                >
                  {estadosOpciones.map(opcion => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})}
                  className="filter-input"
                  placeholder="Desde"
                />
              </div>

              <div className="filter-group">
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => setFiltros({...filtros, fechaHasta: e.target.value})}
                  className="filter-input"
                  placeholder="Hasta"
                />
              </div>

              <button onClick={cargarOrdenes} className="action-btn refresh">
                <RefreshCw size={18} /> Actualizar
              </button>

              <button onClick={exportarExcel} className="action-btn export">
                <Download size={18} /> Exportar Excel
              </button>
            </div>

            <div className="ordenes-stats">
              <div className="stat-card">
                <div className="stat-number">{ordenesFiltradas.length}</div>
                <div className="stat-label">Total Órdenes</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {ordenesFiltradas.filter(o => o.estado !== 'entregado').length}
                </div>
                <div className="stat-label">En Proceso</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {ordenesFiltradas.filter(o => o.estado === 'completado').length}
                </div>
                <div className="stat-label">Completadas</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  Bs. {ordenesFiltradas.reduce((sum, o) => sum + (Number(o.costo_estimado) || 0), 0).toFixed(2)}
                </div>
                <div className="stat-label">Total Estimado</div>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando órdenes...</p>
              </div>
            ) : (
              <div className="ordenes-table-container">
                <table className="ordenes-table">
                  <thead>
                    <tr>
                      <th>N° Orden</th>
                      <th>Cliente</th>
                      {tipoVista === 'taller' ? (
                        <>
                          <th>Vehículo</th>
                          <th>Placa</th>
                        </>
                      ) : (
                        <>
                          <th>Tipo Pieza</th>
                          <th>Marca</th>
                        </>
                      )}
                      <th>Estado</th>
                      <th>Técnico</th>
                      <th>Costo Est.</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="empty-table">
                          No se encontraron órdenes con los filtros aplicados
                        </td>
                      </tr>
                    ) : (
                      ordenesFiltradas.map(orden => (
                        <tr key={orden.id}>
                          <td className="orden-numero-col">{orden.orden_numero}</td>
                          <td>
                            <div className="cliente-info">
                              <div className="cliente-nombre">{orden.nombre_cliente}</div>
                              <div className="cliente-tel">{orden.telefono_cliente}</div>
                            </div>
                          </td>
                          {tipoVista === 'taller' ? (
                            <>
                              <td>
                                {orden.vehiculo ? 
                                  `${orden.vehiculo.marca} ${orden.vehiculo.modelo}` : 
                                  '-'
                                }
                              </td>
                              <td>
                                <span className="placa-badge">
                                  {orden.vehiculo?.placa || '-'}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>{orden.tipo_pieza}</td>
                              <td>{orden.marca_pieza || '-'}</td>
                            </>
                          )}
                          <td>{getEstadoBadge(orden.estado)}</td>
                          <td>{orden.mecanico?.nombre_completo || 'Sin asignar'}</td>
                          <td className="costo-col">
                            Bs. {Number(orden.costo_estimado || 0).toFixed(2)}
                          </td>
                          <td className="fecha-col">{formatearFecha(orden.fecha_creacion)}</td>
                          <td className="acciones-col">
                            <button 
                              className="btn-icon btn-icon-view" 
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModal(orden);
                              }}
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              className="btn-icon btn-icon-print"
                              onClick={(e) => {
                                e.stopPropagation();
                                imprimirOrden(orden);
                              }}
                              title="Imprimir PDF"
                            >
                              <Printer size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Detalles - Solo lectura, sin botón imprimir */}
      {modalAbierto && ordenSeleccionada && (
        <ModalDetalleOrden
          orden={ordenSeleccionada}
          tipoOrden={tipoVista}
          onClose={cerrarModal}
          soloLectura={true}
          ocultarImprimir={true}
        />
      )}
    </div>
  );
};

export default OrdenesTrabajo;