import { LINK_LOGIN_ERROR, requestClientLinkToken } from "../../services/api/clientLinkLogin";
import { loginClientWithCustomToken } from "../../services/firebase/auth";

function requestTokenFromFragment(): Promise<string> {
    const fragment = window.location.hash;
    // Preserve router history state and remove credentials before starting the request.
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    const match = /^#([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/.exec(fragment);
    if (!match) throw new Error(LINK_LOGIN_ERROR);
    return requestClientLinkToken(match[1], match[2]);
}

export async function consumeClientLink(): Promise<string> {
    try {
        // Credentials stay in the short-lived request scope; only the UID reaches the page.
        const user = await requestTokenFromFragment().then(loginClientWithCustomToken);
        return user.uid;
    } catch {
        throw new Error(LINK_LOGIN_ERROR);
    }
}
