import { mapData, statuses, type Plot } from '../map/mock/generatePlots';
import { plotProfiles } from '../features/plots/mock/plotProfiles';
import { number } from '../lib/format';
export const plots = plotProfiles.map((p) => ({
  id: p.shortCode,
  pdi: p.pdi,
  zoneId: p.zoneId,
  owner: p.owner.name,
  householdId: p.owner.householdId,
  sourceOnly: p.sourceOnly,
  area: p.areaGisHa,
  declaredArea: p.areaDeclaredHa,
  gisArea: p.areaGisHa,
  diff: p.areaDiffPct,
  variety: p.currentSeason.variety,
  stage: p.currentSeason.stage,
  status: p.codeStatus,
  lat: p.centroid.lat,
  lng: p.centroid.lng,
}));
export const households = [
  ...new Map(
    plotProfiles.map((p) => [p.owner.householdId, { id: p.owner.householdId, name: p.owner.name }]),
  ).values(),
];
export const zones = mapData.zones.features.map(({ properties: z }) => {
  const members = plots.filter((p) => p.zoneId === z.id);
  const issued = members.filter((p) => p.status === 'Đã cấp mã').length;
  return {
    id: z.id,
    name: z.name,
    manager: plotProfiles.find((p) => p.zoneId === z.id)!.cooperative.name,
    area: members.reduce((s, p) => s + p.area, 0),
    plots: members.length,
    households: new Set(members.map((p) => p.householdId)).size,
    issued,
    status: members.every((p) => p.status === members[0].status)
      ? members[0].status
      : 'Đang đăng ký',
    officialCode: plotProfiles.find((p) => p.zoneId === z.id)?.officialZoneCode?.code,
    markets: [
      ...new Set(
        plotProfiles
          .filter((p) => p.zoneId === z.id)
          .flatMap((p) => p.officialZoneCode?.markets ?? []),
      ),
    ],
  };
});
export const currentMapPlots: Plot[] = mapData.plots.features.map((f) => ({
  ...f,
  properties: {
    ...f.properties,
    stage: plotProfiles.find((p) => p.pdi === f.properties.pdi)!.currentSeason.stage,
  },
}));
export function summarize(items = plots) {
  const issued = items.filter((p) => p.status === 'Đã cấp mã').length;
  return {
    areaHa: items.reduce((s, p) => s + p.area, 0),
    plots: items.length,
    zones: new Set(items.map((p) => p.zoneId)).size,
    households: new Set(items.map((p) => p.householdId)).size,
    issued,
    issuedPct: items.length ? (issued / items.length) * 100 : 0,
    statusCounts: statuses.map((name) => ({
      name,
      value: items.filter((p) => p.status === name).length,
    })),
  };
}
export function issuedLabel(issued: number, total: number, lang: string) {
  return `${number(issued, lang, 0)}/${number(total, lang, 0)} (${number(total ? (issued / total) * 100 : 0, lang, 0)}%)`;
}
export function synchronizeProfile(profile: (typeof plotProfiles)[number]) {
  const index = plotProfiles.findIndex((p) => p.pdi === profile.pdi);
  if (index < 0) return;
  plotProfiles[index] = profile;
  const row = plots.find((p) => p.pdi === profile.pdi)!;
  Object.assign(row, {
    owner: profile.owner.name,
    variety: profile.currentSeason.variety,
    stage: profile.currentSeason.stage,
    status: profile.codeStatus,
  });
  const household = households.find((h) => h.id === profile.owner.householdId);
  if (household) household.name = profile.owner.name;
  for (const collection of [mapData.plots.features, currentMapPlots]) {
    const feature = collection.find((f) => f.properties.pdi === profile.pdi);
    if (feature)
      Object.assign(feature.properties, {
        owner: profile.owner.name,
        variety: profile.currentSeason.variety,
        stage: profile.currentSeason.stage,
        sourceParcelNumber: profile.source!.parcelNumber,
        sheetNumber: profile.source!.sheetNumber,
      });
  }
  const zone = zones.find((z) => z.id === profile.zoneId)!;
  zone.manager = profile.cooperative.name;
  zone.officialCode = profile.officialZoneCode?.code;
}
export function zoneAreaScale(features: Plot[]) {
  const areas = [...new Set(features.map((p) => p.properties.zoneId))].map((id) =>
    features.filter((p) => p.properties.zoneId === id).reduce((s, p) => s + p.properties.areaHa, 0),
  );
  const min = areas.length ? Math.min(...areas) : 0,
    max = Math.max(...areas, 0);
  const low = Math.round((min + (max - min) / 3) * 100) / 100,
    high = Math.round((min + (2 * (max - min)) / 3) * 100) / 100;
  return {
    low,
    high,
    color: (area: number) => (area >= high ? '#1F5130' : area >= low ? '#4CAF50' : '#E0A526'),
  };
}
