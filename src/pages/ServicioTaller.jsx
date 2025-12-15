import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Wrench, 
  Microscope, 
  Brain, 
  ClipboardList, 
  Kanban, 
  Users, 
  CalendarClock,
  Upload,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import './ServicioTaller.css';
import GestionUsuarios from '../components/GestionUsuarios';
import Cotizaciones from '../components/Cotizaciones';

const ServicioTaller = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [seccionActual, setSeccionActual] = useState('recepcion-vehiculo');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [formData, setFormData] = useState({
    nombreCliente: '',
    telefonoCliente: '',
    email: '',
    empresa: '',
    marca: '',
    modelo: '',
    año: '',
    placa: '',
    vin: '',
    detalleProblema: '',
    tipoPieza: '',
    marcaPieza: '',
    modeloOrigen: '',
    numeroParte: '',
    observaciones: '',
    fechaRecepcion: '',
    horaRecepcion: '',
    horaRevision: '',
    fechaDiagnostico: '',
    horaDiagnostico: '',
    fechaEntrega: '',
    horaEntrega: '',
    archivos: []
  });

  const getMenuItemsByRole = () => {
    const allItems = [
      { id: 'recepcion-vehiculo', nombre: 'Recepción Vehículo', icono: <Car size={20} />, roles: ['admin'] },
      { id: 'recepcion-laboratorio', nombre: 'Recepción Laboratorio', icono: <Microscope size={20} />, roles: ['admin'] },
      { id: 'diagnostico-tecnico', nombre: 'Diagnóstico Técnico', icono: <Wrench size={20} />, roles: ['admin', 'mecanico'] },
      { id: 'cotizaciones', nombre: 'Cotizaciones', icono: <ClipboardList size={20} />, roles: ['admin'] },
      { id: 'ordenes-trabajo', nombre: 'Órdenes de Trabajo', icono: <ClipboardList size={20} />, roles: ['admin', 'mecanico'], isRoute: true, path: '/taller/ordenes' },
      { id: 'kanban-tareas', nombre: 'Kanban de Tareas', icono: <Kanban size={20} />, roles: ['admin', 'mecanico'], isRoute: true, path: '/taller/kanban' },
      { id: 'diagnostico-ia', nombre: 'Diagnóstico con IA', icono: <Brain size={20} />, roles: ['admin', 'mecanico'] },
      { id: 'escaneo', nombre: 'Escaneo 3D', icono: <Brain size={20} />, roles: ['admin'] },
      { id: 'gestion-usuarios', nombre: 'Gestión de Usuarios', icono: <Users size={20} />, roles: ['admin'] },
      { id: 'kpis-taller', nombre: 'KPIs Taller', icono: <Kanban size={20} />, roles: ['admin'] },
      { id: 'configuracion-taller', nombre: 'Configuración Taller', icono: <Wrench size={20} />, roles: ['admin'] }
    ];

    return allItems.filter(item => item.roles.includes(profile?.rol));
  };

  const menuItems = getMenuItemsByRole();

  const handleMenuClick = (item) => {
    if (item.isRoute) {
      // Si el item tiene una ruta, navegar en lugar de cambiar estado
      navigate(item.path);
    } else {
      // Si no tiene ruta, cambiar la sección actual como antes
      setSeccionActual(item.id);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, archivos: [...prev.archivos, ...files] }));
  };

  const subirArchivos = async (ordenId, tipoOrden) => {
    const archivosUrls = [];
    
    for (const archivo of formData.archivos) {
      const fileExt = archivo.name.split('.').pop();
      const fileName = `${ordenId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('ordenes')
        .upload(fileName, archivo);

      if (error) {
        console.error('Error subiendo archivo:', error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('ordenes')
        .getPublicUrl(fileName);

      archivosUrls.push({
        nombre_archivo: archivo.name,
        url_archivo: urlData.publicUrl,
        tipo_archivo: archivo.type,
        tamaño: archivo.size
      });
    }

    if (archivosUrls.length > 0) {
      const archivosParaInsertar = archivosUrls.map(archivo => ({
        tipo_orden: tipoOrden,
        orden_id: ordenId,
        ...archivo
      }));

      await supabase
        .from('archivos')
        .insert(archivosParaInsertar);
    }

    return archivosUrls;
  };

  const handleSubmitVehiculo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { data: vehiculoData, error: vehiculoError } = await supabase
        .from('vehiculos')
        .insert([{
          marca: formData.marca,
          modelo: formData.modelo,
          año: formData.año,
          placa: formData.placa,
          vin: formData.vin
        }])
        .select()
        .single();

      if (vehiculoError) throw vehiculoError;

      const { data: ordenNumero } = await supabase
        .rpc('generar_numero_orden', { prefijo: 'VEH' });

      const { data: recepcionData, error: recepcionError } = await supabase
        .from('recepcion_vehiculos')
        .insert([{
          orden_numero: ordenNumero,
          vehiculo_id: vehiculoData.id,
          nombre_cliente: formData.nombreCliente,
          telefono_cliente: formData.telefonoCliente,
          detalle_problema: formData.detalleProblema,
          fecha_recepcion: formData.fechaRecepcion || null,
          hora_recepcion: formData.horaRecepcion || null,
          fecha_diagnostico: formData.fechaDiagnostico || null,
          hora_diagnostico: formData.horaDiagnostico || null,
          fecha_entrega: formData.fechaEntrega || null,
          hora_entrega: formData.horaEntrega || null,
        }])
        .select()
        .single();

      if (recepcionError) throw recepcionError;

      if (formData.archivos.length > 0) {
        await subirArchivos(recepcionData.id, 'vehiculo');
      }

      setMensaje({ 
        tipo: 'exito', 
        texto: `✅ Orden ${ordenNumero} creada exitosamente!` 
      });

      setFormData({
        nombreCliente: '', telefonoCliente: '', email: '', empresa: '',
        marca: '', modelo: '', año: '', placa: '', vin: '',
        detalleProblema: '', tipoPieza: '', marcaPieza: '',
        modeloOrigen: '', numeroParte: '', observaciones: '',
        fechaRecepcion: '', horaRecepcion: '', horaRevision: '',
        fechaDiagnostico: '', horaDiagnostico: '',
        fechaEntrega: '', horaEntrega: '', archivos: []
      });

    } catch (error) {
      console.error('Error:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: `❌ Error al crear la orden: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLaboratorio = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { data: ordenNumero } = await supabase
        .rpc('generar_numero_orden', { prefijo: 'LAB' });

      const { data: recepcionData, error: recepcionError } = await supabase
        .from('recepcion_laboratorio')
        .insert([{
          orden_numero: ordenNumero,
          nombre_cliente: formData.nombreCliente,
          telefono_cliente: formData.telefonoCliente,
          email_cliente: formData.email || null,
          empresa: formData.empresa || null,
          tipo_pieza: formData.tipoPieza,
          marca_pieza: formData.marcaPieza || null,
          modelo_origen: formData.modeloOrigen || null,
          numero_parte: formData.numeroParte || null,
          observaciones: formData.observaciones,
          hora_recepcion: formData.horaRecepcion || null,
          hora_revision: formData.horaRevision || null,
          hora_entrega: formData.horaEntrega || null,
        }])
        .select()
        .single();

      if (recepcionError) throw recepcionError;

      if (formData.archivos.length > 0) {
        await subirArchivos(recepcionData.id, 'laboratorio');
      }

      setMensaje({ 
        tipo: 'exito', 
        texto: `Orden ${ordenNumero} creada exitosamente!` 
      });

      setFormData({
        nombreCliente: '', telefonoCliente: '', email: '', empresa: '',
        marca: '', modelo: '', año: '', placa: '', vin: '',
        detalleProblema: '', tipoPieza: '', marcaPieza: '',
        modeloOrigen: '', numeroParte: '', observaciones: '',
        fechaRecepcion: '', horaRecepcion: '', horaRevision: '',
        fechaDiagnostico: '', horaDiagnostico: '',
        fechaEntrega: '', horaEntrega: '', archivos: []
      });

    } catch (error) {
      console.error('Error:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: `❌ Error al crear la orden: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContenido = () => {
    switch(seccionActual) {
      case 'recepcion-vehiculo':
        return (
          <div className="contenido-seccion">
            <div className="seccion-header">
              <h2>Registrar Nuevo Vehículo</h2>
              <p>Ingrese los datos del vehículo y el problema reportado por el cliente.</p>
            </div>

            {mensaje.texto && (
              <div className={`mensaje-alert ${mensaje.tipo}`}>
                {mensaje.texto}
              </div>
            )}

            <form onSubmit={handleSubmitVehiculo} className="form-servicio">
              <div className="form-section-group">
                <h3>Datos del Cliente</h3>
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Nombre Completo Cliente*</label>
                    <input
                      type="text"
                      name="nombreCliente"
                      value={formData.nombreCliente}
                      onChange={handleInputChange}
                      placeholder="Ej: Juan Pérez"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono Cliente*</label>
                    <input
                      type="tel"
                      name="telefonoCliente"
                      value={formData.telefonoCliente}
                      onChange={handleInputChange}
                      placeholder="Ej: 75123456"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section-group">
                <h3>Datos del Vehículo</h3>
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Marca*</label>
                    <input
                      type="text"
                      name="marca"
                      value={formData.marca}
                      onChange={handleInputChange}
                      placeholder="Ej: Toyota"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Modelo*</label>
                    <input
                      type="text"
                      name="modelo"
                      value={formData.modelo}
                      onChange={handleInputChange}
                      placeholder="Ej: Corolla"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label>Año</label>
                    <input
                      type="text"
                      name="año"
                      value={formData.año}
                      onChange={handleInputChange}
                      placeholder="Ej: 2019"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Placa / Matrícula*</label>
                    <input
                      type="text"
                      name="placa"
                      value={formData.placa}
                      onChange={handleInputChange}
                      placeholder="Ej: ABC-1234"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>VIN (Chasis)</label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleInputChange}
                    placeholder="Número de identificación del vehículo"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-section-group">
                <h3>Descripción del Problema</h3>
                <div className="form-group">
                  <label>Detalle del problema o servicio solicitado*</label>
                  <textarea
                    name="detalleProblema"
                    value={formData.detalleProblema}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Describa detalladamente el problema o servicio que requiere el vehículo..."
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-section-group">
                <h3><CalendarClock size={20} /> Horarios de Gestión</h3>
                
                <p className="subsection-title">Recepción Actual:</p>
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Fecha Recepción</label>
                    <input
                      type="date"
                      name="fechaRecepcion"
                      value={formData.fechaRecepcion}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora Recepción</label>
                    <input
                      type="time"
                      name="horaRecepcion"
                      value={formData.horaRecepcion}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <p className="subsection-title">Diagnóstico Estimado:</p>
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Fecha Est. Diagnóstico</label>
                    <input
                      type="date"
                      name="fechaDiagnostico"
                      value={formData.fechaDiagnostico}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora Est. Diagnóstico</label>
                    <input
                      type="time"
                      name="horaDiagnostico"
                      value={formData.horaDiagnostico}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <p className="subsection-title">Entrega Estimada:</p>
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Fecha Est. Entrega</label>
                    <input
                      type="date"
                      name="fechaEntrega"
                      value={formData.fechaEntrega}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora Est. Entrega</label>
                    <input
                      type="time"
                      name="horaEntrega"
                      value={formData.horaEntrega}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section-group">
                <h3>Adjuntar Imágenes/Documentos</h3>
                <div className="upload-area">
                  <Upload size={40} className="upload-icon" />
                  <p><strong>Subir archivos</strong> o arrastrar y soltar</p>
                  <p className="upload-hint">PNG, JPG, PDF hasta 10MB cada uno</p>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleFileUpload}
                    className="file-input"
                    disabled={loading}
                  />
                </div>
                {formData.archivos.length > 0 && (
                  <div className="archivos-lista">
                    <p>Archivos seleccionados: {formData.archivos.length}</p>
                    <ul>
                      {formData.archivos.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-submit-taller" disabled={loading}>
                <Send size={20} />
                {loading ? 'Creando orden...' : 'Registrar y Crear Orden de Trabajo'}
              </button>
            </form>
          </div>
        );

      case 'recepcion-laboratorio':
        return (
          <div className="contenido-seccion">
            <div className="seccion-header-lab">
              <h2>Recepción de Piezas (Laboratorio)</h2>
              <p>Registre piezas sueltas para diagnóstico y reparación en laboratorio.</p>
            </div>

            {mensaje.texto && (
              <div className={`mensaje-alert ${mensaje.tipo}`}>
                {mensaje.texto}
              </div>
            )}

            <form onSubmit={handleSubmitLaboratorio} className="form-servicio">
              <div className="form-section-group">
                <h3>Datos del Cliente</h3>
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Nombre Completo*</label>
                    <input
                      type="text"
                      name="nombreCliente"
                      value={formData.nombreCliente}
                      onChange={handleInputChange}
                      placeholder="Ej: Juan Pérez"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono*</label>
                    <input
                      type="tel"
                      name="telefonoCliente"
                      value={formData.telefonoCliente}
                      onChange={handleInputChange}
                      placeholder="Ej: 75123456"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="ejemplo@correo.com"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Empresa (Opcional)</label>
                    <input
                      type="text"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleInputChange}
                      placeholder="Nombre de la empresa"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section-group">
                <h3>Datos de la Pieza</h3>
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Tipo de Pieza*</label>
                    <input
                      type="text"
                      name="tipoPieza"
                      value={formData.tipoPieza}
                      onChange={handleInputChange}
                      placeholder="Ej: Bomba hidráulica, Cremallera"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Marca de la Pieza</label>
                    <input
                      type="text"
                      name="marcaPieza"
                      value={formData.marcaPieza}
                      onChange={handleInputChange}
                      placeholder="Ej: Bosch, TRW"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label>Modelo Vehículo Origen</label>
                    <input
                      type="text"
                      name="modeloOrigen"
                      value={formData.modeloOrigen}
                      onChange={handleInputChange}
                      placeholder="Ej: Toyota Hilux 2015"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Parte (Si aplica)</label>
                    <input
                      type="text"
                      name="numeroParte"
                      value={formData.numeroParte}
                      onChange={handleInputChange}
                      placeholder="Código de la pieza"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Observaciones del Cliente / Falla Reportada*</label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Describa detalladamente la falla o problema reportado por el cliente..."
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-section-group">
                <h3><CalendarClock size={20} /> Horarios Estimados</h3>
                
                <div className="form-row-three">
                  <div className="form-group">
                    <label>Hora Recepción</label>
                    <input
                      type="time"
                      name="horaRecepcion"
                      value={formData.horaRecepcion}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora Estimada Revisión</label>
                    <input
                      type="time"
                      name="horaRevision"
                      value={formData.horaRevision}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora Estimada Entrega</label>
                    <input
                      type="time"
                      name="horaEntrega"
                      value={formData.horaEntrega}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <p className="info-note">
                  Estos horarios son referenciales y se confirmarán tras la revisión técnica.
                </p>
              </div>

              <div className="form-section-group">
                <h3>Adjuntar Imágenes/Videos de la Pieza</h3>
                <div className="upload-area">
                  <Upload size={40} className="upload-icon" />
                  <p><strong>Subir archivos</strong> o arrastrar y soltar</p>
                  <p className="upload-hint">PNG, JPG, MP4 hasta 10MB cada uno</p>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.mp4"
                    onChange={handleFileUpload}
                    className="file-input"
                    disabled={loading}
                  />
                </div>
                {formData.archivos.length > 0 && (
                  <div className="archivos-lista">
                    <p>Archivos seleccionados: {formData.archivos.length}</p>
                    <ul>
                      {formData.archivos.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-submit-taller" disabled={loading}>
                <Send size={20} />
                {loading ? 'Creando orden...' : 'Registrar Pieza y Crear Orden de Recepción'}
              </button>
            </form>
          </div>
        );

      case 'gestion-usuarios':
        return <GestionUsuarios />;

      case 'cotizaciones':
        return <Cotizaciones />;  
      
      default:
        return (
          <div className="contenido-seccion">
            <div className="seccion-header">
              <h2>Próximamente</h2>
              <p>Esta sección está en desarrollo.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="servicio-taller-page">
      <div className="taller-header">
        <div className="taller-header-content">
          <h1>Servicio de Taller</h1>
          <p>Sección Actual: {menuItems.find(item => item.id === seccionActual)?.nombre}</p>
        </div>
      </div>

      <div className="taller-container">
        <aside className="taller-sidebar">
          <h3 className="sidebar-title">Menú Taller</h3>
          <nav className="sidebar-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`sidebar-item ${seccionActual === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item)}
              >
                {item.icono}
                <span>{item.nombre}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="taller-content">
          {renderContenido()}
        </main>
      </div>
    </div>
  );
};

export default ServicioTaller;