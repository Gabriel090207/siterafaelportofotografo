import "./Portfolio.css";

function Portfolio() {
  return (
    <section className="portfolio">
      <div className="portfolio-container">
        <div className="portfolio-content">
          <div className="section-eyebrow">
            <span />
            <p>PORTFÓLIO</p>
          </div>

          <h2>
            Fotos que fazem você reviver o momento.
          </h2>

          <p className="portfolio-description">
            Uma galeria visual elegante com imagens reais para inspirar noivos,
            debutantes, famílias e empresas.
          </p>

          <div className="portfolio-buttons">
            <button className="portfolio-primary-btn">
              Ver galeria completa
            </button>

            <button className="portfolio-secondary-btn">
              Ver ensaios
            </button>
          </div>
        </div>

        <div className="portfolio-gallery">
          <article className="portfolio-card portfolio-card-large">
            <img
              src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc"
              alt="Casamentos"
            />

            <div className="portfolio-overlay" />

            <h3>Casamentos</h3>
          </article>

          <article className="portfolio-card">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552"
              alt="Making Of"
            />

            <div className="portfolio-overlay" />

            <h3>Making Of</h3>
          </article>

          <article className="portfolio-card">
            <img
              src="https://images.unsplash.com/photo-1520854221256-17451cc331bf"
              alt="Ensaios"
            />

            <div className="portfolio-overlay" />

            <h3>Ensaios</h3>
          </article>

          <article className="portfolio-card portfolio-card-wide">
            <img
              src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8"
              alt="Festas"
            />

            <div className="portfolio-overlay" />

            <h3>Festas</h3>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Portfolio;