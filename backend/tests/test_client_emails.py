import copy
import unittest

from app.services.client_emails import (
    ClientEmailConflict, ClientNotFound, DuplicateClientEmail,
    InvalidClientEmail, TooManyClientEmails, RESERVATIONS_COLLECTION,
    _replace_in_transaction, normalize_client_email, normalize_client_emails,
)


class MemoryStore:
    """Transaction-body double, not an emulator of Firestore concurrency."""
    def __init__(self, documents):
        self.documents = copy.deepcopy(documents)
        self.writes = []

    def collection(self, collection):
        store = self

        class Collection:
            def document(self, document_id):
                return Reference(store, (collection, document_id))
        return Collection()

    def set(self, ref, data):
        self.writes.append(('set', ref.key, data))

    def update(self, ref, data):
        self.writes.append(('update', ref.key, data))

    def delete(self, ref):
        self.writes.append(('delete', ref.key, None))

    def commit(self):
        for action, key, data in self.writes:
            if action == 'delete':
                del self.documents[key]
            elif action == 'set':
                self.documents[key] = data
            else:
                self.documents[key].update(data)
        self.writes.clear()


class Reference:
    def __init__(self, store, key):
        self.store, self.key = store, key

    def get(self, transaction):
        assert not transaction.writes, 'Read after write'
        data = self.store.documents.get(self.key)

        class Snapshot:
            exists = data is not None

            def to_dict(self):
                return copy.deepcopy(data)
        return Snapshot()


def reservation(email, owner='x'):
    value = normalize_client_email(email)
    return (RESERVATIONS_COLLECTION, value.reservation_id), {
        'normalizedEmail': value.normalized, 'clientId': owner,
    }


def replace(store, emails, client_id='x'):
    result = _replace_in_transaction(
        store, store, client_id, normalize_client_emails(emails),
    )
    store.commit()
    return result


class NormalizationTests(unittest.TestCase):
    def test_case_and_display(self):
        email = normalize_client_email(' Test@Example.COM ')
        self.assertEqual(email.normalized, 'test@example.com')
        self.assertEqual(email.display, 'Test@Example.COM')

    def test_empty_list(self):
        self.assertEqual(normalize_client_emails([]), [])

    def test_limit(self):
        with self.assertRaises(TooManyClientEmails):
            normalize_client_emails([f'a{i}@example.com' for i in range(11)])
        self.assertEqual(len(normalize_client_emails(
            [f'a{i}@example.com' for i in range(10)])), 10)

    def test_duplicates(self):
        with self.assertRaises(DuplicateClientEmail):
            normalize_client_emails(['Test@example.com', ' test@EXAMPLE.COM '])

    def test_alias_and_dots_preserved(self):
        self.assertEqual(normalize_client_email('a.b+tag@example.com').normalized,
                         'a.b+tag@example.com')

    def test_invalid(self):
        for value in ['', ' ', 'invalid', 'a b@example.com', None, 1]:
            with self.subTest(value=value), self.assertRaises(InvalidClientEmail):
                normalize_client_email(value)
        with self.assertRaises(InvalidClientEmail):
            normalize_client_emails('a@example.com')

    def test_unicode_domain_equivalence(self):
        self.assertEqual(normalize_client_email('A@bücher.de').normalized,
                         normalize_client_email('a@xn--bcher-kva.de').normalized)


class ReservationTests(unittest.TestCase):
    def test_free_reservation_and_idempotence(self):
        store = MemoryStore({('clients', 'x'): {'emails': []}})
        replace(store, ['a@example.com'])
        key, _ = reservation('a@example.com')
        self.assertEqual(store.documents[key]['clientId'], 'x')
        before = copy.deepcopy(store.documents)
        _replace_in_transaction(store, store, 'x', normalize_client_emails(['a@example.com']))
        self.assertEqual(store.writes, [])
        self.assertEqual(store.documents, before)

    def test_conflict_has_no_writes(self):
        key, data = reservation('c@example.com', 'y')
        store = MemoryStore({('clients', 'x'): {'emails': []}, key: data})
        with self.assertRaises(ClientEmailConflict):
            replace(store, ['a@example.com', 'c@example.com'])
        self.assertEqual(store.writes, [])
        self.assertEqual(store.documents[('clients', 'x')]['emails'], [])

    def test_swap(self):
        store = MemoryStore({('clients', 'x'): {'emails': ['a@example.com', 'b@example.com']},
                             **dict([reservation('a@example.com'), reservation('b@example.com')])})
        b_key, _ = reservation('b@example.com')
        before_b = copy.deepcopy(store.documents[b_key])
        replace(store, ['b@example.com', 'c@example.com'])
        self.assertNotIn(reservation('a@example.com')[0], store.documents)
        self.assertEqual(store.documents[b_key], before_b)
        self.assertIn(reservation('c@example.com')[0], store.documents)
        self.assertEqual(store.documents[('clients', 'x')]['emails'], ['b@example.com', 'c@example.com'])

    def test_swap_conflict_preserves_everything(self):
        docs = {('clients', 'x'): {'emails': ['a@example.com', 'b@example.com']},
                **dict([reservation('a@example.com'), reservation('b@example.com'),
                        reservation('c@example.com', 'y')])}
        store = MemoryStore(docs)
        with self.assertRaises(ClientEmailConflict):
            replace(store, ['b@example.com', 'c@example.com'])
        self.assertEqual(store.documents, docs)
        self.assertEqual(store.writes, [])

    def test_empty_releases_all_and_keeps_client(self):
        store = MemoryStore({('clients', 'x'): {'emails': ['a@example.com']},
                             **dict([reservation('a@example.com')])})
        replace(store, [])
        self.assertEqual(store.documents[('clients', 'x')]['emails'], [])
        self.assertNotIn(reservation('a@example.com')[0], store.documents)

    def test_explicit_empty_does_not_read_legacy_reservation(self):
        store = MemoryStore({('clients', 'x'): {'emails': [], 'email': 'old@example.com'},
                             **dict([reservation('old@example.com', 'y')])})
        replace(store, [])
        self.assertEqual(store.documents[('clients', 'x')]['email'], 'old@example.com')

    def test_missing_client(self):
        store = MemoryStore({})
        with self.assertRaises(ClientNotFound):
            replace(store, [])
        self.assertEqual(store.writes, [])


if __name__ == '__main__':
    unittest.main()
