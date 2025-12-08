import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.nombreCompleto,
        formData.telefono
      );

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este correo ya está registrado');
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      if (data) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError('Error al registrarse. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <span className="logo-auto">AUTO</span>
            <span className="logo-smart">SMART</span>
          </div>

          <h1 className="auth-title">Crear Cuenta</h1>
          <p className="auth-subtitle">Regístrate como cliente</p>

          {/* Success Alert */}
          {success && (
            <div className="auth-alert success">
              <CheckCircle size={20} />
              <span>¡Cuenta creada exitosamente! Redirigiendo...</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="auth-alert error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>
                <User size={18} />
                Nombre Completo
              </label>
              <input
                type="text"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Mail size={18} />
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Phone size={18} />
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="75123456"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={18} />
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={18} />
                Confirmar Contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-auth-primary"
              disabled={loading || success}
            >
              {loading ? (
                'Creando cuenta...'
              ) : (
                <>
                  <UserPlus size={20} />
                  Crear Cuenta
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="auth-footer">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="auth-link">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Side Image */}
        <div className="auth-side">
          <div className="auth-side-content">
            <h2>Únete a AutoSmart</h2>
            <p>Gestiona tus vehículos y obtén servicio de calidad</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;