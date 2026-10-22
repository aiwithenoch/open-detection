# API integration

This document explains how to connect the open-source UI to the private analysis API supplied by the Open Detection owner.

The repository does not contain a live provider endpoint. It also does not define the owner API contract. Every URL, header, request field, response field, limit, pricing rule, and retention rule in the owner’s API documentation takes precedence over the examples below.

The examples are an integration shape, not a claim that the owner API accepts these exact fields.

## The required security model

Use this request path:

~~~text
Browser
  -> community member’s backend
       -> owner analysis API
       -> Supabase/database/storage
  <- normalized report
~~~

The browser must not receive the owner’s private API key. A value in 'dist/app.js', a public environment variable such as 'VITE_API_KEY', or any JavaScript sent to the browser is not secret.

The community member’s backend should:

- authenticate the signed-in user;
- authorize access to the requested workspace and document;
- validate word count, file type, and file size again;
- enforce the community member’s plan and quota;
- attach the owner API credential server-side;
- call the owner API;
- normalize the owner response into the app’s report shape;
- save only the data that the community member is allowed to retain;
- redact documents, API keys, authorization headers, and sensitive report content from logs;
- return safe error messages to the browser.

## What the API owner must provide

Before a community member writes an adapter, the owner should provide a private onboarding document containing:

1. The API base URL.
2. The authentication method.
3. Whether each community member receives a separate key, a tenant key, or uses an owner-managed proxy.
4. The AI check endpoint and method.
5. The similarity check endpoint and method.
6. Whether AI and similarity can run in one request or must run separately.
7. Text and file upload formats.
8. Maximum words, bytes, file types, and request timeout.
9. Synchronous or asynchronous job behavior.
10. Job-status and report retrieval endpoints.
11. The complete success response schema.
12. The complete error response schema.
13. Retry and idempotency rules.
14. Usage and billing rules.
15. Data retention and deletion rules.
16. Allowed production origins, if the provider uses origin restrictions.
17. Support contact and incident procedure.

Do not guess any of these values from the UI. Keep the owner API contract private if it contains private URLs, credentials, or commercial terms.

## Current UI integration points

The current app is local-only:

1. 'bindNewCheck()' reads text and file input.
2. 'validateCheckInput()' validates the input in the browser.
3. The 'run-check' branch in 'handleAction()' creates a local demo object.
4. 'saveState()' stores the object in local storage.
5. 'renderReport()' displays sample scores and placeholder sources.
6. 'renderHistory()' reads local demo objects.
7. Download and share actions show local demo messages.

The first integration change is usually the 'run-check' branch. Do not stop there. Real integration also requires replacing local history, report retrieval, download, sharing, authentication, and error states.

## Suggested normalized application contract

The following shape is a useful boundary between the UI and a community backend. Adapt it to the actual owner API:

~~~json
{
  "text": "document text",
  "file": null,
  "includeSimilarity": true,
  "clientRequestId": "uuid-generated-by-the-backend-or-browser"
}
~~~

A backend-normalized accepted response could look like:

~~~json
{
  "id": "check_123",
  "status": "ready",
  "documentName": "essay.docx",
  "wordCount": 1840,
  "createdAt": "2026-10-22T14:00:00Z",
  "ai": {
    "score": 28,
    "highlights": [
      {
        "start": 0,
        "end": 88,
        "label": "review"
      }
    ]
  },
  "similarity": {
    "score": 9,
    "sources": [
      {
        "title": "Source title",
        "url": "https://example.test/source",
        "matchedText": "matched passage"
      }
    ]
  }
}
~~~

An asynchronous response could instead be:

~~~json
{
  "id": "check_123",
  "status": "processing",
  "pollAfterMs": 2000
}
~~~

Do not show a percentage until the provider has returned a completed result. A failed, cancelled, expired, or still-processing job must have a distinct state in the UI.

## Suggested backend routes

The exact names are up to the implementer. A small backend commonly needs:

~~~text
POST   /api/checks
GET    /api/checks
GET    /api/checks/:id
DELETE /api/checks/:id
GET    /api/checks/:id/download
POST   /api/checks/:id/share
GET    /api/me
~~~

If the owner API is asynchronous, add:

~~~text
GET    /api/checks/:id/status
~~~

The browser should call the community backend with same-origin relative paths such as '/api/checks'. That avoids hard-coding an API host into the UI and makes the same frontend deployable on Vercel, Cloudflare, or a VPS.

## Example frontend replacement

This is an illustrative function for the browser. It contains no owner credential:

~~~js
async function createRealCheck({ text, file, includeSimilarity }) {
  const form = new FormData();
  if (text) form.append('text', text);
  if (file) form.append('file', file);
  form.append('includeSimilarity', String(Boolean(includeSimilarity)));

  const response = await fetch('/api/checks', {
    method: 'POST',
    body: form
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'The check could not be started.');
  }
  return payload;
}
~~~

Replace the demo object creation only after a backend route exists. Add loading, success, processing, failure, retry, and cancellation states before removing the local fallback.

Do not send a private API key in a request header from this function. The browser may send the user’s session cookie or a short-lived user access token to the community backend, depending on the chosen authentication system.

## Example server-side adapter shape

This is deliberately provider-neutral pseudocode. Replace the path, header, and body with the owner’s real contract:

~~~js
export async function createProviderCheck(input) {
  const providerUrl =
    process.env.OPEN_DETECTION_PROVIDER_BASE_URL + '/provider-specific-check-path';

  const providerResponse = await fetch(providerUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.OPEN_DETECTION_PROVIDER_API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.clientRequestId
    },
    body: JSON.stringify({
      text: input.text,
      includeSimilarity: input.includeSimilarity
    })
  });

  const providerBody = await providerResponse.json().catch(() => ({}));
  if (!providerResponse.ok) {
    throw normalizeProviderError(providerResponse.status, providerBody);
  }

  return normalizeProviderResponse(providerBody);
}
~~~

The key rules are:

- Read the key from server environment variables.
- Never return the key to the browser.
- Never log the key or the entire provider request.
- Never trust a score, document ID, or owner ID supplied by the browser without checking it.
- Store the provider request ID so retries and support investigations can be correlated.
- Use the provider’s documented idempotency behavior.

## Text and file handling

For pasted text:

1. Validate the word count in the browser for a fast message.
2. Validate the word count again on the server.
3. Normalize Unicode only if the owner API requires it.
4. Do not silently trim or rewrite a document without telling the user.
5. Send only the fields needed by the provider.

For files:

1. Validate extension and byte size in the browser.
2. Validate MIME type, extension, and byte size on the server.
3. Do not trust the browser-provided MIME type alone.
4. Store the upload in a private bucket or stream it to the backend.
5. Delete temporary files according to the retention policy.
6. Do not expose a public storage URL for a private document.
7. Show a processing state if conversion or provider analysis is asynchronous.

The current demo accepts PDF, DOC, DOCX, and TXT as a UI affordance. The real backend must confirm what it can parse. A file extension is not proof that a document is safe or readable.

## History and reports

Replace local history with authenticated server reads:

- 'GET /api/checks' should filter by the current user or workspace on the server.
- Search, pagination, and sorting should be applied server-side for large histories.
- 'GET /api/checks/:id' must check ownership before returning a report.
- Delete must be authorized and should follow the documented retention policy.
- Download must create a short-lived authorized response or signed URL.
- Share must create a revocable, scoped share token rather than exposing an internal ID.

Never use a client-supplied document ID as proof that the current user may read it.

## Authentication and authorization

Authentication answers “who is this?” Authorization answers “may this person access this check?”

At minimum:

- Require a signed-in user before creating, viewing, downloading, or deleting real checks.
- Attach each check to a user ID and, if applicable, a workspace/tenant ID.
- Verify the session on every backend request.
- Apply server-side plan, quota, and rate-limit checks.
- Do not trust a plan name or quota value sent by the browser.
- Return 401 for an absent/invalid session and 403 for an authenticated user without access.
- Do not reveal whether another user’s document ID exists.

Supabase implementation details are in [SUPABASE.md](SUPABASE.md).

## Errors, timeouts, and retries

Define an error map before connecting the UI:

| Condition | Backend response | UI behavior |
| --- | --- | --- |
| Unauthenticated | 401 | Ask the user to sign in |
| Not allowed | 403 | Explain access/plan limitation |
| Invalid text/file | 400 | Show the specific validation message |
| Provider rate limit | 429 | Show retry timing without exposing provider internals |
| Provider unavailable | 502 or 503 | Show temporary failure and support reference |
| Job still processing | 202 or 200 with status | Poll or subscribe to status |
| Unknown internal error | 500 | Show a safe generic message |

Use bounded retries with backoff only for errors documented as retryable. Do not retry a document submission blindly if it may create a second billable provider job. Use an idempotency key or persist the provider request before retrying.

Set explicit timeouts for provider requests. A request that hangs forever will exhaust server resources.

## Local integration development

Use a local backend URL or a same-origin development proxy. Keep secrets in an ignored local environment file:

~~~text
OPEN_DETECTION_PROVIDER_BASE_URL=https://replace-with-owner-endpoint
OPEN_DETECTION_PROVIDER_API_KEY=replace-locally-never-commit
SUPABASE_URL=https://replace-with-project.supabase.co
SUPABASE_ANON_KEY=replace-with-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=replace-with-server-only-key
~~~

Do not commit the real environment file. Use '.env.example' only for names and safe placeholder values; never put a working key in an example file.

If the browser and backend run on different origins during development, configure a narrow CORS allowlist for the local UI origin. Do not use a wildcard origin with credentials in production.

## Integration checklist

Before declaring the API integration complete:

- [ ] The browser uses a same-origin backend route.
- [ ] The owner API key exists only in backend/serverless environment variables.
- [ ] Text and file limits are enforced twice.
- [ ] Authentication is required.
- [ ] Workspace ownership is checked.
- [ ] Provider requests have timeouts.
- [ ] Provider retries are bounded and idempotent.
- [ ] Processing, ready, failed, and cancelled states are visible.
- [ ] AI and similarity scores are stored and displayed separately.
- [ ] Source matches are treated as review evidence, not automatic plagiarism verdicts.
- [ ] Report downloads are authorized.
- [ ] Shared reports use revocable, scoped links.
- [ ] Logs redact text, files, keys, cookies, and authorization headers.
- [ ] Usage and quota accounting is server-side.
- [ ] Deletion and provider retention behavior are documented.
- [ ] Tests cover unauthorized access, cross-user access, provider failure, timeout, retry, and malformed responses.
