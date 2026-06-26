import "./Services.css";

import heroImage from "../../assets/images/about.png";
import logo from "../../assets/logo/logo1.png";

import {
  FiCamera,
  FiUsers,
  FiClock,
  FiAward,
} from "react-icons/fi";

const services = [
  {
    title: "Fotografia",
    description:
      "Casamentos, aniversários, formaturas, ensaios e eventos.",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
  },
  {
    title: "Filmagem",
    description:
      "Filmes emocionantes para preservar cada detalhe.",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4",
  },
  {
    title: "Álbuns",
    description:
      "Acabamento premium para guardar suas memórias.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552",
  },
  {
    title: "Drone",
    description:
      "Imagens aéreas que valorizam ainda mais o evento.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
];

function Services() {
  return (
    <main className="services-page">

   

      
       
<section
  className="services-page-hero"
  style={{
    backgroundImage: `url(${heroImage})`,
  }}
>

  <div className="services-page-hero-overlay"></div>

  <div className="services-page-hero-container">

    <div className="services-page-eyebrow">
      <span></span>
      <p>SERVIÇOS</p>
    </div>

    <h1>
      Soluções para transformar
      momentos em memórias marcantes.
    </h1>

    <p className="services-page-description">
      Da fotografia ao audiovisual, cada serviço é desenvolvido para
      registrar emoções, preservar histórias e transformar momentos
      especiais em lembranças que poderão ser revividas por toda a vida.
    </p>

  </div>

</section>

<div className="services-page-categories-container">

        <section className="services-page-categories">

  <div className="services-page-categories-container">

    <div className="services-page-categories-label">
    <span></span>
    <p>SOLUÇÕES</p>
  </div>

  <h2 className="services-page-categories-title">
    Soluções para cada
    tipo de história.
  </h2>

  <p className="services-page-categories-description">
    Cada serviço é planejado para registrar momentos
    únicos com qualidade, emoção e atenção aos detalhes.
  </p>

<div className="services-page-categories-grid">

  {services.map((item) => (
    <article
      key={item.title}
      className="services-page-category-card"
      style={{
        backgroundImage: `url(${item.image})`,
      }}
    >
      <div className="services-page-category-overlay"></div>

      <div className="services-page-category-content">
        <h3>{item.title}</h3>

        <p>{item.description}</p>

        <span>Saiba mais</span>
      </div>
    </article>
  ))}

</div>

  </div>

</section>


<section className="services-page-photography">

  <div className="services-page-photography-content">

   <div className="services-page-photography-eyebrow">
  <span></span>

  <p>
    FOTOGRAFIA
  </p>
</div>

    <h2>
      Registros que contam
      histórias reais.
    </h2>

    <p>
      Cada evento possui momentos únicos que merecem
      ser preservados com sensibilidade e atenção aos
      detalhes. A cobertura fotográfica é desenvolvida
      para registrar emoções, conexões e experiências
      de forma autêntica e atemporal.
    </p>

    <div className="services-page-photography-list">

      <div className="services-page-photography-item">
        Casamentos
      </div>

      <div className="services-page-photography-item">
        15 Anos
      </div>

      <div className="services-page-photography-item">
        Formaturas
      </div>

      <div className="services-page-photography-item">
        Ensaios
      </div>

      <div className="services-page-photography-item">
        Corporativos
      </div>

      <div className="services-page-photography-item">
        Aniversários
      </div>

    </div>

  </div>

  <div className="services-page-photography-image">

    <img
      src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc"
      alt="Fotografia"
    />

  </div>

</section>


<section className="services-page-video">

  <div className="services-page-video-image">

    <img
      src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4"
      alt="Audiovisual"
    />

  </div>

  <div className="services-page-video-content">

    <div className="services-page-video-eyebrow">
      <span></span>

      <p>
        AUDIOVISUAL
      </p>
    </div>

    <h2>
      Filmes que fazem você
      reviver cada emoção.
    </h2>

    <p>
      A produção audiovisual vai muito além de registrar imagens em movimento.
      Cada filme é pensado para transmitir a essência do momento, valorizando
      emoções, detalhes e conexões através de uma linguagem cinematográfica.
      O resultado é um registro envolvente, capaz de fazer você reviver cada
      instante sempre que assistir novamente.
    </p>

    <div className="services-page-video-list">

      <div className="services-page-video-item">
        Captação em 4K
      </div>

      <div className="services-page-video-item">
        Drone
      </div>

      <div className="services-page-video-item">
        Trailer Cinematográfico
      </div>

      <div className="services-page-video-item">
        Filme Completo
      </div>

      <div className="services-page-video-item">
        Reels
      </div>

      <div className="services-page-video-item">
        Colorização Profissional
      </div>

    </div>

  </div>

</section>


<section className="services-page-albums">

  <div className="services-page-albums-container">

    <div className="services-page-albums-image">

      <img
        src="https://images.unsplash.com/photo-1519741497674-611481863552"
        alt="Álbuns"
      />

    </div>

    <div className="services-page-albums-content">

      <div className="services-page-albums-eyebrow">
        <span></span>
        <p>ÁLBUNS</p>
      </div>

      <h2>
        Memórias que podem
        ser tocadas.
      </h2>

      <p>
        Além das fotografias digitais, oferecemos álbuns
        personalizados produzidos com materiais premium,
        transformando momentos especiais em recordações
        físicas feitas para atravessar gerações.
      </p>

      <div className="services-page-albums-list">

        <div className="services-page-albums-item">
          Papel fotográfico premium
        </div>

        <div className="services-page-albums-item">
          Layout exclusivo
        </div>

        <div className="services-page-albums-item">
          Diversos tamanhos
        </div>

        <div className="services-page-albums-item">
          Caixa personalizada
        </div>

        <div className="services-page-albums-item">
          Alta durabilidade
        </div>

        <div className="services-page-albums-item">
          Acabamento artesanal
        </div>

      </div>

      <button className="services-page-albums-button">
        Solicitar orçamento
      </button>

    </div>

  </div>

</section>


<section className="services-page-differentials">

  <div className="services-page-differentials-label">
    <span></span>
    <p>DIFERENCIAIS</p>
  </div>

  <h2 className="services-page-differentials-title">
    Mais do que registrar,
    entregar uma experiência.
  </h2>

  <p className="services-page-differentials-description">
    Cada atendimento é pensado para que você tenha tranquilidade
    antes, durante e depois do evento. Do primeiro contato até a
    entrega final, cada etapa é conduzida com atenção,
    organização e compromisso com a qualidade.
  </p>

  <div className="services-page-differentials-grid">

    <div className="services-page-differential-card">

      <div className="services-page-differential-icon">
        <FiCamera />
      </div>

      <h3>Equipamentos Profissionais</h3>

      <p>
        Equipamentos modernos garantem imagens com alta
        qualidade em qualquer ambiente e condição de luz.
      </p>

    </div>

    <div className="services-page-differential-card">

      <div className="services-page-differential-icon">
        <FiUsers />
      </div>

      <h3>Atendimento Personalizado</h3>

      <p>
        Cada evento recebe um planejamento exclusivo,
        respeitando o estilo e as expectativas de cada cliente.
      </p>

    </div>

    <div className="services-page-differential-card">

      <div className="services-page-differential-icon">
        <FiClock />
      </div>

      <h3>Entrega Organizada</h3>

      <p>
        Fotos e vídeos entregues de forma prática,
        organizada e com acabamento profissional.
      </p>

    </div>

    <div className="services-page-differential-card">

      <div className="services-page-differential-icon">
        <FiAward />
      </div>

      <h3>Mais de 8 anos de experiência</h3>

      <p>
        Centenas de histórias registradas com dedicação,
        sensibilidade e compromisso em cada detalhe.
      </p>

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

export default Services;