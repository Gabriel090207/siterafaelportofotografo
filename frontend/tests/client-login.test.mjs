import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise actual TS modules with Firebase/network doubles; no browser or accounts.
async function loadLogin(fetchResponse, exchangeError) {
    const calls = { fetch: [], custom: [], legacy: 0 };
    const context = vm.createContext({
        fetch: async (...args) => {
            calls.fetch.push(args);
            return fetchResponse;
        },
    });
    const firebase = new vm.SyntheticModule(
        ['getAuth', 'signInWithCustomToken', 'signInWithEmailAndPassword', 'signOut'],
        function () {
            this.setExport('getAuth', () => 'test-auth');
            this.setExport('signInWithCustomToken', async (...args) => {
                calls.custom.push(args);
                if (exchangeError) throw exchangeError;
                return { user: { uid: 'UID_X' } };
            });
            this.setExport('signInWithEmailAndPassword', async () => {
                calls.legacy += 1;
                return { user: { uid: 'legacy' } };
            });
            this.setExport('signOut', async () => {});
        }, { context },
    );
    const app = new vm.SyntheticModule(['default'], function () {
        this.setExport('default', {});
    }, { context });
    async function source(path) {
        const code = await readFile(new URL(path, import.meta.url), 'utf8');
        return new vm.SourceTextModule(ts.transpileModule(code, {
            compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
        }).outputText, {
            context,
            initializeImportMeta(meta) { meta.env = { VITE_API_URL: 'https://api.test' }; },
        });
    }
    const api = await source('../src/services/api/clientLogin.ts');
    const auth = await source('../src/services/firebase/auth.ts');
    await auth.link((specifier) => {
        if (specifier === 'firebase/auth') return firebase;
        if (specifier === './firebase') return app;
        if (specifier === '../api/clientLogin') return api;
        throw new Error('Unexpected import');
    });
    await auth.evaluate();
    return { login: auth.namespace.loginClient, calls };
}

test('backend receives only credentials and custom token reaches Firebase', async () => {
    const { login, calls } = await loadLogin({
        ok: true, json: async () => ({ customToken: 'test-token' }),
    });
    const user = await login('a@example.com', ' sample ');
    assert.equal(user.uid, 'UID_X');
    assert.equal(calls.fetch[0][0], 'https://api.test/client/login');
    assert.deepEqual(JSON.parse(calls.fetch[0][1].body), {
        email: 'a@example.com', password: ' sample ',
    });
    assert.equal(calls.fetch[0][1].cache, 'no-store');
    assert.deepEqual(calls.custom[0], ['test-auth', 'test-token']);
    assert.equal(calls.legacy, 0);
    // No localStorage exists in this context: the login completes without it.
});

test('invalid credentials never fall back or consume a sensitive error body', async () => {
    const { login, calls } = await loadLogin({
        ok: false, status: 401, json: async () => { throw new Error('Must not read'); },
    });
    await assert.rejects(login('a@example.com', 'sample'),
        (error) => error.code === 'auth/invalid-credential' && !error.message.includes('sample'));
    assert.equal(calls.legacy, 0);
    assert.equal(calls.custom.length, 0);
});

test('malformed success response cannot start Firebase authentication', async () => {
    const { login, calls } = await loadLogin({ ok: true, json: async () => ({}) });
    await assert.rejects(login('a@example.com', 'sample'));
    assert.equal(calls.custom.length, 0);
    assert.equal(calls.legacy, 0);
});

test('Firebase token exchange failure does not fall back to password login', async () => {
    const { login, calls } = await loadLogin({
        ok: true, json: async () => ({ customToken: 'test-token' }),
    }, new Error('Exchange failed'));
    await assert.rejects(login('a@example.com', 'sample'));
    assert.equal(calls.custom.length, 1);
    assert.equal(calls.legacy, 0);
});
