# Administrative Client provisioning

`POST /admin/clients` requires the existing `get_authenticated_admin` dependency:
Firebase Bearer token validation (including revocation) and an `admins/{uid}`
document. The request accepts only optional `name`, `phone`, `emails`, `password`
and `active` (default true). Unknown fields, UID, clientId, role, albumsCount,
hashes, ciphertext and link secrets are rejected. name/phone may be omitted or
null; emails defaults to [], while explicit null is invalid. Password omitted or
null means no credential; the empty string is invalid, without trimming passwords.
Local request validation avoids returning password inputs in validation errors.

Success is 201, `Cache-Control: no-store`, with:
`clientId`, `uid`, `name`, `phone`, `emails`, `email`, `active`, `role`,
`albumsCount`, `hasPassword`. No password/hash/cipher/token/link is returned.
Errors: 422 invalid input, 409 reserved email, 503 configuration/provider failure.
Uncertain outcomes or failed compensation carry the generic operational code
`provisioning_reconciliation_required`; do not automatically retry them.

## Data and coordination

Name and phone are trimmed; absence is stored as "" for compatibility. There
are no fake names, emails or passwords. role is always client; albumsCount is 0.
The emails helper validates 0..10 addresses and rejects normalized duplicates.
The first presentation email becomes the legacy email projection, or "" for [].

Combinations: []/no password is valid; addresses/no password creates contact-only
addresses and reservations; addresses/password creates one shared credential;
[]/password is rejected before Auth creation. Inactive Clients can be provisioned
but the existing login/private API checks deny access.

Firestore generates an ordinary Client document ID locally before any writes.
Password preparation (including encryption configuration checks) and reservation
preflight happen before Auth creation. The preflight is advisory; the transaction
rechecks the same reservation helpers, so competing provisioners cannot both
commit the same email. No new alternative uniqueness index is introduced.

`firebase_admin.auth.create_user()` receives NO email, password or UID argument.
Firebase generates the canonical UID; it is distinct from the Client document ID.
The new user has no native password credential. No existing Auth user is modified.

One Firestore transaction reads the intended Client/credential references and
all reservations, validates them, then writes Client + reservations + optional
private credential. Password preparation is shared with PASSO 6 and reservation
read/write helpers with PASSO 5; there are no nested transactions. Client has
uid/name/phone/emails/email/albumsCount/active/role/createdAt/updatedAt, without
private credentials. The private record stays in clientPasswordCredentials.

## Compensation, idempotency and remaining crash windows

The Firebase user, Client ID and prepared credential are allocated once per
service invocation, outside Firestore's retry callback. Automatic transaction
retries reuse them; they do not create multiple users, versions or reservations.
A commit error triggers a read-back: if this invocation's Client has committed,
return success without deleting its Firebase user (lost-response recovery).

For confirmed non-commits (validation conflicts or definitive transaction
rejection), attempt to delete ONLY the UID returned by this invocation's create.
UserNotFound is already compensated. Deletion failure logs identifiers and a
fixed reason, without secret values or provider exception text, and requires
operational reconciliation.

For timeout/unavailability with uncertain commit outcome, or failed read-back,
do not delete the Auth user: a remote commit could still succeed. Log clientId,
UID and a fixed reason and report reconciliation required. An Auth create error
may also conceal creation; no UID was received, so log clientId and require
investigation rather than deleting by email. No Firestore writes occur in that
case. Process termination between the two systems can still leave an orphan.

This is per-invocation/retry idempotency, NOT HTTP request idempotency. Repeating
an HTTP request is a new operation; in particular, requests without emails can
create two Clients. There is no durable operation journal or Idempotency-Key
protocol in this step. Before adding automatic retries in ClientForm, introduce
such a protocol and reconciliation workflow. Never blindly retry uncertain 503s
or a request whose success response was lost.

## Legacy and deployment limits

Only the reserved index participates in atomic uniqueness. Unindexed legacy
Clients are NOT covered; do not enable broad use before a controlled legacy
collision/index transition. No scan, migration, backfill or credential creation
for old Clients is performed. Browser writes that bypass the index must be
addressed at rollout. Firebase rules must deny direct browser access to private
credential/reservation collections; Admin SDK access requires appropriate IAM.
Password creation requires the PASSO 6 key configuration. No .env file changes.

The old POST /auth/create-user remains, now requiring get_authenticated_admin.
Its sole code consumer is admin/src/services/api/auth.ts, called by ClientForm;
the Axios interceptor already sends the Firebase Bearer token. No public signup
consumer was found. No admin UI or frontend files are changed.

## Verification

Run backend tests: `PYTHONDONTWRITEBYTECODE=1 venv/bin/python -m unittest discover -s tests`.
Tests use fake Firestore/Auth, real password crypto, the real admin dependency
with token/Firestore doubles, and a test-only FastAPI app. Cases cover valid and
invalid input, one shared credential, alias ownership, auth and commit failure,
compensation failure, lost commit response and transaction retries. They do not
contact production or validate real contention, IAM, security rules, network
ambiguity resolution or a deployed Firebase user. No frontend changed, so no
frontend tests/TypeScript checks are needed for this step.
