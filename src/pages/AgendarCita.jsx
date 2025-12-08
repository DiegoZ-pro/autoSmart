import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Phone, Mail, Car, Wrench, ChevronLeft, ChevronRight, CalendarCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import './AgendarCita.css';

const AgendarCita = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    marca: '',
    modelo: '',
    motivo: [],
    detalles: '',
    fecha: null,
    hora: null
  });

  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 9));
  const [selectedDate, setSelectedDate] = useState(11);

  const motivosOptions = [
    'Revisión de Frenos',
    'Problema de Dirección',
    'Mantenimiento General',
    'Diagnóstico Computarizado'
  ];

  const horasDisponibles = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMotivoChange = (motivo) => {
    setFormData(prev => {
      const motivos = prev.motivo.includes(motivo)
        ? prev.motivo.filter(m => m !== motivo)
        : [...prev.motivo, motivo];
      return { ...prev, motivo: motivos };
    });
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day);
    setFormData(prev => ({ ...prev, fecha: day }));
  };

  const handleHoraSelect = (hora) => {
    setFormData(prev => ({ ...prev, hora }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDAR SI ESTÁ LOGUEADO
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { data, error } = await supabase
        .from('citas')
        .insert([{
          cliente_id: user.id,
          nombre_cliente: formData.nombre,
          telefono_cliente: formData.telefono,
          email_cliente: formData.email || null,
          marca_vehiculo: formData.marca,
          modelo_vehiculo: formData.modelo,
          motivo: formData.motivo,
          detalles: formData.detalles || null,
          fecha_cita: `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`,
          hora_cita: formData.hora,
          estado: 'pendiente'
        }]);

      if (error) throw error;

      setMensaje({ 
        tipo: 'exito', 
        texto: '✅ ¡Cita agendada exitosamente! Nos pondremos en contacto pronto.' 
      });

      // Limpiar formulario
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        marca: '',
        modelo: '',
        motivo: [],
        detalles: '',
        fecha: null,
        hora: null
      });
      setSelectedDate(11);

    } catch (error) {
      console.error('Error:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: `❌ Error al agendar cita: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="agendar-cita-page">
      {/* Modal de Login */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <AlertCircle size={48} className="modal-icon" />
            <h2>Inicia Sesión para Continuar</h2>
            <p>Necesitas tener una cuenta para poder agendar una cita.</p>
            <div className="modal-buttons">
              <button 
                onClick={() => navigate('/login')} 
                className="btn-modal-primary"
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="btn-modal-secondary"
              >
                Registrarse
              </button>
            </div>
            <button 
              onClick={() => setShowLoginModal(false)} 
              className="btn-modal-close"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="agendar-header">
        <div className="agendar-header-content">
          <CalendarCheck size={48} className="header-icon" />
          <div className="header-text">
            <h1>Agendar Cita</h1>
            <p>Reserve su cita para nuestros servicios de taller de forma fácil y rápida.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="agendar-container">
        {mensaje.texto && (
          <div className={`mensaje-alert ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="agendar-form">
          {/* Left Column */}
          <div className="form-column">
            <div className="form-section">
              <h2 className="section-title">Información de Contacto y Vehículo</h2>
              <p className="section-subtitle">Complete sus datos y los de su vehículo</p>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <User size={18} />
                    Nombre Completo*
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Juan Pérez"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Phone size={18} />
                    Teléfono*
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Ej: 75123456"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Mail size={18} />
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ejemplo@correo.com"
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Car size={18} />
                    Marca del Vehículo*
                  </label>
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
                  <label>
                    <Car size={18} />
                    Modelo del Vehículo*
                  </label>
                  <input
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleInputChange}
                    placeholder="Ej: Corolla 2020"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Wrench size={18} />
                  Motivo de la Cita*
                </label>
                <div className="checkbox-group">
                  {motivosOptions.map((motivo) => (
                    <label key={motivo} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.motivo.includes(motivo)}
                        onChange={() => handleMotivoChange(motivo)}
                        disabled={loading}
                      />
                      {motivo}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <textarea
                  name="detalles"
                  value={formData.detalles}
                  onChange={handleInputChange}
                  placeholder="Otro motivo o detalles adicionales..."
                  rows="4"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="form-column">
            <div className="form-section">
              <h2 className="section-title">Seleccione Fecha y Hora</h2>
              <p className="section-subtitle">Elija un horario disponible para su cita</p>

              {/* Calendar */}
              <div className="calendar-container">
                <div className="calendar-header">
                  <button type="button" onClick={prevMonth} className="calendar-nav">
                    <ChevronLeft size={20} />
                  </button>
                  <span className="calendar-month">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <button type="button" onClick={nextMonth} className="calendar-nav">
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="calendar-grid">
                  <div className="calendar-weekdays">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="weekday">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {getDaysInMonth(currentMonth).map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`calendar-day ${!day ? 'empty' : ''} ${day === selectedDate ? 'selected' : ''} ${day && day < 11 ? 'disabled' : ''}`}
                        onClick={() => day && day >= 11 && handleDateSelect(day)}
                        disabled={!day || day < 11 || loading}
                      >
                        {day || ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Horas Disponibles */}
              <div className="horas-container">
                <label className="horas-label">Hora Disponible*</label>
                <div className="horas-grid">
                  {horasDisponibles.map((hora) => (
                    <button
                      key={hora}
                      type="button"
                      className={`hora-button ${formData.hora === hora ? 'selected' : ''}`}
                      onClick={() => handleHoraSelect(hora)}
                      disabled={loading}
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" className="submit-button" disabled={loading}>
                <CalendarCheck size={20} />
                {loading ? 'Agendando...' : 'Confirmar Cita'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgendarCita;