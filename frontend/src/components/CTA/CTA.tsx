import "./CTA.css";
import logo from "../../assets/logo/logo1.png";

function CTA() {
  return (
    <section className="cta">
      <div className="cta-container">

        <div className="cta-logo">
          <img src={logo} alt="Rafael Porto" />
        </div>

      

        <h2>
          Vamos conversar sobre o seu
          evento?
        </h2>

        <p className="cta-description">
          Conte a data, o tipo de evento e o que deseja registrar.
          Nossa equipe vai orientar você com a melhor opção.
        </p>

        <div className="cta-buttons">
          <button className="cta-primary">
            Chamar no WhatsApp
          </button>

          <button className="cta-secondary">
            Ligar agora
          </button>

          <button className="cta-secondary">
            Enviar e-mail
          </button>

          <button className="cta-secondary">
            Ver localização
          </button>
        </div>

      </div>
    </section>
  );
}

export default CTA;