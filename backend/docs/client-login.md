# Transitional Client login

`POST /client/login` accepts only `email` and `password`. Success returns only
`{"customToken": "..."}`. Invalid credentials produce the same 401 detail:
`E-mail ou senha inválidos.` Infrastructure errors produce a generic 503.
All these responses have `Cache-Control: no-store`. Locally validated requests
reject extra fields (including clientId/uid), do not echo validation inputs,
and cap email at 320 characters and password at 4096. Password spaces are kept.
No request bodies, exceptions, passwords or tokens are logged by the new code.
Disable capture of bodies/sensitive locals in deployment observability as well.

## New credential path

The existing normalization helper resolves the hashed reservation document ID.
The reservation must have the matching normalizedEmail, a valid clientId,
and a corresponding Client containing that alias. Inactive clients, missing
UIDs, missing credentials, and stale/corrupt reservations fail closed.
`ClientPasswordService.verify_client_password` verifies Argon2id; AES/key
configuration is not used. The service rereads the credential, reservation and
Client to catch changes during verification. It also requires a unique Client
for the UID and an existing, enabled Firebase Auth user before issuing a minimal
Admin SDK custom token. No user is created and no UID or claim is changed.
Firestore and Firebase token issuance are not a single transaction: a narrow
race remains after the final checks. Existing private APIs retain their own
active/revocation checks. Stronger session-version enforcement is future work.

## Legacy compatibility

No public response identifies an account as legacy. No browser fallback exists.
Only when there is no reservation can the backend look up the native Firebase
user by email and find exactly one Client by that UID (indexed query, no scan).
The Client must have no `emails` field at all, no private password credential,
and a matching singular legacy email. An explicit `emails: []` fails closed.
Do not remove the emails field from Clients that have entered the new flow;
this presence acts as a conservative transition boundary. Incomplete states
(reservation without credential, credential without reservation, or explicit
emails without credential) are rejected instead of reverting to native login.

Configure `FIREBASE_WEB_API_KEY` in the backend deployment with this Firebase
project's Web API key, authorized for Identity Toolkit server-side requests.
This is required for legacy compatibility; it is not supplied by the browser.
No environment file is changed by this implementation. Deploy the backend and
configuration before the new frontend. Missing config produces generic 503.

The backend validates legacy credentials using Identity Toolkit
`accounts:signInWithPassword` over HTTPS with timeouts and redirects disabled.
It verifies the returned ID token with the configured Admin SDK project and
requires localId/token UID/Client UID to match. Returned ID/refresh tokens are
not returned, persisted, or logged. Only a fresh custom token is sent to the UI.
The legacy flow, like any Firebase sign-in, may update Firebase sign-in metadata.

## Migration and native password provider

No on-login migration, index backfill, password writes or mode flags are made.
Firestore reservation/password operations and native provider changes cannot
be committed atomically together. The native password may still work directly;
a Client using the new endpoint is NOT thereby fully migrated.

Firebase documents `auth.update_user(uid, providers_to_delete=['password'])` to
unlink the password provider without deleting the UID. The installed SDK's
user-management implementation supports deleteProvider too. This operation is
NOT performed here: effects on existing sessions, recovery/reset/relink paths,
and failure recovery must be verified in staging before a coordinated rollout.
Do not disable/delete the whole Firebase user, which would block custom login.

The next migration step needs a persistent transition state, controlled legacy
email collision resolution, atomic reservation/credential preparation, provider
unlink with retry/recovery, and verification that direct password login fails
while custom login and the intended session policy still work. Only then mark
migration complete. A failed migration must never enable native fallback again.

References:
- https://firebase.google.com/docs/reference/rest/auth
- https://firebase.google.com/docs/reference/admin/python/firebase_admin.auth#update_user
- https://firebase.google.com/docs/auth/admin/create-custom-tokens

## Security and deployment prerequisites

No existing rate limiter was found and none was added. Rate limiting per IP,
normalized identifier AND Client is mandatory before public exposure, together
with request size/concurrency limits. Every Argon2 verification uses about
64 MiB; aliases must not bypass a Client-wide limit. Provider throttling is not
a substitute for protecting this endpoint.

A lazily cached random dummy Argon2id hash provides verification work for
unknown/invalid/ineligible identities. The legacy path also performs dummy work.
The first dummy use additionally generates the hash; Firestore/Auth/network
latencies still differ. This does NOT promise constant timing or eliminate all
timing side channels. Malformed request validation is account-independent.

Deny browser access to both private collections in deployed Firestore rules.
Signing permissions/service-account configuration must support custom tokens.
No actual deployment, Firebase configuration change, or production login was
performed. No native provider was removed and existing sessions were not revoked.

## Frontend and tests

The page calls the backend then signInWithCustomToken. The old native helper is
retained as loginLegacyClient but is never invoked automatically by the page.
ClientAuthProvider, onIdTokenChanged, ID tokens, Bearer APIs, /client/session,
get_authenticated_client and protected routes are unchanged. Tokens are not
manually stored in localStorage. The page no longer logs raw login errors.

Backend: `PYTHONDONTWRITEBYTECODE=1 venv/bin/python -m unittest discover -s tests -v`
Frontend: `node --experimental-vm-modules --test tests/client-login.test.mjs`

Tests use real Argon2 verification, memory Firestore doubles, mocked Firebase
Admin/REST, and a test-only FastAPI instance. Frontend tests transpile actual TS
modules with the existing TypeScript dependency and mock network/Firebase in
Node's VM. They do not test a browser, real token exchange, IAM, Firestore rules,
transaction concurrency or the existing provider UI end to end.
