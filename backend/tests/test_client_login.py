import copy
import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from firebase_admin import auth

from app.routes.client_login import router
from app.services.client_emails import normalize_client_email, RESERVATIONS_COLLECTION
from app.services.client_login import (
    ClientLoginService, ClientLoginUnavailable, InvalidClientLogin,
    verify_legacy_password, _dummy_hash, _dummy_verify,
)
from app.services.client_password_crypto import hash_password
from app.services.client_passwords import CREDENTIALS_COLLECTION, ClientPasswordService


class DB:
    def __init__(self, docs):
        self.docs = copy.deepcopy(docs)

    def collection(self, name):
        db = self

        class Query:
            def document(self, document_id):
                def get():
                    data = copy.deepcopy(db.docs.get((name, document_id)))
                    return SimpleNamespace(exists=data is not None, to_dict=lambda: data)
                return SimpleNamespace(get=get)

            def where(self, field, operator, value):
                self.field, self.value = field, value
                return self

            def limit(self, maximum):
                self.maximum = maximum
                return self

            def stream(self):
                result = []
                for (collection, doc_id), data in db.docs.items():
                    if collection == name and data.get(self.field) == self.value:
                        result.append(SimpleNamespace(id=doc_id, to_dict=lambda d=data: copy.deepcopy(d)))
                return iter(result[:self.maximum])
        return Query()


def reservation(email):
    value = normalize_client_email(email)
    return (RESERVATIONS_COLLECTION, value.reservation_id), {
        'normalizedEmail': value.normalized, 'clientId': 'x',
    }


class LoginTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.hashed = hash_password('test password')

    def setUp(self):
        self.db = DB({
            ('clients', 'x'): {'uid': 'UID_X', 'active': True,
                               'emails': ['a@example.com', 'b@example.com']},
            (CREDENTIALS_COLLECTION, 'x'): {'clientId': 'x', 'passwordHash': self.hashed,
                                          'credentialVersion': 'v1'},
            **dict([reservation('a@example.com'), reservation('b@example.com')]),
        })
        self.firebase = Mock()
        self.firebase.get_user.return_value = SimpleNamespace(uid='UID_X', disabled=False)
        self.firebase.get_user_by_email.return_value = SimpleNamespace(uid='UID_X', disabled=False)
        self.firebase.create_custom_token.return_value = b'test-custom-token'
        self.legacy = Mock(return_value='UID_X')
        self.dummy = Mock()
        self.service = ClientLoginService(self.db, firebase_auth=self.firebase,
                                          legacy_verifier=self.legacy, dummy_verifier=self.dummy)
        self.before = copy.deepcopy(self.db.docs)

    def invalid(self, email='a@example.com', password='test password'):
        with self.assertRaises(InvalidClientLogin) as caught:
            self.service.login(email, password)
        self.assertEqual(str(caught.exception), 'E-mail ou senha inválidos.')
        self.firebase.create_custom_token.assert_not_called()
        self.assertEqual(self.db.docs, self.before)

    def test_both_aliases_same_uid_and_normalization(self):
        for email in [' A@Example.COM ', 'b@example.com']:
            self.assertTrue(self.service.login(email, 'test password') == 'test-custom-token')
            self.firebase.create_custom_token.assert_called_with('UID_X')
        self.legacy.assert_not_called()
        self.assertEqual(self.db.docs, self.before)

    def test_wrong_password_never_falls_back(self):
        self.invalid(password='wrong')
        self.legacy.assert_not_called()

    def test_missing_email(self):
        self.firebase.get_user_by_email.side_effect = auth.UserNotFoundError('test')
        self.invalid(email='missing@example.com')
        self.dummy.assert_called_once()

    def test_invalid_email(self):
        self.invalid(email='invalid')
        self.dummy.assert_called_once()

    def test_missing_client(self):
        del self.db.docs[('clients', 'x')]
        self.before = copy.deepcopy(self.db.docs)
        self.invalid()

    def test_inactive_missing_uid(self):
        for change in [{'active': False}, {'uid': ''}, {'uid': None}]:
            with self.subTest(change=change):
                self.db.docs[('clients', 'x')].update(change)
                self.before = copy.deepcopy(self.db.docs)
                self.invalid()

    def test_reserved_without_password_never_falls_back(self):
        del self.db.docs[(CREDENTIALS_COLLECTION, 'x')]
        self.before = copy.deepcopy(self.db.docs)
        self.invalid()
        self.legacy.assert_not_called()

    def test_stale_or_corrupt_reservation(self):
        self.db.docs[('clients', 'x')]['emails'] = []
        self.before = copy.deepcopy(self.db.docs)
        self.invalid()
        self.db.docs[reservation('a@example.com')[0]]['normalizedEmail'] = 'different@example.com'
        self.before = copy.deepcopy(self.db.docs)
        self.invalid()

    def test_token_failure_is_unavailable(self):
        self.firebase.create_custom_token.side_effect = RuntimeError('private provider detail')
        with self.assertRaises(ClientLoginUnavailable) as caught:
            self.service.login('a@example.com', 'test password')
        self.assertNotIn('private provider detail', str(caught.exception))
        self.assertEqual(self.db.docs, self.before)

    def test_absent_auth_user_is_not_created(self):
        self.firebase.get_user.side_effect = auth.UserNotFoundError('test')
        self.invalid()
        self.firebase.create_user.assert_not_called()

    def test_disabled_auth_user(self):
        self.firebase.get_user.return_value = SimpleNamespace(uid='UID_X', disabled=True)
        self.invalid()

    def test_duplicate_uid_rejected(self):
        self.db.docs[('clients', 'y')] = {'uid': 'UID_X'}
        self.before = copy.deepcopy(self.db.docs)
        self.invalid()

    def legacy_setup(self):
        self.db.docs = {('clients', 'x'): {'uid': 'UID_X', 'email': 'a@example.com', 'active': True}}
        self.before = copy.deepcopy(self.db.docs)

    def test_legacy_valid_no_migration(self):
        self.legacy_setup()
        self.assertTrue(self.service.login('a@example.com', 'test password') == 'test-custom-token')
        self.legacy.assert_called_once_with('a@example.com', 'test password')
        self.firebase.create_custom_token.assert_called_once_with('UID_X')
        self.assertEqual(self.db.docs, self.before)

    def test_legacy_invalid_no_migration(self):
        self.legacy_setup()
        self.legacy.side_effect = InvalidClientLogin()
        self.invalid()

    def test_legacy_wrong_uid(self):
        self.legacy_setup()
        self.legacy.return_value = 'UID_Y'
        self.invalid()

    def test_unreserved_new_client_never_falls_back(self):
        self.legacy_setup()
        self.db.docs[('clients', 'x')]['emails'] = []
        self.before = copy.deepcopy(self.db.docs)
        self.invalid()
        self.legacy.assert_not_called()

    def test_unindexed_credential_blocks_legacy(self):
        self.legacy_setup()
        self.db.docs[(CREDENTIALS_COLLECTION, 'x')] = {'credentialVersion': 'v1'}
        self.before = copy.deepcopy(self.db.docs)
        self.invalid()
        self.legacy.assert_not_called()

    def test_credential_change_during_verification_denied(self):
        real = ClientPasswordService(self.db)
        def changed(client_id, password):
            result = real.verify_client_password(client_id, password)
            self.db.docs[(CREDENTIALS_COLLECTION, 'x')]['credentialVersion'] = 'v2'
            return result
        self.service.passwords = SimpleNamespace(verify_client_password=changed)
        with self.assertRaises(InvalidClientLogin):
            self.service.login('a@example.com', 'test password')
        self.firebase.create_custom_token.assert_not_called()


class RouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)
        self.service = Mock()
        self.patcher = patch('app.routes.client_login.get_login_service', return_value=self.service)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

    def test_response_minimal_no_store(self):
        self.service.login.return_value = 'test-custom-token'
        response = self.client.post('/client/login', json={'email': 'a@example.com', 'password': 'sample'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.json()), {'customToken'})
        self.assertEqual(response.headers['cache-control'], 'no-store')
        self.assertNotIn('sample', response.text)

    def test_rejects_clientid_uid_and_malformed_body_without_echo(self):
        for body in [{'email': 'a@example.com', 'password': 'sample', 'clientId': 'x'},
                     {'email': 'a@example.com', 'password': 'sample', 'uid': 'UID_X'},
                     {'email': 'a@example.com', 'password': ['private-input']},
                     {'email': 'a@example.com', 'password': ''}]:
            response = self.client.post('/client/login', json=body)
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.json(), {'detail': 'E-mail ou senha inválidos.'})
            self.assertEqual(response.headers['cache-control'], 'no-store')
        self.service.login.assert_not_called()

    def test_generic_errors_do_not_echo_exception_or_token(self):
        for error, status in [(InvalidClientLogin(), 401), (RuntimeError('private-input'), 503)]:
            self.service.login.side_effect = error
            response = self.client.post('/client/login', json={'email': 'a@example.com', 'password': 'sample'})
            self.assertEqual(response.status_code, status)
            self.assertEqual(response.headers['cache-control'], 'no-store')
            self.assertNotIn('sample', response.text)
            self.assertNotIn('private-input', response.text)
            self.assertNotIn('customToken', response.json())


class LegacyAdapterTests(unittest.TestCase):
    def test_dummy_uses_real_cached_argon_hash(self):
        first = _dummy_hash()
        _dummy_verify('sample')
        self.assertTrue(first == _dummy_hash())
        self.assertTrue(first.startswith('$argon2id$'))

    @patch.dict(os.environ, {'FIREBASE_WEB_API_KEY': 'test-key'}, clear=True)
    @patch('app.services.client_login.auth.verify_id_token')
    @patch('app.services.client_login.requests.post')
    def test_validated_rest_token_and_uid(self, post, verify):
        post.return_value.status_code = 200
        post.return_value.json.return_value = {'idToken': 'test-id-token', 'localId': 'UID_X'}
        verify.return_value = {'uid': 'UID_X'}
        self.assertEqual(verify_legacy_password('a@example.com', 'sample'), 'UID_X')
        verify.assert_called_once_with('test-id-token', check_revoked=True)
        self.assertFalse(post.call_args.kwargs['allow_redirects'])
        verify.return_value = {'uid': 'UID_Y'}
        with self.assertRaises(InvalidClientLogin):
            verify_legacy_password('a@example.com', 'sample')

    @patch.dict(os.environ, {'FIREBASE_WEB_API_KEY': 'test-key'}, clear=True)
    @patch('app.services.client_login.requests.post')
    def test_invalid_and_network_failure(self, post):
        post.return_value.status_code = 400
        with self.assertRaises(InvalidClientLogin):
            verify_legacy_password('a@example.com', 'sample')
        post.side_effect = RuntimeError('private request body')
        with self.assertRaises(ClientLoginUnavailable) as caught:
            verify_legacy_password('a@example.com', 'sample')
        self.assertNotIn('private request body', str(caught.exception))

    @patch.dict(os.environ, {}, clear=True)
    def test_missing_config(self):
        with self.assertRaises(ClientLoginUnavailable):
            verify_legacy_password('a@example.com', 'sample')


if __name__ == '__main__':
    unittest.main()
