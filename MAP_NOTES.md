# Digital map

Only `/map` and its page-owned components/data were redesigned. The shared layout, translation provider and `src/data/mock.ts` are unchanged.

MapLibre GL JS via `react-map-gl/maplibre`; Turf generates deterministic field geometry and computes areas/measurements. New runtime dependencies: `maplibre-gl`, `react-map-gl`, `@turf/turf`. Development dependencies: `@types/react`, `@types/react-dom`, `@types/geojson`, `tsx`.

## Checks

```powershell
npm run build
npx tsc -p tsconfig.map.json
npx tsx src/map/mock/verifyGeometry.ts
```

The page-specific TypeScript config avoids existing unrelated type errors in other screens and the root config's obsolete node10 resolution setting. Geometry checks cover determinism, 50 plots, 4 zones, all plots within the boundary, no pairwise intersections, computed areas and station/alert placement.

## Tile services

Satellite uses Esri World Imagery. Terrain uses OpenTopoMap. Street defaults to OpenStreetMap because CARTO began requiring API keys in September 2026 and the requested Voyager URL returns watermarked tiles. To enable Voyager, set `VITE_CARTO_API_KEY` in `.env.local` and rebuild. Attribution follows the active source.

https://carto.com/basemaps/apikey/

## Scope limitations

The commune, canals, zones and fields are simulated for demonstration, not cadastral/survey data. Zone areas reflect the generated plots, not the example 312 ha. Area search selects field centres within the drawn polygon. Measurement uses WGS84 geodesic calculations.

The existing router only implements the plot profile `/plots/T015`; the drawer links to the selected plot's proper `/plots/Txxx` path, which uses the existing placeholder for other IDs. Other pages were deliberately left unchanged.

The map module loads lazily. No claim of measured 60 fps is made; 50 field features are rendered by MapLibre's WebGL layers. Basemap availability remains subject to provider/network conditions.

## Files changed / added

- package.json
- package-lock.json
- src/pages/MapPage.tsx
- src/map/MapView.tsx
- src/map/map.css
- src/map/i18n.ts
- src/map/assets.d.ts
- src/map/layers/styles.ts
- src/map/mock/generatePlots.ts
- src/map/mock/verifyGeometry.ts
- src/map/components/LayerPanel.tsx
- src/map/components/Legend.tsx
- src/map/components/KpiStrip.tsx
- src/map/components/PlotDrawer.tsx
- src/map/components/MapToolbar.tsx
- tsconfig.map.json
- MAP_NOTES.md
- map-preview.jpg
- dist/ (generated production output)
