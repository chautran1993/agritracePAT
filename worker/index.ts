import type { Plot } from '../src/features/plots/types';
import { editFields } from '../src/features/plots/editable';
import { checkIngredient } from '../src/data/mrlLimits';
import { addDays, dayDiff, todaySaigon } from '../src/lib/format';
import { refreshDerivedProfile } from '../src/data/derivedProfile';
interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all(): Promise<{ results: unknown[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
interface Env {
  DB: {
    prepare(sql: string): Statement;
    batch(statements: Statement[]): Promise<{ meta: { changes: number } }[]>;
  };
  ASSETS: { fetch(request: Request): Promise<Response> };
  // Provision through wrangler secret. No write access until both values are configured.
  API_ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
}
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const enc = new TextEncoder();
function validDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value))), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}
async function authenticated(request: Request, env: Env) {
  if (!env.SESSION_SECRET) return false;
  const token = request.headers.get('Cookie')?.match(/(?:^|;\s*)agri_api=([^;]+)/)?.[1];
  if (!token) return false;
  const [expiry, username, signature] = token.split('.');
  if (!['quanly', 'htx', 'kythuat', 'doanhnghiep'].includes(username)) return false;
  return Number(expiry) > Date.now() &&
    signature === (await sign(expiry + '.' + username, env.SESSION_SECRET))
    ? username
    : false;
}
async function derivePassword(password: string, salt: string, secret: string) {
  const material = await crypto.subtle.importKey(
    'raw',
    enc.encode(password + secret),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    material,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
}
async function verifyPassword(username: string, password: string, env: Env) {
  const saved = await env.DB.prepare(
    'SELECT password_hash,password_salt FROM user_credentials WHERE username=?',
  )
    .bind(username)
    .first<{ password_hash: string; password_salt: string }>();
  return saved
    ? saved.password_hash ===
        (await derivePassword(password, saved.password_salt, env.SESSION_SECRET))
    : (await sign(password, env.SESSION_SECRET)) ===
        (await sign(env.API_ADMIN_PASSWORD, env.SESSION_SECRET));
}
type ZoneColumns = {
  puc_code: string;
  issued_by: string;
  issued_date: string;
  issued_doc_no: string;
  status: 'active' | 'pending_approval' | 'suspended' | 'revoked';
};
function applyZoneData(plot: Plot, zone: ZoneColumns) {
  const statusLabels = {
    active: 'Đã cấp mã',
    pending_approval: 'Đang đăng ký',
    suspended: 'Tạm dừng',
    revoked: 'Đã thu hồi',
  } as const;
  plot.codeStatus = statusLabels[zone.status];
  plot.officialZoneCode = {
    code: zone.puc_code,
    issuedBy: zone.issued_by,
    issuedAt: zone.issued_date,
    issuedDocNo: zone.issued_doc_no,
    statusValue: zone.status,
    markets: zone.puc_code.endsWith('-CHN') ? ['CN'] : ['US'],
    status: statusLabels[zone.status],
  };
  return plot;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      if (request.method !== 'GET' && request.headers.get('Origin') !== url.origin)
        return json({ error: 'Origin rejected' }, 403);
      if (url.pathname === '/api/session' && request.method === 'POST') {
        if (!env.API_ADMIN_PASSWORD || !env.SESSION_SECRET)
          return json({ error: 'API credentials are not configured' }, 503);
        const body = (await request.json()) as { username?: string; password?: string };
        if (
          !['quanly', 'htx', 'kythuat', 'doanhnghiep'].includes(body.username || '') ||
          !(await verifyPassword(body.username!, body.password || '', env))
        )
          return json({ error: 'Thông tin đăng nhập không hợp lệ' }, 401);
        const expiry = String(Date.now() + 30 * 60 * 1000);
        return new Response(JSON.stringify({ authenticated: true }), {
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `agri_api=${expiry}.${body.username}.${await sign(expiry + '.' + body.username, env.SESSION_SECRET)}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=1800`,
            'Cache-Control': 'no-store',
          },
        });
      }
      if (url.pathname === '/api/session' && request.method === 'DELETE')
        return new Response(null, {
          status: 204,
          headers: {
            'Set-Cookie': 'agri_api=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0',
          },
        });
      const publicTrace = url.pathname.match(/^\/api\/public-trace\/([A-Z0-9-]+)\/([A-Z0-9-]+)$/);
      if (publicTrace && request.method === 'GET') {
        const row = await env.DB.prepare(
          'SELECT p.payload,z.puc_code,z.issued_by,z.issued_date,z.issued_doc_no,z.status FROM plots p JOIN planting_zone z ON z.id=p.zone_id WHERE p.pdi=?',
        )
          .bind(publicTrace[1])
          .first<{ payload: string } & ZoneColumns>();
        if (!row) return json({ error: 'Không tìm thấy lô hàng' }, 404);
        const plot = applyZoneData(refreshDerivedProfile(JSON.parse(row.payload)), row);
        const season = [plot.currentSeason, ...plot.seasons].find(
          (s) => s.traceBatch?.code === publicTrace[2] || s.harvest?.batchCode === publicTrace[2],
        );
        if (!season) return json({ error: 'Không tìm thấy lô hàng' }, 404);
        plot.officialZoneCode!.code = row.puc_code;
        const { phone, householdId, ...owner } = plot.owner;
        const { soilBaseline, ...publicPlot } = plot;
        plot.documents = [];
        plot.versions = [];

        plot.seasons = [season];
        return json({
          plot: { ...publicPlot, owner, documents: [], versions: [], seasons: [season] },
        });
      }
      const caller = await authenticated(request, env);
      if (!caller) return json({ error: 'Yêu cầu đăng nhập API' }, 401);
      if(url.pathname==='/api/session'&&request.method==='GET')return json({authenticated:true,username:caller});
      if (url.pathname === '/api/session' && request.method === 'PUT') {
        const expiry = String(Date.now() + 30 * 60 * 1000);
        return new Response(JSON.stringify({ authenticated: true }), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Set-Cookie': `agri_api=${expiry}.${caller}.${await sign(expiry + '.' + caller, env.SESSION_SECRET)}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=1800`,
          },
        });
      }
      if (url.pathname === '/api/account/password' && request.method === 'POST') {
        const body = (await request.json()) as { current: string; next: string };
        if (
          typeof body.next !== 'string' ||
          body.next.length < 8 ||
          body.next.length > 200 ||
          !/[A-Za-z]/.test(body.next) ||
          !/\d/.test(body.next) ||
          body.current === body.next
        )
          return json({ error: 'Mật khẩu mới không hợp lệ' }, 400);
        if (!(await verifyPassword(caller, body.current, env)))
          return json({ error: 'Mật khẩu hiện tại không đúng' }, 401);
        const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
          b.toString(16).padStart(2, '0'),
        ).join('');
        await env.DB.prepare(
          'INSERT INTO user_credentials(username,password_hash,password_salt) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash,password_salt=excluded.password_salt,updated_at=CURRENT_TIMESTAMP',
        )
          .bind(caller, await derivePassword(body.next, salt, env.SESSION_SECRET), salt)
          .run();
        return json({ saved: true });
      }
      if (caller === 'doanhnghiep' && request.method !== 'GET')
        return json({ error: 'Tài khoản chỉ có quyền xem' }, 403);
      if (url.pathname === '/api/dataset' && request.method === 'GET') {
        const rows = await env.DB.prepare(
          'SELECT p.payload,z.puc_code,z.issued_by,z.issued_date,z.issued_doc_no,z.status FROM plots p JOIN planting_zone z ON z.id=p.zone_id',
        ).all();
        return json(
          rows.results.map((value) => {
            const r = value as { payload: string } & ZoneColumns;
            const p = applyZoneData(refreshDerivedProfile(JSON.parse(r.payload)), r);
            return p;
          }),
        );
      }
      const zoneInfo = url.pathname.match(/^\/api\/zones\/(VT\d+)$/);
      if (zoneInfo && request.method === 'GET')
        return json(
          await env.DB.prepare('SELECT * FROM planting_zone WHERE id=?').bind(zoneInfo[1]).first(),
        );
      if (zoneInfo && request.method === 'PATCH') {
        const body = (await request.json()) as { field: string; value: string; revision: number };
        if (
          !['issued_by', 'issued_doc_no', 'issued_date', 'variety', 'status'].includes(
            body.field,
          ) ||
          typeof body.value !== 'string' ||
          !body.value.trim() ||
          body.value.length > 200
        )
          return json({ error: 'Giá trị không hợp lệ' }, 400);
        if (body.field === 'issued_date' && !validDate(body.value))
          return json({ error: 'Ngày không hợp lệ' }, 400);
        if (
          body.field === 'status' &&
          !['active', 'pending_approval', 'suspended', 'revoked'].includes(body.value)
        )
          return json({ error: 'Trạng thái không hợp lệ' }, 400);
        if (
          /mẫu|gợi ý|chưa có|chưa xác định|preview|phase 2|\bdemo\b|\bsample\b|lorem|^[-–—]{1,2}$/i.test(
            body.value,
          )
        )
          return json({ error: 'Vui lòng nhập thông tin đầy đủ' }, 400);
        const result = await env.DB.prepare(
          `UPDATE planting_zone SET ${body.field}=?,revision=revision+1 WHERE id=? AND revision=? RETURNING *`,
        )
          .bind(body.value.trim(), zoneInfo[1], body.revision)
          .first();
        return result ? json(result) : json({ error: 'Vùng đã thay đổi. Vui lòng tải lại.' }, 409);
      }
      const zoneMatch = url.pathname.match(/^\/api\/zones\/(VT\d+)\/market$/);
      if (zoneMatch && request.method === 'PATCH') {
        const body = (await request.json()) as { market: string; revision: number };
        if (!['USA', 'CHN', 'JPN', 'KOR', 'AUS', 'CAN', 'GBR', 'DEU', 'FRA'].includes(body.market))
          return json({ error: 'Thị trường không hợp lệ' }, 400);
        const zone = await env.DB.prepare('SELECT puc_code,revision FROM planting_zone WHERE id=?')
          .bind(zoneMatch[1])
          .first<{ puc_code: string; revision: number }>();
        if (!zone) return json({ error: 'Không tìm thấy vùng' }, 404);
        if (zone.revision !== body.revision)
          return json({ error: 'Vùng đã thay đổi. Vui lòng tải lại.' }, 409);
        const code = zone.puc_code.split('-').slice(0, 4).join('-') + '-' + body.market;
        const saved = await env.DB.batch([
          env.DB.prepare(
            'DELETE FROM zone_markets WHERE zone_id=? AND EXISTS(SELECT 1 FROM planting_zone WHERE id=? AND revision=?)',
          ).bind(zoneMatch[1], zoneMatch[1], body.revision),
          env.DB.prepare(
            'INSERT INTO zone_markets SELECT ?,? WHERE EXISTS(SELECT 1 FROM planting_zone WHERE id=? AND revision=?)',
          ).bind(zoneMatch[1], body.market, zoneMatch[1], body.revision),
          env.DB.prepare(
            'UPDATE planting_zone SET puc_code=?,revision=revision+1 WHERE id=? AND revision=?',
          ).bind(code, zoneMatch[1], body.revision),
        ]);
        return saved[2].meta.changes
          ? json({ puc_code: code, revision: body.revision + 1 })
          : json({ error: 'Xung đột phiên bản' }, 409);
      }
      if (zoneMatch && request.method === 'GET')
        return json(
          await env.DB.prepare('SELECT puc_code,revision FROM planting_zone WHERE id=?')
            .bind(zoneMatch[1])
            .first(),
        );
      const match = url.pathname.match(/^\/api\/plots\/([A-Z0-9-]+)$/);
      if (match) {
        const row = await env.DB.prepare(
          'SELECT p.payload,p.revision,z.puc_code,z.issued_by,z.issued_date,z.issued_doc_no,z.status FROM plots p JOIN planting_zone z ON z.id=p.zone_id WHERE p.pdi=?',
        )
          .bind(match[1])
          .first<{ payload: string; revision: number } & ZoneColumns>();
        if (!row) return json({ error: 'Không tìm thấy thửa' }, 404);
        if (request.method === 'GET') {
          const plot = applyZoneData(refreshDerivedProfile(JSON.parse(row.payload)), row);
          plot.officialZoneCode!.code = row.puc_code;
          plot.officialZoneCode!.markets = row.puc_code.endsWith('-CHN') ? ['CN'] : ['US'];
          return json({ plot, revision: row.revision });
        }
        if (request.method === 'PATCH') {
          const body = (await request.json()) as {
            field: string;
            value: unknown;
            revision: number;
          };
          const plot = applyZoneData(refreshDerivedProfile(JSON.parse(row.payload)), row);
          const fields = new Set(
            ['overview', 'season', 'logbook', 'soil', 'pests', 'harvest'].flatMap((tab) =>
              editFields(plot, tab).map((f) => f.path),
            ),
          );
          if (
            !fields.has(body.field) ||
            (typeof body.value !== 'string' && typeof body.value !== 'number') ||
            String(body.value).trim().length === 0 ||
            String(body.value).length > 200
          )
            return json({ error: 'Giá trị không hợp lệ' }, 400);
          if (body.revision !== row.revision)
            return json({ error: 'Hồ sơ đã thay đổi. Vui lòng tải lại.' }, 409);
          const keys = body.field.split('.');
          const key = keys.pop()!;
          const parent = keys.reduce<Record<string, unknown>>(
            (obj, k) => obj[k] as Record<string, unknown>,
            plot as unknown as Record<string, unknown>,
          );
          const before = parent[key];
          if (/(?:Date|At|date)$/.test(key) && !validDate(body.value))
            return json({ error: 'Ngày không hợp lệ' }, 400);
          parent[key] = typeof before === 'number' ? Number(body.value) : body.value;
          if (
            body.field === 'currentSeason.sowingDate' &&
            /^\d{4}-\d{2}-\d{2}$/.test(String(body.value))
          ) {
            const shift = dayDiff(String(body.value), String(before));
            plot.currentSeason.expectedHarvestDate = addDays(
              plot.currentSeason.expectedHarvestDate,
              shift,
            );
            for (const log of plot.currentSeason.logs) log.date = addDays(log.date, shift);
            for (const pest of plot.currentSeason.pests)
              pest.detectedAt = addDays(pest.detectedAt, shift);
            plot.currentSeason.das = Math.max(0, dayDiff(todaySaigon(), String(body.value)));
            const days = plot.currentSeason.das;
            plot.currentSeason.stage =
              String(body.value) > todaySaigon()
                ? 'Chuẩn bị gieo sạ'
                : days < 25
                  ? 'Gieo sạ'
                  : days < 50
                    ? 'Đẻ nhánh'
                    : days < 80
                      ? 'Làm đòng – Trổ'
                      : 'Chín – Thu hoạch';
          }
          if (
            typeof before === 'number' &&
            (!Number.isFinite(parent[key]) ||
              Number(parent[key]) <= 0 ||
              Number(parent[key]) > 100000)
          )
            return json({ error: 'Số phải lớn hơn 0' }, 400);
          if (plot.currentSeason.expectedHarvestDate <= plot.currentSeason.sowingDate)
            return json({ error: 'Ngày thu hoạch phải sau ngày gieo sạ' }, 400);
          for (const season of [plot.currentSeason, ...plot.seasons]) {
            if (
              season.expectedHarvestDate <= season.sowingDate ||
              (season.harvest && season.harvest.date <= season.sowingDate)
            )
              return json({ error: 'Ngày thu hoạch phải sau ngày gieo sạ' }, 400);
            if (
              season.logs.some(
                (log: { date: string }) =>
                  log.date < season.sowingDate || log.date > season.expectedHarvestDate,
              )
            )
              return json({ error: 'Ngày nhật ký phải nằm trong mùa vụ' }, 400);
          }
          if (
            body.field === 'owner.phone' &&
            !/^(03|08|09)\d{8}$/.test(String(body.value).replace(/\s/g, ''))
          )
            return json({ error: 'Số điện thoại không hợp lệ' }, 400);
          if (/(?:Date|At|date)$/.test(key) && !/^\d{4}-\d{2}-\d{2}$/.test(String(body.value)))
            return json({ error: 'Ngày không hợp lệ' }, 400);
          if (body.field === 'currentSeason.yieldPerHaT')
            plot.currentSeason.expectedYieldT = plot.areaGisHa * Number(body.value);
          if (/ratePerHa$/.test(body.field)) parent.qty = plot.areaGisHa * Number(body.value);
          if (
            key === 'activeIngredient' &&
            row.puc_code.endsWith('-USA') &&
            !checkIngredient('USA', String(body.value))
          )
            return json(
              {
                error:
                  'Hoạt chất chưa được cấu hình cho thị trường Hoa Kỳ; cần đối chiếu trước khi lưu.',
              },
              422,
            );
          if (
            /chưa có dữ liệu|chưa xác định|chưa rõ|chưa xác minh|chưa có|mẫu|gợi ý|preview|phase 2|\bdemo\b|\btest\b|\bsample\b|lorem|^[-–—]{1,2}$/i.test(
              String(body.value),
            )
          )
            return json({ error: 'Vui lòng nhập giá trị đầy đủ' }, 400);
          const saved = await env.DB.batch([
            env.DB.prepare(
              'INSERT INTO audit_events(pdi,field,before_value,after_value,actor) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM plots WHERE pdi=? AND revision=?)',
            ).bind(
              match[1],
              body.field,
              String(before),
              String(body.value),
              caller,
              match[1],
              body.revision,
            ),
            env.DB.prepare(
              'UPDATE plots SET payload=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE pdi=? AND revision=?',
            ).bind(JSON.stringify(plot), match[1], body.revision),
          ]);
          if (!saved[1].meta.changes)
            return json({ error: 'Hồ sơ đã thay đổi. Vui lòng tải lại.' }, 409);
          plot.officialZoneCode!.code = row.puc_code;
          plot.officialZoneCode!.markets = row.puc_code.endsWith('-CHN') ? ['CN'] : ['US'];
          return json({ plot, revision: row.revision + 1 });
        }
      }
      return json({ error: 'Endpoint không tồn tại' }, 404);
    } catch {
      return json({ error: 'Không thể xử lý yêu cầu' }, 500);
    }
  },
};
