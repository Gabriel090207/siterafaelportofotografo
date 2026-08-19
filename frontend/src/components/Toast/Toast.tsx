import "./Toast.css";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    AlertTriangle,
    CheckCircle,
    Info,
    X,
    XCircle,
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
    id: number;
    message: string;
    type: ToastType;
    onRemove: (id: number) => void;
}

const TOAST_DURATION_MS = 3500;
const TOAST_EXIT_MS = 280;

function Toast({ id, message, type, onRemove }: ToastProps) {
    const [closing, setClosing] = useState(false);
    const closingRef = useRef(false);
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const closeToast = useCallback(() => {
        if (closingRef.current) return;

        closingRef.current = true;
        setClosing(true);

        exitTimerRef.current = setTimeout(() => {
            onRemove(id);
        }, TOAST_EXIT_MS);
    }, [id, onRemove]);

    useEffect(() => {
        const durationTimer = setTimeout(closeToast, TOAST_DURATION_MS);

        return () => {
            clearTimeout(durationTimer);

            if (exitTimerRef.current) {
                clearTimeout(exitTimerRef.current);
            }
        };
    }, [closeToast]);

    const icons = {
        success: <CheckCircle size={22} aria-hidden="true" />,
        error: <XCircle size={22} aria-hidden="true" />,
        warning: <AlertTriangle size={22} aria-hidden="true" />,
        info: <Info size={22} aria-hidden="true" />,
    };

    return (
        <div
            className={`toast toast--${type}${closing ? " toast--closing" : ""}`}
            role="status"
        >
            <div className="toast__icon" aria-hidden="true">
                {icons[type]}
            </div>

            <p className="toast__message">{message}</p>

            <button
                type="button"
                className="toast__close"
                onClick={closeToast}
                aria-label="Fechar notificação"
            >
                <X size={18} aria-hidden="true" />
            </button>
        </div>
    );
}

export default Toast;
