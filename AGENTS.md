# Open Detection repository instructions

These instructions apply to coding agents and human contributors working on the Open Detection UI starter.

## Mission

This repository is an open-source UI starting point for a document review product. It is intentionally buildless and local-first. Community members clone it, customize the UI, then add their own backend and connect an approved private analysis API.

Do not treat this repository as a complete production application. Do not claim that the demo score, similarity source, billing screen, profile screen, or upload flow is connected to a real provider unless the implementation and tests prove it.

## Read before changing code

Read:

1. 'README.md'.
2. 'docs/SETUP.md'.
3. 'docs/API-INTEGRATION.md' for API/backend work.
4. 'docs/SUPABASE.md' for database/auth/storage work.
5. 'docs/DEPLOYMENT.md' for hosting work.
6. 'docs/OPERATIONS.md' for security, domains, privacy, monitoring, and backups.

If the user asks for a change that crosses one of those areas, read the relevant guide completely before editing.

## Source of truth

The current UI source is:

- 'dist/index.html' for the shell and metadata;
- 'dist/styles.css' for visual styling and responsive layout;
- 'dist/app.js' for routing, rendering, state, validation, and interaction.

There is no source-to-dist build step. Do not edit a generated directory and then assume another build will overwrite it. The files in 'dist/' are the files deployed to a static host.

## Required safety rules

- Never put API keys, Supabase service-role keys, passwords, cookies, private URLs, or deployment tokens in browser code.
- Never add a provider request to the frontend with a private key.
- Never log full document text, uploaded files, authorization headers, or raw secret values.
- Never remove authentication or ownership checks to make a demo request work.
- Never treat a client-provided plan, user ID, or document ID as trusted.
- Never claim that placeholder scores are real analysis.
- Never expose a private storage bucket publicly.
- Never add real user documents to fixtures or screenshots.

## UI changes

Preserve:

- keyboard-accessible controls;
- mobile navigation and desktop sidebar collapse;
- file-mode hash navigation;
- responsive layout;
- escaped user-controlled text;
- visible validation messages;
- clear local-demo boundaries until a real backend replaces them.

When changing the brand:

1. Update the visible wordmark and title consistently.
2. Update metadata and cache versions.
3. Keep the SVG logo accessible and crisp at small sizes.
4. Search for old brand strings and stale asset markers.
5. Test both desktop and mobile layouts.

When changing routes:

1. Update the renderer in 'dist/app.js'.
2. Update visible navigation only when the route should be public.
3. Update the README route map.
4. Add or update source smoke assertions.
5. Test direct refresh with SPA fallback.
6. Test direct 'file://' behavior if file preview remains supported.

## API/backend changes

The current 'run-check' action is local demo behavior. A real integration should use:

~~~text
browser -> community backend -> owner API
browser <- authorized normalized report
~~~

The backend must own:

- session verification;
- ownership and workspace authorization;
- server-side input validation;
- provider credentials;
- plan and quota checks;
- timeout/retry/idempotency behavior;
- normalized report persistence;
- safe error handling;
- deletion and retention behavior.

Before changing the UI to call a backend, identify the actual owner API contract. Do not invent endpoint paths or response fields and present them as real. If the contract is not available, keep the adapter behind a clearly marked placeholder.

## Supabase changes

When adding Supabase:

- enable RLS on every user-data table;
- test access with two users;
- keep the service-role key server-only;
- use private storage for documents;
- use signed URLs with short expiry;
- store migrations in source control;
- do not allow browser writes to plans or usage accounting;
- document deletion and retention.

## Deployment changes

For every deployment change:

- verify SPA fallback for direct routes;
- verify JavaScript and CSS content types;
- verify no secret is present in the output;
- test the exact production domain over HTTPS;
- separate preview and production environment variables;
- record rollback instructions.

Follow 'docs/DEPLOYMENT.md' for Vercel, Cloudflare, and VPS instructions.

## Verification commands

Run from the repository root:

~~~sh
npm run check
git diff --check
~~~

For changed UI routes, use a static server and manually inspect:

- '/';
- '/dashboard';
- '/dashboard/checks';
- '/dashboard/profile';
- '/learn';
- '/help';
- desktop and mobile widths;
- browser console for errors.

For backend changes, add tests for authentication, cross-user access, invalid input, provider failure, timeout, retry, and deletion. Do not declare the API integration complete based only on one successful happy-path request.

## Documentation contract

If a change affects setup, API behavior, environment variables, Supabase, deployment, privacy, limits, or support:

1. Update the relevant document in 'docs/'.
2. Update the root README if the main workflow changed.
3. Add safe placeholder names instead of real secrets.
4. Explain what is demo-only and what is production-ready.
5. Record any known blocker or deferred decision.

If a checkout contains 'changelog.md', preserve it as an append-only chronological engineering log. Do not rewrite old entries to make the history look cleaner.

## Stop conditions

Stop and ask the product owner when:

- the API contract is missing or contradictory;
- a license choice is required;
- a data-retention or privacy decision is unknown;
- a real secret is needed but has not been provisioned through a secure channel;
- a deployment target is ambiguous;
- a change would expose another user’s document;
- a requested shortcut would bypass authentication or authorization.
