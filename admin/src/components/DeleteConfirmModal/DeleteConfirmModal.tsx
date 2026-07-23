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

    const [visible, setVisible] =
        useState(open);

    const [closing, setClosing] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    useEffect(() => {

        if (open) {

            setVisible(true);

            setClosing(false);

            setLoading(false);

            return;

        }

        if (visible) {

            setClosing(true);

            const timeout =
                setTimeout(() => {

                    setVisible(false);

                    setClosing(false);

                }, 350);

            return () =>
                clearTimeout(timeout);

        }

    }, [open, visible]);

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
            className={`delete-modal ${
                closing
                    ? "delete-modal--closing"
                    : ""
            }`}
        >

            <div
                className="delete-modal__backdrop"
                onClick={() => {

                    if (!loading) {

                        onCancel();

                    }

                }}
            />

            <div className="delete-modal__card">

                <div className="delete-modal__icon">

                    <TriangleAlert />

                </div>

                <h2 className="delete-modal__title">

                    {title}

                </h2>

                <p className="delete-modal__message">

                    {message}

                </p>

                <div className="delete-modal__actions">

                    <button
                        className="delete-modal__cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >

                        Cancelar

                    </button>

                    <button
                        className="delete-modal__confirm"
                        onClick={handleConfirm}
                        disabled={loading}
                    >

                        {loading
                            ? "Excluindo..."
                            : "Excluir"}

                    </button>

                </div>

            </div>

        </div>

    );

};

export default DeleteConfirmModal;