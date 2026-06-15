import "./Process.css";

function Process() {
  return (
    <section className="process">
      <div className="process-container">

        <div className="process-header">
          <div className="section-eyebrow">
            <span />
            <p>COMO FUNCIONA</p>
          </div>

          <h2>
            Um caminho simples até
            as fotos prontas.
          </h2>
        </div>

        <div className="process-grid">

          <article className="process-card">
            <span className="process-number">01</span>

            <h3>Contato</h3>

            <p className="process-description">
              Cliente chama no WhatsApp e informa data,
              cidade e tipo de evento.
            </p>

            <a href="#" className="process-link">
              Chamar no WhatsApp
            </a>
          </article>

          <article className="process-card">
            <span className="process-number">02</span>

            <h3>Proposta</h3>

            <p className="process-description">
              A equipe indica o pacote ideal
              de foto, vídeo ou combo completo.
            </p>

            <a href="#" className="process-link">
              Ver pacotes
            </a>
          </article>

          <article className="process-card">
            <span className="process-number">03</span>

            <h3>Registro</h3>

            <p className="process-description">
              No dia, a equipe conduz tudo com
              naturalidade e atenção aos detalhes.
            </p>

            <a href="#" className="process-link">
              Conhecer processo
            </a>
          </article>

          <article className="process-card">
            <span className="process-number">04</span>

            <h3>Entrega</h3>

            <p className="process-description">
              Galeria online organizada,
              seleção e área do cliente.
            </p>

            <a href="#" className="process-link">
              Área do Cliente
            </a>
          </article>

        </div>

      </div>
    </section>
  );
}

export default Process;