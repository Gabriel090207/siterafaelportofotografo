import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

const publicId = 'p'.repeat(22), secret = 's'.repeat(43);
const validFragment = `#${publicId}.${secret}`;

async function source(path, context) {
    const text = await readFile(new URL(path, import.meta.url), 'utf8');
    return new vm.SourceTextModule(ts.transpileModule(text, { compilerOptions: {
        target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText, { context, initializeImportMeta(meta) { meta.env = { VITE_API_URL: 'https://api.test' }; } });
}
function synthetic(exports, context) {
    return new vm.SyntheticModule(Object.keys(exports), function () {
        for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
}

async function loadFlow(hash = validFragment, response = { ok: true, json: async () => ({ customToken: 'test-token' }) }) {
    const calls = { fetch: [], tokens: [], urls: [] };
    const auth = { currentUser: { uid: 'UID_A' } };
    const window = {
        location: { hash, pathname: '/cliente/acesso', search: '' },
        history: { state: { idx: 2 }, replaceState(state, _, url) {
            assert.deepEqual(state, { idx: 2 });
            calls.urls.push(url);
            window.location.hash = '';
        } },
    };
    const context = vm.createContext({ window, fetch: async (...args) => {
        assert.equal(window.location.hash, '');
        calls.fetch.push(args);
        return response;
    }, console: { log() { throw new Error('Unexpected log'); }, error() { throw new Error('Unexpected log'); } } });
    const firebase = synthetic({
        getAuth: () => auth,
        signInWithCustomToken: async (current, token) => {
            assert.equal(current, auth);
            calls.tokens.push(token);
            auth.currentUser = { uid: 'UID_B' };
            return { user: auth.currentUser };
        },
        signInWithEmailAndPassword: () => { throw new Error('No native login'); },
        signOut: () => { throw new Error('No explicit logout'); },
    }, context);
    const app = synthetic({ default: {} }, context);
    const loginApi = await source('../src/services/api/clientLogin.ts', context);
    const linkApi = await source('../src/services/api/clientLinkLogin.ts', context);
    const firebaseAuth = await source('../src/services/firebase/auth.ts', context);
    const flow = await source('../src/pages/ClientLinkAccess/consumeClientLink.ts', context);
    await flow.link((specifier) => {
        if (specifier.endsWith('/api/clientLinkLogin')) return linkApi;
        if (specifier.endsWith('/firebase/auth')) return firebaseAuth;
        if (specifier === '../api/clientLogin') return loginApi;
        if (specifier === 'firebase/auth') return firebase;
        if (specifier === './firebase') return app;
        throw new Error('Unexpected import');
    });
    await flow.evaluate();
    return { consume: flow.namespace.consumeClientLink, calls, auth, window };
}

test('consumes fragment before request, posts only credential, replaces existing A session with B', async () => {
    const { consume, calls, auth } = await loadFlow();
    assert.equal(await consume(), 'UID_B');
    assert.deepEqual(calls.urls, ['/cliente/acesso']);
    assert.equal(calls.fetch[0][0], 'https://api.test/client/link-login');
    assert.deepEqual(JSON.parse(calls.fetch[0][1].body), { publicId, secret });
    assert.equal(calls.fetch[0][1].cache, 'no-store');
    assert.deepEqual(calls.tokens, ['test-token']);
    assert.equal(auth.currentUser.uid, 'UID_B');
    // No storage or cookies exist in the context, and logs would throw.
});

test('malformed or missing fragment is cleared and does not call backend', async () => {
    for (const fragment of ['', '#bad', `#${publicId}.${secret}.extra`, '#uid.secret']) {
        const { consume, calls, window } = await loadFlow(fragment);
        await assert.rejects(consume(), (error) => error.message === 'Link inválido ou indisponível.');
        assert.equal(window.location.hash, '');
        assert.equal(calls.fetch.length, 0);
        assert.equal(calls.tokens.length, 0);
    }
});

test('refresh after consumption cannot reuse the secret', async () => {
    const { consume, calls } = await loadFlow();
    await consume();
    await assert.rejects(consume());
    assert.equal(calls.fetch.length, 1);
    assert.equal(calls.tokens.length, 1);
});

test('failed exchange leaves prior session intact and exposes only generic error', async () => {
    const { consume, calls, auth } = await loadFlow(validFragment, {
        ok: false, json: () => { throw new Error('Must not read error body'); },
    });
    await assert.rejects(consume(), (error) => error.message === 'Link inválido ou indisponível.');
    assert.equal(calls.tokens.length, 0);
    assert.equal(auth.currentUser.uid, 'UID_A');
});

async function pageHarness(exchange) {
    const context = vm.createContext({});
    let cursor = 0;
    const slots = [], effects = [], navigations = [];
    let session = { status: 'authenticated', client: { uid: 'UID_A' } };
    const navigate = (...args) => navigations.push(args);
    const react = synthetic({
        useRef(value) {
            const i = cursor++;
            slots[i] ??= { current: value };
            return slots[i];
        },
        useState(value) {
            const i = cursor++;
            if (!(i in slots)) slots[i] = value;
            return [slots[i], (next) => { slots[i] = next; }];
        },
        useEffect(run, deps) {
            const i = cursor++;
            const prior = slots[i];
            if (!prior || deps.some((value, index) => value !== prior.deps[index])) {
                const effect = { run, deps, cleanup: null };
                slots[i] = effect;
                effects.push(effect);
            }
        },
    }, context);
    const page = await source('../src/pages/ClientLinkAccess/ClientLinkAccess.tsx', context);
    const modules = {
        react,
        'react/jsx-runtime': synthetic({ jsx, jsxs, Fragment }, context),
        'react-router-dom': synthetic({ Link: 'a', useNavigate: () => navigate }, context),
        '../../hooks/useClientAuth': synthetic({ useClientAuth: () => session }, context),
        '../../services/api/clientLinkLogin': synthetic({ LINK_LOGIN_ERROR: 'Link inválido ou indisponível.' }, context),
        './consumeClientLink': synthetic({ consumeClientLink: exchange }, context),
        '../ClientLogin/ClientLogin.css': synthetic({}, context),
        './ClientLinkAccess.css': synthetic({}, context),
    };
    await page.link((specifier) => modules[specifier]);
    await page.evaluate();
    return {
        navigations,
        session: (value) => { session = value; },
        render() { cursor = 0; return page.namespace.default(); },
        flush() { for (const effect of effects.splice(0)) effect.cleanup = effect.run(); },
        replay() { for (const effect of slots.filter((slot) => slot?.run)) {
            effect.cleanup?.(); effect.cleanup = effect.run();
        } },
    };
}

test('page waits for B provider validation, navigates with replace, and StrictMode does not exchange twice', async () => {
    let calls = 0;
    const page = await pageHarness(async () => { calls++; return 'UID_B'; });
    page.render(); page.flush(); page.replay();
    await new Promise((resolve) => setImmediate(resolve));
    page.render(); page.flush();
    assert.equal(calls, 1);
    assert.equal(page.navigations.length, 0);
    page.session({ status: 'initializing', client: null });
    page.render(); page.flush();
    assert.equal(page.navigations.length, 0);
    page.session({ status: 'authenticated', client: { uid: 'UID_B' } });
    page.render(); page.flush();
    assert.equal(page.navigations[0][0], '/cliente/dashboard');
    assert.equal(page.navigations[0][1].replace, true);
});

test('page shows generic error and normal login link after failure', async () => {
    const page = await pageHarness(async () => { throw new Error('private detail'); });
    page.render(); page.flush();
    await new Promise((resolve) => setImmediate(resolve));
    const tree = page.render();
    const serialized = JSON.stringify(tree);
    assert.ok(serialized.includes('Link inválido ou indisponível.'));
    assert.ok(serialized.includes('"to":"/cliente"'));
    assert.ok(serialized.includes('"className":"client-login__submit"'));
    assert.ok(serialized.includes('"className":"client-link-access__actions"'));
    assert.equal(serialized.includes('private detail'), false);
    assert.equal(page.navigations.length, 0);
});
