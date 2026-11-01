import { number } from '../../lib/format';
import { useState } from 'react';
import { Layers, ChevronDown, Search } from 'lucide-react';
import { useMapText } from '../i18n';
import type { Theme } from '../layers/styles';
export type LayerKey = 'boundary' | 'zones' | 'plots' | 'iot' | 'alerts';
export type LayerSettings = Record<LayerKey, { show: boolean; opacity: number }>;
export default function LayerPanel({
  layers,
  setLayers,
  theme,
  setTheme,
  query,
  setQuery,
  counts,
}: {
  layers: LayerSettings;
  setLayers: (s: LayerSettings) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  query: string;
  setQuery: (s: string) => void;
  counts: Record<LayerKey, number>;
}) {
  const { t, lang } = useMapText(),
    [collapsed, setCollapsed] = useState(false);
  const swatches = ['#1F5130', '#4CAF50', '#2E9E4F', '#4FA3D9', '#D64545'];
  return (
    <aside className="gis-glass gis-layer-panel">
      <button
        className="gis-panel-heading"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
      >
        <span>
          <Layers size={17} />
          {t.layers}
        </span>
        <ChevronDown size={16} style={{ transform: collapsed ? 'rotate(-90deg)' : undefined }} />
      </button>
      {!collapsed && (
        <>
          <label className="gis-search">
            <Search size={14} />
            <input
              aria-label={t.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
            />
          </label>
          <div className="gis-layer-rows">
            {(Object.keys(layers) as LayerKey[]).map((key, i) => (
              <div key={key}>
                <label className="gis-layer-row">
                  <input
                    type="checkbox"
                    checked={layers[key].show}
                    onChange={(e) =>
                      setLayers({ ...layers, [key]: { ...layers[key], show: e.target.checked } })
                    }
                  />
                  <span className="gis-swatch" style={{ background: swatches[i] }} />
                  {t[key]}
                  <b>{number(counts[key], lang, 0)}</b>
                </label>
                <div className="gis-slider">
                  <input
                    aria-label={`${t[key]} · ${t.opacity}`}
                    type="range"
                    min="0"
                    max="100"
                    value={number(layers[key].opacity, lang, 0)}
                    onChange={(e) =>
                      setLayers({ ...layers, [key]: { ...layers[key], opacity: +e.target.value } })
                    }
                  />
                  <small>{number(layers[key].opacity, lang, 0)}%</small>
                </div>
              </div>
            ))}
          </div>
          <label className="gis-color-label">
            {t.color}
            <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
              {(['status', 'variety', 'stage'] as const).map((k) => (
                <option key={k} value={k}>
                  {t[k]}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </aside>
  );
}
