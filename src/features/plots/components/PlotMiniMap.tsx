import { useMemo, useRef } from 'react';
import Map, {
  Source,
  Layer,
  Marker,
  AttributionControl,
  ScaleControl,
  type MapRef,
} from 'react-map-gl/maplibre';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { Radio, FlaskConical, MapPin } from 'lucide-react';
import * as turf from '@turf/turf';
import type { Polygon, Point } from 'geojson';
import type { Plot } from '../types';
import { mapData } from '../../../map/mock/generatePlots';
import { baseStyle } from '../../../map/layers/styles';
import { usePlotText } from '../i18n';
import 'maplibre-gl/dist/maplibre-gl.css';
setWorkerUrl(workerUrl);
const style = baseStyle('satellite');
export default function PlotMiniMap({
  plot,
  oldGeometry,
  gps,
}: {
  plot: Plot;
  oldGeometry?: Polygon | Point;
  gps?: { lat: number; lng: number };
}) {
  const ref = useRef<MapRef>(null),
    { t } = usePlotText();
  const feature = useMemo(() => turf.feature(plot.geometry, { pdi: plot.pdi }), [plot]);
  const station = mapData.stations.find((s) => s.properties.id === plot.iotStationId);
  return (
    <div className="pp-map">
      <Map
        ref={ref}
        initialViewState={{ longitude: plot.centroid.lng, latitude: plot.centroid.lat, zoom: 16 }}
        mapStyle={style}
        attributionControl={false}
        scrollZoom={false}
        onLoad={() => {
          const b = turf.bbox(
            gps
              ? turf.featureCollection<Polygon | import('geojson').Point>([
                  feature,
                  turf.point([gps.lng, gps.lat]),
                ])
              : feature,
          );
          ref.current?.fitBounds(
            [
              [b[0], b[1]],
              [b[2], b[3]],
            ],
            { padding: 55, maxZoom: 18, duration: 0 },
          );
        }}
      >
        <Source id="neighbours" type="geojson" data={mapData.plots}>
          <Layer
            id="neighbour-fill"
            type="fill"
            paint={{ 'fill-color': '#8A94A6', 'fill-opacity': 0.18 }}
          />
          <Layer
            id="neighbour-line"
            type="line"
            paint={{ 'line-color': 'white', 'line-width': 1, 'line-opacity': 0.4 }}
          />
        </Source>
        <Source id="profile-plot" type="geojson" data={feature}>
          <Layer
            id="profile-point"
            type="circle"
            paint={{
              'circle-radius': 9,
              'circle-color': '#1F5130',
              'circle-stroke-color': 'white',
              'circle-stroke-width': 2,
            }}
          />
          <Layer
            id="profile-fill"
            type="fill"
            paint={{ 'fill-color': '#2E9E4F', 'fill-opacity': 0.5 }}
          />
          <Layer
            id="profile-glow"
            type="line"
            paint={{ 'line-color': '#1F5130', 'line-width': 7, 'line-blur': 4 }}
          />
          <Layer
            id="profile-line"
            type="line"
            paint={{
              'line-color': [
                'case',
                ['in', ['get', 'pdi'], ['literal', ['MP-0001', 'MP-1001']]],
                '#dc2626',
                '#22a447',
              ],
              'line-width': 2,
            }}
          />
        </Source>
        {oldGeometry && (
          <Source id="old-plot" type="geojson" data={turf.feature(oldGeometry)}>
            <Layer id="old-line" type="line" paint={{ 'line-color': '#E0A526', 'line-width': 3 }} />
          </Source>
        )}
        {!plot.sourceOnly && (
          <Marker
            longitude={plot.soilBaseline.samplePoint.lng}
            latitude={plot.soilBaseline.samplePoint.lat}
          >
            <span className="pp-map-marker" title={t('soilSample')}>
              <FlaskConical size={16} />
            </span>
          </Marker>
        )}
        {station && (
          <Marker
            longitude={station.geometry.coordinates[0]}
            latitude={station.geometry.coordinates[1]}
            offset={[20, 0]}
          >
            <span className="pp-map-marker" title={station.properties.id}>
              <Radio size={16} />
            </span>
          </Marker>
        )}
        {gps && (
          <Marker longitude={gps.lng} latitude={gps.lat}>
            <span className="pp-map-marker danger" title="GPS">
              <MapPin size={18} />
            </span>
          </Marker>
        )}
        <ScaleControl position="bottom-left" />
        <AttributionControl position="bottom-right" compact={false} />
      </Map>
    </div>
  );
}
