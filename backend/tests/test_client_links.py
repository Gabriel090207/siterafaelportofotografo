import base64
import copy
import json
import os
import re
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services.client_links import (
    ClientLinkService, ClientLinkAbsent, ClientLinkRevoked, InvalidClientLink,
    CREDENTIALS_COLLECTION, LOOKUP_COLLECTION,
)
from app.services.client_password_crypto import PasswordKeyConfigurationError


class Keys:
    def __init__(self):
        self.values = {'one': os.urandom(32)}
        self.active = 'one'

    def active_id(self):
        return self.active

    def load(self, key_id):
        if key_id not in self.values:
            raise PasswordKeyConfigurationError('Chave indisponível.')
        return self.values[key_id]


class DB:
    def __init__(self):
        self.docs = {('clients', c): {'uid': f'UID_{c}', 'active': True} for c in ['a', 'b']}
        self.write_count = 0

    def collection(self, name):
        db = self
        def document(doc_id):
            def get(transaction=None):
                assert not transaction.pending, 'All reads must precede writes'
                value = copy.deepcopy(db.docs.get((name, doc_id)))
                return SimpleNamespace(exists=value is not None, to_dict=lambda: value)
            return SimpleNamespace(key=(name, doc_id), get=get)
        return SimpleNamespace(document=document)

    def transaction(self):
        return Transaction(self)


class Transaction:
    def __init__(self, db):
        self.db, self.pending = db, []

    def set(self, ref, data):
        self.pending.append(('set', ref.key, copy.deepcopy(data)))

    def update(self, ref, data):
        self.pending.append(('update', ref.key, copy.deepcopy(data)))

    def delete(self, ref):
        self.pending.append(('delete', ref.key, None))

    def commit(self):
        docs = copy.deepcopy(self.db.docs)
        for op, key, data in self.pending:
            if op == 'set':
                docs[key] = data
            elif op == 'update':
                docs[key].update(data)
            else:
                docs.pop(key, None)
        self.db.docs = docs
        self.db.write_count += len(self.pending)


def transactional(function):
    def run(transaction):
        value = function(transaction)
        transaction.commit()
        return value
    return run


class LinkTests(unittest.TestCase):
    def setUp(self):
        self.db, self.keys = DB(), Keys()
        self.service = ClientLinkService(self.db, self.keys)
        patcher = patch('app.services.client_links.firestore.transactional', transactional)
        patcher.start()
        self.addCleanup(patcher.stop)

    def record(self, client='a'):
        return self.db.docs[(CREDENTIALS_COLLECTION, client)]

    def test_absence_and_missing_client(self):
        self.assertFalse(self.service.has_active_link('a'))
        with self.assertRaises(ClientLinkAbsent):
            self.service.reveal('a')
        self.service.revoke('a')
        self.assertEqual(self.db.write_count, 0)
        with self.assertRaises(InvalidClientLink):
            self.service.get_or_create('missing')

    def test_generation_and_private_storage(self):
        a, b = self.service.get_or_create('a'), self.service.get_or_create('b')
        self.assertTrue(bool(re.fullmatch(r'[A-Za-z0-9_-]{43}', a.secret)))
        self.assertEqual(len(base64.urlsafe_b64decode(a.secret + '=')), 32)
        self.assertTrue(bool(re.fullmatch(r'[A-Za-z0-9_-]{22}', a.public_id)))
        self.assertTrue(a.secret != b.secret and a.public_id != b.public_id)
        self.assertTrue(a.secret not in repr(self.db.docs))
        self.assertTrue(a.secret not in repr(a))
        with self.assertRaises(TypeError):
            json.dumps(a)
        self.assertNotIn('encryptedSecret', self.db.docs[('clients', 'a')])
        self.assertEqual(len(self.record()['secretHash']), 64)
        self.assertEqual(len([key for key in self.db.docs if key[0] == CREDENTIALS_COLLECTION]), 2)

    def test_reveal_and_get_or_create_reuse_without_writes(self):
        link = self.service.get_or_create('a')
        writes = self.db.write_count
        for result in [self.service.reveal('a'), self.service.get_or_create('a'), self.service.get_or_create('a')]:
            self.assertTrue(result.secret == link.secret)
            self.assertTrue(result.public_id == link.public_id)
            self.assertTrue(result.credential_version == link.credential_version)
        self.assertEqual(self.db.write_count, writes)

    def test_validation_no_decrypt_and_no_secret_in_result(self):
        link = self.service.get_or_create('a')
        with patch('app.services.client_links.decrypt_secret', side_effect=AssertionError('No decryption')):
            identity = self.service.validate(link.public_id, link.secret)
        self.assertEqual(identity.client_id, 'a')
        self.assertEqual(identity.uid, 'UID_a')
        self.assertTrue(link.secret not in repr(identity))
        self.assertIsNone(self.service.validate(link.public_id, 'x' * 43))
        self.assertIsNone(self.service.validate('x' * 22, link.secret))
        self.assertIsNone(self.service.validate('../bad', link.secret))

    def test_regenerate_and_revoke(self):
        old = self.service.get_or_create('a')
        new = self.service.regenerate('a')
        self.assertTrue(old.secret != new.secret and old.public_id != new.public_id)
        self.assertTrue(old.credential_version != new.credential_version)
        self.assertIsNone(self.service.validate(old.public_id, old.secret))
        self.assertIsNotNone(self.service.validate(new.public_id, new.secret))
        self.assertNotIn((LOOKUP_COLLECTION, old.public_id), self.db.docs)
        self.assertEqual(len([key for key in self.db.docs if key[0] == LOOKUP_COLLECTION]), 1)
        before_client = copy.deepcopy(self.db.docs[('clients', 'a')])
        self.service.revoke('a')
        self.assertFalse(self.service.has_active_link('a'))
        self.assertIsNone(self.service.validate(new.public_id, new.secret))
        writes = self.db.write_count
        self.service.revoke('a')
        self.assertEqual(writes, self.db.write_count)
        with self.assertRaises(ClientLinkRevoked):
            self.service.get_or_create('a')
        with self.assertRaises(ClientLinkRevoked):
            self.service.reveal('a')
        self.assertEqual(before_client, self.db.docs[('clients', 'a')])
        regenerated = self.service.regenerate('a')
        self.assertIsNotNone(self.service.validate(regenerated.public_id, regenerated.secret))

    def test_tampered_context_and_envelope(self):
        self.service.get_or_create('a')
        original = copy.deepcopy(self.record())
        for field in ['clientId', 'publicId', 'credentialVersion']:
            changed = copy.deepcopy(original)
            changed[field] += 'changed'
            with self.assertRaises(InvalidClientLink):
                self.service._recover(changed)
        for field in ['nonce', 'ciphertext']:
            changed = copy.deepcopy(original)
            raw = bytearray(base64.b64decode(changed['encryptedSecret'][field]))
            raw[0] ^= 1
            changed['encryptedSecret'][field] = base64.b64encode(raw).decode()
            with self.assertRaises(InvalidClientLink):
                self.service._recover(changed)
        for field, value in [('algorithm', 'invalid'), ('formatVersion', 2)]:
            changed = copy.deepcopy(original)
            changed['encryptedSecret'][field] = value
            with self.assertRaises(InvalidClientLink):
                self.service._recover(changed)

    def test_key_changes_and_missing_configuration(self):
        old = self.service.get_or_create('a')
        self.keys.values['two'] = os.urandom(32)
        self.keys.active = 'two'
        self.assertTrue(self.service.reveal('a').secret == old.secret)
        self.service.get_or_create('b')
        self.assertEqual(self.record('b')['encryptedSecret']['keyId'], 'two')
        self.keys.values['one'] = os.urandom(32)
        with self.assertRaises(InvalidClientLink):
            self.service.reveal('a')
        del self.keys.values['one']
        with self.assertRaises(PasswordKeyConfigurationError):
            self.service.reveal('a')
        with patch.dict(os.environ, {}, clear=True):
            service = ClientLinkService(self.db)
            with self.assertRaises(PasswordKeyConfigurationError):
                service.regenerate('a')
            with self.assertRaises(PasswordKeyConfigurationError):
                service.reveal('b')

    def test_inactive_client_and_corrupt_lookup_fail_closed(self):
        link = self.service.get_or_create('a')
        self.db.docs[('clients', 'a')]['active'] = False
        self.assertIsNone(self.service.validate(link.public_id, link.secret))
        self.db.docs[('clients', 'a')]['active'] = True
        self.db.docs[(LOOKUP_COLLECTION, link.public_id)]['clientId'] = 'b'
        self.assertIsNone(self.service.validate(link.public_id, link.secret))

    def test_retry_after_concurrent_winner_reuses_winner(self):
        winner = []
        def retrying(function):
            def run(transaction):
                function(transaction)  # uncommitted losing candidate
                with patch('app.services.client_links.firestore.transactional', transactional):
                    winner.append(self.service.get_or_create('a'))
                retry = self.db.transaction()
                result = function(retry)
                self.assertEqual(retry.pending, [])
                retry.commit()
                return result
            return run
        with patch('app.services.client_links.firestore.transactional', retrying):
            result = self.service.get_or_create('a')
        self.assertTrue(result.secret == winner[0].secret)
        self.assertTrue(result.public_id == winner[0].public_id)
        self.assertEqual(len([key for key in self.db.docs if key[0] == LOOKUP_COLLECTION]), 1)

    def test_password_aad_wire_compatibility(self):
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        from app.services.client_password_crypto import decrypt_password
        nonce = os.urandom(12)
        aad = json.dumps(['client-password', 1, 'a', 'version', 'one', 'AES-256-GCM'],
                         ensure_ascii=True, separators=(',', ':')).encode()
        cipher = AESGCM(self.keys.values['one']).encrypt(nonce, b'test password', aad)
        encrypted = {'algorithm': 'AES-256-GCM', 'formatVersion': 1, 'keyId': 'one',
                     'nonce': base64.b64encode(nonce).decode(),
                     'ciphertext': base64.b64encode(cipher).decode()}
        self.assertTrue(decrypt_password(encrypted, 'a', 'version', self.keys) == 'test password')
        record = {'clientId': 'a', 'publicId': 'x' * 22, 'credentialVersion': 'version',
                  'encryptedSecret': encrypted, 'secretHash': '0' * 64}
        with self.assertRaises(InvalidClientLink):
            self.service._recover(record)


if __name__ == '__main__':
    unittest.main()
