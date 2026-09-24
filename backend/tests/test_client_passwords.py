import base64
import copy
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services.client_password_crypto import (
    EnvironmentPasswordKeys, InvalidPassword, InvalidPasswordCredential,
    PasswordKeyConfigurationError, decrypt_password, encrypt_password,
    hash_password, verify_password,
)
from app.services.client_passwords import (
    CREDENTIALS_COLLECTION, ClientPasswordAbsent, ClientPasswordService,
    PasswordClientNotFound,
)


class TestKeys:
    def __init__(self):
        self.key = os.urandom(32)

    def active_id(self):
        return 'test-key'

    def load(self, key_id):
        return self.key


class CryptoTests(unittest.TestCase):
    def setUp(self):
        self.keys = TestKeys()

    def test_hash_verification_and_random_salt(self):
        first = hash_password('test password')
        second = hash_password('test password')
        self.assertTrue(verify_password('test password', first))
        self.assertFalse(verify_password('wrong password', first))
        self.assertTrue(first != second)
        self.assertTrue(verify_password('test password', second))

    def test_round_trip_preserves_spaces_and_unicode(self):
        for password in [' senha ', ' ', 'Senha ç 🔒']:
            encrypted = encrypt_password(password, 'x', 'v1', self.keys)
            self.assertTrue(decrypt_password(encrypted, 'x', 'v1', self.keys) == password)
        hashed = hash_password(' senha ')
        self.assertTrue(verify_password(' senha ', hashed))
        self.assertFalse(verify_password('senha', hashed))

    def test_empty_rejected(self):
        for operation in [lambda: hash_password(''),
                          lambda: verify_password('', 'invalid'),
                          lambda: encrypt_password('', 'x', 'v1', self.keys)]:
            with self.assertRaises(InvalidPassword):
                operation()

    def test_random_nonce(self):
        first = encrypt_password('sample', 'x', 'v1', self.keys)
        second = encrypt_password('sample', 'x', 'v1', self.keys)
        self.assertTrue(first['nonce'] != second['nonce'])
        self.assertTrue(first['ciphertext'] != second['ciphertext'])

    def test_tampering(self):
        encrypted = encrypt_password('sample', 'x', 'v1', self.keys)
        for field in ['nonce', 'ciphertext']:
            changed = dict(encrypted)
            raw = bytearray(base64.b64decode(changed[field]))
            raw[0] ^= 1
            changed[field] = base64.b64encode(raw).decode()
            with self.subTest(field=field), self.assertRaises(InvalidPasswordCredential):
                decrypt_password(changed, 'x', 'v1', self.keys)

    def test_wrong_client_version_key_and_key_id(self):
        encrypted = encrypt_password('sample', 'x', 'v1', self.keys)
        for client_id, version, keys in [('y', 'v1', self.keys),
                                         ('x', 'v2', self.keys),
                                         ('x', 'v1', TestKeys())]:
            with self.assertRaises(InvalidPasswordCredential):
                decrypt_password(encrypted, client_id, version, keys)
        changed = {**encrypted, 'keyId': 'changed'}
        with self.assertRaises(InvalidPasswordCredential):
            decrypt_password(changed, 'x', 'v1', self.keys)

    def test_missing_environment_key(self):
        encrypted = encrypt_password('sample', 'x', 'v1', self.keys)
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(PasswordKeyConfigurationError):
                encrypt_password('sample', 'x', 'v1')
            with self.assertRaises(PasswordKeyConfigurationError):
                decrypt_password(encrypted, 'x', 'v1')

    def test_environment_key_loading_and_validation(self):
        import json
        encoded = base64.b64encode(self.keys.key).decode()
        with patch.dict(os.environ, {
            'CLIENT_PASSWORD_ACTIVE_KEY_ID': 'test-key',
            'CLIENT_PASSWORD_KEYS_JSON': json.dumps({'test-key': encoded}),
        }, clear=True):
            encrypted = encrypt_password('sample', 'x', 'v1')
            self.assertTrue(decrypt_password(encrypted, 'x', 'v1') == 'sample')
            for malformed in ['bad json', '[]', '{}', '{"test-key":"bad"}']:
                os.environ['CLIENT_PASSWORD_KEYS_JSON'] = malformed
                with self.assertRaises(PasswordKeyConfigurationError):
                    EnvironmentPasswordKeys().load('test-key')

    def test_malformed_encrypted_data(self):
        for value in [None, {}, {'algorithm': 'unsupported'}]:
            with self.assertRaises(InvalidPasswordCredential):
                decrypt_password(value, 'x', 'v1', self.keys)


class MemoryDB:
    def __init__(self):
        self.docs = {('clients', 'x'): {'emails': ['a@example.com', 'b@example.com']}}
        self.writes = 0
        self.fail_commit = False

    def collection(self, name):
        return SimpleNamespace(document=lambda doc_id: MemoryRef(self, (name, doc_id)))

    def transaction(self):
        return MemoryTransaction(self)


class MemoryRef:
    def __init__(self, db, key):
        self.db, self.key = db, key

    def get(self, transaction=None):
        if transaction:
            assert transaction.pending is None, 'Read after write'
        data = copy.deepcopy(self.db.docs.get(self.key))
        return SimpleNamespace(exists=data is not None, to_dict=lambda: data)

    def delete(self):
        self.db.docs.pop(self.key, None)


class MemoryTransaction:
    def __init__(self, db):
        self.db = db
        self.pending = None

    def set(self, ref, data):
        assert self.pending is None, 'Credential must use one write'
        self.pending = (ref.key, data)

    def commit(self):
        if self.db.fail_commit:
            raise RuntimeError('Simulated commit failure')
        if self.pending:
            key, data = self.pending
            self.db.docs[key] = copy.deepcopy(data)
            self.db.writes += 1


def fake_transactional(function):
    def run(transaction):
        result = function(transaction)
        transaction.commit()
        return result
    return run


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.db = MemoryDB()
        self.service = ClientPasswordService(self.db, TestKeys())
        self.patch = patch('app.services.client_passwords.firestore.transactional', fake_transactional)
        self.patch.start()
        self.addCleanup(self.patch.stop)

    def test_absent(self):
        self.assertFalse(self.service.has_client_password('x'))
        self.assertFalse(self.service.verify_client_password('x', 'sample'))
        with self.assertRaises(ClientPasswordAbsent):
            self.service.reveal_client_password('x')
        self.assertEqual(self.db.writes, 0)

    def test_replace_and_delete(self):
        first = self.service.set_client_password('x', 'old password')
        created = self.db.docs[(CREDENTIALS_COLLECTION, 'x')]['createdAt']
        second = self.service.change_client_password('x', 'new password')
        self.assertTrue(first != second)
        self.assertFalse(self.service.verify_client_password('x', 'old password'))
        self.assertTrue(self.service.verify_client_password('x', 'new password'))
        self.assertTrue(self.service.reveal_client_password('x') == 'new password')
        self.assertTrue(self.service.has_client_password('x'))
        record = self.db.docs[(CREDENTIALS_COLLECTION, 'x')]
        self.assertTrue(record['credentialVersion'] == second)
        self.assertTrue(record['createdAt'] == created)
        self.assertEqual(self.db.writes, 2)
        self.service.delete_client_password('x')
        self.service.delete_client_password('x')
        self.assertFalse(self.service.has_client_password('x'))
        self.assertFalse(self.service.verify_client_password('x', 'new password'))
        with self.assertRaises(ClientPasswordAbsent):
            self.service.reveal_client_password('x')
        third = self.service.set_client_password('x', 'another password')
        self.assertTrue(third not in [first, second])

    def test_single_private_record_and_no_plaintext(self):
        before = copy.deepcopy(self.db.docs[('clients', 'x')])
        self.service.set_client_password('x', 'private test password')
        self.assertEqual(self.db.docs[('clients', 'x')], before)
        self.assertEqual(len(self.db.docs), 2)
        record = self.db.docs[(CREDENTIALS_COLLECTION, 'x')]
        self.assertEqual(set(record), {'clientId', 'passwordHash', 'encryptedPassword',
                                      'credentialVersion', 'createdAt', 'updatedAt'})
        self.assertTrue('private test password' not in repr(record))
        writes = self.db.writes
        self.service.reveal_client_password('x')
        self.assertEqual(self.db.writes, writes)

    def test_failed_commit_keeps_old_credential(self):
        self.service.set_client_password('x', 'old')
        self.db.fail_commit = True
        with self.assertRaises(RuntimeError):
            self.service.change_client_password('x', 'new')
        self.assertTrue(self.service.verify_client_password('x', 'old'))
        self.assertTrue(self.service.reveal_client_password('x') == 'old')
        self.assertEqual(self.db.writes, 1)

    def test_missing_client(self):
        with self.assertRaises(PasswordClientNotFound):
            self.service.set_client_password('missing', 'sample')
        self.assertEqual(self.db.writes, 0)

    def test_missing_key_prevents_write(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(PasswordKeyConfigurationError):
                ClientPasswordService(self.db).set_client_password('x', 'sample')
        self.assertEqual(self.db.writes, 0)

    def test_moved_record_rejected(self):
        self.service.set_client_password('x', 'sample')
        self.db.docs[(CREDENTIALS_COLLECTION, 'y')] = copy.deepcopy(
            self.db.docs[(CREDENTIALS_COLLECTION, 'x')])
        with self.assertRaises(InvalidPasswordCredential):
            self.service.reveal_client_password('y')
        self.db.docs[(CREDENTIALS_COLLECTION, 'y')]['clientId'] = 'y'
        with self.assertRaises(InvalidPasswordCredential):
            self.service.reveal_client_password('y')


if __name__ == '__main__':
    unittest.main()
