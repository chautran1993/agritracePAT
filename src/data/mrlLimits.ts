// Commodity is rice grain. Missing entries require review, rather than proving legal prohibition.
export const mrl_limits = [
  {
    market: 'USA',
    active_ingredient: 'Tricyclazole',
    crop_code: 'LUA001',
    mrl_mg_kg: 3,
    commodity: 'Rice, grain',
    verified_at: '2026-10-27',
    source_url:
      'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-E/part-180/subpart-C/section-180.678',
  },
];
export function checkIngredient(market: string, ingredient: string, crop = 'LUA001') {
  return mrl_limits.find(
    (r) =>
      r.market === market &&
      r.crop_code === crop &&
      r.active_ingredient.toLowerCase() === ingredient.trim().toLowerCase(),
  );
}
