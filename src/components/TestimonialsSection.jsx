import { Star } from 'lucide-react';
import './TestimonialsSection.css';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Carlos Vargas',
      rating: 3,
      text: 'Excelente servicio y atención personalizada. Mi auto quedó como nuevo.',
      image: 'https://i.pravatar.cc/150?img=12',
    },
    {
      name: 'Lucía Méndez',
      rating: 5,
      text: 'Rápidos, eficientes y con precios justos. ¡Totalmente recomendados!',
      image: 'https://i.pravatar.cc/150?img=45',
    },
    {
      name: 'Transportes Veloz',
      rating: 4,
      text: 'Confiamos el mantenimiento de nuestra flota a Freno Centro. Siempre cumplen.',
      image: 'https://i.pravatar.cc/150?img=28',
    },
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={20}
        fill={index < rating ? '#FFD93D' : 'none'}
        stroke={index < rating ? '#FFD93D' : '#D1D5DB'}
      />
    ));
  };

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <h2 className="testimonials-title">
          Testimonios de <span className="testimonials-highlight">Nuestros Clientes</span>
        </h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="testimonial-image"
              />
              <div className="testimonial-stars">{renderStars(testimonial.rating)}</div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <p className="testimonial-name">- {testimonial.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;