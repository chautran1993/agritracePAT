import type { Plot } from './types';
export interface EditField {
  path: string;
  label: string;
  value: string | number;
}
const names: Record<string, string> = {
  name: 'Họ tên',
  phone: 'Số điện thoại',
  joinedAt: 'Ngày tham gia',
  parcelNumber: 'Số thửa',
  sheetNumber: 'Số tờ',
  variety: 'Giống',
  sowingDate: 'Ngày gieo sạ',
  expectedHarvestDate: 'Ngày thu hoạch dự kiến',
  seedRateKgHa: 'Lượng giống (kg/ha)',
  yieldPerHaT: 'Năng suất (tấn/ha)',
  code: 'Mã lô giống',
  supplier: 'Nhà cung cấp',
  germinationPct: 'Tỷ lệ nảy mầm (%)',
  purityPct: 'Độ sạch (%)',
  date: 'Ngày',
  actor: 'Người thực hiện',
  activeIngredient: 'Hoạt chất',
  ratePerHa: 'Liều lượng/ha',
  waterLevelCm: 'Mực nước (cm)',
  pH: 'pH',
  ecDsM: 'EC (dS/m)',
  nAvailKgHa: 'Đạm dễ tiêu (kg/ha)',
  pAvailKgHa: 'Lân dễ tiêu (kg/ha)',
  kAvailKgHa: 'Kali dễ tiêu (kg/ha)',
  ca: 'Canxi',
  mg: 'Magiê',
  baseSatPct: 'Độ bão hòa bazơ (%)',
  sampledAt: 'Ngày đo',
  lab: 'Phòng kiểm nghiệm',
  alHSatPct: 'Độ bão hòa Al/H (%)',
  socPct: 'Carbon hữu cơ (%)',
  somPct: 'Chất hữu cơ (%)',
  cnRatio: 'Tỷ lệ C/N',
  clayPct: 'Sét (%)',
  siltPct: 'Bột (%)',
  sandPct: 'Cát (%)',
  bulkDensity: 'Dung trọng',
  awcMm: 'Nước hữu dụng (mm)',
  microbialBiomassMgCKg: 'Sinh khối vi sinh (mg C/kg)',
  microbialActivityMgNKg: 'Hoạt tính vi sinh (mg N/kg)',
  fungiBacteriaRatio: 'Tỷ lệ nấm/vi khuẩn',
  detectedAt: 'Ngày phát hiện',
  affectedPct: 'Tỷ lệ ảnh hưởng (%)',
  product: 'Tên thương mại',
  dose: 'Liều dùng',
  phiDays: 'Thời gian cách ly (ngày)',
  approvedBy: 'Người duyệt',
  status: 'Trạng thái',
  moisturePct: 'Độ ẩm (%)',
  timeToDryerH: 'Thời gian tới sấy (giờ)',
  dryerMoisturePct: 'Độ ẩm sau sấy (%)',
  maturityPct: 'Độ chín (%)',
  mill: 'Đơn vị xay xát',
  batchCode: 'Mã lô hàng',
};
export function editFields(plot: Plot, tab: string): EditField[] {
  const fields: EditField[] = [];
  function add(path: string, label?: string) {
    let value: unknown = plot;
    for (const key of path.split('.')) value = (value as Record<string, unknown>)?.[key];
    if ((typeof value === 'number' || typeof value === 'string') && String(value).trim())
      fields.push({ path, value, label: label || names[path.split('.').at(-1)!] || path });
  }
  if (tab === 'overview') {
    [
      'owner.name',
      'owner.phone',
      'owner.joinedAt',
      'cooperative.name',
      'source.parcelNumber',
      'source.sheetNumber',
    ].forEach((p) => add(p));
  }
  if (tab === 'season') {
    ['variety', 'sowingDate', 'expectedHarvestDate', 'seedRateKgHa', 'yieldPerHaT'].forEach((p) =>
      add('currentSeason.' + p),
    );
    ['code', 'supplier', 'germinationPct', 'purityPct'].forEach((p) =>
      add('currentSeason.seedBatch.' + p),
    );
  }
  if (tab === 'logbook')
    plot.currentSeason.logs.forEach((l, i) => {
      const prefix = `currentSeason.logs.${i}.`;
      for (const key of ['date', 'actor']) add(prefix + key, `${i + 1} · ${names[key]}`);
      add(prefix + 'title.vi', `${i + 1} · Công việc`);
      l.inputs?.forEach((_, j) => {
        for (const key of ['name', 'activeIngredient', 'ratePerHa'])
          add(
            prefix + `inputs.${j}.` + key,
            `${i + 1} · ${key === 'name' ? 'Vật tư' : names[key]}`,
          );
      });
    });
  if (tab === 'soil') {
    add('soilBaseline.sampledAt');
    add('soilBaseline.lab');
    for (const group of ['chemistry', 'acidity', 'carbon', 'physics', 'biology'] as const)
      Object.keys(plot.soilBaseline[group]).forEach((key) => add(`soilBaseline.${group}.${key}`));
  }
  if (tab === 'pests')
    plot.currentSeason.pests.forEach((_, i) => {
      const prefix = `currentSeason.pests.${i}.`;
      for (const key of ['detectedAt', 'affectedPct'])
        add(prefix + key, `${i + 1} · ${names[key]}`);
      for (const key of ['product', 'activeIngredient', 'dose', 'phiDays', 'approvedBy'])
        add(prefix + 'prescription.' + key, `${i + 1} · ${names[key]}`);
    });
  if (tab === 'harvest')
    plot.seasons.forEach((s, i) => {
      if (s.harvest)
        for (const key of [
          'date',
          'maturityPct',
          'moisturePct',
          'timeToDryerH',
          'dryerMoisturePct',
          'mill',
          'batchCode',
        ])
          add(`seasons.${i}.harvest.${key}`, `${s.name.vi} · ${names[key]}`);
    });
  return fields;
}
