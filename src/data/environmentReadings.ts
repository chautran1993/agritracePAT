import { plotProfiles } from '../features/plots/mock/plotProfiles';
import { seededNumber } from './seededAgronomy';
export const environmentReadings = plotProfiles.map((p) => ({
  pdi: p.pdi,
  zoneId: p.zoneId,
  name: p.name,
  ph: p.soilBaseline.chemistry.pH,
  ec: p.soilBaseline.chemistry.ecDsM,
  salinity: 0.2 + seededNumber(p.pdi + 'salinity') * 1.3,
  waterCm: 2 + seededNumber(p.pdi + 'water') * 3,
  temperature: 26 + seededNumber(p.pdi + 'temperature') * 5,
  moisture: 70 + seededNumber(p.pdi + 'moisture') * 20,
}));
