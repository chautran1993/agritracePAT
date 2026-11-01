PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS provinces (code TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS crop_codes (code TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS planting_zone (
 id TEXT PRIMARY KEY, puc_code TEXT NOT NULL UNIQUE, legacy_code TEXT,
 province_code TEXT NOT NULL REFERENCES provinces(code), crop_code TEXT NOT NULL REFERENCES crop_codes(code),
 variety TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','pending_approval','suspended','revoked')),
 issued_by TEXT NOT NULL, issued_doc_no TEXT NOT NULL, issued_date TEXT NOT NULL,
 is_seeded INTEGER NOT NULL DEFAULT 1 CHECK(is_seeded IN (0,1)), revision INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS zone_markets (
 zone_id TEXT NOT NULL REFERENCES planting_zone(id), market TEXT NOT NULL CHECK(length(market)=3),
 PRIMARY KEY(zone_id,market)
);
CREATE TABLE IF NOT EXISTS puc_allocations (
 province_code TEXT NOT NULL, crop_code TEXT NOT NULL, sequence INTEGER NOT NULL,
 zone_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL,
 PRIMARY KEY(province_code,crop_code,sequence)
);
CREATE TABLE IF NOT EXISTS plots (
 pdi TEXT PRIMARY KEY, zone_id TEXT NOT NULL REFERENCES planting_zone(id),
 payload TEXT NOT NULL CHECK(json_valid(payload)), is_seeded INTEGER NOT NULL DEFAULT 1,
 revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_events (
 id INTEGER PRIMARY KEY, pdi TEXT NOT NULL, field TEXT NOT NULL, before_value TEXT NOT NULL,
 after_value TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS mrl_limits (
 market TEXT NOT NULL, active_ingredient TEXT NOT NULL, crop_code TEXT NOT NULL,
 mrl_mg_kg REAL NOT NULL CHECK(mrl_mg_kg>=0), source_url TEXT NOT NULL,
 verified_at TEXT NOT NULL, PRIMARY KEY(market,active_ingredient,crop_code)
);
