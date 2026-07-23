import {
    useEffect,
} from "react";

import "./SaveToDriveModal.css";

interface Props {
    open: boolean;
    onCancel: () => void;
    onNo: () => void;
    onYes: () => void;
}

const SaveToDriveModal = ({
    open,
    onCancel,
    onNo,
    onYes,
}: Props) => {

    useEffect(() => {

        if (!open) return;

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {

            document.body.style.overflow =
                previousOverflow;

        };

    }, [open]);

    if (!open) return null;

    return (

        <div className="save-drive">

            <div className="save-drive__card">

                <h3>
                    Salvar também no Google Drive?
                </h3>

                <p>
                    Os arquivos selecionados também serão enviados
                    para o Google Drive, organizados por cliente,
                    álbum e categoria.
                </p>

                <div className="save-drive__actions">

                    <button
                        type="button"
                        className="save-drive__cancel"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className="save-drive__no"
                        onClick={onNo}
                    >
                        Não
                    </button>

                    <button
                        type="button"
                        className="save-drive__yes"
                        onClick={onYes}
                    >
                        Salvar
                    </button>

                </div>

            </div>

        </div>

    );

};

export default SaveToDriveModal;