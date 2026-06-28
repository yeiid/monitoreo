Playwright screenshots

This folder contains a minimal Playwright test and config to capture screenshots of the app.

Prereqs
- Node.js (16+)
- From the workspace root you can use your package manager (pnpm, npm, yarn).

Install (example with pnpm, run in workspace root):

```bash
pnpm add -D -w @playwright/test
npx playwright install --with-deps
```

Run

```bash
# from workspace root
npx playwright test tools/screenshot --project=chromium
```

Options
- Set `BASE_URL` env var if your frontend runs on a different port, e.g. `BASE_URL=http://localhost:5173`.
- Output images are written to `tools/screenshot/output/`.

Notes
- If the app requires authentication to view pages, either run the script against a dev server that doesn't require auth, or update the spec to perform a login step (you can provide `SCREENSHOT_USER`/`SCREENSHOT_PASS` env vars and I'll add the login flow).
- The spec uses non-destructive interactions only (opens dropdowns, clicks safe buttons). Adjust interactions as needed for modals or forms.
