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

    console.log("2 - carregando scripts");

    await Promise.all([

        loadScript(GOOGLE_API),
        loadScript(GOOGLE_IDENTITY),

    ]);

    console.log("3 - scripts carregados");

    console.log("google", window.google);
    console.log("gapi", window.gapi);

};

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SCOPES =
    "https://www.googleapis.com/auth/drive.readonly";

let tokenClient: any = null;
let accessToken: string | null = null;

let onPhotoImported:
    | ((photo: any) => void)
    | null = null;

export const initializeGoogleAuth = async (
    callback?: (photo: any) => void
) => {

    onPhotoImported = callback ?? null;

    console.log("1 - initializeGoogleAuth");

    await loadGooglePicker();

    tokenClient = window.google.accounts.oauth2.initTokenClient({

        client_id: CLIENT_ID,

        scope: SCOPES,

        callback: (response: any) => {

            accessToken = response.access_token;

            console.log("token recebido");

            console.log("carregando picker");

            window.gapi.load("picker", {

                callback: () => {

                    console.log("picker carregado");
                    console.log(window.google.picker);

                    openGooglePicker();

                },

            });

        },

    });

};

export const requestAccessToken = () => {

    if (!tokenClient) {

        throw new Error(
            "Google Auth não inicializado."
        );

    }

    tokenClient.requestAccessToken({

        prompt: "consent",

    });

};

export const openGooglePicker = () => {

    console.log("abrindo picker");

    console.log(
        "API KEY:",
        import.meta.env.VITE_GOOGLE_API_KEY
    );

    console.log(
        "CLIENT ID:",
        import.meta.env.VITE_GOOGLE_CLIENT_ID
    );

    console.log(
        "PROJECT:",
        import.meta.env.VITE_GOOGLE_PROJECT_NUMBER
    );

    if (!accessToken) {

        throw new Error(
            "Access Token não encontrado."
        );

    }

    const view = new window.google.picker.DocsView()

        .setIncludeFolders(true)

        .setSelectFolderEnabled(false)

        .setMimeTypes(
            "image/jpeg,image/png,image/webp,image/heic,image/heif"
        );

    const picker = new window.google.picker.PickerBuilder()

        .addView(view)

        .setOAuthToken(accessToken)

        .setDeveloperKey(
            import.meta.env.VITE_GOOGLE_API_KEY
        )

        .setAppId(
            import.meta.env.VITE_GOOGLE_PROJECT_NUMBER
        )

        .setCallback(async (data: any) => {

            console.log(data);

            if (
                data.action !==
                window.google.picker.Action.PICKED
            ) {
                return;
            }

            const file = data.docs[0];

            console.log(file);

            console.log("ID:", file.id);
            console.log("Nome:", file.name);
            console.log("URL:", file.url);
            console.log("Mime:", file.mimeType);

            try {

                const result = await importDriveFile({

                    fileId: file.id,
                    accessToken: accessToken!,

                });

                console.log(result);

                onPhotoImported?.(result);

            } catch (error) {

                console.error(error);

            }

        })

        .build();

    picker.setVisible(true);

};