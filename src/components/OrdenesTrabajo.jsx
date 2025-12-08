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
      { id: 'diagnostico-ia', nombre: 'Diagnóstico con IA', icono: <Brain size={20} />, roles: ['admin', 'mecanico'], path: '/servicio-taller' },
      { id: 'cotizaciones', nombre: 'Cotizaciones', icono: <ClipboardList size={20} />, roles: ['admin'], path: '/servicio-taller' },
      { id: 'ordenes-trabajo', nombre: 'Órdenes de Trabajo', icono: <ClipboardList size={20} />, roles: ['admin', 'mecanico'], path: '/taller/ordenes' },
      { id: 'kanban-tareas', nombre: 'Kanban de Tareas', icono: <KanbanIcon size={20} />, roles: ['admin', 'mecanico'], path: '/taller/kanban' },
      { id: 'kpis-taller', nombre: 'KPIs Taller', icono: <KanbanIcon size={20} />, roles: ['admin'], path: '/servicio-taller' },
      { id: 'inventario-interno', nombre: 'Inventario Interno', icono: <KanbanIcon size={20} />, roles: ['admin'], path: '/servicio-taller' },
      { id: 'gestion-usuarios', nombre: 'Gestión de Usuarios', icono: <Users size={20} />, roles: ['admin'], path: '/servicio-taller' },
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
      // Query para TALLER con vehículos
      const { data, error } = await supabase
        .from('recepcion_vehiculos')
        .select(`
          *,
          cliente:perfiles!recepcion_vehiculos_cliente_id_fkey(nombre_completo, telefono, email),
          vehiculo:vehiculos(marca, modelo, placa, año),
          mecanico:perfiles!recepcion_vehiculos_mecanico_asignado_id_fkey(nombre_completo)
        `)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setOrdenes(data || []);
      
    } else {
      // Query para LABORATORIO sin vehículos
      const { data, error } = await supabase
        .from('recepcion_laboratorio')
        .select(`
          *,
          cliente:perfiles!recepcion_laboratorio_cliente_id_fkey(nombre_completo, telefono, email),
          mecanico:perfiles!recepcion_laboratorio_mecanico_asignado_id_fkey(nombre_completo)
        `)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setOrdenes(data || []);
    }
    
  } catch (error) {
    console.error('Error al cargar órdenes:', error);
    alert('Error al cargar las órdenes de trabajo: ' + error.message);
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
    alert('Función de exportar a Excel - Próximamente');
  };

  const imprimirOrden = (orden) => {
    alert(`Imprimir orden: ${orden.orden_numero}`);
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
                <Download size={18} /> Exportar
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
                        <tr key={orden.id} onClick={() => setOrdenSeleccionada(orden)}>
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
                              className="btn-icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                alert('Ver detalles');
                              }}
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              className="btn-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                imprimirOrden(orden);
                              }}
                              title="Imprimir"
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
    </div>
  );
};

export default OrdenesTrabajo;