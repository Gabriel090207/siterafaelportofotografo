import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from "react";


import Toast from "../components/Toast/Toast";

import type {
    ToastType,
} from "../components/Toast/Toast";



interface ToastData {

    id: number;

    message: string;

    type: ToastType;

}



interface ToastContextProps {

    showToast: (
        message: string,
        type?: ToastType
    ) => void;

}



const ToastContext =
    createContext<ToastContextProps | null>(null);



interface ToastProviderProps {

    children: ReactNode;

}



export const ToastProvider = ({
    children,
}: ToastProviderProps) => {


    const [toasts, setToasts] =
        useState<ToastData[]>([]);



    const removeToast = (
        id: number
    ) => {

        setToasts((current) =>
            current.filter(
                (toast) =>
                    toast.id !== id
            )
        );

    };



    const showToast = useCallback(
        (
            message: string,
            type: ToastType = "success"
        ) => {


            const id =
                Date.now();



            setToasts((current) => [

                ...current,

                {
                    id,
                    message,
                    type,
                },

            ]);



            setTimeout(() => {

                removeToast(id);

            }, 3500);


        },
        []
    );



    return (

        <ToastContext.Provider
            value={{
                showToast,
            }}
        >

            {children}


            <div>

                {toasts.map((toast) => (

                    <Toast

                        key={toast.id}

                        message={
                            toast.message
                        }

                        type={
                            toast.type
                        }

                        onClose={() =>
                            removeToast(
                                toast.id
                            )
                        }

                    />

                ))}

            </div>


        </ToastContext.Provider>

    );

};



export const useToast = () => {


    const context =
        useContext(
            ToastContext
        );


    if (!context) {

        throw new Error(
            "useToast deve ser usado dentro do ToastProvider"
        );

    }


    return context;

};