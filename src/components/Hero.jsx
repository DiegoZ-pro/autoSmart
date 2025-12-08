import { ArrowLeft, ArrowRight, Car } from 'lucide-react';
import { useState } from 'react';
import './Hero.css';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Tecnología de Punta',
      highlight: 'para su Vehículo',
      subtitle: 'Diagnóstico preciso y reparaciones con equipos de última generación.',
    },
    {
      title: 'Servicio Profesional',
      highlight: 'Garantizado',
      subtitle: 'Técnicos certificados y repuestos de calidad para su tranquilidad.',
    },
    {
      title: 'Atención Rápida',
      highlight: 'y Eficiente',
      subtitle: 'Reserve su cita online y reciba notificaciones en tiempo real.',
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          {slides[currentSlide].title}{' '}
          <span className="hero-highlight">{slides[currentSlide].highlight}</span>
        </h1>
        <p className="hero-subtitle">{slides[currentSlide].subtitle}</p>
        <button className="hero-button">
          <Car size={20} />
          Servicio Taller
        </button>
      </div>

      <button className="hero-arrow hero-arrow-left" onClick={prevSlide}>
        <ArrowLeft size={24} />
      </button>
      <button className="hero-arrow hero-arrow-right" onClick={nextSlide}>
        <ArrowRight size={24} />
      </button>

      <div className="hero-indicators">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;