import "./Hero.css";

import heroBg from "../../assets/images/hero-bg.webp";

import { Link } from "react-router-dom";

import {
    useEffect,
    useState,
} from "react";

import {
    subscribeSiteHero,
} from "../../services/firebase/siteHero";

import type {
    SiteHero as SiteHeroType,
} from "../../services/firebase/siteHero";

function Hero() {

const [hero, setHero] =
    useState<SiteHeroType | null>(null);

useEffect(() => {

    const unsubscribe =
        subscribeSiteHero(
            setHero
        );

    return unsubscribe;

}, [])

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `url(${
            hero?.backgroundUrl || heroBg
        })`,
      }}
    >
      <div className="hero-overlay"></div>

      <div className="hero-container">
        <div className="hero-content">

          <div className="hero-eyebrow">
            <span></span>
            <p>
                {hero?.eyebrow ||
                    "FOTOGRAFIA • FILME • EMOÇÃO"}
            </p>
          </div>

         <h1>
            {hero?.title ||
                "Momentos únicos merecem ser eternizados com beleza."}
        </h1>

          <p className="hero-description">
            {hero?.description ||
              "Especialistas em fotografia e filmagem de casamentos, 15 anos, ensaios, formaturas e eventos, com mais de 15 anos de experiência e mais de 30 premiações."}
          </p>

          <div className="hero-buttons">
            <div className="hero-buttons">

              <a
                  href="https://wa.me/5543988237222"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-primary-btn"
              >
                  Solicitar orçamento
              </a>

              <Link
                  to="/portfolio"
                  className="hero-secondary-btn"
              >
                  Ver portfólio
              </Link>

          </div>
          </div>

          <div className="hero-stats">
            <div>
              <h3>+1000</h3>
              <span>eventos registrados</span>
            </div>

            <div>
              <h3>+20 anos</h3>
              <span>de experiência</span>
            </div>

            <div>
              <h3>Foto e Filme</h3>
              <span>pacotes completos</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;