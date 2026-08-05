import "./Experiences.css";

import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import {
    subscribeSiteExperiences,
} from "../../services/firebase/siteExperiences";

import type {
    SiteExperiences,
} from "../../services/firebase/siteExperiences";

function Experiences() {

    const [data, setData] =
        useState<SiteExperiences | null>(null);

    useEffect(() => {

        const unsubscribe =
            subscribeSiteExperiences(
                setData
            );

        return unsubscribe;

    }, []);

    return (

        <section className="experiences">

            <div className="experiences-container">

                <div className="experiences-header">

                    <div className="section-eyebrow">

                        <span></span>

                        <p>

                            {data?.eyebrow ||
                                "EXPERIÊNCIAS"}

                        </p>

                    </div>

                    <div className="experiences-top">

                        <div>

                            <h2>

                                {data?.title ||
                                    "Escolha o tipo de história"}

                            </h2>

                            <p>

                                {data?.description ||

                                    "Cada experiência possui uma abordagem única para registrar momentos que merecem ser lembrados."}

                            </p>

                        </div>

                    </div>

                </div>

                <div className="experiences-grid">

                    {(data?.items ?? []).map((item) => (

                        <Link

                            key={item.categoryName}

                            to={`/eventos/${encodeURIComponent(item.categoryName)}`}

                            className="experience-card"

                            style={{
                                backgroundImage: `url(${item.imageUrl})`,
                            }}

                        >

                            <div className="experience-overlay"></div>

                            <div className="experience-content">

                                <h3>

                                    {item.title}

                                </h3>

                                <p>

                                    {item.description}

                                </p>

                                <span>

                                    Ver trabalhos

                                </span>

                            </div>

                        </Link>

                    ))}

                </div>

            </div>

        </section>

    );

}

export default Experiences;