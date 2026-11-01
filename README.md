# AgriTrace Portal

Vietnamese/English demo portal for rice planting zones, parcel profiles, IoT monitoring and traceability. Built with React, TypeScript, Vite, Tailwind CSS, MapLibre GL JS, Turf and Recharts.

## Run locally

Requires Node.js 22 LTS or newer.

```sh
npm ci
npm run dev
```

## Validate and build

```sh
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
npm run preview
```

Use `npm run format` to format `src/` with Prettier (100 columns).
ESLint checks TypeScript, React hooks and JSX accessibility. The application keeps
its locked TypeScript 7 compiler; ESLint's supported TypeScript 6 parser is isolated
in `tooling/eslint/` and installed automatically by `npm ci` through `postinstall`.
Both dependency trees have committed lockfiles. If lifecycle scripts are disabled,
run `npm --prefix tooling/eslint ci --ignore-scripts` before linting.

Pages load through `React.lazy` with a shared skeleton fallback. MapLibre and its
worker are the only production JavaScript assets allowed to exceed 500 kB.

Production output is generated in `dist/`. Configure static hosting to serve `index.html` for client-side routes.

## Responsive regression checks

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright builds and serves the production app on port 4175, then checks all 14
main routes at widths 390, 768, 1024 and 1440. The width test also rejects document
overflow hiding as a workaround. Additional checks cover mobile drawer focus,
Escape/backdrop/menu dismissal, scroll locking, desktop sidebar collapse, table
scroll edges and mobile map sheets. Reports and mobile screenshots are saved in
the ignored `test-results/` directory.

## Accessibility regression checks

```sh
npm run test:a11y
```

The production app is scanned with `@axe-core/playwright` and the `wcag2a`,
`wcag2aa`, `wcag21aa` tags at 390 and 1440 pixels. Coverage includes all main
routes, public plot traceability, the fallback page, both VI/EN languages, every
plot/admin tab, account/password forms, the notification dropdown, session-expiry warning, invalid login and the mobile navigation/map dialogs. Tests assert
zero axe violations without excluding page regions or disabling rules. Full axe
JSON reports are saved under `test-results/`.

Additional checks cover one main/h1, heading order, a 12px screen-text minimum,
24px controls (44px on mobile), skip-link focus and tab arrow/Home/End navigation.
Tables use 13–14px text. Content colors meet the [WCAG contrast minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html),
and tabs follow the [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

## Screens

- `/dashboard`: overview and satellite map preview.
- `/map`: real basemaps, seeded parcel geometry, filters, measurements, coordinates and plot drawer.
- `/zones`: planting-zone registry and member parcels.
- `/plots`: separate parcel list with owner/PDI search and filters.
- `/plots/VN-66-04-12-HTX01-T015`: showcase digital passport with eight tabs, logbook, GPS checks, soil/water, pests, compliance, harvest history and documents.
- `/iot`: sensor monitoring and station map.
- `/trace/plots/:pdi/:batch`: public demonstration batch traceability.

Other demo modules include farming, standards, carbon MRV and administration.

## Data and tiles

All agricultural, household, sensor and compliance records are mock data. Documents and photos are illustrative. Market checks and soil ranges are demonstration rules, not certification or legal determinations.

Basemaps require internet access and show provider attribution. Satellite uses Esri, terrain uses OpenTopoMap and street defaults to OpenStreetMap. To use CARTO Voyager, set `VITE_CARTO_API_KEY` in `.env.local` and rebuild. Local environment files are ignored by Git.

See [map notes](MAP_NOTES.md) and [plot profile notes](PLOT_PROFILE_NOTES.md) for implementation details.

## Previews

![Plot profile](plot-profile-preview.jpg)

![Digital map](map-preview.jpg)

## Mock sessions and account settings

AppLayout routes and role selection require a mock session. A successful login returns to the requested local URL, or opens role selection when logging in directly. Public `/trace/plots/:pdi/:batch` links remain accessible without signing in.

Authentication, role, account edits, password changes and per-account notification read state are stored in `sessionStorage`. The username reminder only remembers the username; it never stores a persistent login. Inactive sessions show a warning at 29 minutes and sign out at 30 minutes. Continuing the session resets the timer.

The avatar menu opens `/account`, `/account/password`, role switching and sign out. `/notifications` lists older notifications with read/unread filters. Password changes require the current password and a different password with at least eight characters, including letters and numbers. Avatar uploads support PNG/JPEG/WebP up to 2 MB and are resized locally.

Demo credentials are shown in development only. To show the demo-account table in a production demo build, set `VITE_SHOW_DEMO_ACCOUNTS=true` in `.env.local` and rebuild. The default production build hides the table.

`tests/e2e/auth-notifications.spec.ts` uses the actual login form to test session guards, sign out, inactivity, account/password edits and notification read state. Other screen regression suites explicitly seed an authenticated mock session; they do not bypass the application's route guard.

## Evidence-backed standards library

`/standards` links to `/standards/:id` (including `/standards/srp`). The data and per-field reference mapping are in `src/features/standards/data/standards.ts`; the verified snapshot is dated 15 October 2026. Optional fields without registered sources are omitted entirely. Issuer roles include appraisal for the TCVN record. Reference links open a new tab and show access dates.

The market matrix contains only the three sourced EU/US legal cells in `marketMatrix.ts`. Missing cells stay empty; rows without sourced cells are hidden. GLOBALG.A.P. transition dates retain the scope of the cited announcement. The library does not assign a validity status to VietGAP.

`standards.spec.ts` covers accent-insensitive search, good practices, sourced market cells, direct detail URLs, missing IDs, keyboard accordions, VI/EN axe scans and mobile widths. Data integrity and missing-source behavior are also covered by Vitest.
