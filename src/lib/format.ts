export const number = (value: number, lang: string, digits = 1) =>
  new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    maximumFractionDigits: digits,
  }).format(value);
export function date(value: string, lang: string) {
  if (!value) return '—';
  return new Date(`${value.slice(0, 10)}T12:00:00+07:00`).toLocaleDateString(
    lang === 'vi' ? 'vi-VN' : 'en-US',
    lang === 'vi'
      ? { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }
      : { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' },
  );
}
export const dayDiff = (a: string, b: string) =>
  Math.floor(
    (Date.parse(a.slice(0, 10) + 'T00:00:00Z') - Date.parse(b.slice(0, 10) + 'T00:00:00Z')) /
      86400000,
  );
export const addDays = (value: string, days: number) =>
  new Date(Date.parse(value.slice(0, 10) + 'T00:00:00Z') + days * 86400000)
    .toISOString()
    .slice(0, 10);
export const todaySaigon = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

export const dateTime = (value: string, lang: string) =>
  new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const year = (value: number, lang: string) =>
  new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', { useGrouping: false }).format(value);
