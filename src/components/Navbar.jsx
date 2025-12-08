import { useState } from 'react';
import { Wrench, Calendar, Newspaper, Car, MessageCircle, User, ChevronDown, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Determinar qué mostrar según el rol
  const isCliente = profile?.rol === 'cliente';
  const isAdmin = profile?.rol === 'admin';
  const isMecanico = profile?.rol === 'mecanico';
  const isAuthenticated = !!user;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-auto">AUTO</span>
          <span className="logo-smart">SMART</span>
        </Link>
        
        <ul className="navbar-menu">
          {/* PARA USUARIOS NO AUTENTICADOS Y CLIENTES */}
          {(!isAuthenticated || isCliente) && (
            <>
              <li className="navbar-item">
                <Wrench size={18} />
                <Link to="/">Inicio</Link>
              </li>
              <li className="navbar-item">
                <Calendar size={18} />
                <Link to="/agendar-cita">Agendar Cita</Link>
              </li>
              <li className="navbar-item">
                <Newspaper size={18} />
                <Link to="/noticias">Noticias</Link>
              </li>
              <li className="navbar-item">
                <MessageCircle size={18} />
                <a href="https://wa.me/59167522948" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </li>
            </>
          )}

          {/* PARA ADMIN Y MECÁNICO - SOLO SERVICIO TALLER */}
          {(isAdmin || isMecanico) && (
            <li 
              className="navbar-item dropdown"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <Car size={18} />
              <Link to="/servicio-taller">Servicio Taller</Link>
              <ChevronDown size={16} className="dropdown-icon" />
              
              {dropdownOpen && (
                <div className="dropdown-menu">
                  {isAdmin && (
                    <>
                      <Link to="/servicio-taller" className="dropdown-item">Recepción Vehículo</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Recepción Laboratorio</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Diagnóstico Técnico</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Diagnóstico con IA</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Cotizaciones</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Órdenes de Trabajo</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Kanban de Tareas</Link>
                      <Link to="/servicio-taller" className="dropdown-item">KPIs Taller</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Inventario Interno</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Gestión de Usuarios</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Configuración Taller</Link>
                    </>
                  )}
                  {isMecanico && (
                    <>
                      <Link to="/servicio-taller" className="dropdown-item">Kanban de Tareas</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Diagnóstico Técnico</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Diagnóstico con IA</Link>
                      <Link to="/servicio-taller" className="dropdown-item">Órdenes de Trabajo</Link>
                    </>
                  )}
                </div>
              )}
            </li>
          )}

          {/* PERFIL O LOGIN */}
          {isAuthenticated ? (
            <li className="navbar-item dropdown" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
              <User size={18} />
              <span>{profile?.nombre_completo?.split(' ')[0] || 'Usuario'}</span>
              <ChevronDown size={16} className="dropdown-icon" />
              
              {dropdownOpen && (
                <div className="dropdown-menu">
                  {isCliente && (
                    <Link to="/perfil" className="dropdown-item">Mi Perfil</Link>
                  )}
                  <button onClick={handleLogout} className="dropdown-item logout-btn">
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li className="navbar-item">
              <User size={18} />
              <Link to="/login">Iniciar Sesión</Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;