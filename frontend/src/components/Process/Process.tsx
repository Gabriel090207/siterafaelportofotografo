import "./Process.css";

import {
    useEffect,
    useState,
} from "react";

import {
    subscribeSiteProcess,
} from "../../services/firebase/siteProcess";

import type {
    SiteProcess,
} from "../../services/firebase/siteProcess";

function Process() {

    const [process, setProcess] =
        useState<SiteProcess | null>(null);

    useEffect(() => {

        const unsubscribe =
            subscribeSiteProcess((data) => {

                setProcess(data);

            });

        return unsubscribe;

    }, []);

    const steps =
        process?.steps ?? [];

    return (

        <section className="process">

            <div className="process-container">

                <div className="process-header">

                    <div className="section-eyebrow">

                        <span />

                        <p>

                            {process?.eyebrow}

                        </p>

                    </div>

                    <h2>

                        {process?.title}

                    </h2>

                </div>

                <div className="process-grid">

                    {steps.map((step, index) => (

                        <article
                            key={index}
                            className="process-card"
                        >

                            <span className="process-number">

                                {step.number}

                            </span>

                            <h3>

                                {step.title}

                            </h3>

                            <p className="process-description">

                                {step.description}

                            </p>

                        </article>

                    ))}

                </div>

            </div>

        </section>

    );

}

export default Process;