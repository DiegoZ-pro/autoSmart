import './BrandsSection.css';

const BrandsSection = () => {
  const brands = [
    { name: 'Imcruz', logo: 'https://cladera.org/foda/images/subcat-867.jpg' },
    { name: 'Toyota', logo: 'https://hemispheriacg.com/wp-content/uploads/2020/06/Toyosa-e1592337834440.png' },
    { name: 'Taiyo', logo: 'https://images.squarespace-cdn.com/content/v1/63a213464d134b7c095ecd09/1671566225449-968O8CLNCQ0N99B8AYY3/Logo_Taiyo_Motors-01.png' },
    { name: 'Multimotors', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Mitsubishi-logo.png' },
    { name: 'SAS', logo: 'https://media.designrush.com/inspiration_images/291693/conversions/ford_logo_0_c4103a3013ad-mobile.jpg' },
  ];

  return (
    <section className="brands-section">
      <div className="brands-container">
        <h2 className="brands-title">
          Marcas <span className="brands-highlight">con las que Trabajamos</span>
        </h2>
        <div className="brands-grid">
          {brands.map((brand, index) => (
            <div key={index} className="brand-item">
              <img src={brand.logo} alt={brand.name} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;