import "./DeleteConfirmModal.css";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";

interface DeleteConfirmModalProps {
    open: boolean;
    title?: string;
    message?: string;
    onCancel: () => void;
    onConfirm: () => Promise<void> | void;
}

const DeleteConfirmModal = ({
    open,
    title = "Excluir",
    message = "Tem certeza que deseja excluir este item? Essa ação não poderá ser desfeita.",
    onCancel,
    onConfirm,
}: DeleteConfirmModalProps) => {
    const [visible, setVisible] = useState(open);
    const [closing, setClosing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            const timeout = window.setTimeout(() => {
                setVisible(true);
                setClosing(false);
                setLoading(false);
            }, 0);

            return () => window.clearTimeout(timeout);
        }

        if (!visible) return;

        const closingTimeout = window.setTimeout(() => {
            setClosing(true);
        }, 0);

        const unmountTimeout = window.setTimeout(() => {
            setVisible(false);
            setClosing(false);
        }, 350);

        return () => {
            window.clearTimeout(closingTimeout);
            window.clearTimeout(unmountTimeout);
        };
    }, [open, visible]);

    useEffect(() => {
        if (!visible) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [visible]);

    useEffect(() => {
        if (!visible) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !loading && !closing) {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [closing, loading, onCancel, visible]);

    const handleConfirm = async () => {
        if (loading) return;

        try {
            setLoading(true);
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <div
            className={`delete-confirm-modal${closing ? " delete-confirm-modal--closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-modal-title"
            aria-describedby="delete-confirm-modal-message"
        >
            <div
                className="delete-confirm-modal__backdrop"
                onClick={() => {
                    if (!loading) onCancel();
                }}
                aria-hidden="true"
            />

            <div className="delete-confirm-modal__card">
                <div className="delete-confirm-modal__icon">
                    <TriangleAlert aria-hidden="true" />
                </div>

                <h2
                    id="delete-confirm-modal-title"
                    className="delete-confirm-modal__title"
                >
                    {title}
                </h2>

                <p
                    id="delete-confirm-modal-message"
                    className="delete-confirm-modal__message"
                >
                    {message}
                </p>

                <div className="delete-confirm-modal__actions">
                    <button
                        type="button"
                        className="delete-confirm-modal__cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className="delete-confirm-modal__confirm"
                        onClick={() => void handleConfirm()}
                        disabled={loading}
                    >
                        {loading ? "Excluindo..." : "Excluir"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
