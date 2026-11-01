import { writeFileSync, mkdirSync } from 'node:fs';
import { plotProfiles } from '../src/features/plots/mock/plotProfiles';
import { provinces, crop_codes } from '../src/data/puc';
import { mrl_limits } from '../src/data/mrlLimits';
const quote = (value: unknown) => `'${String(value).replaceAll("'", "''")}'`;
const sql: string[] = ['PRAGMA foreign_keys=ON;'];
for (const [code, name] of Object.entries(provinces))
  sql.push(`INSERT OR IGNORE INTO provinces VALUES(${quote(code)},${quote(name)});`);
for (const [code, name] of Object.entries(crop_codes))
  sql.push(`INSERT OR IGNORE INTO crop_codes VALUES(${quote(code)},${quote(name)});`);
for (const r of mrl_limits)
  sql.push(
    `INSERT OR IGNORE INTO mrl_limits VALUES(${quote(r.market)},${quote(r.active_ingredient)},${quote(r.crop_code)},${r.mrl_mg_kg},${quote(r.source_url)},${quote(r.verified_at)});`,
  );
for (const id of ['VT001', 'VT002']) {
  const p = plotProfiles.find((p) => p.zoneId === id)!;
  const province = id === 'VT001' ? '80' : '86';
  sql.push(
    `INSERT OR IGNORE INTO planting_zone(id,puc_code,province_code,crop_code,variety,status,issued_by,issued_doc_no,issued_date,is_seeded) VALUES(${quote(id)},${quote(p.officialZoneCode!.code)},${quote(province)},'LUA001','ST25','active',${quote(p.officialZoneCode!.issuedBy)},'125/TB-UBND','2026-10-15',1);`,
  );
  sql.push(`INSERT OR IGNORE INTO zone_markets VALUES(${quote(id)},'USA');`);
  sql.push(
    `INSERT OR IGNORE INTO puc_allocations VALUES(${quote(province)},'LUA001',1,${quote(id)},'active');`,
  );
}
for (const p of plotProfiles)
  sql.push(
    `INSERT OR IGNORE INTO plots(pdi,zone_id,payload,is_seeded) VALUES(${quote(p.pdi)},${quote(p.zoneId)},${quote(JSON.stringify(p))},1);`,
  );
mkdirSync('.tmp-analysis', { recursive: true });
writeFileSync('.tmp-analysis/seed.sql', sql.join('\n'));
console.log(
  `Prepared ${plotProfiles.length} parcels; existing database records will be preserved.`,
);
