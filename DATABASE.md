# AgriTrace database and generated cultivation records

The application now includes a Cloudflare Worker API and D1 database. `wrangler.jsonc`
binds `DB` to `agritrace-db` and `ASSETS` to the Vite production build. Keep the existing
account and database identifiers when deploying this project.

## Data ownership

- All 306 accepted parcel geometries remain unchanged (83 Tân Hưng, 223 Tân An).
- Geometry determines area. Zone/dashboard totals sum the member parcels. The illustrative
  52 ha / 38 households and 6 corners in the request do not override accepted geometry:
  Tân Hưng has approximately 149.7127 ha / 83 distinct household IDs; MP-0001 has 18 corners.
- Each parcel has three deterministic seasons, 14 journal rows per season, four pest records
  per season, and harvest records for the two previous seasons. Production is area × yield.
- `is_seeded` is stored as a constrained SQLite boolean integer and is not rendered.
  Generated identities, phone numbers, agronomy and issuing-document records are synthetic.
  Their presentation does not establish that an authority issued an actual certificate.
- PUC uses the **requested six-digit application format**. The reviewed NĐ 38/2026 text
  shows `YYYYY`; do not describe the application's six-digit variant or crop-code mapping
  as a verified legal standard. Reference:
  https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/38-ndcp.signed.pdf
- Initial USA rice-grain Tricyclazole tolerance is 3 mg/kg, with commodity and source recorded:
  https://www.ecfr.gov/current/title-40/chapter-I/subchapter-E/part-180/subpart-C/section-180.678
  Absence from this small configuration requires review; it is not evidence of a legal ban.

## Development and migrations

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run db:seed
node node_modules/wrangler/bin/wrangler.js d1 migrations apply agritrace-db --local
node node_modules/wrangler/bin/wrangler.js d1 execute agritrace-db --local --file .tmp-analysis/seed.sql
node node_modules/wrangler/bin/wrangler.js dev --local
```

For production migrations use `npm run db:migrate`. Seed SQL uses `INSERT OR IGNORE`;
running it again does not overwrite user edits. It is an initialization step, not a sync
command. Inspect migration changes before applying them to an existing database.

Set `API_ADMIN_PASSWORD` and `SESSION_SECRET` through Wrangler secrets. For local work,
use an ignored `.dev.vars` file. Never commit secrets or include them in `dist/`.
Keep `SESSION_SECRET` stable: it also peppers the PBKDF2 password hashes.

The original four usernames are supported. `doanhnghiep` has read-only parcel access.
Changing a password persists a per-user PBKDF2 hash and random salt in D1. Sessions are
HttpOnly/Secure/SameSite cookies; mutations validate Origin. Active sessions renew on activity.

## API

- `POST /api/session`, `GET /api/session`, `PUT /api/session`, `DELETE /api/session`
- `POST /api/account/password`
- `GET /api/dataset`
- `GET /api/plots/:pdi`, `PATCH /api/plots/:pdi` with field/value/revision
- `GET /api/zones/:id`, `PATCH /api/zones/:id` for issuing metadata/status
- `GET /api/zones/:id/market`, `PATCH /api/zones/:id/market`
- `GET /api/public-trace/:pdi/:batch` is public; phone/contact IDs and private attachments
  are omitted. The batch must exist on the selected parcel.

Parcel edits have an explicit field allowlist, revision checks and transactionally stored
audit events. Geometry, area, allocated identifiers and calculated quantities cannot be
overwritten through the generic field editor. Sowing-date edits shift their dependent
timeline; yield edits recalculate production. Shared zone metadata is read from its parent
zone rather than trusting duplicated parcel payloads.

## Verification

`npm run test:database` starts a **separate local test store** under `.tmp-analysis/`,
initializes it and tests persistence, market changes, PDF printing, validation and auth.
The local test-only password is `local-integration-only`; do not configure it in production.
Use `.dev.vars` with that value when running this integration suite.

`tests/e2e/data-quality.spec.ts` audits all main route templates, five standard details,
a valid public trace and all eight profile tabs in Vietnamese/English. It checks visible
semantic fields rather than decorative empty SVG/span containers. The accessibility suite
also audits open editors. Parcel geometry and consistency tests cover the entire dataset.
