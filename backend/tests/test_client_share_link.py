import copy
import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch
from urllib.parse import urlsplit

from fastapi import FastAPI
from fastapi.testclient import TestClient
from firebase_admin import firestore
from app.services.client_links import ClientLinkService, ClientLinkRevoked
from app.services.client_share_link import (
    ClientShareLinkService, ClientShareLinkNotFound,
    ClientShareLinkConfigurationError, public_frontend_base,
)
from test_client_links import Keys, transactional
from test_client_link_login import LoginDB

with patch.object(firestore, 'client', return_value=Mock()):
    from app.routes.client_provisioning import router
    from app.dependencies import admin_auth


class ShareLinkTests(unittest.TestCase):
    def setUp(self):
        self.db = LoginDB()
        self.links = ClientLinkService(self.db, Keys())
        self.service = ClientShareLinkService(self.db, self.links)
        for patcher in [patch.dict(os.environ, {'PUBLIC_FRONTEND_URL': 'https://public.example/'}),
                        patch('app.services.client_links.firestore.transactional', transactional)]:
            patcher.start()
            self.addCleanup(patcher.stop)

    def test_legacy_first_click_creates_then_recovers_without_backfill(self):
        before = copy.deepcopy(self.db.docs[('clients', 'b')])
        with self.assertNoLogs('app', level='DEBUG'):
            first = self.service.get_or_create('a')
            writes = self.db.write_count
            second = self.service.get_or_create('a')
        self.assertEqual(first, second)
        self.assertEqual(self.db.write_count, writes)
        self.assertEqual(set(first), {'shareLink'})
        url = urlsplit(first['shareLink'])
        self.assertEqual(url.path, '/cliente/acesso')
        self.assertEqual(url.query, '')
        public_id, secret = url.fragment.split('.')
        self.assertEqual(self.links.validate(public_id, secret).uid, 'UID_a')
        self.assertNotIn(first['shareLink'], repr(self.db.docs))
        self.assertNotIn(secret, repr(self.db.docs))
        self.assertEqual(self.db.docs[('clients', 'b')], before)
        self.assertNotIn(('clientLinkCredentials', 'b'), self.db.docs)

    def test_public_domain_with_or_without_trailing_slash(self):
        existing = self.links.get_or_create('a')
        origin = 'https://www.rafaelportofotografia.com.br'
        expected = f'{origin}/cliente/acesso#{existing.public_id}.{existing.secret}'
        before = copy.deepcopy(self.db.docs)
        for base in [origin, origin + '/']:
            with self.subTest(base=base), patch.dict(os.environ, {'PUBLIC_FRONTEND_URL': base}):
                result = self.service.get_or_create('a')['shareLink']
            self.assertEqual(result, expected)
            self.assertNotIn('//cliente/acesso', result)
            url = urlsplit(result)
            self.assertEqual(url.query, '')
            self.assertEqual(url.path, '/cliente/acesso')
            self.assertEqual(url.fragment, f'{existing.public_id}.{existing.secret}')
            self.assertNotIn(existing.secret, url.path)
        self.assertEqual(self.db.docs, before)
        self.assertNotIn(expected, repr(self.db.docs))

    def test_existing_link_recovers_without_regeneration(self):
        existing = self.links.get_or_create('a')
        self.assertTrue(self.service.get_or_create('a')['shareLink'].endswith(
            f'#{existing.public_id}.{existing.secret}'))

    def test_missing_client_and_revoked_link(self):
        with self.assertRaises(ClientShareLinkNotFound):
            self.service.get_or_create('missing')
        self.links.get_or_create('a')
        self.links.revoke('a')
        before = copy.deepcopy(self.db.docs)
        with self.assertRaises(ClientLinkRevoked):
            self.service.get_or_create('a')
        self.assertEqual(self.db.docs, before)

    def test_base_configuration_rejected_before_creation(self):
        for value in ['', 'https://', 'https://u:p@site.example', 'https://site.example/path',
                      'https://site.example?secret=x', 'https://site.example#x',
                      'http://site.example', 'javascript:alert(1)', 'https://site.example:bad']:
            with self.subTest(value=value), patch.dict(os.environ, {'PUBLIC_FRONTEND_URL': value}):
                with self.assertRaises(ClientShareLinkConfigurationError):
                    self.service.get_or_create('a')
        self.assertEqual(self.db.write_count, 0)
        with patch.dict(os.environ, {'PUBLIC_FRONTEND_URL': 'http://localhost:5173/'}):
            self.assertEqual(public_frontend_base(), 'http://localhost:5173')


class ShareLinkRouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)
        self.service = Mock()
        self.service.get_or_create.return_value = {'shareLink': 'https://public.example/cliente/acesso#private'}
        patcher = patch('app.routes.client_provisioning.get_share_link_service', return_value=self.service)
        patcher.start()
        self.addCleanup(patcher.stop)

    def admin(self):
        return patch.multiple(admin_auth,
                              verify_firebase_id_token=Mock(return_value={'uid': 'admin'}),
                              db=SimpleNamespace(collection=lambda _: SimpleNamespace(
                                  document=lambda _: SimpleNamespace(get=lambda: SimpleNamespace(exists=True)))))

    def test_authentication_and_admin_required(self):
        self.assertEqual(self.client.post('/admin/clients/a/link').status_code, 401)
        with patch.object(admin_auth, 'verify_firebase_id_token', return_value={'uid': 'client'}), \
             patch.object(admin_auth, 'db') as db:
            db.collection.return_value.document.return_value.get.return_value.exists = False
            self.assertEqual(self.client.post('/admin/clients/a/link',
                headers={'Authorization': 'Bearer test'}).status_code, 403)
        self.service.get_or_create.assert_not_called()

    def test_success_minimal_response_and_no_store(self):
        with self.admin(), self.assertNoLogs('app', level='DEBUG'):
            response = self.client.post('/admin/clients/a/link', headers={'Authorization': 'Bearer test'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.json()), {'shareLink'})
        self.assertEqual(response.headers['cache-control'], 'no-store')
        self.service.get_or_create.assert_called_once_with('a')

    def test_errors_do_not_echo_secrets_or_cache(self):
        for error, status in [(ClientShareLinkNotFound('private'), 404),
                              (ClientLinkRevoked('private'), 409), (RuntimeError('private'), 503)]:
            self.service.get_or_create.side_effect = error
            with self.admin(), self.assertNoLogs('app', level='DEBUG'):
                response = self.client.post('/admin/clients/a/link', headers={'Authorization': 'Bearer test'})
            self.assertEqual(response.status_code, status)
            self.assertEqual(response.headers['cache-control'], 'no-store')
            self.assertNotIn('private', response.text)
            self.assertNotIn('shareLink', response.json())
