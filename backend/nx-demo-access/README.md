# Geschützte neXaro Produktvorführung

Edge Function `nx-demo-access`, Supabase project `hbuqzdmjqvgybwohfnqy`.
`verify_jwt=false` is intentional: the handler authenticates a random invitation code (128 bits), validates expiry and revocation before returning any tour content. The built-in service-role key is used server-side only. No external packages.

Public repository must contain only the gate, marketing preview and backend source. NEVER commit tour HTML, valid codes, database exports or keys. Protected HTML lives in `nx_demo_content` with no anon/authenticated grants and RLS enabled. Public screenshots show only the marketing preview.

Issue each invitation separately: generate 16 random bytes using a cryptographic RNG; prefix uppercase hex with NX; hash normalized code (remove whitespace and hyphens, uppercase) using SHA-256; insert ONLY hash, internal recipient label, expiry into nx_demo_invitations via authenticated administration. Default lifetime: seven days. Give the raw code directly to its intended recipient; do not put it in URLs or analytics. Bearer codes can be forwarded; they are not identity verification. Administration is currently through Supabase, not a public browser endpoint.

Revoke: set revoked_at=now() for the matching invitation ID. Existing viewers are rechecked every 30 seconds; expiry is also checked locally each second. Browser closes preview on validation/network failure. No localStorage, sessionStorage, access cookies, query-string codes or service worker caching. Downloaded content cannot be retroactively erased from a recipient's device.

The rate limiter stores keyed IP digests for up to one day (cleanup on new access); no raw IPs or codes are logged by application code. Hosting infrastructure may keep separate technical logs. Run the security advisor and endpoint checks after changes.
