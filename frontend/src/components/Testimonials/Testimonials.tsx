import "./Testimonials.css";

import {
    useEffect,
    useState,
} from "react";

import { Link } from "react-router-dom";

import {
    subscribeSiteTestimonials,
} from "../../services/firebase/siteTestimonials";

import type {
    SiteTestimonials,
} from "../../services/firebase/siteTestimonials";

function Testimonials() {

    const [section, setSection] =
        useState<SiteTestimonials | null>(null);

    useEffect(() => {

        const unsubscribe =
            subscribeSiteTestimonials((data) => {

                setSection(data);

            });

        return unsubscribe;

    }, []);

    return (

        <section className="testimonials">

            <div className="testimonials-container">

                <div className="section-eyebrow">

                    <span />

                    <p>

                        {section?.eyebrow}

                    </p>

                </div>

                <div className="testimonials-header">

                    <h2>

                        {section?.title}

                    </h2>

                </div>

                <div className="testimonials-grid">

                    {section?.testimonials.map((item, index) => (

                        <article
                            key={index}
                            className="testimonial-card"
                        >

                            <p className="testimonial-text">

                                “{item.text}”

                            </p>

                            <div className="testimonial-author">

                                <h4>

                                    {item.name}

                                </h4>

                                <span>

                                    {item.category}

                                </span>

                            </div>

                        </article>

                    ))}

                </div>

                <div className="testimonials-footer">

                    <Link
                        to="/depoimentos"
                        className="testimonials-btn"
                    >

                        Ver mais depoimentos

                    </Link>

                </div>

            </div>

        </section>

    );

}

export default Testimonials;