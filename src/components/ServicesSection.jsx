import { Wrench, Calendar, ArrowRight } from 'lucide-react';
import './ServicesSection.css';

const ServicesSection = () => {
  const services = [
    {
      icon: <Wrench size={32} />,
      title: 'Servicios de Taller',
      description:
        'Reparación de direcciones hidráulicas, frenos y mantenimiento general para vehículos medianos y grandes.',
      buttonText: 'Gestionar Taller',
    },
    {
      icon: <Calendar size={32} />,
      title: 'Agendamiento de Citas',
      description:
        'Reserve su cita para servicios de taller de forma rápida y sencilla. Reciba recordatorios automáticos.',
      buttonText: 'Agendar Ahora',
    },
  ];

  return (
    <section className="services-section">
      <div className="services-container">
        <h2 className="services-title">
          Nuestros <span className="services-highlight">Servicios</span> Destacados
        </h2>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <button className="service-button">
                {service.buttonText}
                <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;