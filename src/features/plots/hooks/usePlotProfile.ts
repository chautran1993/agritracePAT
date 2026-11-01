import { useEffect, useState } from 'react';
import { plotProfiles } from '../mock/plotProfiles';
import { loadStoredPlot, savePlotField, type StoredPlot } from '../../../lib/plotApi';
import { synchronizeProfile } from '../../../data/agritrace';
export function usePlotProfile(pdi: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [stored, setStored] = useState<StoredPlot | null>(null);
  useEffect(() => {
    setLoading(true);
    setStored(null);
    let alive = true;
    if (pdi)
      void loadStoredPlot(pdi)
        .then((value) => {
          if (alive) setStored(value);
        })
        .catch(() => {});
    const timer = setTimeout(() => setLoading(false), 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [pdi]);
  return {
    loading,
    plot: stored?.plot ?? plotProfiles.find((p) => p.pdi === pdi || p.shortCode === pdi),
    save: async (field: string, value: string) => {
      if (!pdi) throw new Error('Không tìm thấy thửa');
      const current = stored ?? (await loadStoredPlot(pdi));
      const saved = await savePlotField(pdi, field, value, current.revision);
      synchronizeProfile(saved.plot);
      setStored(saved);
    },
  };
}
