import "./Toast.css";

import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Info,
    X,
} from "lucide-react";


export type ToastType =
    | "success"
    | "error"
    | "warning"
    | "info";


interface ToastProps {

    message: string;

    type: ToastType;

    onClose: () => void;

}



const Toast = ({
    message,
    type,
    onClose,
}: ToastProps) => {


    const icons = {

        success:
            <CheckCircle size={22} />,

        error:
            <XCircle size={22} />,

        warning:
            <AlertTriangle size={22} />,

        info:
            <Info size={22} />,

    };


    return (

        <div
            className={`toast toast--${type}`}
        >

            <div className="toast__icon">

                {icons[type]}

            </div>


            <p className="toast__message">

                {message}

            </p>


            <button
                className="toast__close"
                onClick={onClose}
            >

                <X size={18} />

            </button>


        </div>

    );

};


export default Toast;