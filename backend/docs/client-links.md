# Internal exclusive Client link credentials

No HTTP endpoint, UI, token exchange or provisioning integration is added here.
The service is callable only from future authorized backend operations. It does
not scan/backfill Clients and never calls Firebase Auth.

## Storage and identity

- `clientLinkCredentials/{clientId}`: exactly one current record per Client.
  Fields: clientId, publicId, secretHash, encryptedSecret, credentialVersion,
  active, createdAt, updatedAt.
- `clientLinkLookup/{publicId}`: clientId and credentialVersion only.

Both collections are PRIVATE. Before enabling future access, deployed rules
must deny browser reads/writes, including browser admin SDK clients; server
Admin SDK access is governed by IAM. Collection names do not enforce privacy.
No secret/hash/cipher is written into the public Client document.

publicId uses `secrets.token_urlsafe(16)` (128 random bits, 22 URL-safe characters).
It is non-secret and cannot authenticate alone. The independent secret uses
`secrets.token_urlsafe(32)` (256 random bits, 43 URL-safe characters). UUID4 is
used for the opaque credentialVersion. No identifier is derived from a Client,
UID, email or personal data. SHA-256(secret ASCII bytes), stored as hex, is
appropriate for a high-entropy random secret; validation uses compare_digest.

## Encryption and keys

AES-256-GCM, 12-byte random nonce, tag included in ciphertext; both serialized
as Base64 in encryptedSecret along with algorithm, formatVersion=1 and keyId.
The generic AES envelope lives in secret_crypto.py; password wrappers preserve
their existing format and AAD. No second AES implementation was introduced.

The existing EnvironmentPasswordKeys provider is deliberately reused:
`CLIENT_PASSWORD_ACTIVE_KEY_ID` and secret `CLIENT_PASSWORD_KEYS_JSON` supply
the active ID and Base64-encoded 32-byte keys. These names remain unchanged for
configuration compatibility; the keyring now supports two separate purposes.
Production must inject keys securely outside Firestore/source control. Missing,
invalid or unknown keys raise PasswordKeyConfigurationError (existing internal
configuration exception). No key is generated at boot. The service also accepts
an injected key provider. No dependency/environment file changes are needed.

Link AAD is UTF-8 JSON with ensure_ascii=True and separators=(',', ':'):
`["client-link",1,clientId,publicId,credentialVersion,keyId,"AES-256-GCM"]`.
Password AAD still starts with client-password and has its original fields.
Moving ciphertext across Clients, public IDs, versions, keys or purposes fails
AEAD authentication. Changing the active key only affects newly issued links;
old links can still be recovered while their stored keyId remains in the keyring.
No bulk rotation is implemented. Hash validation does not use decryption/keys.

## Operations

`ClientLinkService.get_or_create(clientId)` creates on demand if absent, including
for legacy Clients, or recovers the same active credential. A revoked credential
raises ClientLinkRevoked: merely consulting it never reactivates access.
`regenerate(clientId)` explicitly issues a new publicId/secret/hash/cipher/version,
replaces the current record and deletes the previous lookup atomically. It can
also create when absent or revoked. createdAt is retained, updatedAt changes.

`reveal(clientId)` returns a RecoveredClientLink object holding public_id,
credential_version and an explicitly accessible secret property in memory.
The object has a redacted repr and no automatic dict/JSON serialization; future
callers must not log or serialize the secret except in the authorized recovery
response. Retrieval decrypts and checks the recovered secret against its hash.
Missing credentials raise ClientLinkAbsent. No writes are made during reveal.

`validate(publicId, secret)` reads lookup and canonical credential and Client
in a transaction; it checks index/version/ownership/active/hash and a valid
canonical UID, returning only ValidatedClientLink(client_id, uid,
credential_version), or None for invalid credentials. No secret or ciphertext
is returned. Inactive Clients or missing UIDs are rejected. It never issues a
custom token and does not verify Firebase user existence in this step.

`revoke(clientId)` marks active=false and deletes the lookup atomically. Repeated
revocation (or no credential) is a no-op. The encrypted record remains private,
but reveal/get-or-create refuse revoked records. `has_active_link(clientId)`
reports credential state and checks lookup consistency; Client active=false
still prevents validation independently. Client/email/password/Auth records
and already authenticated Firebase sessions are unaffected.

## Transactions, concurrency and future URLs

All reads precede queued writes. The credential document keyed by clientId
serializes issuance/regeneration/revocation. A competing get-or-create retries
and returns the winning active record rather than issuing a second link. A
publicId collision fails without overwriting another lookup. Candidate material
is generated once per operation and reused on retries. No full URL is persisted.
A future token-exchange endpoint must account for changes after validation;
this service does not promise revocation of a token/session already issued.

No official backend public-site-base setting was found for these links. URL
assembly is deferred: configure a public base and chosen route later, with
`#publicId.secret` in the fragment, never the path/query. The future frontend
must capture the fragment, immediately clear it, then POST the credential for
exchange. Fragments normally are not sent in HTTP requests/Referer, but remain
sensitive to browser scripts/history/extensions; do not send them to analytics.
Future endpoints need authorization for recovery/regeneration/revocation,
no-store responses, rate limiting and scrubbed request/error logging.

## Verification and limits

Tests use real crypto, temporary keys and memory Firestore transaction doubles,
without Firebase initialization or production access. They cover generation,
lookup, repeat recovery, tampering, wrong/missing keys, key changes, regeneration,
revocation, identity-only validation, password-format compatibility and simulated
retry after a concurrent winner. No real emulator contention, IAM, deployed rules
or public access flow was tested. Existing backend test/check commands apply.
