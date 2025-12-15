import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Send, 
  Check, 
  X, 
  MessageCircle,
  Download,
  Edit,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { generarPDFCotizacion } from './pdfGenerator';
import './Cotizaciones.css';

const Cotizaciones = () => {
  const { profile } = useAuth();
  const [vista, setVista] = useState('lista'); // 'lista', 'crear', 'editar'
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ordenesDisponibles, setOrdenesDisponibles] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: '',
    estado: ''
  });

  // Datos del formulario de cotización
  const [formCotizacion, setFormCotizacion] = useState({
    items_cotizacion: [],
    mano_de_obra: 0,
    valida_hasta: '',
    terminos_condiciones: `TÉRMINOS Y CONDICIONES:

1. Esta cotización tiene validez de 15 días calendario desde la fecha de emisión.
2. Los precios están expresados en Bolivianos (Bs.)
3. Los precios incluyen mano de obra y repuestos especificados.
4. Cualquier trabajo adicional será cotizado por separado.
5. El pago puede realizarse en efectivo, transferencia bancaria o tarjeta.
6. Se requiere un anticipo del 50% para iniciar los trabajos.
7. El tiempo de entrega puede variar según disponibilidad de repuestos.
8. La garantía de los trabajos es de 30 días o 1000 km, lo que ocurra primero.`
  });

  // Item temporal para agregar
  const [nuevoItem, setNuevoItem] = useState({
    descripcion: '',
    cantidad: 1,
    precio_unitario: 0
  });

  useEffect(() => {
    cargarCotizaciones();
    cargarOrdenesDisponibles();
  }, []);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  // ============================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================================================

  const cargarOrdenesDisponibles = async () => {
    try {
      // Obtener órdenes de vehículos
      const { data: vehiculos, error: errorVehiculos } = await supabase
        .from('recepcion_vehiculos')
        .select(`
          *,
          cliente:perfiles!recepcion_vehiculos_cliente_id_fkey(nombre_completo, email, telefono),
          mecanico:perfiles!recepcion_vehiculos_mecanico_asignado_id_fkey(nombre_completo),
          vehiculo:vehiculos(marca, modelo, placa)
        `)
        .order('fecha_creacion', { ascending: false });

      if (errorVehiculos) throw errorVehiculos;

      // Obtener órdenes de laboratorio
      const { data: laboratorio, error: errorLaboratorio } = await supabase
        .from('recepcion_laboratorio')
        .select(`
          *,
          cliente:perfiles!recepcion_laboratorio_cliente_id_fkey(nombre_completo, email, telefono),
          mecanico:perfiles!recepcion_laboratorio_mecanico_asignado_id_fkey(nombre_completo)
        `)
        .order('fecha_creacion', { ascending: false });

      if (errorLaboratorio) throw errorLaboratorio;

      // Combinar y marcar tipo
      const ordenesVehiculos = (vehiculos || []).map(orden => ({
        ...orden,
        tipo_orden: 'vehiculo'
      }));

      const ordenesLaboratorio = (laboratorio || []).map(orden => ({
        ...orden,
        tipo_orden: 'laboratorio'
      }));

      setOrdenesDisponibles([...ordenesVehiculos, ...ordenesLaboratorio]);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      mostrarMensaje('error', 'Error al cargar órdenes disponibles');
    }
  };

  const cargarCotizaciones = async () => {
    setLoading(true);
    try {
      let ordenesVehiculos = [];
      let ordenesLaboratorio = [];

      // Cargar cotizaciones de vehículos
      if (!filtros.tipo || filtros.tipo === 'vehiculo') {
        let query = supabase
          .from('recepcion_vehiculos')
          .select(`
            *,
            cliente:perfiles!recepcion_vehiculos_cliente_id_fkey(nombre_completo, email, telefono),
            mecanico:perfiles!recepcion_vehiculos_mecanico_asignado_id_fkey(nombre_completo),
            vehiculo:vehiculos(marca, modelo, placa)
          `)
          .not('numero_cotizacion', 'is', null);

        if (filtros.estado) query = query.eq('estado_cotizacion', filtros.estado);

        const { data, error } = await query.order('fecha_creacion', { ascending: false });
        
        if (error) throw error;
        ordenesVehiculos = (data || []).map(orden => ({ ...orden, tipo_orden: 'vehiculo' }));
      }

      // Cargar cotizaciones de laboratorio
      if (!filtros.tipo || filtros.tipo === 'laboratorio') {
        let query = supabase
          .from('recepcion_laboratorio')
          .select(`
            *,
            cliente:perfiles!recepcion_laboratorio_cliente_id_fkey(nombre_completo, email, telefono),
            mecanico:perfiles!recepcion_laboratorio_mecanico_asignado_id_fkey(nombre_completo)
          `)
          .not('numero_cotizacion', 'is', null);

        if (filtros.estado) query = query.eq('estado_cotizacion', filtros.estado);

        const { data, error } = await query.order('fecha_creacion', { ascending: false });
        
        if (error) throw error;
        ordenesLaboratorio = (data || []).map(orden => ({ ...orden, tipo_orden: 'laboratorio' }));
      }

      setCotizaciones([...ordenesVehiculos, ...ordenesLaboratorio]);
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
      mostrarMensaje('error', 'Error al cargar cotizaciones');
    }
    setLoading(false);
  };

  // ============================================================================
  // FUNCIONES DE MANIPULACIÓN DE COTIZACIONES
  // ============================================================================

  const generarNumeroCotizacion = () => {
    const año = new Date().getFullYear();
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `COT-${año}-${fecha}-${random}`;
  };

  const handleSeleccionarOrden = (orden) => {
    setOrdenSeleccionada(orden);
    
    // Cargar datos existentes si ya tiene cotización
    if (orden.numero_cotizacion) {
      setFormCotizacion({
        items_cotizacion: orden.items_cotizacion || [],
        mano_de_obra: orden.mano_de_obra || 0,
        valida_hasta: orden.valida_hasta || '',
        terminos_condiciones: orden.terminos_condiciones || formCotizacion.terminos_condiciones
      });
      setVista('editar');
    } else {
      // Nueva cotización
      setFormCotizacion({
        ...formCotizacion,
        items_cotizacion: [],
        mano_de_obra: 0
      });
      setVista('crear');
    }
  };

  const agregarItem = () => {
    if (!nuevoItem.descripcion || nuevoItem.cantidad <= 0 || nuevoItem.precio_unitario <= 0) {
      mostrarMensaje('error', 'Complete todos los campos del item');
      return;
    }

    const subtotal = nuevoItem.cantidad * nuevoItem.precio_unitario;
    
    setFormCotizacion(prev => ({
      ...prev,
      items_cotizacion: [
        ...prev.items_cotizacion,
        { ...nuevoItem, subtotal }
      ]
    }));

    setNuevoItem({
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0
    });
  };

  const eliminarItem = (index) => {
    setFormCotizacion(prev => ({
      ...prev,
      items_cotizacion: prev.items_cotizacion.filter((_, i) => i !== index)
    }));
  };

  const calcularTotales = () => {
    const subtotal = formCotizacion.items_cotizacion.reduce(
      (acc, item) => acc + (parseFloat(item.subtotal) || 0),
      0
    );
    const manoDeObra = parseFloat(formCotizacion.mano_de_obra) || 0;
    const total = subtotal + manoDeObra;

    return { subtotal, manoDeObra, total };
  };

  const guardarCotizacion = async () => {
    if (!ordenSeleccionada) {
      mostrarMensaje('error', 'Debe seleccionar una orden');
      return;
    }

    if (formCotizacion.items_cotizacion.length === 0) {
      mostrarMensaje('error', 'Debe agregar al menos un item');
      return;
    }

    setLoading(true);
    try {
      const tabla = ordenSeleccionada.tipo_orden === 'vehiculo' 
        ? 'recepcion_vehiculos' 
        : 'recepcion_laboratorio';
      
      const totales = calcularTotales();
      
      // Generar número de cotización si no existe
      let numeroCotizacion = ordenSeleccionada.numero_cotizacion;
      if (!numeroCotizacion) {
        numeroCotizacion = generarNumeroCotizacion();
      }

      // Preparar datos para actualización
      const updateData = {
        items_cotizacion: formCotizacion.items_cotizacion,
        mano_de_obra: totales.manoDeObra,
        subtotal: totales.subtotal,
        costo_estimado: totales.total,
        costo_final: formCotizacion.estado_cotizacion === 'aprobada' ? totales.total : null,
        estado_cotizacion: 'pendiente',
        valida_hasta: formCotizacion.valida_hasta,
        terminos_condiciones: formCotizacion.terminos_condiciones,
        numero_cotizacion: numeroCotizacion,
        ultima_actualizacion: new Date().toISOString()
      };

      const { error } = await supabase
        .from(tabla)
        .update(updateData)
        .eq('id', ordenSeleccionada.id);

      if (error) throw error;

      mostrarMensaje('exito', 'Cotización guardada exitosamente');
      setVista('lista');
      cargarCotizaciones();
      cargarOrdenesDisponibles();
      setOrdenSeleccionada(null);
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      mostrarMensaje('error', 'Error al guardar cotización: ' + error.message);
    }
    setLoading(false);
  };

  const enviarPorWhatsApp = async (orden) => {
    const telefono = orden.telefono_cliente || orden.cliente?.telefono;
    if (!telefono) {
      mostrarMensaje('error', 'No hay número de teléfono disponible');
      return;
    }

    try {
      // Construir mensaje de WhatsApp
      const mensaje = `
🔧 *COTIZACIÓN AUTO SMART*

📋 Orden: ${orden.orden_numero}
💰 Total: Bs. ${(parseFloat(orden.costo_estimado) || 0).toFixed(2)}

Válida hasta: ${orden.valida_hasta || 'N/A'}

¡Gracias por confiar en nosotros!
      `.trim();

      // Abrir WhatsApp con el mensaje
      const telefonoLimpio = telefono.replace(/\D/g, '');
      const url = `https://wa.me/591${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
      
      window.open(url, '_blank');

      // Actualizar estado
      const tabla = orden.tipo_orden === 'vehiculo' 
        ? 'recepcion_vehiculos' 
        : 'recepcion_laboratorio';

      await supabase
        .from(tabla)
        .update({
          estado_cotizacion: 'enviada',
          fecha_envio_cotizacion: new Date().toISOString()
        })
        .eq('id', orden.id);

      mostrarMensaje('exito', 'Cotización enviada por WhatsApp');
      cargarCotizaciones();
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al enviar por WhatsApp');
    }
  };

  const aprobarCotizacion = async (orden) => {
    if (!confirm('¿Está seguro de aprobar esta cotización?')) return;

    setLoading(true);
    try {
      const tabla = orden.tipo_orden === 'vehiculo' 
        ? 'recepcion_vehiculos' 
        : 'recepcion_laboratorio';

      const { error } = await supabase
        .from(tabla)
        .update({
          estado_cotizacion: 'aprobada',
          fecha_respuesta_cotizacion: new Date().toISOString(),
          costo_final: orden.costo_estimado
        })
        .eq('id', orden.id);

      if (error) throw error;

      mostrarMensaje('exito', 'Cotización aprobada exitosamente');
      cargarCotizaciones();
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al aprobar cotización');
    }
    setLoading(false);
  };

  const rechazarCotizacion = async (orden) => {
    if (!confirm('¿Está seguro de rechazar esta cotización?')) return;

    setLoading(true);
    try {
      const tabla = orden.tipo_orden === 'vehiculo' 
        ? 'recepcion_vehiculos' 
        : 'recepcion_laboratorio';

      const { error } = await supabase
        .from(tabla)
        .update({
          estado_cotizacion: 'rechazada',
          fecha_respuesta_cotizacion: new Date().toISOString()
        })
        .eq('id', orden.id);

      if (error) throw error;

      mostrarMensaje('exito', 'Cotización rechazada');
      cargarCotizaciones();
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al rechazar cotización');
    }
    setLoading(false);
  };

  const exportarPDF = async (orden) => {
    try {
      setLoading(true);
      mostrarMensaje('info', 'Generando PDF...');
      
      // Cargar archivos/imágenes de la orden
      const { data: archivos, error } = await supabase
        .from('archivos')
        .select('*')
        .eq('tipo_orden', orden.tipo_orden)
        .eq('orden_id', orden.id);
      
      if (error) {
        console.error('Error al cargar archivos:', error);
      }
      
      // Generar PDF con todos los detalles e imágenes
      await generarPDFCotizacion(orden, archivos || []);
      
      mostrarMensaje('exito', '¡PDF generado exitosamente!');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      mostrarMensaje('error', 'Error al generar PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  const getEstadoBadgeClass = (estado) => {
    const clases = {
      'pendiente': 'badge-pendiente',
      'enviada': 'badge-enviada',
      'aprobada': 'badge-aprobada',
      'rechazada': 'badge-rechazada'
    };
    return clases[estado] || 'badge-default';
  };

  const cotizacionesFiltradas = cotizaciones.filter(cot => {
    const coincideBusqueda = !filtros.busqueda || 
      cot.orden_numero?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      cot.numero_cotizacion?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      cot.nombre_cliente?.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    const coincideTipo = !filtros.tipo || cot.tipo_orden === filtros.tipo;
    const coincideEstado = !filtros.estado || cot.estado_cotizacion === filtros.estado;

    return coincideBusqueda && coincideTipo && coincideEstado;
  });

  const totales = calcularTotales();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="cotizaciones-container">
      {/* Mensajes */}
      {mensaje.texto && (
        <div className={`mensaje mensaje-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Header */}
      <div className="cotizaciones-header">
        <h1>
          <FileText size={32} />
          Gestión de Cotizaciones
        </h1>
        
        {vista === 'lista' && (
          <button 
            className="btn-crear-cotizacion"
            onClick={() => setVista('seleccionar')}
          >
            <Plus size={20} />
            Nueva Cotización
          </button>
        )}
      </div>

      {/* VISTA: Lista de Cotizaciones */}
      {vista === 'lista' && (
        <>
          {/* Filtros */}
          <div className="cotizaciones-filtros">
            <div className="filtro-busqueda">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar por orden, cotización o cliente..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              />
            </div>

            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            >
              <option value="">Todos los tipos</option>
              <option value="vehiculo">Vehículos</option>
              <option value="laboratorio">Laboratorio</option>
            </select>

            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="enviada">Enviada</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>

          {/* Tabla de Cotizaciones */}
          <div className="cotizaciones-tabla-container">
            {loading ? (
              <div className="loading-state">Cargando cotizaciones...</div>
            ) : cotizacionesFiltradas.length === 0 ? (
              <div className="empty-state">
                <FileText size={64} />
                <p>No hay cotizaciones disponibles</p>
              </div>
            ) : (
              <table className="cotizaciones-tabla">
                <thead>
                  <tr>
                    <th>N° Cotización</th>
                    <th>Orden</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Válida hasta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacionesFiltradas.map(cot => (
                    <tr key={cot.id}>
                      <td className="font-mono">{cot.numero_cotizacion}</td>
                      <td className="font-mono">{cot.orden_numero}</td>
                      <td>{cot.nombre_cliente}</td>
                      <td>
                        <span className={`badge badge-${cot.tipo_orden}`}>
                          {cot.tipo_orden === 'vehiculo' ? 'Vehículo' : 'Laboratorio'}
                        </span>
                      </td>
                      <td className="font-bold">
                        Bs. {(parseFloat(cot.costo_estimado) || 0).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${getEstadoBadgeClass(cot.estado_cotizacion)}`}>
                          {cot.estado_cotizacion}
                        </span>
                      </td>
                      <td>{cot.valida_hasta || 'N/A'}</td>
                      <td>
                        <div className="acciones-grupo">
                          <button
                            className="btn-icono btn-editar"
                            title="Editar"
                            onClick={() => handleSeleccionarOrden(cot)}
                          >
                            <Edit size={16} />
                          </button>
                          
                          <button
                            className="btn-icono btn-whatsapp"
                            title="Enviar por WhatsApp"
                            onClick={() => enviarPorWhatsApp(cot)}
                          >
                            <MessageCircle size={16} />
                          </button>
                          
                          <button
                            className="btn-icono btn-pdf"
                            title="Exportar PDF"
                            onClick={() => exportarPDF(cot)}
                          >
                            <Download size={16} />
                          </button>

                          {cot.estado_cotizacion === 'enviada' && (
                            <>
                              <button
                                className="btn-icono btn-aprobar"
                                title="Aprobar"
                                onClick={() => aprobarCotizacion(cot)}
                              >
                                <Check size={16} />
                              </button>
                              
                              <button
                                className="btn-icono btn-rechazar"
                                title="Rechazar"
                                onClick={() => rechazarCotizacion(cot)}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* VISTA: Seleccionar Orden */}
      {vista === 'seleccionar' && (
        <div className="seleccionar-orden-container">
          <h2>Seleccione una Orden de Trabajo</h2>
          
          <div className="ordenes-grid">
            {ordenesDisponibles.map(orden => (
              <div 
                key={orden.id}
                className="orden-card"
                onClick={() => handleSeleccionarOrden(orden)}
              >
                <div className="orden-card-header">
                  <span className="orden-numero">{orden.orden_numero}</span>
                  <span className={`badge badge-${orden.tipo_orden}`}>
                    {orden.tipo_orden === 'vehiculo' ? 'Vehículo' : 'Laboratorio'}
                  </span>
                </div>
                
                <div className="orden-card-body">
                  <p><strong>Cliente:</strong> {orden.nombre_cliente}</p>
                  {orden.tipo_orden === 'vehiculo' && orden.vehiculo && (
                    <p><strong>Vehículo:</strong> {orden.vehiculo.marca} {orden.vehiculo.modelo}</p>
                  )}
                  {orden.tipo_orden === 'laboratorio' && (
                    <p><strong>Pieza:</strong> {orden.tipo_pieza}</p>
                  )}
                  
                  {orden.numero_cotizacion && (
                    <div className="cotizacion-existente">
                      <FileText size={16} />
                      <span>Ya tiene cotización: {orden.numero_cotizacion}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            className="btn-cancelar"
            onClick={() => setVista('lista')}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* VISTA: Crear/Editar Cotización */}
      {(vista === 'crear' || vista === 'editar') && ordenSeleccionada && (
        <div className="formulario-cotizacion">
          <div className="formulario-header">
            <h2>
              {vista === 'crear' ? 'Nueva Cotización' : 'Editar Cotización'}
            </h2>
            <button 
              className="btn-cancelar"
              onClick={() => {
                setVista('lista');
                setOrdenSeleccionada(null);
              }}
            >
              <X size={20} />
              Cancelar
            </button>
          </div>

          {/* Información de la Orden */}
          <div className="orden-info-section">
            <h3>Información de la Orden</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>N° Orden:</label>
                <span>{ordenSeleccionada.orden_numero}</span>
              </div>
              <div className="info-item">
                <label>Cliente:</label>
                <span>{ordenSeleccionada.nombre_cliente}</span>
              </div>
              <div className="info-item">
                <label>Teléfono:</label>
                <span>{ordenSeleccionada.telefono_cliente}</span>
              </div>
              {ordenSeleccionada.tipo_orden === 'vehiculo' && ordenSeleccionada.vehiculo && (
                <div className="info-item">
                  <label>Vehículo:</label>
                  <span>
                    {ordenSeleccionada.vehiculo.marca} {ordenSeleccionada.vehiculo.modelo}
                    {ordenSeleccionada.vehiculo.placa && ` - ${ordenSeleccionada.vehiculo.placa}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items de Cotización */}
          <div className="items-section">
            <h3>
              <Package size={20} />
              Items de la Cotización
            </h3>

            {/* Agregar Nuevo Item */}
            <div className="agregar-item-form">
              <input
                type="text"
                placeholder="Descripción del item (ej: Cambio de aceite, Filtro de aire)"
                value={nuevoItem.descripcion}
                onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion: e.target.value })}
              />
              <input
                type="number"
                placeholder="Cant. (ej: 1, 2, 3...)"
                min="1"
                value={nuevoItem.cantidad}
                onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: parseFloat(e.target.value) || 0 })}
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Precio Bs. (ej: 150.00)"
                value={nuevoItem.precio_unitario || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permitir solo números y punto decimal
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setNuevoItem({ 
                      ...nuevoItem, 
                      precio_unitario: value === '' ? 0 : parseFloat(value) || 0 
                    });
                  }
                }}
                onBlur={(e) => {
                  // Formatear a 2 decimales cuando pierde el foco
                  const value = parseFloat(e.target.value) || 0;
                  setNuevoItem({ ...nuevoItem, precio_unitario: value });
                }}
              />
              <button 
                className="btn-agregar-item"
                onClick={agregarItem}
              >
                <Plus size={20} />
                Agregar
              </button>
            </div>

            {/* Lista de Items */}
            {formCotizacion.items_cotizacion.length > 0 ? (
              <table className="items-tabla">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {formCotizacion.items_cotizacion.map((item, index) => (
                    <tr key={index}>
                      <td>{item.descripcion}</td>
                      <td>{item.cantidad}</td>
                      <td>Bs. {parseFloat(item.precio_unitario).toFixed(2)}</td>
                      <td>Bs. {parseFloat(item.subtotal).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn-icono btn-eliminar"
                          onClick={() => eliminarItem(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-items">
                <Package size={48} />
                <p>No hay items agregados</p>
              </div>
            )}
          </div>

          {/* Costos */}
          <div className="costos-section">
            <h3>
              <DollarSign size={20} />
              Costos
            </h3>
            
            <div className="costo-item">
              <label>Mano de Obra (Bs.):</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ej: 200.00"
                value={formCotizacion.mano_de_obra || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permitir solo números y punto decimal
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setFormCotizacion({ 
                      ...formCotizacion, 
                      mano_de_obra: value === '' ? 0 : parseFloat(value) || 0 
                    });
                  }
                }}
                onBlur={(e) => {
                  // Formatear a 2 decimales cuando pierde el foco
                  const value = parseFloat(e.target.value) || 0;
                  setFormCotizacion({ ...formCotizacion, mano_de_obra: value });
                }}
              />
            </div>

            <div className="totales-resumen">
              <div className="total-item">
                <span>Subtotal Items:</span>
                <span>Bs. {totales.subtotal.toFixed(2)}</span>
              </div>
              <div className="total-item">
                <span>Mano de Obra:</span>
                <span>Bs. {totales.manoDeObra.toFixed(2)}</span>
              </div>
              <div className="total-item total-final">
                <span>TOTAL:</span>
                <span>Bs. {totales.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Validez */}
          <div className="validez-section">
            <h3>
              <Calendar size={20} />
              Validez de la Cotización
            </h3>
            <input
              type="date"
              value={formCotizacion.valida_hasta}
              onChange={(e) => setFormCotizacion({ 
                ...formCotizacion, 
                valida_hasta: e.target.value 
              })}
            />
          </div>

          {/* Términos y Condiciones */}
          <div className="terminos-section">
            <h3>Términos y Condiciones</h3>
            <textarea
              rows="8"
              value={formCotizacion.terminos_condiciones}
              onChange={(e) => setFormCotizacion({ 
                ...formCotizacion, 
                terminos_condiciones: e.target.value 
              })}
            />
          </div>

          {/* Botones de Acción */}
          <div className="formulario-acciones">
            <button 
              className="btn-guardar"
              onClick={guardarCotizacion}
              disabled={loading}
            >
              <Check size={20} />
              {loading ? 'Guardando...' : 'Guardar Cotización'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;