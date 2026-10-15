# Plot passports

Entry: `/plots/VN-66-04-12-HTX01-T015`. All 50 generated map parcels have profiles. Short-code links such as `/plots/T015` remain supported for old links. Unknown identifiers show a not-found state. `/plots` opens the parcel registry.

## Validation

```powershell
npm test
npm run typecheck:plots
npm run build
npx tsx src/map/mock/verifyGeometry.ts
```

Vitest covers deterministic generation, 50 profiles, current-season timing, polygon validity, GPS position/accuracy/tolerance, COA changes, market-specific mock ingredient restrictions, PHI, GPS recomputation, straw burning, harvest drainage and not-applicable evidence for unharvested seasons.

VI/EN uses the shared language provider with a feature-scoped dictionary. Dates use Vietnam-local calendar dates; DAS is computed from today in Asia/Ho_Chi_Minh. The showcase sowing date is anchored to 2026-08-28 (47 DAS on 2026-10-14), so the demo remains chronologically stable as time advances.

## New dependencies

- Runtime: `qrcode` for locally generated batch QR codes.
- Development: `vitest`, `@types/qrcode`, `@types/node`.

## Source additions

- `src/features/plots/types.ts`, `i18n.ts`, `profile.css`
- `src/features/plots/PlotProfilePage.tsx`, `PlotPublicTracePage.tsx`
- `src/features/plots/mock/plotProfiles.ts`
- `src/features/plots/hooks/usePlotProfile.ts`
- `src/features/plots/utils/{compliance,geo,format}.ts`, `rules.test.ts`
- `src/features/plots/components/{PlotHeader,KpiStrip,PlotMiniMap,OverviewTab,SeasonTab,LogbookTab,SoilWaterTab,PestTab,ComplianceTab,HarvestTab,HistoryTab,StageTimeline,SoilMetricBar,ComplianceChecklist,GlobalPlotSearch,shared}.tsx`
- `tsconfig.plots.json`, `vitest.config.ts`, this document.

## Updated integrations

- `src/main.tsx`: PDI profile routes, registry entry and public batch page.
- `src/map/MapView.tsx`: URL focus (`/map?focus=PDI`).
- `src/map/components/PlotDrawer.tsx`: profile links use the full PDI.
- `src/map/mock/generatePlots.ts`: T015 variety is OM5451, consistent with the showcase.
- `src/pages/ZonesPage.tsx`: keyboard/click profile entry and GIS parcel area/zone/status matching the map.
- `src/layouts/AppLayout.tsx`: working PDI/owner search, plot breadcrumb label and compact top bar at 1024px.
- `package.json`, `package-lock.json`: dependencies and scripts.
- `dist/`: generated production output.

## Demo limits

Documents are explicitly labeled sample previews; they are not genuine land certificates, COAs or laboratory reports. Photos are illustrative agricultural photos. Market restriction lists, optimal soil ranges and calculated scores are demo rules, not legal or certification advice. Previous seasons have harvest data; current-season harvest remains pending. Linked IoT uses a simulated daily series; otherwise water levels come from log observations.

The PDF action opens the browser print dialog. The print stylesheet includes the header, KPIs, overview, EU checklist and compact logs; it omits screen navigation and uses a vector parcel outline for reliable printing.

Public traceability URLs use `/trace/plots/:pdi/:batch` and show the actual selected historical batch. Share and PDI copy use the clipboard. CSV and GeoJSON downloads are generated locally.
