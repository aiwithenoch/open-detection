# Deployment guide

This UI is a static application. You can deploy the frontend to Vercel, Cloudflare Pages, or an ordinary Linux VPS. The analysis backend can live on the same provider or on a separate service. The browser should call the backend through a stable same-origin path such as '/api/checks'.

Choose one deployment path. Do not deploy real document processing until authentication, authorization, secrets, storage, provider limits, and deletion behavior have been tested.

## Before deploying

Complete these items first:

- [ ] The UI works locally from a clean clone.
- [ ] 'npm run check' passes.
- [ ] The API owner has supplied the real integration contract.
- [ ] The backend keeps the owner API key server-side.
- [ ] Authentication is enabled.
- [ ] Database and storage policies are tested.
- [ ] Server-side file and word limits are enforced.
- [ ] The application has a privacy policy and terms appropriate to the documents it handles.
- [ ] The domain and support contact are ready.
- [ ] No secrets or private documents are in Git.

## Option A: Vercel for the frontend

Vercel is a convenient option for the static UI and small serverless backend functions.

### Import the repository

1. Sign in to Vercel.
2. Choose Add New Project.
3. Import 'aiwithenoch/open-detection'.
4. Select the intended GitHub account/team.
5. Set the framework preset to Other if Vercel does not detect one.
6. Leave the build command empty because this repository is already static.
7. Set the output directory to 'dist'.
8. Deploy a preview first.

If the Vercel project is configured with the repository root as its output, use a rewrite file so extensionless routes reach the SPA shell. An optional root-level 'vercel.json' can contain:

~~~json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
~~~

If the host serves existing static assets before rewrites, the broad rule works as shown. If the host rewrites asset requests too, use the platform’s documented filesystem-first SPA rule and verify that 'styles.css' and 'app.js' still return their correct content types.

### Test Vercel

Test all of these URLs directly, not only by clicking from the homepage:

~~~text
/
/dashboard
/dashboard/checks
/dashboard/profile
/learn
/help
~~~

Open the browser developer tools and check:

- the JavaScript and stylesheet requests return 200;
- no asset request is rewritten to HTML;
- a direct refresh on '/dashboard/checks' still renders;
- the mobile navigation works;
- the browser console has no errors.

### Add a backend on Vercel

If the community member uses Vercel Functions, place server code in the Vercel-supported function directory and keep the UI route calls same-origin. The exact directory and runtime depend on the chosen framework. This repository has no function directory today, so adding one is an integration change that must include:

- server-side environment variables;
- authentication verification;
- request validation;
- provider adapter;
- database access;
- error handling;
- tests.

Add owner API and Supabase variables in Vercel Project Settings → Environment Variables. Configure separate values for Development, Preview, and Production. Do not commit the values to GitHub.

### Vercel update workflow

~~~text
local change
  -> git commit
  -> git push
  -> Vercel preview
  -> test preview
  -> promote/merge to production
~~~

Use preview deployments to test a new API adapter without pointing production users at an unfinished provider integration.

## Option B: Cloudflare Pages

Cloudflare Pages works well for the static UI and can be paired with Cloudflare Workers or another backend.

### Connect the repository

1. Open Cloudflare Dashboard → Workers & Pages.
2. Create an application and choose Pages.
3. Connect the GitHub repository.
4. Select the 'main' branch for production.
5. Use no framework preset or a static-site preset.
6. Leave the build command empty.
7. Set the output directory to 'dist'.
8. Deploy a preview.

Cloudflare Pages commonly provides SPA fallback when there is no '404.html', but verify direct route refreshes after deployment. If a route returns a 404, follow Cloudflare’s current SPA fallback guidance or add the appropriate Pages Function/routing rule.

### Cloudflare Pages environment variables

Add only the variables needed by the deployed component:

- public browser configuration may be exposed only if it is explicitly designed to be public;
- owner API keys belong in a Worker or backend secret;
- Supabase service-role keys belong in server secrets;
- development, preview, and production values must be separated.

Use the Cloudflare dashboard’s encrypted variables/secrets or Wrangler secret commands. Do not place secrets in 'dist/'.

### Cloudflare Worker backend

A Worker can expose same-origin routes such as '/api/checks'. The Worker should:

1. Verify the user session.
2. Validate the request.
3. Read the owner API key from a Worker secret.
4. Call the owner API with a timeout.
5. Normalize the response.
6. Write authorized state to Supabase or another database.
7. Return a safe JSON response.

Do not use a public Worker environment variable for the owner key. Test a request without authentication and a request for another user’s check.

## Option C: Linux VPS with Nginx

A VPS gives more control, but the owner is responsible for updates, firewall rules, backups, monitoring, TLS renewal, and incident response.

### Prepare the server

Use a supported Ubuntu or Debian release. Create a non-root deployment user and use SSH keys rather than password login where possible.

~~~sh
sudo apt update
sudo apt install -y nginx git ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
~~~

Do not expose development servers such as the local 'serve' process directly to the internet.

### Copy the UI

One simple layout is:

~~~sh
sudo mkdir -p /var/www/open-detection
sudo chown -R "$USER":"$USER" /var/www/open-detection
git clone https://github.com/aiwithenoch/open-detection.git /var/www/open-detection
~~~

The static files are in:

~~~text
/var/www/open-detection/dist
~~~

### Configure Nginx

Create '/etc/nginx/sites-available/open-detection':

~~~nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.example.com;

    root /var/www/open-detection/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|svg|png|jpg|jpeg|gif|webp|ico|woff2?)$ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
~~~

Enable it:

~~~sh
sudo ln -s /etc/nginx/sites-available/open-detection /etc/nginx/sites-enabled/open-detection
sudo nginx -t
sudo systemctl reload nginx
~~~

Do not cache HTML as immutable. The asset query version in 'dist/index.html' is used to refresh CSS and JavaScript after a release.

### Add HTTPS

After DNS points to the VPS and HTTP works:

~~~sh
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.example.com
sudo systemctl status certbot.timer
~~~

Confirm that HTTP redirects to HTTPS and that certificate renewal works in a safe test before the certificate expires.

### Deploy updates

~~~sh
cd /var/www/open-detection
git pull --ff-only origin main
sudo nginx -t
sudo systemctl reload nginx
~~~

If a backend is on the same VPS, run it as a separate non-root service behind Nginx. Keep provider keys in a protected environment file or secret manager, not in the Git checkout.

## Backend placement

The UI and backend can be:

1. on the same origin;
2. on separate origins with a narrow CORS policy;
3. on separate providers with a reverse proxy.

Same-origin routing is the simplest for this UI:

~~~text
https://app.example.com/                 -> static UI
https://app.example.com/api/checks       -> community backend
https://app.example.com/api/checks/:id   -> community backend
~~~

If the backend uses another host:

- configure CORS for only the real UI origins;
- send credentials only when required;
- protect cookies;
- never use wildcard origins with credentialed requests;
- verify that error responses do not include provider keys or document text;
- configure a production API base URL through the deployment environment, not by editing a key into the browser bundle.

## Rollback

Before each production release:

1. Record the Git commit SHA.
2. Test the preview.
3. Confirm the current production URL and health check.
4. Keep the previous deployment available.

Rollback should restore both frontend and backend compatibility. Do not roll back only the UI if the new UI requires response fields that the old backend does not provide.

## Deployment verification

Run this after every deployment:

- [ ] Homepage loads over HTTPS.
- [ ] Direct '/dashboard' refresh works.
- [ ] Direct '/dashboard/checks' refresh works.
- [ ] JavaScript and CSS return 200 with correct content types.
- [ ] No source map or environment file exposes a secret.
- [ ] Browser console has no errors.
- [ ] Authentication redirects work.
- [ ] An unauthenticated API request is rejected.
- [ ] A user cannot read another user’s report.
- [ ] An invalid file is rejected.
- [ ] A too-large file is rejected.
- [ ] Provider timeout produces a safe error.
- [ ] Health checks and logs are available.
- [ ] The domain resolves on both intended IPv4/IPv6 paths or the chosen network configuration is documented.
