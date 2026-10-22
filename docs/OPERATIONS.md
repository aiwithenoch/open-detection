# Operations, domains, and security

This document covers the work that starts after the UI is running. A deployed static page is not yet a secure document-processing product.

## Domain setup

### Buy and control the domain

Use a registrar and account controlled by the product owner. Enable registrar two-factor authentication and domain-lock protections. Keep the registrar recovery codes in a password manager.

Choose the final hostname before configuring production callbacks. Common options:

~~~text
app.example.com       application UI
api.example.com       backend API, if it is separate
www.example.com       marketing site, if it is separate
~~~

Do not use a temporary preview hostname in OAuth redirect URLs, password-reset URLs, webhooks, or provider allowlists as the only production value.

### DNS records

The hosting provider will tell you whether to add:

- an A record pointing to a VPS IPv4 address;
- an AAAA record for a VPS IPv6 address;
- a CNAME pointing to a managed host;
- a TXT record for domain verification;
- MX/TXT records for email, if email is used.

Do not create an A record from memory. Copy the target shown by the selected host. Duplicate or stale records can send users to the wrong server.

After changing DNS:

~~~sh
dig +short app.example.com
dig +short CNAME app.example.com
~~~

DNS propagation is not a reason to disable HTTPS or loosen authentication. Wait for the expected records and verify from more than one network.

### HTTPS

Production must use HTTPS. Check:

- the certificate covers the exact hostname;
- HTTP redirects to HTTPS;
- cookies are Secure in production;
- mixed-content warnings do not appear;
- API calls use HTTPS;
- webhook endpoints reject plain HTTP;
- certificate renewal is automated and monitored.

## Secrets and environment variables

Store secrets in:

- Vercel encrypted environment variables;
- Cloudflare Worker/Pages secrets;
- a VPS secret manager or protected environment file;
- Supabase Edge Function secrets;
- a dedicated secret manager for larger deployments.

Never store secrets in:

- 'dist/';
- Git history;
- README examples;
- screenshots;
- browser local storage;
- query strings;
- issue reports;
- client-side environment variables;
- public build artifacts.

The most sensitive values in this project are likely:

- owner analysis API key;
- Supabase service-role key;
- database password;
- OAuth client secret;
- payment/webhook signing secret;
- SMTP password;
- deployment token;
- private signing key.

If a secret is exposed, rotate it. Deleting the file in a later commit is not enough because Git history may still contain it.

## Authentication and sessions

Before processing a private document:

- require an authenticated user;
- verify the session server-side;
- set an expiration and refresh policy;
- protect sign-out and password changes;
- handle revoked sessions;
- avoid exposing session tokens in URLs;
- configure allowed redirect URLs narrowly;
- add rate limits to sign-in, reset, and check creation;
- log authentication events without tokens or passwords.

If using Supabase Auth, keep the project URL and anon key in the allowed client configuration and keep the service-role key server-side. See [SUPABASE.md](SUPABASE.md).

## Data privacy

Write down what happens to a document at each stage:

~~~text
browser upload
  -> community backend
  -> temporary storage or provider request
  -> owner API
  -> normalized report
  -> persistent database/storage
  -> deletion
~~~

Answer these questions before launch:

1. Is the document stored?
2. Where is it stored?
3. How long is it retained?
4. Is it sent to a third-party provider?
5. Does the provider retain it?
6. Is it used for training?
7. Who can read it?
8. How does a user request deletion?
9. Does deletion also remove provider copies and backups?
10. Which country or region processes it?

The privacy policy must match the real implementation. Do not leave the placeholder privacy page in production.

## Quotas and billing

The UI’s Pro/Free labels are demo copy. They do not enforce access. Enforce entitlements on the server:

- identify the user and workspace;
- read the plan from a trusted billing/database record;
- count accepted provider jobs, not button clicks;
- distinguish AI usage from similarity usage;
- handle provider retries without double charging;
- record usage events with timestamps and provider request IDs;
- stop or queue requests when a quota is exceeded;
- show users a safe explanation;
- reconcile provider and internal usage periodically.

Never accept a client-supplied value such as 'plan=pro' or 'unlimited=true' as proof of entitlement.

## Logging

Log enough to troubleshoot without logging private content:

- timestamp;
- request ID;
- authenticated user/workspace ID;
- route and method;
- response status;
- latency;
- provider request ID;
- safe error code;
- deployment version.

Do not log:

- document text;
- full uploaded files;
- authorization headers;
- API keys;
- cookies;
- password-reset tokens;
- raw provider payloads unless explicitly approved and protected.

Use a redaction test to confirm that errors cannot accidentally print request bodies.

## Monitoring

At minimum monitor:

- frontend availability;
- backend availability;
- provider error rate;
- provider timeout rate;
- queue/job age;
- 4xx and 5xx rate;
- authentication failures;
- storage capacity;
- database connection health;
- quota/usage mismatches;
- certificate expiration;
- backup success.

Create an alert threshold and a human response for each important metric. A dashboard without an owner is not an incident process.

## Backups and restore

Back up:

- database data;
- storage metadata and files according to policy;
- deployment configuration;
- migration history;
- secret names and rotation procedure, not the secret values in a public repo;
- domain and DNS configuration;
- provider request mapping if needed for support.

Test restoration into a non-production project. A backup that has never been restored is unverified.

Document:

- recovery point objective;
- recovery time objective;
- who can restore;
- where backups are stored;
- how old backups are deleted;
- what happens to documents during a restore.

## Abuse and safety controls

Document review systems can be abused for scraping, automated submissions, prompt injection, and sensitive-data processing. Add:

- authenticated access;
- per-user and per-IP rate limits;
- maximum request body size;
- maximum document size;
- allowed file types;
- malware scanning where appropriate;
- request timeouts;
- queue limits;
- provider spend limits;
- abuse reporting;
- audit events for administrative actions.

Do not make a file upload endpoint public just because the UI starts as a public landing page.

## Production launch checklist

### Code and deployment

- [ ] The final Git SHA is recorded.
- [ ] 'npm run check' passes.
- [ ] The preview was tested on desktop and mobile.
- [ ] SPA fallback works for every direct route.
- [ ] No demo placeholder copy remains where production copy is required.
- [ ] The favicon, title, metadata, privacy page, and terms page are final.
- [ ] Error pages are useful and do not reveal stack traces.

### Backend

- [ ] Authentication and authorization are enforced server-side.
- [ ] The owner API key is server-only.
- [ ] Provider limits and timeouts are enforced.
- [ ] AI and similarity usage are measured separately.
- [ ] Retry/idempotency behavior is tested.
- [ ] Report access is owner-scoped.
- [ ] Deletion behavior is implemented.

### Data

- [ ] RLS or equivalent authorization is enabled.
- [ ] Storage is private.
- [ ] Signed URLs expire.
- [ ] Retention and deletion policy is written.
- [ ] Backups are configured.
- [ ] Restore has been tested.

### Security

- [ ] HTTPS is active.
- [ ] Cookies and CORS are configured narrowly.
- [ ] Secrets are in the deployment secret store.
- [ ] Dependency and OS update ownership is assigned.
- [ ] Logs redact private content.
- [ ] Monitoring and alerts are active.
- [ ] Incident contact is known.

### Product and legal

- [ ] The UI license is selected and included.
- [ ] API access terms are separate and clear.
- [ ] Provider attribution/redistribution terms are confirmed.
- [ ] Privacy, retention, and deletion copy matches reality.
- [ ] Support and refund/billing policies are published if money is charged.
