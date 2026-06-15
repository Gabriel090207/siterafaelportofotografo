import "./Hero.css";

import heroBg from "../../assets/images/hero-bg.png";

function Hero() {
  return (
    <section
      className="hero"
      style={{
        backgroundImage: `url(${heroBg})`,
      }}
    >
      <div className="hero-overlay"></div>

      <div className="hero-container">
        <div className="hero-content">

          <div className="hero-eyebrow">
            <span></span>
            <p>FOTOGRAFIA • FILME • EMOÇÃO</p>
          </div>

         <h1>
  Momentos únicos merecem ser eternizados com beleza.
</h1>

          <p className="hero-description">
            Casamentos, 15 anos, ensaios, formaturas e eventos corporativos
            registrados com emoção, estética e cuidado em cada detalhe.
          </p>

          <div className="hero-buttons">
            <button className="hero-primary-btn">
              Solicitar orçamento
            </button>

            <button className="hero-secondary-btn">
              Ver portfólio
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <h3>+500</h3>
              <span>eventos registrados</span>
            </div>

            <div>
              <h3>15 anos</h3>
              <span>de experiência</span>
            </div>

            <div>
              <h3>Foto + Filme</h3>
              <span>pacotes completos</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;