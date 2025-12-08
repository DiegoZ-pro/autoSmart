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
  Clock,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import ModalDetalleOrden from './ModalDetalleOrden';
import './KanbanTareas.css';

const KanbanTareas = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tipoVista, setTipoVista] = useState('taller');
  const [ordenes, setOrdenes] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  // Configuración de columnas según el tipo de vista
  const columnasTaller = [
    { id: 'pendiente', titulo: 'Recepcionado', color: '#1e40af' },
    { id: 'en_proceso', titulo: 'En Diagnóstico', color: '#0891b2' },
    { id: 'diagnosticado', titulo: 'Aprobado', color: '#0d9488' },
    { id: 'reparando', titulo: 'En Reparación', color: '#ea580c' },
    { id: 'completado', titulo: 'Pruebas Finales', color: '#7c3aed' },
    { id: 'listo_entrega', titulo: 'Listo para Entrega', color: '#16a34a' },
    { id: 'entregado', titulo: 'Entregado', color: '#64748b' }
  ];

  const columnasLaboratorio = [
    { id: 'pendiente', titulo: 'Pieza Recepcionada', color: '#eab308' },
    { id: 'en_revision', titulo: 'En Diagnóstico Lab', color: '#f59e0b' },
    { id: 'esperando_repuestos', titulo: 'Esperando Repuestos', color: '#f97316' },
    { id: 'reparando', titulo: 'Reparación en Lab', color: '#dc2626' },
    { id: 'calibracion', titulo: 'Pruebas y Calibración', color: '#7c3aed' },
    { id: 'completado', titulo: 'Lista para Entrega', color: '#16a34a' },
    { id: 'entregado', titulo: 'Entregado Lab', color: '#64748b' }
  ];

  const columnas = tipoVista === 'taller' ? columnasTaller : columnasLaboratorio;

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

  // Cargar órdenes desde Supabase
  useEffect(() => {
    cargarOrdenes();
  }, [tipoVista]);

  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      const tabla = tipoVista === 'taller' ? 'recepcion_vehiculos' : 'recepcion_laboratorio';
      
      let query;
      
      if (tipoVista === 'taller') {
        // Query para TALLER - incluye vehículo
        query = supabase
          .from(tabla)
          .select(`
            *,
            cliente:perfiles!recepcion_vehiculos_cliente_id_fkey(nombre_completo, telefono, email),
            vehiculo:vehiculos(marca, modelo, placa, año, vin),
            mecanico:perfiles!recepcion_vehiculos_mecanico_asignado_id_fkey(nombre_completo, telefono)
          `);
      } else {
        // Query para LABORATORIO - NO incluye vehículo
        query = supabase
          .from(tabla)
          .select(`
            *,
            cliente:perfiles!recepcion_laboratorio_cliente_id_fkey(nombre_completo, telefono, email),
            mecanico:perfiles!recepcion_laboratorio_mecanico_asignado_id_fkey(nombre_completo, telefono)
          `);
      }

      const { data, error } = await query.order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('Error detallado:', error);
        throw error;
      }

      console.log('Órdenes cargadas:', data);
      setOrdenes(data || []);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      alert('Error al cargar las órdenes de trabajo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar órdenes
  const ordenesFiltradas = ordenes.filter(orden => {
    const textoLower = filtroTexto.toLowerCase();
    return (
      orden.orden_numero?.toLowerCase().includes(textoLower) ||
      orden.nombre_cliente?.toLowerCase().includes(textoLower) ||
      orden.vehiculo?.placa?.toLowerCase().includes(textoLower) ||
      orden.tipo_pieza?.toLowerCase().includes(textoLower)
    );
  });

  // Agrupar órdenes por estado
  const ordenesAgrupadas = columnas.reduce((acc, columna) => {
    acc[columna.id] = ordenesFiltradas.filter(orden => {
      if (tipoVista === 'taller') {
        if (columna.id === 'listo_entrega') {
          return orden.estado === 'completado' && !orden.entregado;
        }
        return orden.estado === columna.id;
      } else {
        if (columna.id === 'esperando_repuestos') {
          return orden.estado === 'diagnosticado' && orden.requiere_repuestos;
        }
        if (columna.id === 'calibracion') {
          return orden.estado === 'completado' && !orden.entregado;
        }
        return orden.estado === columna.id;
      }
    });
    return acc;
  }, {});

  // Drag and Drop handlers
  const handleDragStart = (e, orden) => {
    setDraggedItem(orden);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, nuevoEstado) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const estadoAnterior = draggedItem.estado;
    
    let estadoBD = nuevoEstado;
    if (tipoVista === 'taller') {
      if (nuevoEstado === 'listo_entrega') estadoBD = 'completado';
    } else {
      if (nuevoEstado === 'esperando_repuestos') estadoBD = 'diagnosticado';
      if (nuevoEstado === 'calibracion') estadoBD = 'completado';
    }

    if (estadoAnterior === estadoBD) {
      setDraggedItem(null);
      return;
    }

    try {
      const tabla = tipoVista === 'taller' ? 'recepcion_vehiculos' : 'recepcion_laboratorio';
      
      const updateData = {
        estado: estadoBD,
        ultima_actualizacion: new Date().toISOString()
      };

      if (nuevoEstado === 'entregado') {
        updateData.entregado = true;
      }

      const { error } = await supabase
        .from(tabla)
        .update(updateData)
        .eq('id', draggedItem.id);

      if (error) throw error;

      setOrdenes(prev => prev.map(orden => 
        orden.id === draggedItem.id 
          ? { ...orden, ...updateData }
          : orden
      ));

      await crearNotificacion(draggedItem, estadoBD);

    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado de la orden');
    }

    setDraggedItem(null);
  };

  const crearNotificacion = async (orden, nuevoEstado) => {
    try {
      const mensajes = {
        'pendiente': 'Su orden ha sido recepcionada',
        'en_proceso': 'Estamos realizando el diagnóstico',
        'en_revision': 'Estamos realizando el diagnóstico',
        'diagnosticado': 'Diagnóstico completado',
        'reparando': 'Su vehículo/pieza está en reparación',
        'completado': 'Reparación completada, realizando pruebas finales',
        'entregado': 'Su orden está lista para retirar'
      };

      const { error } = await supabase
        .from('notificaciones')
        .insert({
          usuario_id: orden.cliente_id,
          titulo: `Actualización de orden ${orden.orden_numero}`,
          mensaje: mensajes[nuevoEstado] || 'Estado actualizado',
          tipo: 'info'
        });

      if (error) {
        console.warn('⚠️ No se pudo crear la notificación:', error.message);
      } else {
        console.log('✅ Notificación creada exitosamente');
      }
    } catch (error) {
      console.warn('⚠️ Error al crear notificación:', error);
    }
  };

  const getTiempoTranscurrido = (fecha) => {
    if (!fecha) return 'Sin fecha';
    
    const ahora = new Date();
    const fechaOrden = new Date(fecha);
    const diffMs = ahora - fechaOrden;
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);

    if (diffDias > 0) return `${diffDias}d ${diffHoras % 24}h`;
    return `${diffHoras}h`;
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
          <p>Sección Actual: Kanban</p>
        </div>
      </div>

      <div className="taller-container">
        <aside className="taller-sidebar">
          <h3 className="sidebar-title">Menú Taller</h3>
          <nav className="sidebar-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`sidebar-item ${item.id === 'kanban-tareas' ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.icono}
                <span>{item.nombre}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="taller-content">
          <div className="kanban-container">
            <div className="kanban-controls">
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

            <div className="kanban-filters">
              <div className="search-box">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar OT/OR, cliente..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="search-input"
                />
              </div>
              <button className="filter-btn" onClick={cargarOrdenes}>
                <RefreshCw size={18} /> Actualizar
              </button>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando órdenes...</p>
              </div>
            ) : (
              <div className="kanban-board">
                {columnas.map(columna => (
                  <div
                    key={columna.id}
                    className="kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, columna.id)}
                  >
                    <div 
                      className="column-header"
                      style={{ 
                        backgroundColor: columna.color,
                        color: '#fff'
                      }}
                    >
                      <h3>{columna.titulo} ({ordenesAgrupadas[columna.id]?.length || 0})</h3>
                    </div>

                    <div className="column-content">
                      {ordenesAgrupadas[columna.id]?.length === 0 ? (
                        <div className="empty-column">
                          <p>No hay órdenes en esta etapa.</p>
                        </div>
                      ) : (
                        ordenesAgrupadas[columna.id]?.map(orden => (
                          <div
                            key={orden.id}
                            className="kanban-card"
                            draggable
                            onDragStart={(e) => handleDragStart(e, orden)}
                          >
                            <div className="card-header">
                              <span className="orden-numero">{orden.orden_numero}</span>
                              <span className="tiempo-transcurrido">
                                <Clock size={14} /> {getTiempoTranscurrido(orden.fecha_creacion)}
                              </span>
                            </div>

                            <div className="card-body">
                              <div className="card-info">
                                <span className="info-label">Cliente:</span>
                                <span className="info-value">{orden.nombre_cliente}</span>
                              </div>

                              {tipoVista === 'taller' ? (
                                <>
                                  {orden.vehiculo && (
                                    <div className="card-info">
                                      <span className="info-label">Vehículo:</span>
                                      <span className="info-value">
                                        {orden.vehiculo.marca} {orden.vehiculo.modelo}
                                      </span>
                                    </div>
                                  )}
                                  {orden.vehiculo?.placa && (
                                    <div className="card-info">
                                      <span className="info-label">Placa:</span>
                                      <span className="info-value placa">{orden.vehiculo.placa}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="card-info">
                                    <span className="info-label">Pieza:</span>
                                    <span className="info-value">{orden.tipo_pieza}</span>
                                  </div>
                                  {orden.marca_pieza && (
                                    <div className="card-info">
                                      <span className="info-label">Marca:</span>
                                      <span className="info-value">{orden.marca_pieza}</span>
                                    </div>
                                  )}
                                </>
                              )}

                              {orden.mecanico && (
                                <div className="card-info">
                                  <span className="info-label">Técnico:</span>
                                  <span className="info-value">
                                    <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    {orden.mecanico.nombre_completo}
                                  </span>
                                </div>
                              )}

                              {orden.costo_estimado && (
                                <div className="card-info">
                                  <span className="info-label">Costo est.:</span>
                                  <span className="info-value precio">
                                    Bs. {Number(orden.costo_estimado).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="card-footer">
                              <button 
                                className="card-btn card-btn-view" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModal(orden);
                                }}
                              >
                                <Eye size={16} /> Ver Detalles
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Detalles - Solo lectura */}
      {modalAbierto && ordenSeleccionada && (
        <ModalDetalleOrden
          orden={ordenSeleccionada}
          tipoOrden={tipoVista}
          onClose={cerrarModal}
          soloLectura={true}
        />
      )}
    </div>
  );
};

export default KanbanTareas;