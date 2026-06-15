import "./About.css";

import logo from "../../assets/logo/logoabout.png";
import aboutImage from "../../assets/images/about.png";

function About() {
  return (
    <section className="about">
      <div
        className="about-background"
        style={{
          backgroundImage: `url(${aboutImage})`,
        }}
      />

      <div className="about-overlay" />

      <div className="about-container">
        <div className="about-logo-card">
          <img
            src={logo}
            alt="Rafael Porto Fotografia"
          />
        </div>

        <div className="about-content">
          <div className="section-eyebrow">
            <span />
            <p>SOBRE</p>
          </div>

          <h2>
            Por trás das lentes, um olhar atento aos detalhes.
          </h2>

          <p className="about-description">
            A Rafael Porto Fotografia registra histórias em
            Londrina e região com foco em emoção, estética e
            cuidado em cada detalhe.
          </p>

          <p className="about-description">
            O objetivo é criar imagens que façam você reviver
            o momento sempre que olhar para elas.
          </p>

          <div className="about-buttons">
            <button className="about-primary-btn">
              Conheça nossa história
            </button>

            <button className="about-secondary-btn">
              Fale com Rafael Porto
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;