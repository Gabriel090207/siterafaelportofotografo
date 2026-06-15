import "./Films.css";

function Films() {
  return (
    <section className="films">
      <div className="films-container">

        <div className="films-video">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552"
            alt="Filme em destaque"
          />

          <div className="films-video-overlay" />

          <button className="play-button">
            ▶
          </button>

          <span>Assistir filme em destaque</span>
        </div>

        <div className="films-content">
          <div className="section-eyebrow">
            <span />
            <p>VÍDEOS </p>
          </div>

          <h2>
            Transforme seu evento em uma experiência cinematográfica.
          </h2>

          <p className="films-description">
            Área ideal para vídeos de casamento,
            15 anos, pré-wedding, formaturas
            e eventos corporativos.
          </p>

          <div className="films-features">
            <div className="films-feature">
              <h3>Trailer emocional</h3>
              <p>para redes sociais</p>
            </div>

            <div className="films-feature">
              <h3>Filme completo</h3>
              <p>para reviver o evento</p>
            </div>

            <div className="films-feature">
              <h3>Foto + Filme</h3>
              <p>pacote mais desejado</p>
            </div>
          </div>

          <div className="films-buttons">
            <button className="films-primary-btn">
              Assistir vídeos
            </button>

            <button className="films-secondary-btn">
              Solicitar pacote
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Films;