import { number } from '../lib/format';
import { currentMapPlots, zoneAreaScale } from '../data/agritrace';
import { useI18n } from '../lib/i18n';
import ModalDrawer from '../components/ModalDrawer';
import { useSearchParams } from 'react-router-dom';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Map, {
  Source,
  Layer,
  Marker,
  Popup,
  ScaleControl,
  AttributionControl,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre';
import * as turf from '@turf/turf';
import {
  Satellite,
  Map as MapIcon,
  Mountain,
  Plus,
  Minus,
  LocateFixed,
  Leaf,
  Radio,
  Copy,
} from 'lucide-react';
import type { Feature, Polygon, Position } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';
import { setWorkerUrl } from 'maplibre-gl';
import MapWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
setWorkerUrl(MapWorker);
import { mapData, type Plot } from './mock/generatePlots';
import { useMapText } from './i18n';
import { baseStyle, colorExpression, type Theme, type Base } from './layers/styles';
import LayerPanel, { type LayerSettings } from './components/LayerPanel';
import Legend from './components/Legend';
import KpiStrip from './components/KpiStrip';
import PlotDrawer from './components/PlotDrawer';
import MapToolbar, { type Tool } from './components/MapToolbar';
const initialLayers: LayerSettings = {
  boundary: { show: true, opacity: 100 },
  zones: { show: true, opacity: 80 },
  plots: { show: true, opacity: 100 },
  iot: { show: true, opacity: 100 },
  alerts: { show: true, opacity: 100 },
};
export default function MapView() {
  const { t: common } = useI18n();
  const [mobilePanel, setMobilePanel] = useState<'layers' | 'legend' | null>(null);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const close = () => {
      if (media.matches) setMobilePanel(null);
    };
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);
  const [searchParams] = useSearchParams();
  const focused = currentMapPlots.find((p) => p.properties.pdi === searchParams.get('focus'));
  const activeZone = searchParams.get('zone') ?? focused?.properties.zoneId ?? 'VT001';
  const zonePlots = useMemo(
    () => currentMapPlots.filter((p) => activeZone === 'all' || p.properties.zoneId === activeZone),
    [activeZone],
  );
  const zoneExtent = useMemo(
    () =>
      turf.bboxPolygon(
        turf.bbox(turf.featureCollection(zonePlots.length ? zonePlots : currentMapPlots)),
      ),
    [zonePlots],
  );
  const zoneCenter = useMemo(() => turf.center(zoneExtent).geometry.coordinates, [zoneExtent]);
  const [loaded, setLoaded] = useState(false);
  const [renderedZone, setRenderedZone] = useState('');
  const { t, lang } = useMapText(),
    ref = useRef<MapRef>(null),
    container = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState<Base>('satellite'),
    [theme, setTheme] = useState<Theme>('status'),
    [layers, setLayers] = useState(initialLayers),
    [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(14),
    [selected, setSelected] = useState<Plot | null>(null),
    [hover, setHover] = useState<{ plot: Plot; lng: number; lat: number } | null>(null),
    [cursor, setCursor] = useState(zoneCenter);
  const [tool, setToolState] = useState<Tool>(null),
    [points, setPoints] = useState<Position[]>([]),
    [finished, setFinished] = useState(false),
    [region, setRegion] = useState<Feature<Polygon> | null>(null),
    [coordinate, setCoordinate] = useState<Position | null>(null),
    [copied, setCopied] = useState(false),
    [threeD, setThreeD] = useState(false),
    [error, setError] = useState(false);
  const style = useMemo(() => baseStyle(base), [base]);
  const filtered = useMemo(
    () =>
      zonePlots.filter(
        (p) =>
          `${p.properties.id} ${p.properties.pdi} ${p.properties.zoneId} ${p.properties.owner} ${p.properties.sourceParcelNumber} ${p.properties.sheetNumber}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()) &&
          (!region || turf.booleanPointInPolygon(turf.pointOnFeature(p), region)),
      ),
    [query, region, zonePlots],
  );
  const visible = useMemo(() => turf.featureCollection(filtered), [filtered]);
  const centers = useMemo(
    () =>
      turf.featureCollection(
        filtered.map((p) =>
          turf.point(turf.pointOnFeature(p).geometry.coordinates, {
            ...p.properties,
            label: `${p.properties.id}\n${number(p.properties.areaHa, lang, 2)} ha`,
          }),
        ),
      ),
    [filtered, lang],
  );
  const zones = useMemo(
    () =>
      turf.featureCollection(
        mapData.zones.features.filter((z) =>
          filtered.some((p) => p.properties.zoneId === z.properties.id),
        ),
      ),
    [filtered],
  );
  const selectedCollection = useMemo(
    () => turf.featureCollection(selected && filtered.includes(selected) ? [selected] : []),
    [selected, filtered],
  );
  const drawing = useMemo(
    () =>
      turf.featureCollection<Polygon | import('geojson').LineString>(
        points.length >= 3 && tool !== 'length'
          ? [turf.polygon([[...points, points[0]]])]
          : points.length >= 2
            ? [turf.lineString(points)]
            : [],
      ),
    [points, tool],
  );
  const result =
    points.length >= 2 && tool === 'length'
      ? `${number(turf.length(turf.lineString(points)) * 1000, lang, 1)} m`
      : points.length >= 3
        ? `${number(turf.area(turf.polygon([[...points, points[0]]])) / 10000, lang, 2)} ha`
        : '';
  const fit = useCallback((feature: Feature, drawer = false) => {
    const b = turf.bbox(feature),
      width = container.current?.clientWidth || 1100;
    ref.current?.fitBounds(
      [
        [b[0], b[1]],
        [b[2], b[3]],
      ],
      {
        padding: {
          left: window.matchMedia('(min-width: 1024px)').matches ? 285 : 24,
          right: drawer ? Math.min(416, width * 0.42) : 80,
          top: 155,
          bottom: 170,
        },
        duration: 900,
        maxZoom: 18,
      },
    );
  }, []);
  const choose = useCallback(
    (plot: Plot) => {
      setSelected(plot);
      setHover(null);
      fit(plot, true);
    },
    [fit],
  );
  const setTool = (next: Tool) => {
    setToolState(next);
    setPoints([]);
    setFinished(false);
    setCoordinate(null);
    setCopied(false);
    setHover(null);
    if (next === 'searchArea') setRegion(null);
  };
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null);
        setTool(null);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  useEffect(() => {
    if (selected && !filtered.includes(selected)) setSelected(null);
  }, [filtered, selected]);
  useEffect(() => {
    if (loaded && focused) choose(focused);
  }, [loaded, focused, choose]);
  useEffect(() => {
    if (loaded && !focused) fit(zoneExtent);
  }, [loaded, focused, zoneExtent, fit]);
  const click = (e: MapLayerMouseEvent) => {
    if (tool === 'coord') {
      setCoordinate([e.lngLat.lng, e.lngLat.lat]);
      setCopied(false);
      return;
    }
    if (tool && !finished) {
      setPoints((p) => [...p, [e.lngLat.lng, e.lngLat.lat]]);
      return;
    }
    if (tool) return;
    const id = e.features?.[0]?.properties?.id,
      plot = filtered.find((p) => p.properties.id === id);
    if (plot) choose(plot);
  };
  const finish = () => {
    if (tool === 'length' ? points.length < 2 : points.length < 3) return;
    setFinished(true);
    if (tool === 'searchArea') setRegion(turf.polygon([[...points, points[0]]]));
  };
  const plotOpacity = (layers.plots.opacity / 100) * (base === 'satellite' ? 0.55 : 0.7);
  const counts = {
    boundary: filtered.length,
    zones: zones.features.length,
    plots: filtered.length,
    iot: mapData.stations.length,
    alerts: mapData.alerts.length,
  };
  return (
    <div ref={container} className="gis-map" data-geometry-rendered={renderedZone === activeZone}>
      <Map
        ref={ref}
        initialViewState={{
          longitude: zoneCenter[0],
          latitude: zoneCenter[1],
          zoom: 14,
        }}
        mapStyle={style}
        attributionControl={false}
        interactiveLayerIds={layers.plots.show ? ['plot-fill', 'plot-point'] : []}
        cursor={tool ? 'crosshair' : hover ? 'pointer' : 'grab'}
        onLoad={() => {
          setLoaded(true);
          if (focused) choose(focused);
          else fit(zoneExtent);
        }}
        onMove={(e) => {
          setZoom(e.viewState.zoom);
          setCursor([e.viewState.longitude, e.viewState.latitude]);
        }}
        onClick={click}
        doubleClickZoom={!tool}
        onError={(e) => {
          console.error(e.error);
          setError(true);
        }}
        onIdle={(event) => {
          setError(false);
          if (
            event.target.getLayer('plot-fill') &&
            event.target
              .queryRenderedFeatures({ layers: ['plot-fill'] })
              .some((f) => activeZone === 'all' || f.properties?.zoneId === activeZone)
          )
            setRenderedZone(activeZone);
        }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          setCursor([e.lngLat.lng, e.lngLat.lat]);
          if (tool) return;
          const plot = filtered.find((p) => p.properties.id === e.features?.[0]?.properties?.id);
          setHover(plot ? { plot, lng: e.lngLat.lng, lat: e.lngLat.lat } : null);
        }}
      >
        <Source id="zones" type="geojson" data={zones}>
          <Layer
            id="zone-fill"
            type="fill"
            layout={{ visibility: layers.zones.show ? 'visible' : 'none' }}
            paint={{
              'fill-color': '#4CAF50',
              'fill-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                13.8,
                (0.2 * layers.zones.opacity) / 100,
                14,
                0,
              ],
            }}
          />
          <Layer
            id="zone-border"
            type="line"
            layout={{ visibility: layers.zones.show ? 'visible' : 'none' }}
            paint={{
              'line-color': '#4CAF50',
              'line-width': 2,
              'line-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                13.8,
                (0.9 * layers.zones.opacity) / 100,
                14,
                (0.2 * layers.zones.opacity) / 100,
              ],
            }}
          />
        </Source>
        <Source id="plots" type="geojson" data={visible}>
          <Layer
            id="plot-point"
            type="circle"
            filter={['==', ['geometry-type'], 'Point']}
            layout={{ visibility: layers.plots.show ? 'visible' : 'none' }}
            paint={{
              'circle-radius': 6,
              'circle-color': colorExpression(theme),
              'circle-stroke-color': '#fff',
              'circle-stroke-width': 1.5,
              'circle-opacity': layers.plots.opacity / 100,
            }}
          />
          <Layer
            id="plot-fill"
            type="fill"
            layout={{ visibility: layers.plots.show ? 'visible' : 'none' }}
            paint={{
              'fill-color': colorExpression(theme),
              'fill-opacity': plotOpacity,
              'fill-opacity-transition': { duration: 250 },
            }}
          />
          <Layer
            id="plot-outline"
            type="line"
            layout={{ visibility: layers.plots.show ? 'visible' : 'none' }}
            paint={{
              'line-color': [
                'case',
                ['in', ['get', 'pdi'], ['literal', ['MP-0001', 'MP-1001']]],
                '#dc2626',
                '#22a447',
              ],
              'line-width': 1.5,

              'line-opacity': (0.9 * layers.plots.opacity) / 100,
            }}
          />
          <Layer
            id="plot-extrusion"
            type="fill-extrusion"
            layout={{ visibility: threeD && layers.plots.show ? 'visible' : 'none' }}
            minzoom={14}
            paint={{
              'fill-extrusion-color': colorExpression(theme),
              'fill-extrusion-height': ['*', ['get', 'areaHa'], 12],
              'fill-extrusion-opacity': plotOpacity,
            }}
          />
        </Source>
        <Source id="hover" type="geojson" data={turf.featureCollection(hover ? [hover.plot] : [])}>
          <Layer
            id="hover-fill"
            type="fill"
            minzoom={14}
            paint={{
              'fill-color': colorExpression(theme),
              'fill-opacity': Math.min(1, plotOpacity + 0.2),
            }}
          />
          <Layer
            id="hover-outline"
            type="line"
            minzoom={14}
            paint={{ 'line-color': 'white', 'line-width': 2.5 }}
          />
        </Source>
        <Source id="selection" type="geojson" data={selectedCollection}>
          <Layer
            id="selection-point"
            type="circle"
            paint={{
              'circle-radius': 10,
              'circle-color': '#E0A526',
              'circle-stroke-color': '#fff',
              'circle-stroke-width': 3,
            }}
          />
          <Layer
            id="selection-glow"
            type="line"
            paint={{ 'line-color': '#1F5130', 'line-width': 6, 'line-blur': 4 }}
          />
          <Layer
            id="selection-outline"
            type="line"
            paint={{ 'line-color': '#FFFFFF', 'line-width': 3 }}
          />
        </Source>
        <Source id="canals" type="geojson" data={mapData.canals}>
          <Layer
            id="canals-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': '#4FA3D9',
              'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3, 18, 6],
              'line-opacity': 0.8,
            }}
          />
        </Source>
        <Source id="boundary" type="geojson" data={visible}>
          <Layer
            id="boundary-halo"
            type="line"
            layout={{ visibility: layers.boundary.show ? 'visible' : 'none' }}
            paint={{
              'line-color': '#12341F',
              'line-width': 3,
              'line-opacity': (layers.boundary.opacity / 100) * 0.6,
            }}
          />
          <Layer
            id="boundary-dash"
            type="line"
            layout={{ visibility: layers.boundary.show ? 'visible' : 'none' }}
            paint={{
              'line-color': [
                'case',
                ['in', ['get', 'pdi'], ['literal', ['MP-0001', 'MP-1001']]],
                '#dc2626',
                '#22a447',
              ],
              'line-width': 1.5,

              'line-opacity': layers.boundary.opacity / 100,
            }}
          />
        </Source>
        <Source id="labels" type="geojson" data={centers}>
          <Layer
            id="plot-label"
            type="symbol"
            minzoom={16}
            layout={{
              visibility: layers.plots.show ? 'visible' : 'none',
              'text-field': ['get', 'label'],
              'text-font': ['Open Sans Semibold'],
              'text-size': 11,
              'text-allow-overlap': false,
              'text-padding': 4,
            }}
            paint={{ 'text-color': 'white', 'text-halo-color': '#183a28', 'text-halo-width': 2 }}
          />
        </Source>
        <Source id="drawing" type="geojson" data={drawing}>
          <Layer
            id="draw-fill"
            type="fill"
            filter={['==', ['geometry-type'], 'Polygon']}
            paint={{ 'fill-color': '#E0A526', 'fill-opacity': 0.18 }}
          />
          <Layer
            id="draw-line"
            type="line"
            paint={{ 'line-color': '#E0A526', 'line-width': 3, 'line-dasharray': [2, 1] }}
          />
        </Source>
        {points.map((p, i) => (
          <Marker key={i} longitude={p[0]} latitude={p[1]}>
            <span
              style={{
                display: 'block',
                width: 9,
                height: 9,
                borderRadius: 9,
                background: '#E0A526',
                border: '2px solid white',
              }}
            />
          </Marker>
        ))}
        {zoom < 14 &&
          layers.zones.show &&
          zones.features.map((z) => {
            const c = turf.centerOfMass(z).geometry.coordinates,
              area = filtered
                .filter((p) => p.properties.zoneId === z.properties.id)
                .reduce((s, p) => s + p.properties.areaHa, 0),
              color = zoneAreaScale(filtered).color(area);
            return (
              <Marker
                key={z.properties.id}
                longitude={c[0]}
                latitude={c[1]}
                style={{ opacity: layers.zones.opacity / 100 }}
              >
                <button
                  className="gis-zone-marker"
                  onClick={() =>
                    fit(
                      turf.bboxPolygon(
                        turf.bbox(
                          turf.featureCollection(
                            zonePlots.filter((p) => p.properties.zoneId === z.properties.id),
                          ),
                        ),
                      ),
                    )
                  }
                >
                  <span className="gis-zone-pin" style={{ background: color }}>
                    <Leaf size={18} />
                  </span>
                  <span className="gis-zone-chip">
                    {z.properties.id} · {z.properties.name}
                    <b>{number(area, lang, 2)} ha</b>
                  </span>
                </button>
              </Marker>
            );
          })}
        {layers.iot.show &&
          mapData.stations.map((s) => (
            <Marker
              key={s.properties.id}
              longitude={s.geometry.coordinates[0]}
              latitude={s.geometry.coordinates[1]}
              style={{ opacity: layers.iot.opacity / 100 }}
            >
              <div
                title={`${s.properties.id} · ${s.properties.online ? t.online : t.offline}`}
                className="gis-station"
              >
                <Radio size={16} />
                <span className={`gis-dot ${s.properties.online ? '' : 'offline'}`} />
              </div>
            </Marker>
          ))}
        {layers.alerts.show &&
          mapData.alerts.map((s) => (
            <Marker
              key={s.properties.id}
              longitude={s.geometry.coordinates[0]}
              latitude={s.geometry.coordinates[1]}
              style={{ opacity: layers.alerts.opacity / 100 }}
            >
              <div title={`${t.alert} · ${s.properties.id}`} className="gis-alert">
                !
              </div>
            </Marker>
          ))}
        {hover && zoom >= 14 && !selected && (
          <Popup
            longitude={hover.lng}
            latitude={hover.lat}
            closeButton={false}
            offset={12}
            className="gis-hover"
          >
            <strong>{hover.plot.properties.pdi}</strong>
            <small>
              {hover.plot.properties.owner} · {number(hover.plot.properties.areaHa, lang, 2)} ha
            </small>
          </Popup>
        )}
        {coordinate && (
          <Popup
            longitude={coordinate[0]}
            latitude={coordinate[1]}
            onClose={() => setCoordinate(null)}
          >
            <div>
              {number(coordinate[1], lang, 6)}, {number(coordinate[0], lang, 6)}
            </div>
            <button
              style={{ display: 'flex', gap: 5, marginTop: 8 }}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${coordinate[1].toFixed(6)}, ${coordinate[0].toFixed(6)}`,
                  );
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              <Copy size={13} />
              {copied ? t.copied : t.copy}
            </button>
          </Popup>
        )}
        <ScaleControl position="bottom-left" unit="metric" />
        <AttributionControl position="bottom-right" compact={false} />
      </Map>
      <div className="gis-glass gis-base">
        {(
          [
            ['satellite', Satellite, 'sat'],
            ['street', MapIcon, 'street'],
            ['terrain', Mountain, 'terrain'],
          ] as const
        ).map(([key, Icon, label]) => (
          <button
            aria-label={t[label]}
            aria-pressed={base === key}
            key={key}
            className={base === key ? 'active' : ''}
            onClick={() => {
              setBase(key);
              setError(false);
            }}
          >
            <Icon size={15} />
            <span>{t[label]}</span>
          </button>
        ))}
      </div>
      <MapToolbar tool={tool} setTool={setTool} />
      <div className="gis-desktop-panels">
        {' '}
        <LayerPanel
          layers={layers}
          setLayers={setLayers}
          theme={theme}
          setTheme={setTheme}
          query={query}
          setQuery={setQuery}
          counts={counts}
        />
        <Legend theme={theme} plots={filtered} overview={zoom < 14} />
      </div>
      <div className="gis-sheet-buttons">
        <button
          onClick={() => setMobilePanel('layers')}
          aria-controls="map-panel-sheet"
          aria-expanded={mobilePanel === 'layers'}
        >
          {t.layers}
        </button>
        <button
          onClick={() => setMobilePanel('legend')}
          aria-controls="map-panel-sheet"
          aria-expanded={mobilePanel === 'legend'}
        >
          {lang === 'vi' ? 'Chú giải' : 'Legend'}
        </button>
      </div>
      <ModalDrawer
        open={mobilePanel !== null}
        onClose={() => setMobilePanel(null)}
        title={mobilePanel === 'layers' ? t.layers : lang === 'vi' ? 'Chú giải' : 'Legend'}
        id="map-panel-sheet"
        className="map-sheet"
      >
        {mobilePanel === 'layers' ? (
          <LayerPanel
            layers={layers}
            setLayers={setLayers}
            theme={theme}
            setTheme={setTheme}
            query={query}
            setQuery={setQuery}
            counts={counts}
          />
        ) : (
          <Legend theme={theme} plots={filtered} overview={zoom < 14} />
        )}
      </ModalDrawer>
      <PlotDrawer
        plot={selected}
        onClose={() => setSelected(null)}
        onFly={() => selected && fit(selected, true)}
      />
      <KpiStrip plots={filtered} />
      {tool && tool !== 'coord' && (
        <div className="gis-glass gis-tool-result">
          <p>{tool === 'searchArea' ? t.areaHint : t.hint}</p>
          <strong>{result}</strong>
          <div style={{ marginTop: 8 }}>
            <button
              disabled={finished || (tool === 'length' ? points.length < 2 : points.length < 3)}
              onClick={finish}
            >
              {t.finish}
            </button>
            <button
              onClick={() => {
                setPoints([]);
                setFinished(false);
                setRegion(null);
              }}
            >
              {t.clear}
            </button>
            <button onClick={() => setTool(null)}>{t.close}</button>
          </div>
        </div>
      )}
      {error && (
        <div role="status" className="gis-glass gis-error">
          {t.error}
        </div>
      )}
      <div className="gis-glass gis-navigation">
        <button
          aria-label={common.zoomIn}
          title={common.zoomIn}
          onClick={() => ref.current?.zoomIn()}
        >
          <Plus size={16} />
        </button>
        <button
          aria-label={common.zoomOut}
          title={common.zoomOut}
          onClick={() => ref.current?.zoomOut()}
        >
          <Minus size={16} />
        </button>
        <button aria-label={t.locate} title={t.locate} onClick={() => fit(zoneExtent, !!selected)}>
          <LocateFixed size={16} />
        </button>
        {[false, true].map((v) => (
          <button
            key={String(v)}
            className={threeD === v ? 'active' : ''}
            onClick={() => {
              setThreeD(v);
              ref.current?.easeTo({ pitch: v ? 50 : 0, duration: 700 });
            }}
          >
            {v ? '3D' : '2D'}
          </button>
        ))}
      </div>
      <div className="gis-cursor">
        {number(cursor[1], lang, 5)}° N · {number(cursor[0], lang, 5)}° E
      </div>
      <div className="gis-caption">
        {t.mock}
        {!filtered.length ? ` · ${t.empty}` : ''} · {lang.toUpperCase()}
      </div>
    </div>
  );
}
