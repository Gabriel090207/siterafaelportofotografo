// An explicitly present emails field is authoritative, even when empty.
export const readClientEmails = (client: { email?: unknown; emails?: unknown }): string[] => {
    const value = Object.prototype.hasOwnProperty.call(client, "emails")
        ? client.emails
        : [client.email];

    return Array.isArray(value)
        ? value.filter((email): email is string =>
            typeof email === "string" && email.trim().length > 0)
        : [];
};

export const matchesClientEmail = (emails: readonly string[], search: string): boolean =>
    emails.some((email) => email.toLowerCase().includes(search.toLowerCase()));
