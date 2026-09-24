import assert from "node:assert/strict";
import test from "node:test";
import { readClientEmails, matchesClientEmail } from "../src/utils/clientEmails.ts";

test("reads a populated legacy email when emails is absent", () => {
    assert.deepEqual(readClientEmails({ email: "a@example.com" }), ["a@example.com"]);
});

test("reads an empty legacy email as no emails", () => {
    assert.deepEqual(readClientEmails({ email: "" }), []);
    assert.deepEqual(readClientEmails({}), []);
});

test("an explicit empty list never resurrects the legacy email", () => {
    assert.deepEqual(readClientEmails({ email: "antigo@example.com", emails: [] }), []);
});

test("prefers the new list without mutating the document", () => {
    const emails = Object.freeze(["novo@example.com", "outro@example.com"]);
    const document = Object.freeze({ email: "antigo@example.com", emails });
    assert.deepEqual(readClientEmails(document), emails);
    assert.equal(document.email, "antigo@example.com");
});

test("admin search matches secondary emails case-insensitively", () => {
    const emails = readClientEmails({ emails: ["a@example.com", "b@example.com"] });
    assert.equal(matchesClientEmail(emails, "B@EXAMPLE.COM"), true);
    assert.equal(matchesClientEmail(emails, "missing@example.com"), false);
});

test("admin search does not match stale legacy emails", () => {
    for (const emails of [[], ["novo@example.com"]]) {
        assert.equal(matchesClientEmail(readClientEmails({
            email: "antigo@example.com", emails,
        }), "antigo@example.com"), false);
    }
});

test("malformed present fields do not trigger legacy fallback", () => {
    for (const emails of [null, undefined, "invalid", 1]) {
        assert.deepEqual(readClientEmails({ email: "antigo@example.com", emails }), []);
    }
    assert.deepEqual(readClientEmails({ emails: [null, 1, "", " ", "a@example.com"] }),
        ["a@example.com"]);
});
