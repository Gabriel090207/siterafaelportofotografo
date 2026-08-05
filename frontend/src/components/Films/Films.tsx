import "./Films.css";

import {
    useEffect,
    useState,
} from "react";

import {
    Play,
    X,
} from "lucide-react";

import {
    subscribeSiteFilms,
} from "../../services/firebase/siteFilms";

function Films() {

    const [film, setFilm] =
        useState<any>(null);

    const [showVideo, setShowVideo] =
        useState(false);

    const [closingVideo, setClosingVideo] =
        useState(false);

    useEffect(() => {

        const unsubscribe =
            subscribeSiteFilms(
                setFilm
            );

        return unsubscribe;

    }, []);

    const closeVideo = () => {

        setClosingVideo(true);

        setTimeout(() => {

            setShowVideo(false);

            setClosingVideo(false);

        }, 250);

    };

    const features =
        film?.features ?? [];

    return (

        <>

            <section className="films">

                <div className="films-container">

                    <div className="films-video">

                        <img
                            src={film?.thumbnailUrl}
                            alt={film?.title}
                        />

                        <div className="films-video-overlay" />

                        <button
                            className="play-button"
                            onClick={() =>
                                setShowVideo(true)
                            }
                        >

                            <Play
                                size={34}
                                fill="currentColor"
                            />

                        </button>

                    </div>

                    <div className="films-content">

                        <div className="section-eyebrow">

                            <span />

                            <p>

                                {film?.eyebrow}

                            </p>

                        </div>

                        <h2>

                            {film?.title}

                        </h2>

                        <p className="films-description">

                            {film?.description}

                        </p>

                        <div className="films-features">

                            {features.map(

                                (
                                    feature: any,
                                    index: number
                                ) => (

                                    <div
                                        key={index}
                                        className="films-feature"
                                    >

                                        <h3>

                                            {feature.title}

                                        </h3>

                                        <p>

                                            {feature.description}

                                        </p>

                                    </div>

                                )

                            )}

                        </div>

                        <div className="films-buttons">

                            <a
                                href="https://wa.me/SEUNUMERO"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="films-secondary-btn"
                            >

                                Solicitar pacote

                            </a>

                        </div>

                    </div>

                </div>

            </section>

            {showVideo && (

                <div
                    className={`films-preview ${

                        closingVideo
                            ? "films-preview--closing"
                            : ""

                    }`}
                    onClick={closeVideo}
                >

                    <button
                        className="films-preview__close"
                        onClick={closeVideo}
                    >

                        <X size={26} />

                    </button>

                    <div
                        className="films-preview__content"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <video
                            controls
                            autoPlay
                            playsInline
                        >

                            <source
                                src={film?.videoUrl}
                                type="video/mp4"
                            />

                            Seu navegador não suporta vídeos.

                        </video>

                    </div>

                </div>

            )}

        </>

    );

}

export default Films;