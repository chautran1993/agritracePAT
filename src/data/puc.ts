export const provinces = Object.fromEntries([
  ['01', 'Hà Nội'],
  ['04', 'Cao Bằng'],
  ['08', 'Tuyên Quang'],
  ['11', 'Điện Biên'],
  ['12', 'Lai Châu'],
  ['14', 'Sơn La'],
  ['15', 'Lào Cai'],
  ['19', 'Thái Nguyên'],
  ['20', 'Lạng Sơn'],
  ['22', 'Quảng Ninh'],
  ['24', 'Bắc Ninh'],
  ['25', 'Phú Thọ'],
  ['31', 'Hải Phòng'],
  ['33', 'Hưng Yên'],
  ['37', 'Ninh Bình'],
  ['38', 'Thanh Hóa'],
  ['40', 'Nghệ An'],
  ['42', 'Hà Tĩnh'],
  ['44', 'Quảng Trị'],
  ['46', 'Huế'],
  ['48', 'Đà Nẵng'],
  ['51', 'Quảng Ngãi'],
  ['52', 'Gia Lai'],
  ['56', 'Khánh Hòa'],
  ['66', 'Đắk Lắk'],
  ['68', 'Lâm Đồng'],
  ['75', 'Đồng Nai'],
  ['79', 'TP.HCM'],
  ['80', 'Tây Ninh'],
  ['82', 'Đồng Tháp'],
  ['86', 'Vĩnh Long'],
  ['91', 'An Giang'],
  ['92', 'Cần Thơ'],
  ['96', 'Cà Mau'],
]);
export const crop_codes = {
  LUA001: 'Lúa',
  NGO001: 'Ngô/Bắp',
  XOAI01: 'Xoài',
  SR0001: 'Sầu riêng',
  BUOI01: 'Bưởi',
  TL0001: 'Thanh long',
  DUA002: 'Dứa/Thơm',
};
export const pucPattern = /^\d{2}-(PUC|PHC)-[A-Z0-9]{6}-\d{6}(-[A-Z]{3})?$/;
export type ZoneStatus = 'active' | 'pending_approval' | 'suspended' | 'revoked';
export interface PucRecord {
  puc_code: string;
  status: ZoneStatus;
}
// Pure allocator. The API reserves the sequence atomically in its database transaction.
export function generatePUC(
  { provinceCode, cropCode, market }: { provinceCode: string; cropCode: string; market?: string },
  allocated: readonly PucRecord[] = [],
) {
  if (!provinces[provinceCode] || !(cropCode in crop_codes))
    throw new Error('Invalid province/crop');
  if (market && !/^[A-Z]{3}$/.test(market)) throw new Error('Invalid market');
  const prefix = `${provinceCode}-PUC-${cropCode}-`;
  const next =
    1 +
    Math.max(
      0,
      ...allocated
        .filter((r) => r.puc_code.startsWith(prefix))
        .map((r) => Number(r.puc_code.split('-')[3])),
    );
  if (next > 999999) throw new Error('Sequence exhausted');
  return `${prefix}${String(next).padStart(6, '0')}${market ? `-${market}` : ''}`;
}
export function changePucMarket(code: string, market: string) {
  if (!pucPattern.test(code) || !/^[A-Z]{3}$/.test(market)) throw new Error('Invalid PUC/market');
  return `${code.split('-').slice(0, 4).join('-')}-${market}`;
}
