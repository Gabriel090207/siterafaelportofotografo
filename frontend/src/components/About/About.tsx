import "./About.css";

import {
    useEffect,
    useState,
} from "react";

import logo from "../../assets/logo/logoabout.png";
import aboutImage from "../../assets/images/about.png";

import { Link } from "react-router-dom";

import {
    subscribeSiteAbout,
} from "../../services/firebase/siteAbout";

import type {
    SiteAbout,
} from "../../services/firebase/siteAbout";

function About() {

    const [about, setAbout] =
        useState<SiteAbout | null>(null);

    useEffect(() => {

        const unsubscribe =
            subscribeSiteAbout((data) => {

                setAbout(data);

            });

        return unsubscribe;

    }, []);

    return (

        <section className="about">

            <div
                className="about-background"
                style={{
                    backgroundImage: `url(${
                        about?.backgroundUrl ||
                        aboutImage
                    })`,
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

                        <p>

                            {about?.eyebrow}

                        </p>

                    </div>

                    <h2>

                        {about?.title}

                    </h2>

                    <p className="about-description">

                        {about?.description}

                    </p>

                    <div className="about-buttons">

                        <Link
                            to="/sobre"
                            className="about-primary-btn"
                        >

                            Conheça nossa história

                        </Link>

                        <a
                            href="https://wa.me/5543988237222"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="about-secondary-btn"
                        >

                            Fale com Rafael Porto

                        </a>

                    </div>

                </div>

            </div>

        </section>

    );

}

export default About;