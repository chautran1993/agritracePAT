import TableScroll from '../../components/TableScroll';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpRight, MapPin, FileText, Users, Layers } from 'lucide-react';
import { plotProfiles } from './mock/plotProfiles';
import { useI18n } from '../../lib/i18n';
import { text, number, date } from './utils/format';
import { categoryLabel } from '../../map/i18n';
import { Card, Chip, Empty } from './components/shared';
import './profile.css';
export default function PlotRegistryPage() {
  const { lang } = useI18n(),
    vi = lang === 'vi',
    [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(''),
    [zone, setZone] = useState(params.get('zone') || 'all'),
    [status, setStatus] = useState('all'),
    [variety, setVariety] = useState(params.get('variety') || 'all');
  const labels = vi
    ? {
        title: 'Hồ sơ thửa ruộng',
        sub: 'Quản lý thông tin thửa ruộng, chủ hộ và mùa vụ.',
        search: 'Tìm PDI, mã thửa hoặc chủ hộ…',
        all: 'Tất cả',
        zone: 'Vùng trồng',
        status: 'Trạng thái mã',
        variety: 'Giống',
        plots: 'Thửa ruộng',
        owners: 'Chủ hộ',
        area: 'Diện tích ước tính',
        profile: 'Mở hồ sơ',
        name: 'Thửa / Mã PDI',
        owner: 'Chủ hộ',
        season: 'Mùa vụ hiện tại',
        stage: 'Giai đoạn',
        sowing: 'Ngày sạ',
        map: 'Xem bản đồ',
        zones: 'Quản lý vùng trồng',
        empty: 'Không có thửa phù hợp',
        count: 'hồ sơ',
      }
    : {
        title: 'Rice plot records',
        sub: 'Manage parcel information, households and cultivation seasons.',
        search: 'Find PDI, plot code or owner…',
        all: 'All',
        zone: 'Planting zone',
        status: 'Code status',
        variety: 'Variety',
        plots: 'Rice plots',
        owners: 'Owners',
        area: 'Estimated area',
        profile: 'Open profile',
        name: 'Plot / PDI',
        owner: 'Owner',
        season: 'Current season',
        stage: 'Growth stage',
        sowing: 'Sowing date',
        map: 'View map',
        zones: 'Manage zones',
        empty: 'No matching plots',
        count: 'profiles',
      };
  const filtered = useMemo(
    () =>
      plotProfiles.filter(
        (p) =>
          (zone === 'all' || p.zoneId === zone) &&
          (status === 'all' || p.codeStatus === status) &&
          (variety === 'all' || p.currentSeason.variety === variety) &&
          `${p.pdi} ${p.shortCode} ${p.owner.name}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
      ),
    [query, zone, status, variety],
  );
  const changeZone = (value: string) => {
    setZone(value);
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('zone');
    else next.set('zone', value);
    setParams(next, { replace: true });
  };
  return (
    <div className="plot-profile">
      <div className="pp-row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <small className="pp-eyebrow">AgriTrace · Digital passports</small>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#12341F', margin: '6px 0' }}>
            {labels.title}
          </h1>
          <p style={{ color: '#526457' }}>{labels.sub}</p>
        </div>
        <div className="pp-row">
          <Link className="pp-primary" to="/map">
            <MapPin size={14} />
            {labels.map}
          </Link>
          <Link to="/zones" style={{ color: '#1F5130' }}>
            {labels.zones} →
          </Link>
        </div>
      </div>
      <div className="pp-three-col">
        <Card>
          <small>
            <FileText size={16} />
            {labels.plots}
          </small>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1F5130' }}>
            {number(filtered.length, lang, 0)}
          </h2>
        </Card>
        <Card>
          <small>
            <Users size={16} />
            {labels.owners}
          </small>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1F5130' }}>
            {number(new Set(filtered.map((p) => p.owner.householdId)).size, lang, 0)}
          </h2>
        </Card>
        <Card>
          <small>
            <Layers size={16} />
            {labels.area}
          </small>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1F5130' }}>
            {number(
              filtered.reduce((s, p) => s + p.areaGisHa, 0),
              lang,
              2,
            )}{' '}
            ha
          </h2>
        </Card>
      </div>
      <Card>
        <div className="pp-filters">
          <label style={{ flex: 1 }}>
            <Search size={15} />
            <input
              style={{ width: '100%' }}
              aria-label={labels.search}
              placeholder={labels.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {[
            [labels.zone, zone, changeZone, [...new Set(plotProfiles.map((p) => p.zoneId))]],
            [labels.variety, variety, setVariety, ['ST25']],
            [
              labels.status,
              status,
              setStatus,
              ['Đã cấp mã', 'Đang đăng ký', 'Chưa đăng ký', 'Đang hoạt động'],
            ],
          ].map(([label, value, set, options]) => (
            <select
              key={label as string}
              aria-label={label as string}
              value={value as string}
              onChange={(e) => (set as (s: string) => void)(e.target.value)}
              style={{
                border: '1px solid #E5EAE3',
                borderRadius: 7,
                padding: 8,
                background: 'white',
              }}
            >
              <option value="all">
                {label as string}: {labels.all}
              </option>
              {(options as string[]).map((o) => (
                <option key={o} value={o}>
                  {categoryLabel(o, lang)}
                </option>
              ))}
            </select>
          ))}
        </div>
        <p className="pp-space">
          <small>
            {number(filtered.length, lang, 0)} {labels.count}
          </small>
        </p>
        {filtered.length ? (
          <div className="pp-table-scroll">
            <TableScroll>
              <table>
                <thead>
                  <tr>
                    {[
                      labels.name,
                      labels.owner,
                      labels.zone,
                      labels.area,
                      labels.season,
                      labels.stage,
                      labels.sowing,
                      labels.status,
                      '',
                    ].map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.pdi}>
                      <td>
                        <Link to={`/plots/${encodeURIComponent(p.pdi)}`}>
                          <b style={{ color: '#1F5130' }}>
                            {p.shortCode} · {text(p.name, lang)}
                          </b>
                          <small
                            style={{ display: 'block', fontFamily: 'monospace', marginTop: 5 }}
                          >
                            {p.pdi}
                          </small>
                        </Link>
                      </td>
                      <td>
                        <b>{p.owner.name}</b>
                        <small style={{ display: 'block' }}>{p.owner.householdId}</small>
                      </td>
                      <td>
                        <Link to={`/zones?zone=${p.zoneId}`}>{p.zoneId}</Link>
                      </td>
                      <td>{number(p.areaGisHa, lang, 2)} ha</td>
                      <td>
                        {text(p.currentSeason.name, lang)}
                        <small style={{ display: 'block' }}>
                          {categoryLabel(p.currentSeason.variety, lang)}
                        </small>
                      </td>
                      <td>{categoryLabel(p.currentSeason.stage, lang)}</td>
                      <td>{date(p.currentSeason.sowingDate, lang)}</td>
                      <td>
                        <Chip
                          tone={
                            p.codeStatus === 'Đã cấp mã'
                              ? 'green'
                              : p.codeStatus === 'Đang đăng ký'
                                ? 'gold'
                                : 'grey'
                          }
                        >
                          {categoryLabel(p.codeStatus, lang)}
                        </Chip>
                      </td>
                      <td>
                        <Link
                          aria-label={`${labels.profile} ${p.shortCode}`}
                          to={`/plots/${encodeURIComponent(p.pdi)}`}
                          className="pp-row"
                          style={{ color: '#1F5130', whiteSpace: 'nowrap' }}
                        >
                          {labels.profile}
                          <ArrowUpRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </div>
        ) : (
          <Empty>{labels.empty}</Empty>
        )}
      </Card>
    </div>
  );
}
