import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
    type ReactNode,
} from "react";

import Toast, { type ToastType } from "../components/Toast/Toast";

interface ToastData {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

interface ToastProviderProps {
    children: ReactNode;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const nextId = useRef(0);

    const showToast = useCallback(
        (message: string, type: ToastType = "success") => {
            nextId.current += 1;

            setToasts((current) => [
                ...current,
                {
                    id: nextId.current,
                    message,
                    type,
                },
            ]);
        },
        []
    );

    const removeToast = useCallback((id: number) => {
        setToasts((current) =>
            current.filter((toast) => toast.id !== id)
        );
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div
                className="toast-container"
                aria-live="polite"
                aria-relevant="additions"
            >
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onRemove={removeToast}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast deve ser usado dentro do ToastProvider");
    }

    return context;
}
