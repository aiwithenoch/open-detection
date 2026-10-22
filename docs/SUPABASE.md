# Supabase setup

Supabase is an optional backend foundation for a deployed Open Detection UI. It can provide authentication, Postgres data, private storage, and server-side functions. It does not replace the owner analysis API. The backend still has to call that API using a server-only credential.

The public UI does not connect to Supabase today. This guide describes one safe path for adding it.

## Recommended architecture

~~~text
Browser
  -> authentication session
  -> community backend or Supabase Edge Function
       -> Supabase Postgres / Storage
       -> owner analysis API
~~~

Use the browser-safe Supabase anon key only for operations protected by Row Level Security. Keep the Supabase service-role key and the owner API key in a server or Edge Function environment.

Never place either secret key in 'dist/'.

## 1. Create the Supabase project

1. Create a Supabase project in the intended organization.
2. Choose a region close to your users and provider API.
3. Record the project URL and public anon key.
4. Keep the database password in a password manager.
5. Enable only the authentication providers you intend to support.
6. Decide whether users belong to one account or to workspaces/teams before creating production tables.
7. Configure a separate development project if the project will process real documents.

Do not use a production project for early UI experiments with real documents.

## 2. Environment variables

A server or Edge Function may use:

~~~text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=public-anon-key-for-client-auth
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key
OPEN_DETECTION_PROVIDER_BASE_URL=https://owner-api.example
OPEN_DETECTION_PROVIDER_API_KEY=server-only-owner-api-key
~~~

The anon key is designed to be public, but it is not an authorization bypass. Row Level Security must be enabled and tested. The service-role key bypasses RLS and must never be sent to a browser.

Keep local values in an ignored environment file. In deployment, add them through the provider’s encrypted environment-variable settings.

## 3. Minimum database model

This is a starting migration for a single-user-owned workspace. If the product needs teams, create a workspace and membership model before going live.

~~~sql
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_name text not null,
  word_count integer not null check (word_count >= 0),
  status text not null check (status in ('queued', 'processing', 'ready', 'failed', 'cancelled')),
  provider_check_id text,
  ai_score numeric(5, 2),
  similarity_score numeric(5, 2),
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null unique references public.checks(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  ai_payload jsonb,
  similarity_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  check_id uuid references public.checks(id) on delete set null,
  service text not null check (service in ('ai', 'similarity')),
  words integer,
  provider_request_id text,
  created_at timestamptz not null default now()
);

create index if not exists checks_owner_created_idx
  on public.checks(owner_id, created_at desc);

create index if not exists reports_owner_created_idx
  on public.reports(owner_id, created_at desc);

create index if not exists usage_owner_created_idx
  on public.usage_events(owner_id, created_at desc);
~~~

Use migrations in source control rather than making undocumented production dashboard edits. Supabase CLI migrations are recommended once the project has more than one environment.

## 4. Create profiles safely

A common pattern is to create a profile row when a user signs up. The database trigger must be written carefully and tested against failed signups. Alternatively, create the profile in a trusted server function immediately after signup.

Do not allow a browser to set its own plan to Pro by writing directly to a plan column. Plan changes must come from a trusted billing workflow or an administrator-controlled server operation.

## 5. Enable Row Level Security

Enable RLS on every table that contains user or document data:

~~~sql
alter table public.profiles enable row level security;
alter table public.checks enable row level security;
alter table public.reports enable row level security;
alter table public.usage_events enable row level security;
~~~

Basic single-user policies:

~~~sql
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "checks_select_own"
on public.checks for select
to authenticated
using (owner_id = auth.uid());

create policy "checks_insert_own"
on public.checks for insert
to authenticated
with check (owner_id = auth.uid());

create policy "checks_update_own"
on public.checks for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "checks_delete_own"
on public.checks for delete
to authenticated
using (owner_id = auth.uid());

create policy "reports_select_own"
on public.reports for select
to authenticated
using (owner_id = auth.uid());

create policy "usage_select_own"
on public.usage_events for select
to authenticated
using (owner_id = auth.uid());
~~~

If reports can be read through a check relationship, use a policy that checks both the report owner and the linked check owner. Do not assume a report ID is secret.

Test RLS with two different user accounts:

1. User A creates a check.
2. User B attempts to read User A’s check by ID.
3. User B attempts to read the report, download the file, update the check, and delete the check.
4. Every cross-user operation must fail.

## 6. Storage for uploads

Create a private storage bucket for original documents if the product needs to retain them. Do not create a public bucket for essays, student work, or other private documents.

Recommended object path:

~~~text
user-id/check-id/original-file-name
~~~

Use a server endpoint or tightly scoped signed URLs for upload and download. Validate the file again on the server before writing it. Store a sanitized display name in the database; do not use an unsanitized user filename as a storage path.

Define:

- maximum file size;
- allowed MIME types and extensions;
- malware scanning procedure;
- retention period;
- deletion behavior;
- whether provider transmission requires a separate copy;
- who may create signed download URLs.

The storage bucket, database record, provider request, and report record must not be left in an inconsistent state when a job fails. Add a cleanup job for abandoned uploads.

## 7. Authentication flow

A normal flow is:

1. User signs up or signs in through Supabase Auth.
2. Supabase issues a session.
3. The browser sends the session cookie or access token to the community backend.
4. The backend verifies the user.
5. The backend uses the authenticated user ID in every database query.
6. The backend checks plan, quota, and ownership before calling the owner API.

Do not trust a user ID in a JSON body. Read identity from the verified session.

If using cookies:

- use Secure cookies in production;
- use HttpOnly where appropriate;
- use SameSite settings appropriate for the deployment;
- protect state-changing requests against CSRF;
- do not log cookies.

If using bearer access tokens:

- validate signature and expiry server-side;
- keep the token out of URLs;
- do not put it in screenshots or issue reports;
- handle refresh and sign-out explicitly.

## 8. Server-side service role

Only use the service-role key in trusted server code when an operation genuinely needs it. Prefer the anon key plus RLS for user-scoped reads and writes. If an Edge Function uses service-role access to create a report, it must still derive the user identity from a verified session and apply explicit ownership checks.

Never:

- embed the service-role key in frontend code;
- put it in a public GitHub issue;
- print it in deployment logs;
- store it in a screenshot;
- use it as a replacement for authorization.

Rotate it immediately if it is exposed.

## 9. Provider report persistence

Persist the smallest useful normalized result:

- provider request ID;
- current status;
- word count;
- AI score;
- similarity score;
- normalized highlights;
- normalized source metadata;
- timestamps;
- safe error code;
- owner/workspace ID.

Keep raw provider payloads only if the owner API terms and your privacy policy allow it. Raw payloads may contain document text or source content. Encrypt or restrict them appropriately.

Usage accounting should be written from trusted server events, not from a browser checkbox. Record whether an AI or similarity request was actually accepted and charged.

## 10. Database verification checklist

- [ ] Development and production projects are separate.
- [ ] Every user-data table has RLS enabled.
- [ ] Every policy is tested with two users.
- [ ] The service-role key is server-only.
- [ ] Private storage is not public.
- [ ] Signed URLs expire.
- [ ] Database backups and restore testing are configured.
- [ ] Migrations are stored in Git.
- [ ] User deletion removes or anonymizes their checks, reports, and files according to policy.
- [ ] Provider retention and Supabase retention are documented together.
- [ ] Usage events cannot be edited by an ordinary user.
- [ ] Plan/entitlement changes cannot be written by the browser.
