import type { Polygon, Point } from 'geojson';
export type Market = 'CN' | 'EU' | 'US' | 'HALAL';
export type Group =
  'LAM_DAT' | 'GIEO_SA' | 'NUOC_AWD' | 'PHAN_BON' | 'BVTV' | 'ROM_RA' | 'THU_HOACH';
export type Bilingual = { vi: string; en: string };
export interface PlannedTask {
  id: string;
  title: Bilingual;
  group: Group;
  fromDas: number;
  toDas: number;
}
export interface LogEntry {
  id: string;
  date: string;
  group: Group;
  title: Bilingual;
  actor: string;
  inputs?: {
    name: string;
    activeIngredient?: string;
    qty: number;
    unit: string;
    ratePerHa: number;
    nutrients?: { n: number; p: number; k: number };
  }[];
  waterLevelCm?: number;
  phiDays?: number;
  photos: string[];
  gps: { lat: number; lng: number; accuracyM: number };
  gpsVerified: boolean;
  plannedTaskId?: string;
  deviation?: Bilingual;
  syncedOffline: boolean;
}
export interface PestCase {
  id: string;
  code: string;
  name: Bilingual;
  detectedAt: string;
  severity: 1 | 2 | 3;
  affectedPct: number;
  photo: string;
  prescription: {
    product: string;
    activeIngredient: string;
    dose: string;
    method: 'Drone' | 'Phun tay';
    phiDays: number;
    approvedBy: string;
  };
  status: 'Mới' | 'Đang xử lý' | 'Đã khống chế';
}
export interface Harvest {
  date: string;
  maturityPct: number;
  yieldT: number;
  moisturePct: number;
  timeToDryerH: number;
  dryerMoisturePct: number;
  batchCode: string;
  mill: string;
  qrIssued: number;
  qrQuota: number;
}
export interface Season {
  yieldPerHaT?: number;
  traceBatch?: {
    code: string;
    mill: string;
    destination: string;
    packageWeightKg: number;
    dryingDays: number;
    packagingDays: number;
    exportDays: number;
  };

  id: string;
  name: Bilingual;
  variety: string;
  varietyDays: number;
  seedBatch: {
    code: string;
    grade: 'SNC' | 'NC' | 'XN';
    supplier: string;
    germinationPct: number;
    purityPct: number;
    coaUrl: string;
  };
  seedRateKgHa: number;
  sowingMethod: Bilingual;
  sowingDate: string;
  das: number;
  stage: string;
  expectedHarvestDate: string;
  expectedYieldT: number;
  actualYieldT?: number;
  plan: PlannedTask[];
  logs: LogEntry[];
  pests: PestCase[];
  harvest?: Harvest;
}
export interface SoilBaseline {
  sampledAt: string;
  lab: string;
  samplePoint: { lat: number; lng: number };
  chemistry: {
    pH: number;
    ecDsM: number;
    nAvailKgHa: number;
    pAvailKgHa: number;
    kAvailKgHa: number;
    ca: number;
    mg: number;
    baseSatPct: number;
  };
  acidity: { alHSatPct: number };
  carbon: { socPct: number; somPct: number; cnRatio: number };
  physics: {
    clayPct: number;
    siltPct: number;
    sandPct: number;
    bulkDensity: number;
    awcMm: number;
  };
  biology: {
    microbialBiomassMgCKg: number;
    microbialActivityMgNKg: number;
    fungiBacteriaRatio: number;
  };
}
export interface ParcelVersion {
  season: string;
  change: 'Tạo mới' | 'Đổi chủ' | 'Gộp thửa' | 'Tách thửa' | 'Chỉnh ranh';
  areaHa: number;
  by: string;
  at: string;
  geometry: Polygon | Point;
}
export interface Doc {
  id: string;
  type: string;
  title: Bilingual;
  date: string;
  size: string;
  body: Bilingual;
}
export interface Plot {
  is_seeded?: boolean;
  sourceOnly?: boolean;
  source?: {
    sourceRow: number;
    parcelNumber: string;
    sheetNumber: string;
    imageBatch: number;
    note: string;
    landUse: string;
    googleMaps: string;
  };
  pdi: string;
  shortCode: string;
  codeStatus: string;
  name: Bilingual;
  zoneId: string;
  zoneName: Bilingual;
  cooperative: { id: string; name: string };
  commune: string;
  district: string;
  province: string;
  owner: {
    householdId: string;
    name: string;
    phone: string;
    idVerified: boolean;
    joinedAt: string;
  };
  geometry: Polygon | Point;
  areaDeclaredHa: number;
  areaGisHa: number;
  areaDiffPct: number;
  centroid: { lat: number; lng: number };
  elevationDiffCm: number;
  officialZoneCode?: {
    issuedDocNo?: string;
    statusValue?: 'active' | 'pending_approval' | 'suspended' | 'revoked';
    code: string;
    issuedBy: string;
    issuedAt: string;
    markets: Market[];
    status: 'Đã cấp mã' | 'Đang đăng ký' | 'Chưa đăng ký' | 'Tạm dừng' | 'Đã thu hồi';
  };
  currentSeason: Season;
  seasons: Season[];
  soilBaseline: SoilBaseline;
  iotStationId?: string;
  versions: ParcelVersion[];
  documents: Doc[];
}
