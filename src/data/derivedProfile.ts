import type { Plot } from '../features/plots/types';
import { dayDiff, todaySaigon } from '../lib/format';
export function refreshDerivedProfile(plot: Plot, today = todaySaigon()) {
  if (plot.source)
    plot.name = {
      vi: `Thửa ${plot.source.parcelNumber} · Tờ ${plot.source.sheetNumber}`,
      en: `Parcel ${plot.source.parcelNumber} · Sheet ${plot.source.sheetNumber}`,
    };
  for (const s of [plot.currentSeason, ...plot.seasons]) {
    const year = Number(s.sowingDate.slice(0, 4)),
      month = Number(s.sowingDate.slice(5, 7));
    s.name =
      month >= 11
        ? { vi: `Vụ Đông Xuân ${year}–${year + 1}`, en: `Winter–Spring ${year}–${year + 1}` }
        : month <= 2
          ? { vi: `Vụ Đông Xuân ${year - 1}–${year}`, en: `Winter–Spring ${year - 1}–${year}` }
          : month <= 8
            ? { vi: `Vụ Hè Thu ${year}`, en: `Summer–Autumn ${year}` }
            : { vi: `Vụ Thu Đông ${year}`, en: `Autumn–Winter ${year}` };
    s.das = Math.max(0, dayDiff(today, s.sowingDate));
    s.stage =
      today < s.sowingDate
        ? 'Chuẩn bị gieo sạ'
        : s.das < 25
          ? 'Gieo sạ'
          : s.das < 50
            ? 'Đẻ nhánh'
            : s.das < 80
              ? 'Làm đòng – Trổ'
              : 'Chín – Thu hoạch';
    if (s.yieldPerHaT) s.expectedYieldT = plot.areaGisHa * s.yieldPerHaT;
  }
  return plot;
}
