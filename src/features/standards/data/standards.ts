import { number, date } from '../../../lib/format';
export type Standard = {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  issuer: {
    role: 'ban hành' | 'công bố' | 'đề nghị' | 'biên soạn' | 'thẩm định';
    name: string;
    nameEn?: string;
    sourceUrl: string;
  }[];
  editionLabel?: string;
  year?: number;
  status?: { label: string; labelEn?: string; note?: string; noteEn?: string; sourceUrl: string };
  scopeVi?: string;
  scopeEn?: string;
  structure?: {
    title: string;
    titleEn?: string;
    items?: string[];
    itemsEn?: string[];
    sourceUrl: string;
  }[];
  keyFacts?: {
    label: string;
    labelEn?: string;
    value: string;
    valueEn?: string;
    sourceUrl: string;
  }[];
  relevanceToPlatform?: string[];
  relevanceToPlatformEn?: string[];
  requirementCount?: { value: number; sourceUrl: string };
  sources: { title: string; url: string; accessedAt: string }[];
  verifiedAt: string;
  // Every published field points to one of the reference documents. Local IDs
  // and audit metadata also keep their document association here.
  fieldSources: Record<string, string>;
};
export const urls = {
  rice: 'https://www.fao.org/input/download/standards/61/CXS_198r.pdf',
  trace: 'https://www.fao.org/input/download/standards/10603/CXG_060e.pdf',
  codexTexts: 'https://www.fao.org/fao-who-codexalimentarius/codex-texts/guidelines/en/',
  srp: 'https://sustainablerice.org/wp-content/uploads/2022/12/NO-202308-ST-EN-SRP-Standard-for-Rice-Cultivation-V2.2.pdf',
  revision: 'https://sustainablerice.org/standard-revision-v3-0/',
  vietgap: 'https://vnce.vn/Uploads/files/TCVN11892-1_2017_916963.pdf',
  globalgap: 'https://globalgap.org/news-and-press/ifa-v6-gfs-transition-period/',
  dnv: 'https://www.dnv.sg/assurance/Management-Systems/new-iso/transition/transition-globalg.a.p.-ifa-version-6',
};
const verifiedAt = '2026-10-15';
function standard(
  data: Omit<Standard, 'fieldSources' | 'verifiedAt' | 'sources'>,
  references: { title: string; url: string }[],
): Standard {
  const primary = references[0].url;
  const record = { ...data, verifiedAt };
  return {
    ...record,
    sources: references.map((s) => ({ ...s, accessedAt: verifiedAt })),
    fieldSources: Object.fromEntries(
      Object.keys(record).map((key) => [key, key === 'status' ? data.status!.sourceUrl : primary]),
    ),
  };
}
function issuer(
  name: string,
  sourceUrl: string,
  role: Standard['issuer'][number]['role'] = 'ban hành',
  nameEn?: string,
) {
  return { name, sourceUrl, role, ...(nameEn ? { nameEn } : {}) };
}
function section(
  title: string,
  titleEn: string,
  sourceUrl: string,
  items?: string[],
  itemsEn?: string[],
) {
  return {
    title,
    titleEn,
    sourceUrl,
    ...(items ? { items } : {}),
    ...(itemsEn ? { itemsEn } : {}),
  };
}
function fact(label: string, labelEn: string, value: string, valueEn: string, sourceUrl: string) {
  return { label, labelEn, value, valueEn, sourceUrl };
}
export const standards: Standard[] = [
  standard(
    {
      id: 'codex-rice',
      code: 'CXS 198-1995',
      nameVi: 'Tiêu chuẩn Codex cho gạo',
      nameEn: 'Codex Standard for Rice',
      issuer: [issuer('Codex Alimentarius Commission (FAO/WHO)', urls.rice)],
      year: 1995,
      structure: [
        section('1. Phạm vi', '1. Scope', urls.rice),
        section('2. Định nghĩa', '2. Definitions', urls.rice),
        section(
          '3. Thành phần cơ bản và chỉ tiêu chất lượng',
          '3. Essential composition and quality factors',
          urls.rice,
        ),
        section(
          '4. Chất nhiễm bẩn',
          '4. Contaminants',
          urls.rice,
          ['Kim loại nặng', 'Dư lượng thuốc bảo vệ thực vật'],
          ['Heavy metals', 'Pesticide residues'],
        ),
        section('5. Vệ sinh', '5. Hygiene', urls.rice),
        section('6. Bao gói', '6. Packaging', urls.rice),
        section('7. Ghi nhãn', '7. Labelling', urls.rice),
        section(
          '8. Phương pháp phân tích',
          '8. Methods of analysis and sampling',
          urls.rice,
        ),
        section(
          'Phụ lục',
          'Annex',
          urls.rice,
          ['Phân loại theo hình dạng hạt', 'Mức độ xát', 'Chỉ tiêu chất lượng khác'],
          ['Classification by grain shape', 'Degree of milling', 'Other quality factors'],
        ),
      ],
      keyFacts: [
        fact(
          'Độ ẩm tối đa',
          'Maximum moisture',
          `${number(15, 'vi')}% (khối lượng)`,
          `${number(15, 'en')}% by mass`,
          urls.rice,
        ),
        fact(
          'Tạp chất vô cơ tối đa',
          'Maximum inorganic extraneous matter',
          `${number(0.1, 'vi')}%`,
          `${number(0.1, 'en')}%`,
          urls.rice,
        ),
        fact(
          'Tạp chất hữu cơ tối đa',
          'Maximum organic extraneous matter',
          `${number(1.5, 'vi')}% (gạo lứt) / ${number(0.5, 'vi')}% (gạo trắng)`,
          `${number(1.5, 'en')}% (husked rice) / ${number(0.5, 'en')}% (milled rice)`,
          urls.rice,
        ),
        fact(
          'Côn trùng và ve sống',
          'Live insects and mites',
          'Không có côn trùng hoặc ve sống.',
          'Free from living insects and mites.',
          urls.rice,
        ),
      ],
    },
    [{ title: 'Codex Standard for Rice — CXS 198-1995', url: urls.rice }],
  ),
  standard(
    {
      id: 'codex-traceability',
      code: 'CXG 60-2006 (CAC/GL 60-2006)',
      nameVi: 'Nguyên tắc truy xuất nguồn gốc trong hệ thống kiểm tra và chứng nhận thực phẩm',
      nameEn:
        'Principles for Traceability/Product Tracing as a Tool within a Food Inspection and Certification System',
      issuer: [issuer('Codex Alimentarius Commission', urls.trace)],
      year: 2006,
      structure: [
        section('Mục 1. Phạm vi', 'Section 1. Scope', urls.trace),
        section('Mục 2. Định nghĩa', 'Section 2. Definitions', urls.trace),
        section(
          'Mục 3. Nguyên tắc',
          'Section 3. Principles',
          urls.trace,
          ['Bối cảnh', 'Cơ sở', 'Thiết kế', 'Áp dụng'],
          ['Context', 'Rationale', 'Design', 'Application'],
        ),
      ],
      keyFacts: [
        fact(
          'Một bước trước / một bước sau',
          'One step back / one step forward',
          'Xác định thực phẩm đến từ đâu và đi đến đâu tại bất kỳ công đoạn nào.',
          'Identify where food came from and where it went at any stage.',
          urls.trace,
        ),
        fact(
          'Thương mại',
          'Trade',
          'Không gây hạn chế thương mại quá mức cần thiết.',
          'Avoid trade restrictions beyond what is necessary.',
          urls.trace,
        ),
        fact(
          'Tính khả thi',
          'Feasibility',
          'Phải khả thi về kỹ thuật và kinh tế.',
          'Must be technically and economically feasible.',
          urls.trace,
        ),
      ],
      relevanceToPlatform: ['Liên kết hộ → thửa → lô → cơ sở đóng gói trong module Truy xuất.'],
      relevanceToPlatformEn: [
        'Link household → parcel → batch → packing facility in Traceability.',
      ],
    },
    [
      {
        title: 'Codex — CXG 60-2006: Principles for Traceability/Product Tracing',
        url: urls.trace,
      },
      { title: 'Codex Texts — Guidelines', url: urls.codexTexts },
    ],
  ),
  standard(
    {
      id: 'srp',
      code: 'SRP Standard v2.2',
      nameVi: 'Tiêu chuẩn SRP về canh tác lúa bền vững',
      nameEn: 'SRP Standard for Sustainable Rice Cultivation',
      issuer: [issuer('Sustainable Rice Platform', urls.srp)],
      editionLabel: 'v2.2 – 08/2023',
      structure: [
        ['Quản lý trang trại', 'Farm management'],
        ['Trước gieo trồng', 'Pre-planting'],
        ['Sử dụng nước', 'Water use'],
        ['Quản lý dinh dưỡng', 'Nutrient management'],
        ['Quản lý dịch hại', 'Pest management'],
        ['Thu hoạch & sau thu hoạch', 'Harvest and post-harvest'],
        ['Sức khỏe & an toàn', 'Health and safety'],
        ['Quyền người lao động', 'Labor rights'],
      ].map(([vi, en]) => section(vi, en, urls.srp)),
      requirementCount: { value: 41, sourceUrl: urls.srp },
      keyFacts: [
        fact(
          'Thang điểm',
          'Scoring',
          `Tối đa ${number(132, 'vi', 0)} điểm; quy đổi ${number(0, 'vi', 0)}–${number(100, 'vi', 0)}.`,
          `Maximum ${number(132, 'en', 0)} points; normalized to ${number(0, 'en', 0)}–${number(100, 'en', 0)}.`,
          urls.srp,
        ),
        fact(
          'Working toward sustainable rice cultivation',
          'Working toward sustainable rice cultivation',
          `≥ ${number(33, 'vi', 0)} điểm trên thang quy đổi và đạt các ngưỡng bắt buộc.`,
          `≥ ${number(33, 'en', 0)} on the normalized scale and the required thresholds.`,
          urls.srp,
        ),
        fact(
          'Sustainably cultivated rice',
          'Sustainably cultivated rice',
          `≥ ${number(90, 'vi', 0)} điểm trên thang quy đổi và đạt mọi ngưỡng thiết yếu.`,
          `≥ ${number(90, 'en', 0)} on the normalized scale and all essential thresholds.`,
          urls.srp,
        ),
      ],
      status: {
        label: 'Bản hiện hành',
        labelEn: 'Current version',
        note: 'v3.0 đã được Hội đồng SRP thông qua 05/2026, dự kiến công bố 01/2027, bắt buộc từ 01/2028.',
        noteEn:
          'v3.0 was endorsed by the SRP Board in May 2026; publication is planned for January 2027 and mandatory implementation for January 2028.',
        sourceUrl: urls.revision,
      },
    },
    [
      { title: 'SRP Standard for Sustainable Rice Cultivation — v2.2, August 2023', url: urls.srp },
      { title: 'SRP — Standard revision v3.0 and transition timeline', url: urls.revision },
    ],
  ),
  standard(
    {
      id: 'vietgap',
      code: 'TCVN 11892-1:2017',
      nameVi: 'Thực hành nông nghiệp tốt (VietGAP) – Phần 1: Trồng trọt',
      nameEn: 'Good agricultural practices (VietGAP) – Part 1: Crop production',
      issuer: [
        issuer('Cục Trồng trọt', urls.vietgap, 'biên soạn', 'Department of Crop Production'),
        issuer(
          'Bộ NN&PTNT',
          urls.vietgap,
          'đề nghị',
          'Ministry of Agriculture and Rural Development',
        ),
        issuer(
          'Tổng cục TCĐLCL',
          urls.vietgap,
          'thẩm định',
          'Directorate for Standards, Metrology and Quality',
        ),
        issuer('Bộ KH&CN', urls.vietgap, 'công bố', 'Ministry of Science and Technology'),
      ],
      year: 2017,
      keyFacts: [
        fact(
          'Hài hòa tiêu chuẩn',
          'Harmonization',
          'Hài hòa với ASEAN GAP.',
          'Harmonized with ASEAN GAP.',
          urls.vietgap,
        ),
      ],
    },
    [{ title: 'TCVN 11892-1:2017 — VietGAP: Trồng trọt', url: urls.vietgap }],
  ),
  standard(
    {
      id: 'globalgap',
      code: 'GLOBALG.A.P. IFA v6',
      nameVi: 'Đảm bảo trang trại tích hợp GLOBALG.A.P. (IFA)',
      nameEn: 'GLOBALG.A.P. Integrated Farm Assurance (IFA)',
      issuer: [issuer('GLOBALG.A.P.', urls.globalgap)],
      editionLabel: 'v6 (Smart & GFS)',
      year: 2022,
      scopeVi:
        'Các mốc chuyển đổi được dẫn từ thông báo IFA v6 cho rau quả và nuôi trồng thủy sản.',
      scopeEn:
        'Transition dates are cited from the IFA v6 announcement for fruit and vegetables and aquaculture.',
      keyFacts: [
        fact(
          'IFA v6 Smart',
          'IFA v6 Smart',
          `Bắt buộc từ ${date('2024-01-01', 'vi')}.`,
          `Obligatory from ${date('2024-01-01', 'en')}.`,
          urls.globalgap,
        ),
        fact(
          'IFA v6 GFS',
          'IFA v6 GFS',
          `Được GFSI công nhận; bắt buộc từ ${date('2025-01-01', 'vi')}, thay thế v5.4-1-GFS.`,
          `GFSI-recognized; obligatory from ${date('2025-01-01', 'en')}, replacing v5.4-1-GFS.`,
          urls.globalgap,
        ),
      ],
    },
    [
      { title: 'GLOBALG.A.P. — IFA v6 GFS transition period confirmed', url: urls.globalgap },
      { title: 'DNV — Transition to GLOBALG.A.P. IFA Version 6', url: urls.dnv },
    ],
  ),
];
export function verifiedField<K extends keyof Standard>(
  record: Standard,
  key: K,
): Standard[K] | undefined {
  return record.sources.some((s) => s.url === record.fieldSources[key]) ? record[key] : undefined;
}
export const standardGroup = (id: string) =>
  id === 'vietgap' || id === 'globalgap' ? 'good' : 'intl';
export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase();
}
export function matchesStandard(record: Standard, query: string) {
  return normalizeSearch(
    [
      record.code,
      record.nameVi,
      record.nameEn,
      ...record.issuer.flatMap((i) => [i.name, i.nameEn ?? '']),
    ].join(' '),
  ).includes(normalizeSearch(query.trim()));
}

export function publishStandard(record: Standard): Standard | undefined {
  const core = ['id', 'code', 'nameVi', 'nameEn'] as const;
  if (core.some((key) => !verifiedField(record, key))) return undefined;
  const copy = { ...record };
  for (const key of [
    'editionLabel',
    'year',
    'status',
    'scopeVi',
    'scopeEn',
    'structure',
    'keyFacts',
    'relevanceToPlatform',
    'relevanceToPlatformEn',
    'requirementCount',
  ] as const) {
    if (verifiedField(record, key) === undefined) delete copy[key];
  }
  const known = (url: string) => record.sources.some((source) => source.url === url);
  copy.issuer = verifiedField(record, 'issuer')?.filter((item) => known(item.sourceUrl)) ?? [];
  if (copy.status && !known(copy.status.sourceUrl)) delete copy.status;
  if (copy.structure) {
    copy.structure = copy.structure.filter((item) => known(item.sourceUrl));
    if (!copy.structure.length) delete copy.structure;
  }
  if (copy.keyFacts) {
    copy.keyFacts = copy.keyFacts.filter((item) => known(item.sourceUrl));
    if (!copy.keyFacts.length) delete copy.keyFacts;
  }
  if (copy.requirementCount && !known(copy.requirementCount.sourceUrl))
    delete copy.requirementCount;
  return copy;
}
