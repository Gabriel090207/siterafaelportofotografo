import copy
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from firebase_admin import auth

from app.routes.client_link_login import router
from app.services.client_link_login import (
    ClientLinkLoginService, InvalidClientLinkLogin, ClientLinkLoginUnavailable,
)
from app.services.client_links import ClientLinkService
from test_client_links import DB, Keys, transactional


class LoginDB(DB):
    def collection(self, name):
        original = super().collection(name)
        db = self
        def document(doc_id):
            ref = original.document(doc_id)
            return SimpleNamespace(key=ref.key, get=lambda transaction=None: ref.get(transaction or db.transaction()))
        def where(field, operator, value):
            matches = [SimpleNamespace(id=key[1], to_dict=lambda d=data: copy.deepcopy(d))
                       for key, data in db.docs.items() if key[0] == name and data.get(field) == value]
            return SimpleNamespace(limit=lambda count: SimpleNamespace(stream=lambda: iter(matches[:count])))
        return SimpleNamespace(document=document, where=where)


class LinkLoginTests(unittest.TestCase):
    def setUp(self):
        self.db = LoginDB()
        self.links = ClientLinkService(self.db, Keys())
        patcher = patch('app.services.client_links.firestore.transactional', transactional)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.link = self.links.get_or_create('a')
        self.firebase = Mock()
        self.firebase.get_user.return_value = SimpleNamespace(uid='UID_a', disabled=False)
        self.firebase.create_custom_token.return_value = b'test-custom-token'
        self.service = ClientLinkLoginService(self.db, self.links, self.firebase)

    def invalid(self, public_id=None, secret=None):
        with self.assertRaises(InvalidClientLinkLogin) as caught:
            self.service.exchange(public_id or self.link.public_id, secret or self.link.secret)
        self.assertEqual(str(caught.exception), 'Link inválido ou indisponível.')
        self.firebase.create_custom_token.assert_not_called()

    def test_valid_canonical_uid_and_no_decryption(self):
        with patch('app.services.client_links.decrypt_secret', side_effect=AssertionError('No decryption')), \
             patch.object(self.links, 'validate', wraps=self.links.validate) as validate:
            token = self.service.exchange(self.link.public_id, self.link.secret)
        self.assertTrue(token == 'test-custom-token')
        self.assertEqual(validate.call_count, 2)
        self.firebase.create_custom_token.assert_called_once_with('UID_a')
        self.firebase.create_user.assert_not_called()

    def test_wrong_secret_and_public_id(self):
        self.invalid(secret='x' * 43)
        self.invalid(public_id='x' * 22)

    def test_revoked(self):
        self.links.revoke('a')
        self.invalid()

    def test_regenerated(self):
        self.links.regenerate('a')
        self.invalid()

    def test_missing_client(self):
        del self.db.docs[('clients', 'a')]
        self.invalid()

    def test_inactive_missing_uid(self):
        for change in [{'active': False}, {'active': None}, {'uid': ''}]:
            self.db.docs[('clients', 'a')] = {'uid': 'UID_a', 'active': True, **change}
            self.invalid()

    def test_missing_disabled_or_wrong_auth_user(self):
        self.firebase.get_user.side_effect = auth.UserNotFoundError('test')
        self.invalid()
        self.firebase.get_user.side_effect = None
        for user in [SimpleNamespace(uid='UID_a', disabled=True), SimpleNamespace(uid='UID_b', disabled=False)]:
            self.firebase.get_user.return_value = user
            self.invalid()

    def test_signing_failure_does_not_leak_provider_exception(self):
        self.firebase.create_custom_token.side_effect = RuntimeError('private SDK detail')
        with self.assertRaises(ClientLinkLoginUnavailable) as caught:
            self.service.exchange(self.link.public_id, self.link.secret)
        self.assertEqual(str(caught.exception), 'Link inválido ou indisponível.')

    def test_revocation_during_auth_lookup_is_rechecked(self):
        def lookup(uid):
            self.links.revoke('a')
            return SimpleNamespace(uid=uid, disabled=False)
        self.firebase.get_user.side_effect = lookup
        self.invalid()

    def test_ambiguous_uid_rejected(self):
        self.db.docs[('clients', 'b')]['uid'] = 'UID_a'
        self.invalid()


class LinkRouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)
        self.service = Mock()
        patcher = patch('app.routes.client_link_login.get_link_login_service', return_value=self.service)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.body = {'publicId': 'p' * 22, 'secret': 's' * 43}

    def test_success_only_token_no_store(self):
        self.service.exchange.return_value = 'test-custom-token'
        response = self.client.post('/client/link-login', json=self.body)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'customToken': 'test-custom-token'})
        self.assertEqual(response.headers['cache-control'], 'no-store')
        self.assertTrue(self.body['secret'] not in response.text)

    def test_rejects_identity_fields_without_echo(self):
        for field in ['clientId', 'uid', 'email', 'password']:
            response = self.client.post('/client/link-login', json={**self.body, field: 'private-input'})
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.json(), {'detail': 'Link inválido ou indisponível.'})
            self.assertEqual(response.headers['cache-control'], 'no-store')
        self.service.exchange.assert_not_called()

    def test_generic_failures_and_malformed_request(self):
        for error, status in [(InvalidClientLinkLogin(), 401), (RuntimeError('private detail'), 503)]:
            self.service.exchange.side_effect = error
            response = self.client.post('/client/link-login', json=self.body)
            self.assertEqual(response.status_code, status)
            self.assertEqual(response.json(), {'detail': 'Link inválido ou indisponível.'})
            self.assertEqual(response.headers['cache-control'], 'no-store')
        response = self.client.post('/client/link-login', json={'secret': ['private detail']})
        self.assertEqual(response.status_code, 401)
        self.assertNotIn('private detail', response.text)


if __name__ == '__main__':
    unittest.main()
