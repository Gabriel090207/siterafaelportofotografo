import "./Agenda.css";

function Agenda() {
  return (
    <section className="agenda">
      <div className="agenda-container">
        <div className="agenda-content">
          <div className="section-eyebrow">
            <span />
            <p>AGENDA</p>
          </div>

          <h2>
            Sua data já pode estar sendo procurada por outro cliente.
          </h2>

          <p className="agenda-description">
            Consulte disponibilidade para casamento, 15 anos,
            ensaio, formatura ou evento corporativo e garanta
            seu atendimento com antecedência.
          </p>
        </div>

        <div className="agenda-actions">
          <button className="agenda-primary-btn">
            Consultar minha data
          </button>

          <button className="agenda-secondary-btn">
            Ver promoções
          </button>
        </div>
      </div>
    </section>
  );
}

export default Agenda;