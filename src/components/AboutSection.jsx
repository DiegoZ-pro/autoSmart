import { Users } from 'lucide-react';
import './AboutSection.css';

const AboutSection = () => {
  return (
    <section className="about-section">
      <div className="about-container">
        <div className="about-content">
          <h2 className="about-title">Quiénes Somos</h2>
          <p className="about-text">
            Fundada en <strong>2025</strong>, Auto Smart se ha consolidado como líder en Cochabamba
            en la importación y comercialización de repuestos para sistemas de frenos y
            direcciones hidráulicas, además de ofrecer servicios especializados de taller.
          </p>
          <p className="about-text">
            <strong>Misión:</strong> Brindar soluciones integrales y confiables para la seguridad y rendimiento
            vehicular, superando las expectativas de nuestros clientes con productos de calidad y
            servicio experto.
          </p>
          <p className="about-text">
            <strong>Visión:</strong> Ser la empresa referente a nivel nacional en sistemas de frenos y dirección,
            reconocida por nuestra innovación, profesionalismo y compromiso con la satisfacción del
            cliente.
          </p>
          <p className="about-text">
            <strong>Valores:</strong> Honestidad, Calidad, Responsabilidad, Innovación y Pasión por el Servicio.
          </p>
          <button className="about-button">
            <Users size={20} />
            Nuestro Equipo
          </button>
        </div>
        <div className="about-image">
          <img
            src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600"
            alt="Sistema de frenos"
          />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;