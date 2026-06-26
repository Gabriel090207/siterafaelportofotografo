import "./Contact.css";

import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiInstagram,
} from "react-icons/fi";

function Contact() {
  return (
    <main className="contact-page">

      <div className="contact-page-container">

        {/* HERO */}

        <section className="contact-page-hero">

          <div className="contact-page-eyebrow">
            <span></span>
            <p>CONTATO</p>
          </div>

          <h1>
            Vamos conversar
            sobre o seu evento.
          </h1>

          <p className="contact-page-description">
            Será um prazer conhecer a sua história. Entre em contato
            através do WhatsApp, telefone, e-mail ou redes sociais
            para receber um atendimento personalizado.
          </p>

        </section>

        {/* CONTATOS */}

        <section className="contact-page-contacts">

          <div className="contact-page-contacts-label">
            <span></span>
            <p>CONTATOS</p>
          </div>

          <h2 className="contact-page-contacts-title">
            Escolha a melhor
            forma de falar comigo.
          </h2>

          <div className="contact-page-contacts-grid">

            <div className="contact-page-contact-card">

              <div className="contact-page-contact-icon">
                <FiPhone />
              </div>

              <h3>WhatsApp</h3>

              <p>
                Atendimento rápido para tirar dúvidas
                e solicitar um orçamento.
              </p>

              <span>(43) 99999-9999</span>

            </div>

            <div className="contact-page-contact-card">

              <div className="contact-page-contact-icon">
                <FiMail />
              </div>

              <h3>E-mail</h3>

              <p>
                Envie sua mensagem e retornaremos
                o mais breve possível.
              </p>

              <span>contato@rafaelporto.com.br</span>

            </div>

            <div className="contact-page-contact-card">

              <div className="contact-page-contact-icon">
                <FiInstagram />
              </div>

              <h3>Instagram</h3>

              <p>
                Acompanhe os últimos trabalhos
                e envie uma mensagem.
              </p>

              <span>@rafaelporto</span>

            </div>

          </div>

        </section>

        {/* LOCALIZAÇÃO */}

        <section className="contact-page-location">

          <div className="contact-page-location-content">

            <div className="contact-page-location-label">
              <span></span>
              <p>LOCALIZAÇÃO</p>
            </div>

            <h2>
              Atendimento em Londrina
              e em todo o Brasil.
            </h2>

            <p>
              Com sede em Londrina, Paraná, realizamos
              coberturas fotográficas e audiovisuais
              em diversas cidades, acompanhando histórias
              onde elas acontecerem.
            </p>

            <div className="contact-page-location-card">

              <FiMapPin />

              <div>

                <strong>
                  Londrina • Paraná
                </strong>

                <span>
                  Atendimento mediante agendamento.
                </span>

              </div>

            </div>

          </div>

          <div className="contact-page-map">

            <iframe
              title="Mapa"
              src="https://www.google.com/maps?q=Londrina,PR&output=embed"
              loading="lazy"
            />

          </div>

        </section>

      </div>

    </main>
  );
}

export default Contact;