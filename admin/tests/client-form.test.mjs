import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { prepareClientRequest, clientCreationErrorMessage } from '../src/pages/ClientForm/clientFormData.ts';

const base = { name: '', phone: '', emails: [], password: '', confirmPassword: '', active: true };

test('empty/name/phone/contact-only creation and payload allowlist', () => {
    for (const extra of [{}, { name: ' Name ' }, { phone: '123' },
        { emails: ['a@example.com'] }, { emails: ['a@example.com', 'b@example.com'] }]) {
        const result = prepareClientRequest({ ...base, ...extra });
        assert.equal('password' in result, false);
        assert.deepEqual(Object.keys(result).sort(), ['active', 'emails', 'name', 'phone']);
    }
    const result = prepareClientRequest({ ...base, emails: ['', ' ', ' A.B+tag@Example.com '],
        password: ' secret ', confirmPassword: ' secret ' });
    assert.deepEqual(result.emails, ['A.B+tag@Example.com']);
    assert.equal(result.password, ' secret ');
    assert.equal('confirmPassword' in result, false);
});

test('rejects duplicates, invalid emails, over-limit and invalid password combinations', () => {
    for (const extra of [{ emails: ['A@example.com', ' a@EXAMPLE.COM '] },
        { emails: ['bad'] }, { emails: Array.from({ length: 11 }, (_, i) => `a${i}@example.com`) },
        { password: 'sample', confirmPassword: 'sample' },
        { emails: ['a@example.com'], password: 'sample', confirmPassword: 'different' },
        { confirmPassword: 'sample' }]) {
        assert.throws(() => prepareClientRequest({ ...base, ...extra }));
    }
    assert.equal(prepareClientRequest({ ...base,
        emails: Array.from({ length: 10 }, (_, i) => `a${i}@example.com`) }).emails.length, 10);
});

test('operational/HTTP errors are safe and uncertain outcomes warn before retry', () => {
    assert.match(clientCreationErrorMessage({ response: { status: 409 } }), /outro Cliente/);
    assert.match(clientCreationErrorMessage({ response: { status: 422 } }), /Revise/);
    assert.match(clientCreationErrorMessage({}), /antes de tentar novamente/);
    assert.match(clientCreationErrorMessage({ response: { status: 503, data: {
        code: 'provisioning_reconciliation_required', detail: 'private detail',
    } } }), /verificação operacional/);
    assert.equal(clientCreationErrorMessage(new Error('private detail')).includes('private detail'), false);
});

// Evaluate actual components/services with existing TypeScript and small hook/API
// doubles. No DOM framework, browser Firebase access, or dependency installation.
const require = createRequire(import.meta.url);
function load(path, mocks, globals = {}) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2023,
    } }).outputText;
    const module = { exports: {} };
    const localRequire = (id) => id.endsWith('.css') ? {} : (mocks[id] ?? require(id));
    new Function('require', 'module', 'exports', 'setTimeout', 'navigator', code)(
        localRequire, module, module.exports, globals.setTimeout ?? setTimeout, globals.navigator ?? globalThis.navigator);
    return module.exports;
}

function treeNodes(node) {
    if (!node || typeof node !== 'object') return [];
    return [node, ...React.Children.toArray(node.props?.children).flatMap(treeNodes)];
}

function formHarness(provision = async () => ({})) {
    let cursor = 0;
    const slots = [], calls = [], notices = [], navigations = [], timers = [];
    const hooks = {
        useState(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = initial;
            return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
        },
        useRef(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = { current: initial };
            return slots[index];
        },
    };
    const Modal = () => null;
    const Loading = () => null;
    const { default: Form } = load('../src/pages/ClientForm/ClientForm.tsx', {
        react: hooks,
        'react-router-dom': { useNavigate: () => (path) => navigations.push(path) },
        '../../contexts/ToastContext': { useToast: () => ({ showToast: (...args) => notices.push(args) }) },
        '../../services/api/clients': { provisionClient: (data) => { calls.push(data); return provision(data); } },
        '../../components/ConfirmClientModal/ConfirmClientModal': { __esModule: true, default: Modal },
        '../../components/LoadingModal/LoadingModal': { __esModule: true, default: Loading },
        './clientFormData': { prepareClientRequest, clientCreationErrorMessage, MAX_CLIENT_EMAILS: 10 },
    }, { setTimeout: (resolve, delay) => timers.push({ resolve, delay }) });
    const render = () => { cursor = 0; return treeNodes(Form()); };
    const find = (predicate) => render().find(predicate);
    return { calls, notices, navigations, render, find, timers,
        loading: () => find((node) => node.type === Loading),
        modal: () => find((node) => node.type === Modal),
        input: (id, value) => find((node) => node.props.id === id).props.onChange({ target: { value } }),
        review: () => find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} }),
    };
}

test('dynamic rows add/remove, enforce ten, and allow removal of last', () => {
    const form = formHarness();
    const add = () => form.find((node) => node.props.className === 'client-form__add-email');
    assert.equal(form.render().filter((node) => node.type === 'input' && node.props.type === 'email').length, 0);
    for (let i = 0; i < 11; i++) add().props.onClick();
    assert.equal(add().props.disabled, true);
    assert.equal(form.render().filter((node) => node.type === 'input' && node.props.type === 'email').length, 10);
    for (let i = 0; i < 10; i++) form.find((node) => node.props.className === 'client-form__remove-email').props.onClick();
    assert.equal(add().props.disabled, false);
    form.review();
    assert.deepEqual(form.modal().props.summary.emails, []);
});

test('first click reviews only; cancel preserves values and never sends', () => {
    const form = formHarness();
    form.input('client-name', 'Test Name');
    form.review();
    assert.equal(form.calls.length, 0);
    assert.equal(form.modal().props.summary.name, 'Test Name');
    form.modal().props.onCancel();
    assert.equal(form.modal(), undefined);
    assert.equal(form.find((node) => node.props.id === 'client-name').props.value, 'Test Name');
    assert.equal(form.calls.length, 0);
});

test('confirmation sends once, blocks double clicks, succeeds and navigates', async () => {
    let resolve;
    const form = formHarness(() => new Promise((done) => { resolve = done; }));
    form.review();
    const confirm = form.modal().props.onConfirm;
    const pending = confirm();
    await confirm();
    assert.equal(form.calls.length, 1);
    assert.equal(form.modal(), undefined);
    assert.equal(form.loading().props.open, true);
    assert.equal(form.loading().props.success, false);
    assert.equal(form.loading().props.progress, 5);
    resolve({});
    await new Promise((done) => setImmediate(done));
    assert.equal(form.loading().props.success, true);
    assert.equal(form.loading().props.progress, 100);
    assert.equal(form.navigations.length, 0);
    assert.equal(form.timers[0].delay, 900);
    form.timers[0].resolve();
    await new Promise((done) => setImmediate(done));
    assert.equal(form.loading().props.open, false);
    assert.equal(form.timers[1].delay, 350);
    assert.equal(form.navigations.length, 0);
    form.timers[1].resolve();
    await pending;
    assert.equal(form.modal(), undefined);
    assert.deepEqual(form.navigations, ['/clients']);
    assert.equal(form.notices.at(-1)[1], 'success');
    await confirm(); // A stale handler after success cannot submit again.
    assert.equal(form.calls.length, 1);
});

test('failure returns to editable form with every value preserved; retry requires new review', async () => {
    const form = formHarness(async () => { throw { response: { status: 409 } }; });
    const values = { 'client-name': 'Retained', 'client-phone': '(11) 99999-1234',
        'client-password': 'private-password', 'client-confirm-password': 'private-password',
        'client-active': 'inactive' };
    for (const [id, value] of Object.entries(values)) form.input(id, value);
    form.find((node) => node.props.className === 'client-form__add-email').props.onClick();
    form.input('client-email-0', 'a@example.com');
    values['client-email-0'] = 'a@example.com';
    form.review();
    await form.modal().props.onConfirm();
    assert.equal(form.modal(), undefined);
    assert.equal(form.loading().props.open, false);
    assert.equal(form.loading().props.success, false);
    assert.equal(form.loading().props.progress, 0);
    assert.equal(form.find((node) => node.type === 'fieldset').props.disabled, false);
    assert.ok(form.find((node) => node.type === 'form'));
    for (const [id, value] of Object.entries(values)) {
        assert.equal(form.find((node) => node.props.id === id).props.value, value);
    }
    assert.deepEqual(form.notices, [['Um dos e-mails já pertence a outro Cliente.', 'error']]);
    assert.equal(form.navigations.length, 0);
    form.input('client-email-0', 'invalid');
    form.review();
    assert.equal(form.modal(), undefined); // Validation runs again before another review.
    form.input('client-email-0', 'b@example.com');
    form.review();
    assert.deepEqual(form.modal().props.summary.emails, ['b@example.com']);
    assert.equal('error' in form.modal().props, false);
    await form.modal().props.onConfirm();
    assert.equal(form.calls.length, 2);
    assert.equal(form.modal(), undefined);
});

test('uncertain result warns only through toast without exposing response secrets', async () => {
    for (const failure of [new Error('private-password'), { response: { status: 503, data: {
        code: 'provisioning_reconciliation_required', detail: 'private-password',
        shareLink: 'https://example.test/#private-secret',
    } } }]) {
        const form = formHarness(async () => { throw failure; });
        form.review();
        await form.modal().props.onConfirm();
        assert.equal(form.modal(), undefined);
        assert.equal(form.loading().props.open, false);
        assert.equal(form.find((node) => node.type === 'fieldset').props.disabled, false);
        assert.equal(form.navigations.length, 0);
        assert.equal(form.notices[0][1], 'error');
        assert.match(form.notices[0][0], /verificação operacional antes de tentar novamente/);
        assert.doesNotMatch(form.notices[0][0], /private-password|private-secret|https:/);
    }
});

test('dedicated modal shows missing values, status, available access and only password presence', () => {
    const { default: Modal } = load('../src/components/ConfirmClientModal/ConfirmClientModal.tsx', {
        react: { useEffect() {}, useRef: () => ({ current: null }), useState: () => [false, () => {}] },
    });
    const summary = { name: '', phone: '', emails: [], hasPassword: false, active: true };
    const render = (value) => renderToStaticMarkup(React.createElement(Modal, {
        summary: value, loading: false, onCancel() {}, onConfirm() {},
    }));
    const empty = render(summary);
    assert.equal(empty.includes('role="alert"'), false);
    assert.equal(empty.includes('confirm-client-modal__error'), false);
    assert.match(empty, /Não informado/);
    assert.match(empty, /Nenhum informado/);
    assert.match(empty, /Não informada/);
    assert.match(empty, /Acesso por link exclusivo/);
    assert.equal(empty.includes("próxima etapa"), false);
    const populated = render({ ...summary, name: 'Name', phone: '123',
        emails: ['a@example.com', 'b@example.com'], hasPassword: true, active: false });
    assert.match(populated, /a@example.com/);
    assert.match(populated, /b@example.com/);
    assert.match(populated, /Informada/);
    assert.match(populated, /Inativo/);
    assert.equal(populated.includes('type="password"'), false);
    assert.match(populated, /aria-modal="true"/);
});

test('API service posts only allowlisted request fields to admin endpoint', async () => {
    const calls = [];
    const { provisionClient } = load('../src/services/api/clients.ts', {
        './client': { __esModule: true, default: { post: async (...args) => {
            calls.push(args); return { data: { clientId: 'test' } };
        } } },
    });
    await provisionClient({ name: '', phone: '', emails: ['a@example.com'], password: ' sample ',
        active: true, confirmPassword: 'sample', uid: 'blocked', clientId: 'blocked', role: 'admin' });
    assert.equal(calls[0][0], '/admin/clients');
    assert.deepEqual(Object.keys(calls[0][1]).sort(), ['active', 'emails', 'name', 'password', 'phone']);
    assert.equal(calls[0][1].password, ' sample ');
});


test('modal waits for exit animation on cancel, Escape and backdrop; blocks closing while loading', () => {
    for (const action of ['cancel', 'escape', 'backdrop']) {
        for (const loading of [false, true]) {
            let cancelled = 0, confirmed = 0;
            const { default: Modal } = load('../src/components/ConfirmClientModal/ConfirmClientModal.tsx', {
                react: { useEffect() {}, useRef: (value) => ({ current: value }),
                    useState: () => [false, () => {}] },
            });
            const dialog = Modal({ summary: { name: '', phone: '', emails: [], hasPassword: false, active: true },
                loading, onCancel: () => cancelled++, onConfirm: () => confirmed++ });
            const nodes = treeNodes(dialog);
            const cancel = nodes.find((node) => node.props.className === 'confirm-client-modal__cancel');
            const confirm = nodes.find((node) => node.props.className === 'confirm-client-modal__confirm');
            if (action === 'cancel') cancel.props.onClick();
            if (action === 'escape') dialog.props.onCancel({ preventDefault() {} });
            if (action === 'backdrop') {
                const target = { getBoundingClientRect: () => ({ left: 10, right: 100, top: 10, bottom: 100 }) };
                dialog.props.onClick({ target, currentTarget: target, clientX: 0, clientY: 0 });
            }
            assert.equal(cancelled, 0);
            confirm.props.onClick();
            assert.equal(confirmed, 0);
            const target = {};
            dialog.props.onAnimationEnd({ target, currentTarget: target, animationName: 'confirm-client-card-in' });
            assert.equal(cancelled, 0);
            dialog.props.onAnimationEnd({ target, currentTarget: target, animationName: 'confirm-client-card-out' });
            assert.equal(cancelled, loading ? 0 : 1);
        }
    }
});

function clientsHarness(request = async () => 'https://public.example/cliente/acesso#test', clipboard = async () => {}) {
    let cursor = 0, effectInstalled = false;
    const slots = [], calls = [], notices = [], navigations = [], copies = [];
    const clients = [{ id: 'a', name: 'Client A', emails: [], phone: '', albumsCount: 0 },
        { id: 'b', name: '', emails: [], phone: '', albumsCount: 0 }];
    const hooks = {
        useState(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = initial;
            return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
        },
        useRef(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = { current: initial };
            return slots[index];
        },
        useEffect(effect) { if (!effectInstalled) { effectInstalled = true; effect(); } },
        useMemo: (compute) => compute(),
    };
    const { default: Clients } = load('../src/pages/Clients/Clients.tsx', {
        react: hooks,
        'react-router-dom': { useNavigate: () => (path) => navigations.push(path) },
        '../../contexts/ToastContext': { useToast: () => ({ showToast: (...args) => notices.push(args) }) },
        '../../services/api/clients': { getClientShareLink: (id) => { calls.push(id); return request(id); } },
        '../../services/firebase/clients': { subscribeClients: (receive) => { receive(clients); return () => {}; } },
        '../../utils/clientEmails': { matchesClientEmail: () => false },
    }, { navigator: { clipboard: { writeText: (value) => { copies.push(value); return clipboard(value); } } } });
    const render = () => { cursor = 0; return treeNodes(Clients()); };
    render();
    const buttons = () => render().filter((node) => node.type === 'button' && node.props['aria-label']?.startsWith('Copiar'));
    return { render, buttons, calls, notices, navigations, copies };
}

test('desktop and mobile actions are edit/link/delete, with accessible fallback', () => {
    const form = clientsHarness();
    const { Pencil, Link, Trash2 } = require('lucide-react');
    const groups = form.render().filter((node) => node.props.className === 'clients__actions');
    assert.equal(groups.length, 4);
    for (const group of groups) {
        const children = React.Children.toArray(group.props.children);
        assert.deepEqual(children.map((node) => node.props.children.type), [Pencil, Link, Trash2]);
    }
    assert.equal(form.buttons()[0].props['aria-label'], 'Copiar link de acesso de Client A');
    assert.equal(form.buttons()[1].props['aria-label'], 'Copiar link de acesso do cliente');
});

test('copy locks only that Client including stale/mobile handlers, copies then toasts, never navigates', async () => {
    let resolve;
    const form = clientsHarness(() => new Promise((done) => { resolve = done; }));
    const stale = form.buttons();
    const pending = stale[0].props.onClick();
    await stale[0].props.onClick();
    await stale[2].props.onClick();
    assert.deepEqual(form.calls, ['a']);
    assert.deepEqual(form.buttons().map((node) => node.props.disabled), [true, false, true, false]);
    resolve('https://public.example/cliente/acesso#test');
    await pending;
    assert.deepEqual(form.copies, ['https://public.example/cliente/acesso#test']);
    assert.deepEqual(form.notices, [['Link copiado com sucesso.', 'success']]);
    assert.equal(form.buttons()[0].props.disabled, false);
    assert.deepEqual(form.navigations, []);
});

test('button stays busy through clipboard and another Client can copy concurrently', async () => {
    const clipboardResolvers = [];
    const form = clientsHarness(async (id) => `link-${id}`, () => new Promise((done) => clipboardResolvers.push(done)));
    const first = form.buttons()[0].props.onClick();
    await new Promise((done) => setImmediate(done));
    assert.equal(form.buttons()[0].props.disabled, true);
    assert.equal(form.notices.length, 0);
    const second = form.buttons()[1].props.onClick();
    await new Promise((done) => setImmediate(done));
    assert.deepEqual(form.calls, ['a', 'b']);
    clipboardResolvers[0]();
    await first;
    assert.deepEqual(form.buttons().slice(0, 2).map((node) => node.props.disabled), [false, true]);
    clipboardResolvers[1]();
    await second;
});

test('backend and clipboard failures never report copied and always unlock', async () => {
    const backend = clientsHarness(async () => { throw new Error('Não foi possível obter o link.'); });
    await backend.buttons()[0].props.onClick();
    assert.equal(backend.copies.length, 0);
    assert.equal(backend.notices[0][1], 'error');
    assert.equal(backend.buttons()[0].props.disabled, false);
    const clipboard = clientsHarness(undefined, async () => { throw new Error('private clipboard detail'); });
    await clipboard.buttons()[0].props.onClick();
    assert.equal(clipboard.notices[0][1], 'error');
    assert.match(clipboard.notices[0][0], /área de transferência/);
    assert.equal(clipboard.notices[0][0].includes('private'), false);
    assert.equal(clipboard.buttons()[0].props.disabled, false);
    assert.deepEqual(clipboard.navigations, []);
});

test('link API posts to authenticated endpoint and strips private backend errors', async () => {
    const calls = [];
    let failure;
    const { getClientShareLink } = load('../src/services/api/clients.ts', {
        './client': { __esModule: true, default: { post: async (...args) => {
            calls.push(args);
            if (failure) throw failure;
            return { data: { shareLink: 'https://public.example/cliente/acesso#test' } };
        } } },
    });
    assert.equal(await getClientShareLink('client id'), 'https://public.example/cliente/acesso#test');
    assert.deepEqual(calls[0], ['/admin/clients/client%20id/link']);
    for (const status of [409, 503]) {
        failure = { response: { status, data: { shareLink: 'private', detail: 'private' } } };
        await assert.rejects(getClientShareLink('a'), (error) => {
            assert.equal(error.message.includes('private'), false);
            assert.equal('response' in error, false);
            assert.match(error.message, status === 409 ? /revogado/ : /Não foi possível/);
            return true;
        });
    }
});
