import { useState, useEffect } from 'react';
import { X, Save, Printer, User, Car, Wrench, Calendar, DollarSign, FileText } from 'lucide-react';
import { supabase } from '../config/supabase';
import './ModalDetalleOrden.css';

const ModalDetalleOrden = ({ orden, tipoOrden, onClose, soloLectura = false }) => {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEditados, setDatosEditados] = useState({ ...orden });
  const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);
  const [cargandoArchivos, setCargandoArchivos] = useState(false);

  useEffect(() => {
    cargarArchivos();
  }, [orden.id]);

  const cargarArchivos = async () => {
    setCargandoArchivos(true);
    try {
      const tabla = tipoOrden === 'taller' ? 'recepcion_vehiculos' : 'recepcion_laboratorio';
      const campoId = tipoOrden === 'taller' ? 'recepcion_vehiculo_id' : 'recepcion_laboratorio_id';

      const { data, error } = await supabase
        .from('archivos')
        .select('*')
        .eq(campoId, orden.id);

      if (error) {
        console.warn('No se pudieron cargar archivos:', error.message);
        setArchivosAdjuntos([]);
      } else {
        setArchivosAdjuntos(data || []);
      }
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      setArchivosAdjuntos([]);
    } finally {
      setCargandoArchivos(false);
    }
  };

  const handleChange = (campo, valor) => {
    setDatosEditados(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleGuardar = () => {
    onGuardar(datosEditados);
    setModoEdicion(false);
  };

  const handleImprimir = () => {
    window.print();
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

  const getEstadoTexto = (estado) => {
    const estados = {
      'pendiente': 'Recepcionado',
      'en_proceso': 'En Diagnóstico',
      'en_revision': 'En Revisión',
      'diagnosticado': 'Diagnosticado',
      'reparando': 'En Reparación',
      'completado': 'Completado',
      'entregado': 'Entregado'
    };
    return estados[estado] || estado;
  };

  const nombreCliente = orden.nombre_cliente || orden.cliente?.nombre_completo || '-';
  const telefonoCliente = orden.telefono_cliente || orden.cliente?.telefono || '-';
  const emailCliente = orden.email_cliente || orden.cliente?.email || '-';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <h2>{orden.orden_numero}</h2>
            <span className={`estado-badge estado-${orden.estado}`}>
              {getEstadoTexto(orden.estado)}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">

          {/* Información del Cliente */}
          <section className="modal-section">
            <div className="section-header">
              <User size={20} />
              <h3>Información del Cliente</h3>
            </div>
            <div className="info-grid">
              <div className="info-item"><label>Nombre:</label><span>{nombreCliente}</span></div>
              <div className="info-item"><label>Teléfono:</label><span>{telefonoCliente}</span></div>
              <div className="info-item"><label>Email:</label><span>{emailCliente}</span></div>
            </div>
          </section>

          {/* Información del Vehículo o Pieza */}
          <section className="modal-section">
            <div className="section-header">
              {tipoOrden === 'taller' ? <Car size={20} /> : <Wrench size={20} />}
              <h3>{tipoOrden === 'taller' ? 'Información del Vehículo' : 'Información de la Pieza'}</h3>
            </div>
            <div className="info-grid">
              {tipoOrden === 'taller' ? (
                <>
                  <div className="info-item"><label>Marca:</label><span>{orden.vehiculo?.marca || '-'}</span></div>
                  <div className="info-item"><label>Modelo:</label><span>{orden.vehiculo?.modelo || '-'}</span></div>
                  <div className="info-item"><label>Año:</label><span>{orden.vehiculo?.año || '-'}</span></div>
                  <div className="info-item"><label>Placa:</label><span className="placa-badge">{orden.vehiculo?.placa || '-'}</span></div>
                  <div className="info-item"><label>VIN:</label><span>{orden.vehiculo?.vin || '-'}</span></div>
                  <div className="info-item"><label>Kilometraje:</label><span>{orden.kilometraje ? `${orden.kilometraje} km` : '-'}</span></div>
                </>
              ) : (
                <>
                  <div className="info-item"><label>Tipo de Pieza:</label><span>{orden.tipo_pieza || '-'}</span></div>
                  <div className="info-item"><label>Marca:</label><span>{orden.marca_pieza || '-'}</span></div>
                  <div className="info-item"><label>Modelo Origen:</label><span>{orden.modelo_origen || '-'}</span></div>
                  <div className="info-item"><label>Número de Parte:</label><span>{orden.numero_parte || '-'}</span></div>
                  <div className="info-item"><label>Condición:</label><span>{orden.condicion_pieza || '-'}</span></div>
                  <div className="info-item"><label>Cantidad:</label><span>{orden.cantidad || '1'}</span></div>
                </>
              )}
            </div>
          </section>

          {/* Detalle del Problema */}
          <section className="modal-section">
            <div className="section-header"><FileText size={20} /><h3>Detalle del Problema</h3></div>
            {modoEdicion ? (
              <textarea className="edit-textarea" value={datosEditados.descripcion_problema || ''} onChange={(e) => handleChange('descripcion_problema', e.target.value)} rows="4" />
            ) : (
              <p className="problema-texto">{orden.descripcion_problema || 'Sin descripción'}</p>
            )}
          </section>

          {/* Observaciones Iniciales */}
          {(orden.observaciones_iniciales || modoEdicion) && (
            <section className="modal-section">
              <div className="section-header"><FileText size={20} /><h3>Observaciones Iniciales</h3></div>
              {modoEdicion ? (
                <textarea className="edit-textarea" value={datosEditados.observaciones_iniciales || ''} onChange={(e) => handleChange('observaciones_iniciales', e.target.value)} rows="3" />
              ) : (
                <p className="problema-texto">{orden.observaciones_iniciales}</p>
              )}
            </section>
          )}

          {/* Diagnóstico */}
          {(orden.diagnostico_tecnico || modoEdicion) && (
            <section className="modal-section">
              <div className="section-header"><Wrench size={20} /><h3>Diagnóstico del Técnico</h3></div>
              {modoEdicion ? (
                <textarea className="edit-textarea" value={datosEditados.diagnostico_tecnico || ''} onChange={(e) => handleChange('diagnostico_tecnico', e.target.value)} rows="4" />
              ) : (
                <p className="problema-texto">{orden.diagnostico_tecnico}</p>
              )}
            </section>
          )}

          {/* Trabajo Realizado */}
          {(orden.trabajo_realizado || modoEdicion) && (
            <section className="modal-section">
              <div className="section-header"><Wrench size={20} /><h3>Trabajo Realizado</h3></div>
              {modoEdicion ? (
                <textarea className="edit-textarea" value={datosEditados.trabajo_realizado || ''} onChange={(e) => handleChange('trabajo_realizado', e.target.value)} rows="4" />
              ) : (
                <p className="problema-texto">{orden.trabajo_realizado}</p>
              )}
            </section>
          )}

          {/* Técnico Asignado */}
          {orden.mecanico && (
            <section className="modal-section">
              <div className="section-header"><User size={20} /><h3>Técnico Asignado</h3></div>
              <div className="tecnico-info">
                <div className="tecnico-avatar">{orden.mecanico.nombre_completo?.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="tecnico-nombre">{orden.mecanico.nombre_completo}</p>
                  <p className="tecnico-contacto">{orden.mecanico.telefono || 'Sin teléfono'}</p>
                </div>
              </div>
            </section>
          )}

          {/* Costos */}
          <section className="modal-section">
            <div className="section-header"><DollarSign size={20} /><h3>Costos</h3></div>
            <div className="info-grid">
              <div className="info-item">
                <label>Costo Estimado:</label>
                {modoEdicion ? (
                  <input type="number" step="0.01" className="edit-input" value={datosEditados.costo_estimado || ''} onChange={(e) => handleChange('costo_estimado', e.target.value)} />
                ) : (
                  <span className="costo-valor">Bs. {Number(orden.costo_estimado || 0).toFixed(2)}</span>
                )}
              </div>

              <div className="info-item">
                <label>Costo Final:</label>
                {modoEdicion ? (
                  <input type="number" step="0.01" className="edit-input" value={datosEditados.costo_final || ''} onChange={(e) => handleChange('costo_final', e.target.value)} />
                ) : (
                  <span className="costo-valor">{orden.costo_final ? `Bs. ${Number(orden.costo_final).toFixed(2)}` : '-'}</span>
                )}
              </div>
            </div>
          </section>

          {/* Fechas */}
          <section className="modal-section">
            <div className="section-header"><Calendar size={20} /><h3>Fechas</h3></div>
            <div className="info-grid">
              <div className="info-item"><label>Fecha Recepción:</label><span>{formatearFecha(orden.fecha_creacion)}</span></div>
              <div className="info-item"><label>Última Actualización:</label><span>{formatearFecha(orden.ultima_actualizacion)}</span></div>

              {orden.fecha_entrega_estimada && (
                <div className="info-item"><label>Entrega Estimada:</label><span>{formatearFecha(orden.fecha_entrega_estimada)}</span></div>
              )}

              {orden.fecha_entrega && (
                <div className="info-item"><label>Fecha Entrega:</label><span>{formatearFecha(orden.fecha_entrega)}</span></div>
              )}
            </div>
          </section>

          {/* Información Adicional */}
          {(orden.notas_internas || orden.requiere_repuestos) && (
            <section className="modal-section">
              <div className="section-header"><FileText size={20} /><h3>Información Adicional</h3></div>
              <div className="info-grid">
                {orden.requiere_repuestos !== undefined && (
                  <div className="info-item">
                    <label>Repuestos:</label>
                    <span className={orden.requiere_repuestos ? 'badge-warning' : 'badge-success'}>
                      {orden.requiere_repuestos ? 'Sí' : 'No'}
                    </span>
                  </div>
                )}

                {orden.prioridad && (
                  <div className="info-item">
                    <label>Prioridad:</label>
                    <span className={`badge-priority badge-${orden.prioridad}`}>{orden.prioridad.toUpperCase()}</span>
                  </div>
                )}
              </div>

              {orden.notas_internas && (
                <>
                  <label className="label-notas">Notas Internas:</label>
                  {modoEdicion ? (
                    <textarea className="edit-textarea" value={datosEditados.notas_internas || ''} onChange={(e) => handleChange('notas_internas', e.target.value)} rows="2" />
                  ) : (
                    <p className="problema-texto">{orden.notas_internas}</p>
                  )}
                </>
              )}
            </section>
          )}

          {/* Archivos Adjuntos */}
          {archivosAdjuntos.length > 0 && (
            <section className="modal-section">
              <div className="section-header">
                <FileText size={20} />
                <h3>Archivos Adjuntos ({archivosAdjuntos.length})</h3>
              </div>

              {cargandoArchivos ? (
                <p>Cargando archivos...</p>
              ) : (
                <div className="archivos-lista">
                  {archivosAdjuntos.map((archivo, index) => (
                    <a
                      key={archivo.id || index}
                      href={archivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="archivo-item"
                    >
                      <FileText size={16} />
                      <span>{archivo.nombre_archivo || `Archivo ${index + 1}`}</span>
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-print" onClick={handleImprimir}>
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleOrden;
