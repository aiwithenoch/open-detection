# Open Detection website codebase

This is the coded website—not a screenshot or hosted-site wrapper. It is an original, buildless HTML/CSS/JavaScript implementation based on the public information architecture and non-mutating UI inspection of the supplied document-review site.

It includes:

- public landing, pricing, Learn, Help, and blog/legal placeholder routes;
- dashboard new-check, history, report, billing, profile, and settings routes;
- local-only mock interactions for checks, reports, filters, pricing toggles, accordions, and copy buttons;
- anonymized sample data and a clear demo-mode boundary—no live provider requests, uploads, payment actions, or account mutations. Developer/API features are intentionally omitted because API delivery is handled separately.

The source of truth is `dist/index.html`, `dist/styles.css`, and `dist/app.js`. Edit those files to change the site.

## Run locally

From the project folder, run a static server with SPA fallback so direct dashboard links resolve:

```bash
npx --yes serve -s dist -l 4173
```

Then open `http://127.0.0.1:4173/`.

The app also works with Python's built-in server when you start at `/` and navigate inside the app, but direct deep links need a server with history-fallback support.

For a quick offline check, you can also open `dist/index.html` directly. In `file://` mode, navigation stays inside the file using local hash routes.

Demo state is stored in the browser's local storage under a versioned local key. Checks are limited to 125–50,000 words or a 50 MB PDF, DOC, DOCX, or TXT file, and the local history retains the newest 100 checks.

## Quality checks

This build has no runtime dependencies. Run the syntax and smoke checks with:

```bash
npm run check
```
