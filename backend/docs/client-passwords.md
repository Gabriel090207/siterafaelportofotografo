# Internal Client password infrastructure

This service is not wired to any endpoint, login, signup, or Firebase Auth.
Do not enable it until deployed Firestore rules deny all browser reads/writes
(including authenticated admins) to `clientPasswordCredentials`. Admin SDK
access is governed by server IAM. No rule deployment is performed by this step.
The future HTTP caller must authenticate and authorize administrative set,
change, delete and reveal operations. Reveal responses must use `no-store`.

## Configuration

The existing application loads environment configuration through python-dotenv.
The new key provider reads the process environment only when encryption or
recovery is requested; importing it does not load secrets or initialize Firebase.

- `CLIENT_PASSWORD_ACTIVE_KEY_ID`: identifier used for new encrypted credentials.
- `CLIENT_PASSWORD_KEYS_JSON`: secret JSON object mapping key IDs to standard
  Base64-encoded 32-byte AES keys. Base64 is serialization, not encryption.

Production must inject these through a secure deployment secret mechanism.
Never commit actual values or put them in Firestore. No default key is supplied,
no key is generated at boot, and missing/invalid configuration raises
`PasswordKeyConfigurationError`. Verification uses the password hash and does
not require the encryption key. Recovery selects the stored `keyId`, so older
keys must remain available until a separately designed rotation is complete.

## Crypto and record

Argon2id uses cryptography's PHC derive/verify API: memory 65536 KiB, 3 passes,
4 lanes, random 16-byte salt and 32-byte output. Benchmark concurrency before
exposing login; each hash operation uses about 64 MiB of working memory.
AES-256-GCM uses a fresh random 12-byte nonce per encryption, with the tag
included in ciphertext by the library. No password trimming or normalization
occurs; an empty string is rejected and whitespace-only passwords are retained.

`clientPasswordCredentials/{clientId}` holds one record per Client:
`clientId`, `passwordHash`, `encryptedPassword`, `credentialVersion`,
`createdAt`, `updatedAt`. The nested encrypted value contains `algorithm`,
`formatVersion`, `keyId`, `nonce`, and `ciphertext` (last two encoded in Base64).
Neither the key nor plaintext is persisted. The public `clients` document and
email reservations are untouched.

AAD is exactly the UTF-8 encoding of this ordered JSON array with
`ensure_ascii=True` and separators `(',', ':')`:

`["client-password", 1, clientId, credentialVersion, keyId, "AES-256-GCM"]`

`credentialVersion` is a fresh UUID4 for each set/change, including recreation
after deletion. It is an opaque revision identifier, not an increasing counter.
A transaction retry retains the version prepared for that operation.
Set/change checks Client existence and reads the previous credential, then
replaces the entire private document in one atomic write, retaining createdAt.
Concurrent updates use Firestore transaction retries; the last committed change
wins. Delete removes the private record; it is idempotent. None of these
operations revokes existing Firebase sessions.

## Internal API

`ClientPasswordService` exposes `set_client_password`, `change_client_password`,
`verify_client_password`, `reveal_client_password`, `delete_client_password`,
and `has_client_password`. Set and change are both upserts for an existing Client.
No credential means no document: has/verify return false, reveal raises
`ClientPasswordAbsent`. Reveal returns only an in-memory string, without writes
or logging. Callers must never log its return value or capture sensitive locals.

The crypto module exposes `hash_password`, `verify_password`, `encrypt_password`
and `decrypt_password`. Argon2id verifies through the library, without manual
hash comparison. Authentication failures from AES-GCM reject recovery.

## Tests and limitations

Run from backend: `PYTHONDONTWRITEBYTECODE=1 venv/bin/python -m unittest discover -s tests -v`.
Tests use real cryptography with ephemeral test keys and a memory persistence
double. They never initialize Firebase or access production. The double checks
single-write replacement and failed-commit behavior; it does not validate real
Firestore contention, IAM, Security Rules, or automatic transaction retries.
The environment tested has cryptography 49.0.0; requirements pins 46.0.3, whose
documented PHC and AESGCM APIs also support this implementation. Dependencies
were not installed or changed. Legacy passwords are not recovered or migrated.
