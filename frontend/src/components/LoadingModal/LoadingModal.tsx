import {
    useEffect,
    useState,
} from "react";

import "./LoadingModal.css";

interface LoadingModalProps {

    open: boolean;

    progress: number;

    title: string;

    message: string;

    success?: boolean;

}

const LoadingModal = ({
    open,
    progress,
    title,
    message,
    success = false,
}: LoadingModalProps) => {

    const [mounted, setMounted] = useState(open);

    const [closing, setClosing] = useState(false);

    useEffect(() => {

        if (open) {

            setMounted(true);

            setClosing(false);

            return;

        }

        if (!mounted) return;

        setClosing(true);

        const timeout = window.setTimeout(() => {

            setMounted(false);

            setClosing(false);

        }, 350);

        return () => {

            window.clearTimeout(timeout);

        };

    }, [
        open,
        mounted,
    ]);

    useEffect(() => {

        if (!mounted) return;

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {

            document.body.style.overflow =
                previousOverflow;

        };

    }, [mounted]);

    if (!mounted) return null;

    const normalizedProgress = Math.min(
        100,
        Math.max(0, progress)
    );

    return (

        <div
            className={`
                loading-modal
                ${closing
                    ? "loading-modal--closing"
                    : ""
                }
            `}
            role="dialog"
            aria-modal="true"
            aria-labelledby="loading-modal-title"
            aria-describedby="loading-modal-message"
        >

            <div className="loading-modal__backdrop" />

            <div
                className={`
                    loading-modal__card
                    ${success
                        ? "loading-modal__card--success"
                        : ""
                    }
                `}
            >

                <div className="loading-modal__status">

                    {success ? (

                        <div className="loading-modal__success">

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >

                                <path
                                    d="M5 12.5L9.2 17L19 7"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                            </svg>

                        </div>

                    ) : (

                        <div
                            className="loading-modal__spinner"
                            aria-hidden="true"
                        />

                    )}

                </div>

                <h2
                    id="loading-modal-title"
                    className="loading-modal__title"
                >

                    {title}

                </h2>

                <p
                    id="loading-modal-message"
                    className="loading-modal__message"
                >

                    {message}

                </p>

                <div className="loading-modal__progress-row">

                    <div
                        className="loading-modal__progress"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={normalizedProgress}
                    >

                        <div
                            className="loading-modal__progress-fill"
                            style={{
                                width: `${normalizedProgress}%`,
                            }}
                        />

                    </div>

                    <span className="loading-modal__percent">

                        {Math.round(normalizedProgress)}%

                    </span>

                </div>

                <span className="loading-modal__hint">

                    {success
                        ? "Redirecionando para os álbuns..."
                        : "Não feche esta página durante o processo."
                    }

                </span>

            </div>

        </div>

    );

};

export default LoadingModal;