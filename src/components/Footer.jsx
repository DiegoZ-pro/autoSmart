import { Facebook, Instagram, Youtube, MapPin, Phone, Mail, Clock } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-logo">
            <span className="logo-auto">AUTO</span>
            <span className="logo-smart">SMART</span>
          </div>
          <p className="footer-description">
            Especialistas en autopartes y servicios automotrices. Tu seguridad es nuestra prioridad.
          </p>
          <div className="footer-social">
            <a href="#" className="social-icon">
              <Facebook size={20} />
            </a>
            <a href="#" className="social-icon">
              <Instagram size={20} />
            </a>
            <a href="#" className="social-icon">
              <Youtube size={20} />
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Enlaces Rápidos</h3>
          <ul className="footer-links">
            <li><a href="#catalogo">Catálogo</a></li>
            <li><a href="#agendar">Agendar Cita</a></li>
            <li><a href="#servicios">Servicios de Taller</a></li>
            <li><a href="#quienes-somos">Quiénes Somos</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Contacto Principal</h3>
          <div className="footer-contact">
            <div className="contact-item">
              <MapPin size={18} />
              <span>Av. Principal 123, Cochabamba, Bolivia</span>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <span>+591 67522948 (WhatsApp)</span>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <span>info@frenocentro.bo</span>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">
            <Clock size={20} />
            Horario de Atención
          </h3>
          <div className="footer-schedule">
            <p>Lunes a Viernes: 08:00 - 18:30</p>
            <p>Sábados: 08:00 - 15:30</p>
            <p>Domingos: Cerrado</p>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 Auto Smart. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;