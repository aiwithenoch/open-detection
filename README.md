# Open Detection UI starter

Open Detection is a buildless HTML, CSS, and JavaScript user-interface starter for a document review product. It gives a community member a working interface for a new check, upload/text entry, check history, report viewing, plans, account screens, Learn pages, and Help pages without requiring them to design the product from an empty folder.

This repository is intentionally the UI layer. It is not the owner’s analysis API, it is not a Supabase project, and it is not a complete production SaaS backend. The demo can be opened and tested immediately, but all analysis results, billing actions, authentication, uploads, and persistence are local mock behavior until a community member connects a backend.

The intended workflow is:

1. A community member clones this repository.
2. They run the UI locally and customize the brand, copy, and visual details.
3. They add a server-side backend, authentication, database, and deployment using the guides in this repository.
4. They connect the backend to the private analysis API supplied by the Open Detection owner.
5. They deploy the UI and backend, then attach their own domain.

Do not put a private API key in 'dist/app.js', 'dist/index.html', 'dist/styles.css', a browser bundle, or any other file served to the browser. The browser should call the community member’s own backend. The backend should call the private analysis API.

## Start here

Read the documentation in this order:

1. [Community onboarding](docs/COMMUNITY-ONBOARDING.md) — the complete clone-to-deployment path.
2. [Local setup](docs/SETUP.md) — install, run, inspect, customize, and reset the UI.
3. [API integration](docs/API-INTEGRATION.md) — how to replace demo actions with a safe server-side API adapter.
4. [Supabase setup](docs/SUPABASE.md) — optional authentication, database, storage, and row-level security.
5. [Deployment](docs/DEPLOYMENT.md) — Vercel, Cloudflare Pages, and a Linux VPS with Nginx.
6. [Operations and security](docs/OPERATIONS.md) — domains, HTTPS, secrets, backups, limits, monitoring, and launch checks.
7. [Agent instructions](AGENTS.md) — rules for coding agents and contributors working in this repository.

The guides are deliberately detailed. Follow them in order instead of copying a production API key into the frontend.

## What this repository includes

- A responsive Open Detection dashboard UI.
- New-check text and upload states.
- Client-side validation for 125–50,000 words and PDF, DOC, DOCX, or TXT files up to 50 MB.
- Local mock check creation and report pages.
- Local mock history with search, pagination, delete, download, and share affordances.
- Local mock profile, settings, billing, Learn, Help, pricing, privacy, terms, and placeholder resource routes.
- A collapsible desktop sidebar and mobile navigation drawer.
- Inline SVG icons and a vector brand mark.
- A dependency-free Node smoke check.
- A GitHub Actions workflow that runs the smoke check.

## What this repository does not include

- A live AI-detection provider request.
- A live similarity provider request.
- The owner’s private API base URL, API key, or billing credentials.
- Authentication or authorization.
- A database or Supabase project.
- Real file storage.
- Real reports, real scores, or real source matches.
- Payment processing or subscription enforcement.
- A production server, domain, DNS records, or TLS certificate.

The current application says “local demo” in the places where it matters. That is intentional. A cloned UI is not ready to process private documents until the backend and security work described in the documentation are complete.

## Run the UI locally

Clone the repository and enter the project:

~~~sh
git clone https://github.com/aiwithenoch/open-detection.git
cd open-detection
~~~

Start a static server with SPA fallback:

~~~sh
npx --yes serve -s dist -l 4173
~~~

Open:

~~~text
http://127.0.0.1:4173/
~~~

The repository has no runtime npm dependencies. Node 22 or newer is only required for the repository quality check:

~~~sh
npm run check
~~~

You can also open 'dist/index.html' directly. In 'file://' mode, navigation uses hash routes. A static server is still preferred because direct dashboard URLs require history fallback.

## Route map

| Route | Purpose |
| --- | --- |
| '/' | Public landing page |
| '/pricing' | Public plan comparison |
| '/dashboard' | New check |
| '/dashboard/checks' | All checks/history |
| '/dashboard/checks/:id' | Local report viewer |
| '/dashboard/billing' | Plan and billing demo |
| '/dashboard/profile' | Account/profile demo |
| '/dashboard/settings' | Workspace settings demo |
| '/learn' | Learn index |
| '/learn/:slug' | Learn article |
| '/help' | Help centre |
| '/help/:slug' | Help article |
| '/privacy-policy' | Placeholder privacy page |
| '/tos' | Placeholder terms page |

## Source map

~~~text
dist/index.html       App shell, metadata, asset links, and toast region
dist/styles.css       All layout, responsive, form, card, table, and resource styles
dist/app.js           Routing, rendering, local demo state, validation, and interactions
tests/smoke.mjs       Dependency-free source and syntax checks
package.json          npm check/test commands
.github/workflows/    GitHub Actions quality check
.env.example         Safe names-only example for optional backend variables
docs/                 Setup, integration, database, deployment, and operations guides
AGENTS.md             Coding-agent and contributor instructions
changelog.md          Local append-only engineering log; not included in the public snapshot
~~~

The source of truth is the 'dist/' directory. There is no build step that generates another directory.

## Demo behavior and limits

The UI stores demo state in browser local storage under the key 'open-detection-demo-state-v1'. A local check is not sent to any provider. Demo scores and similarity sources are placeholders. The current client-side limits are:

- 125 words minimum for pasted text.
- 50,000 words maximum for pasted text.
- 50 MB maximum for a selected file.
- PDF, DOC, DOCX, and TXT file extensions.
- The newest 100 demo checks are retained.
- Ten history rows are shown per page.

These limits are useful for the demo but are not a security boundary. After adding a backend, enforce the same or stricter limits on the server, authenticate every request, authorize every document, and apply provider quotas there.

## Connecting the owner API

The demo intentionally has no 'fetch()' call to an analysis provider. The current 'run-check' action creates a local object and opens a local report. The integration guide explains how to replace that behavior with:

~~~text
Browser UI
    -> community member’s authenticated backend
        -> owner-supplied analysis API
        -> database/storage
    <- normalized report returned to the browser
~~~

The exact owner API URL, authentication method, request fields, response fields, limits, and commercial terms must come from the API owner. The repository contains no invented credentials or pretend provider endpoint.

Read [API integration](docs/API-INTEGRATION.md) before writing the first 'fetch()' call.

## Quality checks

Run the checks before committing:

~~~sh
npm run check
git diff --check
~~~

'npm run check' runs JavaScript syntax validation and 'tests/smoke.mjs'. GitHub Actions runs the same check on pushes and pull requests.

## Open-source and API boundaries

The repository is public so community members can inspect and clone the UI. Public visibility alone does not grant a software license, permission to reuse the logo, or permission to redistribute the private analysis API. Before describing a release as open source, add the license that matches the owner’s intended terms and keep the API terms separate from the UI license.

The UI license and the owner API agreement are different things:

- The UI repository governs the code in this repository.
- The API owner governs access, usage limits, pricing, attribution, and redistribution of the analysis service.
- A community member must not publish an API key, resell an endpoint, or imply provider affiliation unless the API owner has explicitly authorized it.

## Community support workflow

When a community member asks for help, ask them to provide:

1. The Git commit or tag they cloned.
2. The exact command they ran.
3. The deployment provider and project URL.
4. The browser console error and server/runtime log, with secrets removed.
5. Whether the problem happens in local demo mode or only after API/Supabase integration.

Do not ask them to paste API keys, service-role keys, cookies, password-reset links, or full document contents into an issue.
