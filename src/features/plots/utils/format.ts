import type { Bilingual } from '../types';
export const text = (value: Bilingual, lang: string) => value[lang === 'vi' ? 'vi' : 'en'];
export { number, date, dayDiff, addDays, todaySaigon } from '../../../lib/format';
export function download(name: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
