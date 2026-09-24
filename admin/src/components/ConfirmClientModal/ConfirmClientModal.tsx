import { useEffect, useRef, useState } from "react";
import "./ConfirmClientModal.css";

export interface ClientCreationSummary {
    name: string;
    phone: string;
    emails: string[];
    hasPassword: boolean;
    active: boolean;
}

interface Props {
    summary: ClientCreationSummary;
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmClientModal({ summary, loading, onCancel, onConfirm }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [closing, setClosing] = useState(false);
    const closingRef = useRef(false);
    const requestClose = () => {
        if (loading || closingRef.current) return;
        closingRef.current = true;
        setClosing(true);
    };
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const dialog = dialogRef.current;
        dialog?.showModal();
        return () => {
            dialog?.close();
            previous?.focus();
        };
    }, []);

    const access = summary.hasPassword
        ? "E-mail e senha ou link exclusivo."
        : summary.emails.length
            ? "Link exclusivo (e-mails somente para contato)."
            : "Acesso por link exclusivo.";

    return (
        <dialog ref={dialogRef} className={`confirm-client-modal${closing ? " confirm-client-modal--closing" : ""}`} aria-modal="true"
            aria-labelledby="confirm-client-title" aria-busy={loading}
            onCancel={(event) => { event.preventDefault(); requestClose(); }}
            onAnimationEnd={(event) => {
                if (event.target === event.currentTarget && event.animationName === "confirm-client-card-out"
                    && closingRef.current && !loading) onCancel();
            }}
            onClick={(event) => {
                if (event.target !== event.currentTarget || loading || closingRef.current) return;
                const rect = event.currentTarget.getBoundingClientRect();
                if (event.clientX < rect.left || event.clientX > rect.right
                    || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
            }}>
            <h2 id="confirm-client-title">Confirmar criação do cliente</h2>
            <dl>
                <dt>Nome</dt><dd>{summary.name || "Não informado"}</dd>
                <dt>WhatsApp</dt><dd>{summary.phone || "Não informado"}</dd>
                <dt>E-mails</dt><dd>{summary.emails.length
                    ? <ul>{summary.emails.map((email) => <li key={email}>{email}</li>)}</ul>
                    : "Nenhum informado"}</dd>
                <dt>Senha</dt><dd>{summary.hasPassword ? "Informada" : "Não informada"}</dd>
                <dt>Status</dt><dd>{summary.active ? "Ativo" : "Inativo"}</dd>
                <dt>Formas de acesso</dt><dd>{access}</dd>
            </dl>
            <div className="confirm-client-modal__actions">
                <button type="button" className="confirm-client-modal__cancel" autoFocus
                    disabled={loading || closing} onClick={requestClose}>Cancelar</button>
                <button type="button" className="confirm-client-modal__confirm" disabled={loading || closing}
                    onClick={() => { if (!loading && !closingRef.current) onConfirm(); }}>{loading ? "Criando..." : "Confirmar criação"}</button>
            </div>
        </dialog>
    );
}
