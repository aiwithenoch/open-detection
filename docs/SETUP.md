# Local setup and UI customization

This guide is for a community member who has cloned the Open Detection UI and wants to see it running before adding a backend.

## 1. Install the tools

You need:

- Git.
- A modern browser such as Chrome, Edge, Firefox, Safari, or Brave.
- Node.js 22 or newer for the repository checks. The UI itself does not need Node at runtime after it is served.
- A terminal.

Check the tools:

~~~sh
git --version
node --version
npm --version
~~~

If 'node' is missing, install the current LTS release from the official Node.js website. If the repository check reports a version problem, use Node 22 or a newer compatible release.

## 2. Clone the repository

~~~sh
git clone https://github.com/aiwithenoch/open-detection.git
cd open-detection
~~~

If you plan to make changes, create a branch:

~~~sh
git switch -c my-open-detection-setup
~~~

Do not commit private API credentials, Supabase service-role keys, password files, customer documents, or deployment tokens.

## 3. Run the UI

The recommended local command is:

~~~sh
npx --yes serve -s dist -l 4173
~~~

Open 'http://127.0.0.1:4173/' in the browser. The '-s' option supplies SPA history fallback so routes such as '/dashboard/checks' work after a direct refresh.

Keep the terminal process running while you use the UI. Stop it with Ctrl+C.

If the 'serve' package cannot be downloaded, use another static server that supports fallback to 'dist/index.html'. Python’s built-in server is useful for inspecting files, but it does not automatically make every history route work:

~~~sh
python3 -m http.server 4173 --directory dist
~~~

With the Python server, open the root route first and navigate inside the app. For a production deployment, configure the host’s SPA fallback as described in the deployment guide.

## 4. Run the repository checks

From the project root:

~~~sh
npm run check
git diff --check
~~~

The check performs:

1. JavaScript syntax validation for 'dist/app.js'.
2. Static smoke assertions in 'tests/smoke.mjs'.
3. A whitespace/error check over the Git diff.

There is no build command. The files in 'dist/' are already the files that a static host serves.

## 5. Test the unconnected UI

Visit these routes and confirm that each one loads:

~~~text
/
/pricing
/dashboard
/dashboard/checks
/dashboard/billing
/dashboard/profile
/dashboard/settings
/learn
/help
/privacy-policy
/tos
~~~

On '/dashboard':

1. Paste at least 125 words.
2. Confirm that the word count changes.
3. Confirm that the Run check button becomes enabled.
4. Run the check.
5. Confirm that a local report opens.
6. Open All checks and confirm that the local record appears.
7. Resize the browser and test the sidebar collapse and mobile menu.

The report is demo output. The score is calculated locally and is not an AI or similarity result.

## 6. Understand local demo state

The app stores its demo state in browser local storage under:

~~~text
open-detection-demo-state-v1
~~~

The stored state contains local demo checks, the profile name, billing-tab selection, sidebar state, and history filter state. It does not contain a server account or provider record.

To reset the demo:

1. Open browser developer tools.
2. Open Application/Storage, then Local Storage.
3. Select the origin you are using, such as 'http://127.0.0.1:4173'.
4. Remove 'open-detection-demo-state-v1'.
5. Reload the page.

You can also run this in the browser console while on the local app:

~~~js
localStorage.removeItem('open-detection-demo-state-v1');
location.reload();
~~~

Only run that command against your local demo origin. It removes the local demo history for that browser origin.

## 7. Customize the brand

The UI has no build pipeline, so customization is direct:

- Change the document title, metadata, and asset version in 'dist/index.html'.
- Change visible product copy and route rendering in 'dist/app.js'.
- Change colors, spacing, layout, responsive breakpoints, and controls in 'dist/styles.css'.
- Change the vector logo in the 'brandMark()' function in 'dist/app.js'.
- Change the default demo account name and placeholder email in 'dist/app.js'.

Search before editing:

~~~sh
rg -n "Open Detection|demo@example.test|brandMark|local demo|provider" dist README.md docs
~~~

After changing asset URLs, use a new cache query such as '?v=your-version' in 'dist/index.html', or force-refresh the browser. An already-open 'file://' tab can continue to show an old bundle until it is reloaded.

## 8. Add or change a route

Routing is handled in 'dist/app.js':

- 'pathName()' reads the browser path or a file-mode hash.
- 'routeTo()' changes the URL and rerenders.
- 'render()' selects public, dashboard, Learn, Help, pricing, or placeholder content.
- 'renderDashboard()' selects the dashboard child route.

When adding a route:

1. Add the renderer or route branch.
2. Add a navigation link only where the route should be visible.
3. Add styles in 'dist/styles.css'.
4. Add a route assertion to 'tests/smoke.mjs' if the route has a stable source marker.
5. Test both an HTTP server and a direct 'file://' preview if file-mode support matters.
6. Update the route map in the root README.

Do not add an API/developer dashboard to this UI unless the product owner specifically changes the scope. API access belongs to the separate backend integration described in the API guide.

## 9. Replace the demo check action

The current check flow is intentionally local:

1. 'bindNewCheck()' watches the text area and file input.
2. 'validateCheckInput()' applies the client-side word, file-type, and file-size checks.
3. The 'run-check' branch in 'handleAction()' creates a local object.
4. 'saveState()' stores the object in local storage.
5. 'routeTo()' opens the local report route.

Do not put provider integration directly into a click handler with a private key. Add a same-origin backend endpoint or serverless function and call that endpoint from the UI. The backend owns authentication, provider credentials, rate limits, document handling, and error translation.

Follow [API-INTEGRATION.md](API-INTEGRATION.md) for the complete seam and request/response guidance.

## 10. Common local problems

### The page is blank

Check that:

- The browser is opened at the server URL, not at a missing filesystem path.
- The terminal is serving the 'dist' directory.
- The browser console does not show a syntax error.
- 'npm run check' passes.

### The page shows an old logo or old copy

Reload the page, force-refresh the browser, close duplicate tabs, and confirm that 'dist/index.html' points to the current asset version. A 'file://' tab may be cached separately from the local HTTP tab.

### '/dashboard/checks' returns 404

The host needs SPA fallback to 'dist/index.html'. Configure the fallback using [DEPLOYMENT.md](DEPLOYMENT.md).

### The local history is not empty

Remove the 'open-detection-demo-state-v1' local-storage key for the exact origin shown in the address bar. 'localhost' and '127.0.0.1' are different browser origins.

### The UI runs but real results do not appear

That is expected before backend integration. The public UI does not contact a provider. Complete the API adapter, database, authentication, and deployment work before testing real documents.
