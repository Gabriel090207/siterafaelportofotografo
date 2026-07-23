import { importDriveFile } from "../api/google";

declare global {

    interface Window {

        google: any;

        gapi: any;

    }

}

const GOOGLE_API = "https://apis.google.com/js/api.js";
const GOOGLE_IDENTITY = "https://accounts.google.com/gsi/client";

const loadScript = (src: string) => {

    return new Promise<void>((resolve, reject) => {

        const existing = document.querySelector(
            `script[src="${src}"]`
        );

        if (existing) {

            resolve();
            return;

        }

        const script = document.createElement("script");

        script.src = src;
        script.async = true;
        script.defer = true;

        script.onload = () => resolve();
        script.onerror = () => reject();

        document.body.appendChild(script);

    });

};

export const loadGooglePicker = async () => {

    

    await Promise.all([

        loadScript(GOOGLE_API),
        loadScript(GOOGLE_IDENTITY),

    ]);

   

};

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ACCOUNT_EMAIL =
    import.meta.env.VITE_GOOGLE_ACCOUNT_EMAIL;

const SCOPES =
    "https://www.googleapis.com/auth/drive.readonly";

let tokenClient: any = null;
let accessToken: string | null = null;

let onFileImported:
    | ((file: any) => void)
    | null = null;

export const initializeGoogleAuth = async (
    callback?: (photo: any) => void
) => {

    onFileImported = callback ?? null;

if (tokenClient) {
    return;
}

  

    await loadGooglePicker();

    tokenClient = window.google.accounts.oauth2.initTokenClient({

        client_id: CLIENT_ID,

        scope: SCOPES,

        auto_select: true,

        callback: (response: any) => {

            accessToken = response.access_token;


            window.gapi.load("picker", {

                callback: () => {

                    

                    openGooglePicker();

                },

            });

        },

    });

};



let hasAuthorized = false;

export const requestAccessToken = () => {

    if (!tokenClient) {

        throw new Error(
            "Google Auth não inicializado."
        );

    }

    tokenClient.requestAccessToken({

    prompt: hasAuthorized ? "" : "consent",

    login_hint: ACCOUNT_EMAIL,

});

    hasAuthorized = true;

};


export const openGooglePicker = () => {

   

    if (!accessToken) {
        throw new Error(
            "Access Token não encontrado."
        );
    }

    const view =
        new window.google.picker.DocsView()
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false)
            .setMimeTypes(
                "image/jpeg,image/png,image/webp,image/heic,image/heif"
            );

    const picker =
        new window.google.picker.PickerBuilder()

            .addView(view)

            // Permite selecionar vários arquivos
            .enableFeature(
                window.google.picker.Feature
                    .MULTISELECT_ENABLED
            )

            .setOAuthToken(accessToken)

            .setDeveloperKey(
                import.meta.env.VITE_GOOGLE_API_KEY
            )

            .setAppId(
                import.meta.env
                    .VITE_GOOGLE_PROJECT_NUMBER
            )

            .setCallback(async (data: any) => {

               
                if (
                    data.action !==
                    window.google.picker.Action.PICKED
                ) {
                    return;
                }

                const files = data.docs ?? [];

                if (files.length === 0) {
                    return;
                }


                /*
                 * Importa um arquivo por vez.
                 * Isso evita muitas requisições simultâneas
                 * para o backend e para o Firebase.
                 */
                for (const file of files) {

                  

                    try {

                        const result =
                            await importDriveFile({

                                fileId: file.id,

                                accessToken:
                                    accessToken!,

                            });

                      

                        onFileImported?.(result);

                    } catch (error) {

                        console.error(
                            `Erro ao importar ${file.name}:`,
                            error
                        );

                    }

                }

            })

            .build();

    picker.setVisible(true);

};


export const getAccessToken = () => accessToken;