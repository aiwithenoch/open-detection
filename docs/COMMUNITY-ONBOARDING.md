# Community onboarding: clone the UI and make it yours

This is the end-to-end guide for a community member who receives the Open Detection GitHub link.

The repository gives you a starting UI. It does not automatically give you an analysis API, a database, authentication, a domain, or a deployed production service. Complete the UI setup first, then follow the integration and deployment guides.

## The expected journey

~~~text
1. Clone the repository
2. Run the local UI
3. Customize the product identity
4. Decide whether to use demo mode or real backend mode
5. Create authentication and database
6. Add the community backend
7. Receive approved API access from the owner
8. Connect AI and similarity requests
9. Test permissions, limits, failures, and deletion
10. Deploy frontend and backend
11. Connect a custom domain
12. Launch only after the production checklist passes
~~~

Do not skip from step 2 directly to a public domain with real documents.

## What the repository owner supplies

The owner of the Open Detection API supplies separately:

- the API onboarding instructions;
- the approved API base URL;
- the authentication method;
- the key or tenant setup, if applicable;
- the supported AI and similarity operations;
- the request and response schemas;
- usage limits and pricing;
- data-retention rules;
- support and incident contact;
- permission to use the service and any required attribution.

The GitHub UI repository does not contain these private values.

## What the community member supplies

The community member is responsible for:

- their cloned Git repository;
- their product name, logo, and copy;
- their own hosting account;
- their own domain and DNS;
- their own Supabase project or database;
- their own authentication configuration;
- their own server-side environment variables;
- their own privacy policy and terms;
- their own support process;
- their own deployment and backups;
- compliance with the API owner’s access terms.

## Step 1: Clone and run

~~~sh
git clone https://github.com/aiwithenoch/open-detection.git
cd open-detection
npx --yes serve -s dist -l 4173
~~~

Open 'http://127.0.0.1:4173/'.

Run the checks:

~~~sh
npm run check
git diff --check
~~~

If the UI does not load, finish [SETUP.md](SETUP.md) before changing application code.

## Step 2: Explore the UI

Open the dashboard and inspect:

- New check;
- Text and Upload modes;
- local input validation;
- All checks;
- report tabs;
- profile;
- settings;
- billing;
- Learn;
- Help;
- sidebar collapse;
- mobile navigation.

Create a demo check using non-sensitive sample text. The local report is not a real provider result.

## Step 3: Customize identity and copy

Before deployment, replace:

- Open Detection name if you are using a different product name;
- logo and favicon;
- browser title and description;
- account placeholder values;
- public landing-page copy;
- pricing copy;
- support email;
- privacy policy;
- terms of service;
- copyright year and owner details.

Search all public files for placeholder content:

~~~sh
rg -n "demo|prototype|example.test|placeholder|local clone|sample|mock" dist README.md docs
~~~

Do not remove important demo boundaries until the real backend exists. A user must not mistake a local score for a real AI or similarity result.

## Step 4: Choose the backend plan

There are two separate decisions:

### Database/authentication

Supabase is one option for:

- user accounts;
- sessions;
- profiles;
- checks;
- reports;
- usage events;
- private document storage.

Read [SUPABASE.md](SUPABASE.md).

### Analysis service

The owner API is the source for:

- AI analysis;
- similarity analysis;
- provider job status;
- provider reports;
- usage/billing rules.

Read [API-INTEGRATION.md](API-INTEGRATION.md). Do not invent an endpoint or put the key in the browser.

## Step 5: Build the server-side adapter

Create a backend route such as:

~~~text
POST /api/checks
GET /api/checks
GET /api/checks/:id
DELETE /api/checks/:id
GET /api/checks/:id/download
~~~

The backend should:

1. Verify the signed-in user.
2. Validate the input.
3. Check ownership and plan.
4. Store a queued/processing check.
5. Call the owner API with the server-side credential.
6. Save the provider request ID.
7. Normalize the report.
8. Store the result.
9. Return only authorized data to the browser.

The UI’s current local check object is not a database schema and is not a provider response. Map it to your backend response explicitly.

## Step 6: Test real integration safely

Start with a development Supabase project and a non-production API credential or approved test quota.

Test:

- no session;
- valid session;
- invalid text;
- too few words;
- too many words;
- unsupported file;
- oversized file;
- provider timeout;
- provider 429;
- provider 5xx;
- malformed provider response;
- duplicate submission;
- user A reading user B’s report;
- user A deleting user B’s check;
- expired share link;
- failed report download;
- provider job that remains processing.

Use fake or approved test documents. Do not use private student documents during initial integration.

## Step 7: Deploy

Choose:

- Vercel for a managed frontend/serverless workflow;
- Cloudflare Pages and Workers for a managed edge workflow;
- a VPS and Nginx for full server control.

Read [DEPLOYMENT.md](DEPLOYMENT.md) and follow one option all the way through. Do not mix partial instructions from multiple hosting providers without understanding where the backend runs.

## Step 8: Configure a domain

1. Buy or use a domain controlled by the product owner.
2. Add the DNS records provided by the host.
3. Verify DNS.
4. Add the domain in the host dashboard.
5. Enable HTTPS.
6. Update authentication redirect URLs.
7. Update CORS allowlists.
8. Update provider callback/origin allowlists if required.
9. Test the exact production hostname.

Read the domain and security sections in [OPERATIONS.md](OPERATIONS.md).

## Step 9: Prepare the community handoff

A community member is ready for handoff when they can answer:

- What repository commit is deployed?
- Where does the frontend run?
- Where does the backend run?
- Which Supabase project is used?
- Where are secrets stored?
- What API key/tenant does the backend use?
- How are quota and billing events recorded?
- How are documents deleted?
- How are backups restored?
- Who receives support alerts?
- How does a user request data deletion?

## Suggested video chapters

Use this sequence when recording a setup video:

1. What the repository is and what it is not.
2. Clone the repository.
3. Run the UI locally.
4. Explore the demo routes.
5. Customize the logo, name, title, and support links.
6. Explain why the API key must not be placed in the UI.
7. Create a Supabase project.
8. Add authentication and database tables.
9. Create a backend adapter.
10. Add the owner API environment variables on the server.
11. Replace the local demo check action with the backend call.
12. Save and retrieve reports securely.
13. Add limits, quotas, retries, and error states.
14. Deploy the frontend.
15. Deploy the backend.
16. Configure the domain and HTTPS.
17. Test an unauthorized request and a provider failure.
18. Review backups, monitoring, privacy, and terms.
19. Explain how the community member receives support/API access.

## Final handoff checklist

- [ ] The community member cloned the repository rather than copying a screenshot.
- [ ] The local UI runs.
- [ ] The quality check passes.
- [ ] The brand and legal copy are updated.
- [ ] The database is separate from the demo local storage.
- [ ] The API key is server-only.
- [ ] Real authentication is enabled.
- [ ] Real report access is authorized.
- [ ] Real files are private.
- [ ] AI and similarity usage are tracked separately.
- [ ] Production deployment has SPA fallback.
- [ ] HTTPS and domain records work.
- [ ] Privacy, terms, deletion, backup, and support instructions are complete.
- [ ] The API owner has approved the community member’s usage.
