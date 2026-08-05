import "./FAQ.css";

import {
    useEffect,
    useState,
} from "react";

import {
    subscribeSiteFaq,
} from "../../services/firebase/siteFaq";

import type {
    SiteFaq,
} from "../../services/firebase/siteFaq";

function FAQ() {

    const [faq, setFaq] =
        useState<SiteFaq | null>(null);

    const [openIndex, setOpenIndex] =
        useState<number | null>(0);

    useEffect(() => {

        const unsubscribe =
            subscribeSiteFaq((data) => {

                setFaq(data);

            });

        return unsubscribe;

    }, []);

    const toggleItem = (
        index: number
    ) => {

        setOpenIndex(

            openIndex === index

                ? null

                : index

        );

    };

    return (

        <section className="faq">

            <div className="faq-container">

                <div className="section-eyebrow">

                    <span />

                    <p>

                        {faq?.eyebrow}

                    </p>

                </div>

                <div className="faq-header">

                    <h2>

                        {faq?.title}

                    </h2>

                </div>

                <div className="faq-list">

                    {faq?.items.map(

                        (item, index) => (

                            <article

                                key={index}

                                className={`faq-item ${
                                    openIndex === index
                                        ? "active"
                                        : ""
                                }`}

                            >

                                <button

                                    className="faq-question"

                                    onClick={() =>
                                        toggleItem(
                                            index
                                        )
                                    }

                                >

                                    <span>

                                        {item.question}

                                    </span>

                                    <div className="faq-icon">

                                        {openIndex ===
                                        index

                                            ? "−"

                                            : "+"}

                                    </div>

                                </button>

                                <div className="faq-answer">

                                    <p>

                                        {item.answer}

                                    </p>

                                </div>

                            </article>

                        )

                    )}

                </div>

            </div>

        </section>

    );

}

export default FAQ;