import { plotProfiles } from './features/plots/mock/plotProfiles';
import { mapData } from './map/mock/generatePlots';
async function hydrate() {
  try {
    const response = await fetch('/api/dataset', { credentials: 'same-origin' });
    if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) return;
    const records = (await response.json()) as typeof plotProfiles;
    if (!Array.isArray(records) || records.length !== plotProfiles.length) return;
    const allowed = new Set(plotProfiles.map((p) => p.pdi));
    if (records.some((p) => !allowed.has(p.pdi))) return;
    plotProfiles.splice(0, plotProfiles.length, ...records);
    for (const f of mapData.plots.features) {
      const p = records.find((p) => p.pdi === f.properties.pdi)!;
      Object.assign(f.properties, {
        owner: p.owner.name,
        variety: p.currentSeason.variety,
        stage: p.currentSeason.stage,
        codeStatus: p.codeStatus,
      });
    }
  } catch {
    /* The deterministic read-only dataset remains available during network outages. */
  }
}
void hydrate().finally(() => import('./main'));
