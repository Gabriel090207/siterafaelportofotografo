import copy
import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from firebase_admin import firestore
from google.api_core.exceptions import Aborted, DeadlineExceeded

from app.models.client_provisioning import ProvisionClientRequest
from app.services.client_emails import ClientEmailError, ClientEmailConflict, RESERVATIONS_COLLECTION, normalize_client_email
from app.services.client_password_crypto import PasswordKeyConfigurationError, InvalidPassword
from app.services.client_passwords import CREDENTIALS_COLLECTION, ClientPasswordService
from app.services.client_links import ClientLinkService, InvalidClientLink, CREDENTIALS_COLLECTION as LINK_COLLECTION, LOOKUP_COLLECTION
from app.services.client_provisioning import (
    ClientProvisioningService, InvalidClientProvisioning,
    ClientProvisioningUnavailable, ClientProvisioningReconciliationRequired,
)

# Dependency modules normally acquire the configured Firestore client on import.
# Supply a double, never initialize Firebase or load production credentials.
with patch.object(firestore, 'client', return_value=Mock()):
    from app.routes.client_provisioning import router
    from app.routes.auth import router as old_router
    from app.dependencies import admin_auth


class Keys:
    def __init__(self):
        self.key = os.urandom(32)

    def active_id(self):
        return 'test-key'

    def load(self, key_id):
        return self.key


class DB:
    def __init__(self):
        self.docs = {}
        self.next_id = 0
        self.fail = None
        self.lose_response = False
        self.before_transaction = None
        self.writes = 0

    def collection(self, collection):
        def document(document_id=None):
            if document_id is None:
                self.next_id += 1
                document_id = f'client-{self.next_id}'
            return Ref(self, (collection, document_id))
        return SimpleNamespace(document=document)

    def transaction(self):
        if self.before_transaction:
            self.before_transaction()
        return Transaction(self)


class Ref:
    def __init__(self, db, key):
        self.db, self.key, self.id = db, key, key[1]

    def get(self, transaction=None):
        if transaction:
            assert not transaction.pending, 'Read after write'
        data = copy.deepcopy(self.db.docs.get(self.key))
        return SimpleNamespace(exists=data is not None, to_dict=lambda: data)


class Transaction:
    def __init__(self, db):
        self.db, self.pending = db, []

    def set(self, ref, data):
        self.pending.append((ref.key, copy.deepcopy(data)))

    def commit(self):
        if self.db.fail:
            raise self.db.fail
        self.db.docs.update(dict(self.pending))
        self.db.writes += len(self.pending)
        if self.db.lose_response:
            raise DeadlineExceeded('Simulated response loss')


def transactional(function):
    def run(transaction):
        result = function(transaction)
        transaction.commit()
        return result
    return run


class ProvisionTests(unittest.TestCase):
    def setUp(self):
        self.db, self.firebase, self.keys = DB(), Mock(), Keys()
        self.auth_users = set()
        def create_user():
            self.auth_users.add('AUTH_UID')
            return SimpleNamespace(uid='AUTH_UID')
        self.firebase.create_user.side_effect = create_user
        self.firebase.delete_user.side_effect = self.auth_users.discard
        self.service = ClientProvisioningService(self.db, self.firebase, self.keys)
        patcher = patch('app.services.client_provisioning.firestore.transactional', transactional)
        patcher.start()
        self.addCleanup(patcher.stop)

    def provision(self, **values):
        return self.service.provision(ProvisionClientRequest(**values))

    def test_valid_combinations(self):
        for values in [{}, {'name': ' Name '}, {'phone': ' 123 '},
                       {'emails': ['a@example.com']},
                       {'emails': ['a@example.com', 'b@example.com']},
                       {'emails': ['a@example.com'], 'password': 'sample'},
                       {'emails': ['a@example.com', 'b@example.com'], 'password': 'sample'}]:
            with self.subTest(fields=list(values)):
                self.db.docs.clear()
                result = self.provision(**values)
                client_id = result['clientId']
                client = self.db.docs[('clients', client_id)]
                self.assertEqual(client['uid'], 'AUTH_UID')
                self.assertEqual(client['name'], values.get('name', '').strip())
                self.assertEqual(client['phone'], values.get('phone', '').strip())
                self.assertEqual(client['email'], values.get('emails', [''])[0])
                self.assertTrue(client['active'])
                self.assertEqual(client['role'], 'client')
                self.assertEqual(client['albumsCount'], 0)
                self.assertNotIn('passwordHash', client)
                self.assertNotIn('encryptedPassword', client)
                self.assertNotIn('password', client)
                self.assertTrue('sample' not in repr(result))
                self.assertEqual(result['hasPassword'], 'password' in values)
                reservations = [d for (c, _), d in self.db.docs.items() if c == RESERVATIONS_COLLECTION]
                self.assertEqual(len(reservations), len(values.get('emails', [])))
                self.assertTrue(all(d['clientId'] == client_id for d in reservations))
                credentials = [d for (c, _), d in self.db.docs.items() if c == CREDENTIALS_COLLECTION]
                self.assertEqual(len(credentials), int('password' in values))
                if credentials:
                    passwords = ClientPasswordService(self.db, self.keys)
                    self.assertTrue(passwords.verify_client_password(client_id, 'sample'))
                    self.assertTrue(passwords.reveal_client_password(client_id) == 'sample')
                links = ClientLinkService(self.db, self.keys)
                link = links.get_or_create(client_id)
                record = self.db.docs[(LINK_COLLECTION, client_id)]
                self.assertEqual(self.db.docs[(LOOKUP_COLLECTION, link.public_id)], {
                    'clientId': client_id, 'credentialVersion': record['credentialVersion'],
                })
                self.assertEqual(links.validate(link.public_id, link.secret).uid, 'AUTH_UID')
                self.assertEqual(links.get_or_create(client_id).secret, link.secret)
                self.assertNotIn(link.secret, repr(result))
                self.assertNotIn('shareLink', result)
                self.assertNotIn(link.secret, repr(self.db.docs))
                self.firebase.create_user.assert_called_with()

    def test_new_client_share_link_matches_provisioned_credential(self):
        from app.services.client_share_link import ClientShareLinkService
        result = self.provision()
        links = ClientLinkService(self.db, self.keys)
        existing = links.reveal(result['clientId'])
        writes = self.db.writes
        with patch.dict(os.environ, {'PUBLIC_FRONTEND_URL': 'https://public.example'}):
            service = ClientShareLinkService(self.db, links)
            first = service.get_or_create(result['clientId'])
            self.assertEqual(first, service.get_or_create(result['clientId']))
        self.assertEqual(self.db.writes, writes)
        self.assertTrue(first['shareLink'].endswith(f'#{existing.public_id}.{existing.secret}'))

    def test_active_false_and_email_display(self):
        result = self.provision(active=False, emails=[' A@Example.COM '])
        self.assertFalse(result['active'])
        self.assertEqual(result['email'], 'A@Example.COM')
        self.assertEqual(result['emails'], ['A@Example.COM'])

    def test_invalid_before_auth_creation(self):
        for values in [{'password': 'sample'}, {'emails': ['bad']},
                       {'emails': ['a@example.com'] * 11},
                       {'emails': ['a@example.com', ' A@EXAMPLE.COM ']},
                       {'emails': ['a@example.com'], 'password': ''}]:
            with self.subTest(fields=list(values)):
                with self.assertRaises((ClientEmailError, InvalidClientProvisioning, InvalidPassword)):
                    self.provision(**values)
        self.firebase.create_user.assert_not_called()
        self.assertEqual(self.db.writes, 0)

    def test_missing_key_before_auth_creation(self):
        self.service.keys = None
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(PasswordKeyConfigurationError):
                self.provision(emails=['a@example.com'], password='sample')
        self.firebase.create_user.assert_not_called()

    def test_missing_link_key_without_password_prevents_auth_creation(self):
        self.service.keys = None
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(PasswordKeyConfigurationError):
                self.provision()
        self.firebase.create_user.assert_not_called()
        self.assertEqual(self.db.docs, {})

    def test_link_write_failure_rolls_back_and_compensates(self):
        with patch.object(ClientLinkService, 'write_prepared_link', side_effect=InvalidClientLink('private')):
            with self.assertRaises(ClientProvisioningUnavailable):
                self.provision(emails=['a@example.com'], password='sample')
        self.assertEqual(self.db.docs, {})
        self.firebase.delete_user.assert_called_once_with('AUTH_UID')

    def test_missing_link_after_uncertain_commit_never_reports_success_or_deletes_auth(self):
        original = Transaction.commit
        def incomplete(transaction):
            original(transaction)
            for key in list(self.db.docs):
                if key[0] == LINK_COLLECTION:
                    del self.db.docs[key]
            raise DeadlineExceeded('lost response')
        with patch.object(Transaction, 'commit', incomplete):
            with self.assertLogs('app.services.client_provisioning', level='ERROR'):
                with self.assertRaises(ClientProvisioningReconciliationRequired):
                    self.provision()
        self.firebase.delete_user.assert_not_called()

    def reserve_elsewhere(self):
        email = normalize_client_email('a@example.com')
        self.db.docs[(RESERVATIONS_COLLECTION, email.reservation_id)] = {
            'normalizedEmail': email.normalized, 'clientId': 'other',
        }

    def test_existing_conflict_before_auth(self):
        self.reserve_elsewhere()
        with self.assertRaises(ClientEmailConflict):
            self.provision(emails=['a@example.com'])
        self.firebase.create_user.assert_not_called()

    def test_concurrent_conflict_compensates(self):
        self.db.before_transaction = self.reserve_elsewhere
        with self.assertRaises(ClientEmailConflict):
            self.provision(emails=['a@example.com'])
        self.firebase.delete_user.assert_called_once_with('AUTH_UID')
        self.assertEqual(self.db.writes, 0)
        self.assertEqual(self.auth_users, set())

    def test_auth_failure_no_firestore_writes(self):
        self.firebase.create_user.side_effect = RuntimeError('sensitive provider details')
        with self.assertLogs('app.services.client_provisioning', level='ERROR') as logs:
            with self.assertRaises(ClientProvisioningUnavailable):
                self.provision()
        self.assertTrue(all('sensitive provider details' not in line for line in logs.output))
        self.assertEqual(self.db.docs, {})
        self.firebase.delete_user.assert_not_called()

    def test_definitive_firestore_failure_compensates(self):
        self.db.fail = Aborted('test abort')
        with self.assertRaises(ClientProvisioningUnavailable):
            self.provision(emails=['a@example.com'], password='sample')
        self.firebase.delete_user.assert_called_once_with('AUTH_UID')
        self.assertEqual(self.db.docs, {})
        self.assertEqual(self.auth_users, set())

    def test_compensation_failure_logged_without_secrets(self):
        self.db.fail = Aborted('test abort')
        self.firebase.delete_user.side_effect = RuntimeError('sensitive provider details')
        with self.assertLogs('app.services.client_provisioning', level='ERROR') as logs:
            with self.assertRaises(ClientProvisioningReconciliationRequired):
                self.provision(emails=['a@example.com'], password='sample')
        combined = ' '.join(logs.output)
        self.assertIn('auth_compensation_failed', combined)
        self.assertIn('AUTH_UID', combined)
        self.assertTrue('sample' not in combined and 'sensitive provider details' not in combined)

    def test_lost_commit_response_returns_committed_client_without_deletion(self):
        self.db.lose_response = True
        result = self.provision(emails=['a@example.com'], password='sample')
        self.assertEqual(result['uid'], 'AUTH_UID')
        self.assertEqual(len(self.db.docs), 5)
        self.firebase.delete_user.assert_not_called()

    def test_unknown_commit_does_not_delete_potentially_referenced_user(self):
        self.db.fail = DeadlineExceeded('uncertain commit')
        with self.assertLogs('app.services.client_provisioning', level='ERROR'):
            with self.assertRaises(ClientProvisioningReconciliationRequired):
                self.provision()
        self.firebase.delete_user.assert_not_called()

    def test_transaction_retry_reuses_auth_user_and_prepared_credential(self):
        def retrying(function):
            def run(transaction):
                function(transaction)  # Simulate an aborted attempt, discard writes.
                retry = Transaction(self.db)
                function(retry)
                self.assertTrue(transaction.pending == retry.pending)
                retry.commit()
            return run
        with patch('app.services.client_provisioning.firestore.transactional', retrying):
            result = self.provision(emails=['a@example.com', 'b@example.com'], password='sample')
        self.firebase.create_user.assert_called_once_with()
        self.assertEqual(len(self.db.docs), 6)
        self.assertEqual(self.db.writes, 6)
        self.assertEqual(result['uid'], 'AUTH_UID')


class RouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        app.include_router(old_router)
        self.client = TestClient(app)
        self.service = Mock()
        self.service.provision.return_value = {'clientId': 'x', 'uid': 'u', 'hasPassword': False}
        patcher = patch('app.routes.client_provisioning.get_provisioning_service', return_value=self.service)
        patcher.start()
        self.addCleanup(patcher.stop)

    def admin(self):
        return patch.multiple(admin_auth,
                              verify_firebase_id_token=Mock(return_value={'uid': 'admin'}),
                              db=SimpleNamespace(collection=lambda _: SimpleNamespace(
                                  document=lambda _: SimpleNamespace(get=lambda: SimpleNamespace(exists=True)))))

    def test_missing_auth_rejected_on_both_routes(self):
        for path in ['/admin/clients', '/auth/create-user']:
            self.assertEqual(self.client.post(path, json={}).status_code, 401)
        self.service.provision.assert_not_called()

    def test_non_admin_rejected(self):
        with patch.object(admin_auth, 'verify_firebase_id_token', return_value={'uid': 'client'}), \
             patch.object(admin_auth, 'db') as db:
            db.collection.return_value.document.return_value.get.return_value.exists = False
            response = self.client.post('/admin/clients', json={}, headers={'Authorization': 'Bearer test'})
            self.assertEqual(response.status_code, 403)
        self.service.provision.assert_not_called()

    def test_admin_and_no_password_echo(self):
        with self.admin():
            response = self.client.post('/admin/clients', json={
                'emails': ['a@example.com'], 'password': 'sample',
            }, headers={'Authorization': 'Bearer test'})
        self.assertEqual(response.status_code, 201)
        self.assertNotIn('sample', response.text)
        self.assertEqual(response.headers['cache-control'], 'no-store')

    def test_extra_fields_rejected(self):
        with self.admin():
            for field in ['uid', 'clientId', 'role', 'albumsCount', 'passwordHash',
                          'encryptedPassword', 'linkSecret']:
                response = self.client.post('/admin/clients', json={field: 'private-input'},
                                            headers={'Authorization': 'Bearer test'})
                self.assertEqual(response.status_code, 422)
                self.assertNotIn('private-input', response.text)
        self.service.provision.assert_not_called()

    def test_old_route_still_accepts_admin(self):
        with self.admin(), patch('app.routes.auth.auth.create_user') as create:
            create.return_value = SimpleNamespace(uid='u', email='a@example.com')
            response = self.client.post('/auth/create-user', json={
                'email': 'a@example.com', 'password': 'sample',
            }, headers={'Authorization': 'Bearer test'})
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('sample', response.text)


if __name__ == '__main__':
    unittest.main()
