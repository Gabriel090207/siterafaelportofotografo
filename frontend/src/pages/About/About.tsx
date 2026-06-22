import "./About.css";


import rafaelImage from "../../assets/images/rafael.png";
import logo from "../../assets/logo/logo1.png";

import {
  FiHeart,
  FiCamera,
  FiStar,
} from "react-icons/fi";


function About() {
  return (
    <main className="about-page">

      <div className="about-page-container">

        <section className="about-page-hero">

          <div className="about-page-eyebrow">
            <span></span>
            <p>SOBRE</p>
          </div>

          <div className="about-page-hero-content">

            <h1>
              Rafael Porto - Fotógrafo e Videomaker
            </h1>

           <p className="about-page-description">
  Há mais de oito anos registrando histórias,
  emoções e momentos únicos através da fotografia
  e do audiovisual. Cada imagem é construída com
  sensibilidade, atenção aos detalhes e o compromisso
  de preservar memórias que poderão ser revividas por
  toda a vida.
</p>

          </div>

        </section>

      


        <section className="about-page-story">

  <div className="about-page-story-image">

    <img
  src={rafaelImage}
  alt="Rafael Porto"
/>

  </div>

  <div className="about-page-story-content">

   <div className="about-page-story-label">
  <span></span>
  <p>MINHA HISTÓRIA</p>
</div>

    <h2>
      A fotografia como forma
      de preservar memórias.
    </h2>

   <p>
  Rafael Porto reside em Londrina, Paraná, e há mais de oito anos dedica sua vida a registrar histórias, emoções e momentos únicos através da fotografia e do audiovisual. Ao longo dessa trajetória, especializou-se em casamentos, aniversários, formaturas, ensaios e eventos corporativos, levando seu trabalho para diversas cidades do Brasil. Seu olhar busca capturar não apenas imagens, mas sentimentos e experiências, transformando instantes especiais em lembranças permanentes que podem ser revividas por toda a vida.
</p>

  </div>

</section>


  <section className="about-page-stats">

          <div className="about-page-stat-card">
            <strong>8+</strong>
            <span>Anos de Experiência</span>
          </div>

          <div className="about-page-stat-card">
            <strong>250+</strong>
            <span>Eventos Registrados</span>
          </div>

          <div className="about-page-stat-card">
            <strong>100k+</strong>
            <span>Fotos Capturadas</span>
          </div>

          <div className="about-page-stat-card">
            <strong>10+</strong>
            <span>Cidades Atendidas</span>
          </div>

        </section>


        <section className="about-page-values">

  <div className="about-page-values-label">
    <span></span>
    <p>MINHA ESSÊNCIA</p>
  </div>

  <h2 className="about-page-values-title">
    Mais do que fotografar,
    preservar emoções.
  </h2>

 <p className="about-page-values-description">
  Acredito que cada fotografia deve transmitir muito mais do que uma imagem bonita. Meu objetivo é registrar sentimentos reais, conexões genuínas e detalhes que muitas vezes passam despercebidos durante um evento. Ao longo dos anos desenvolvi um olhar atento para captar momentos espontâneos e transformá-los em lembranças que permanecem vivas com o passar do tempo. Cada clique é pensado para preservar não apenas a cena, mas toda a emoção presente naquele instante.
</p>

  <div className="about-page-values-grid">

    <div className="about-page-value-card">

      <div className="about-page-value-icon">
        <FiHeart />
      </div>

      <h3>Emoção</h3>

      <p>
        Momentos espontâneos e sentimentos reais são
        o que tornam cada registro verdadeiramente
        especial.
      </p>

    </div>

    <div className="about-page-value-card">

      <div className="about-page-value-icon">
        <FiCamera />
      </div>

      <h3>Detalhes</h3>

      <p>
        Pequenos gestos, olhares e elementos que
        muitas vezes passam despercebidos merecem
        ser eternizados.
      </p>

    </div>

    <div className="about-page-value-card">

      <div className="about-page-value-icon">
        <FiStar />
      </div>

      <h3>Autenticidade</h3>

      <p>
        Cada história é única e deve ser registrada
        de forma natural, respeitando sua essência.
      </p>

    </div>

  </div>

</section>


<section className="about-page-locations">

  <div className="about-page-locations-label">
    <span></span>
    <p>ATUAÇÃO</p>
  </div>

  <h2 className="about-page-locations-title">
   Onde a fotografia
me levou.
  </h2>

  <p className="about-page-locations-description">
    Ao longo dos anos tive a oportunidade de registrar
    momentos especiais em diferentes cidades e estados,
    acompanhando histórias únicas e construindo conexões
    através da fotografia e do audiovisual.
  </p>

  <div className="about-page-locations-grid">

    <div className="about-page-location">
      Londrina
    </div>

    <div className="about-page-location">
      Maringá
    </div>

    <div className="about-page-location">
      Cascavel
    </div>

    <div className="about-page-location">
      São Paulo
    </div>

    <div className="about-page-location">
      Florianópolis
    </div>

    <div className="about-page-location">
      Balneário Camboriú
    </div>

    <div className="about-page-location">
      Presidente Prudente
    </div>

    <div className="about-page-location">
      Sertanópolis
    </div>

    <div className="about-page-location">
      Jandaia do Sul
    </div>

    <div className="about-page-location">
      Primeiro de Maio
    </div>

  </div>

</section>




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


        

      </div>

    </main>
  );
}

export default About;