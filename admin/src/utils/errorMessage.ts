export const getErrorMessage = (
    error: unknown
): string => {


    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error
    ) {


        const firebaseError =
            error as {
                code: string;
            };


        switch (
            firebaseError.code
        ) {


            case "auth/invalid-credential":

                return "E-mail ou senha incorretos.";


            case "auth/user-not-found":

                return "Usuário não encontrado.";


            case "auth/wrong-password":

                return "Senha incorreta.";


            case "auth/too-many-requests":

                return "Muitas tentativas. Aguarde alguns minutos.";


            case "auth/network-request-failed":

                return "Erro de conexão. Verifique sua internet.";


            default:

                return "Ocorreu um erro inesperado.";

        }

    }


    if (error instanceof Error) {

        return error.message;

    }


    return "Ocorreu um erro inesperado.";

};