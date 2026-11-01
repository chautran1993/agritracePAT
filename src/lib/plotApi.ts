import type { Plot } from '../features/plots/types';
export interface StoredPlot {
  plot: Plot;
  revision: number;
}
async function result(response: Response): Promise<StoredPlot> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Không thể lưu hồ sơ');
  return data;
}
export const loadStoredPlot = (pdi: string) =>
  fetch(`/api/plots/${encodeURIComponent(pdi)}`, { credentials: 'same-origin' }).then(result);
export const savePlotField = (pdi: string, field: string, value: string, revision: number) =>
  fetch(`/api/plots/${encodeURIComponent(pdi)}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value, revision }),
  }).then(result);
