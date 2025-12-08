import { Shield } from 'lucide-react';
import './QualitySection.css';

const QualitySection = () => {
  return (
    <section className="quality-section">
      <div className="quality-content">
        <div className="quality-icon">
          <Shield size={60} />
        </div>
        <h2 className="quality-title">Calidad y Confianza Garantizada</h2>
        <p className="quality-text">
          En Auto Smart, nos comprometemos con la excelencia. Utilizamos repuestos de alta
          calidad y contamos con técnicos especializados para asegurar el óptimo rendimiento y
          seguridad de su vehículo.
        </p>
        <button className="quality-button">Contáctanos</button>
      </div>
    </section>
  );
};

export default QualitySection;