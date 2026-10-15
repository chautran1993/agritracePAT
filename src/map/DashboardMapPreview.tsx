import {useEffect,useMemo,useRef} from 'react';
import Map,{Source,Layer,ScaleControl,AttributionControl,type MapRef} from 'react-map-gl/maplibre';
import {setWorkerUrl} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import * as turf from '@turf/turf';
import {useNavigate} from 'react-router-dom';
import {mapData,statuses} from './mock/generatePlots';
import {baseStyle,colorExpression,palettes} from './layers/styles';
import {useMapText,categoryLabel} from './i18n';
import 'maplibre-gl/dist/maplibre-gl.css';
import './dashboard-preview.css';
setWorkerUrl(workerUrl);
const style=baseStyle('satellite');
export default function DashboardMapPreview({zone,variety}:{zone:string;variety:string}){
 const ref=useRef<MapRef>(null),nav=useNavigate(),{t,lang}=useMapText();
 const plots=useMemo(()=>turf.featureCollection(mapData.plots.features.filter(p=>(zone==='all'||p.properties.zoneId===zone)&&(variety==='all'||p.properties.variety===variety))),[zone,variety]);
 const bounds=useMemo(()=>{const b=turf.bbox(plots.features.length?plots:mapData.boundary);return [[b[0],b[1]],[b[2],b[3]]] as [[number,number],[number,number]];},[plots]);
 useEffect(()=>{ref.current?.fitBounds(bounds,{padding:{left:150,right:30,top:25,bottom:40},duration:600,maxZoom:15});},[bounds]);
 return <div className="dashboard-gis-preview">
  <Map ref={ref} initialViewState={{longitude:105.60,latitude:10.55,zoom:14}} mapStyle={style} attributionControl={false} scrollZoom={false} dragRotate={false} touchZoomRotate={false} doubleClickZoom={false} cursor="pointer" onClick={()=>nav('/map')} onLoad={()=>ref.current?.fitBounds(bounds,{padding:{left:150,right:30,top:25,bottom:40},duration:0,maxZoom:15})}>
   <Source id="dashboard-fields" type="geojson" data={plots}>
    <Layer id="dashboard-field-fill" type="fill" paint={{'fill-color':colorExpression('status'),'fill-opacity':.6}}/>
    <Layer id="dashboard-field-outline" type="line" paint={{'line-color':'#FFFFFF','line-width':1.2,'line-opacity':.9}}/>
   </Source>
   <Source id="dashboard-boundary" type="geojson" data={mapData.boundary}>
    <Layer id="dashboard-boundary-halo" type="line" paint={{'line-color':'#12341F','line-width':4,'line-opacity':.7}}/>
    <Layer id="dashboard-boundary-line" type="line" paint={{'line-color':'#FFFFFF','line-width':1.5,'line-dasharray':[4,3]}}/>
   </Source>
   <ScaleControl position="bottom-right"/><AttributionControl position="bottom-right" compact={false}/>
  </Map>
  <div className="dashboard-gis-legend"><strong>{t.status}</strong>{statuses.map((s,i)=><div key={s}><span style={{background:palettes.status[i]}}/>{categoryLabel(s,lang)}</div>)}</div>
  <div className="dashboard-gis-summary">{plots.features.length} {t.plotUnit} · {plots.features.reduce((sum,p)=>sum+p.properties.areaHa,0).toFixed(1)} ha<span>{t.mock}</span></div>
  <button className="dashboard-gis-open" onClick={()=>nav('/map')}>{lang==='vi'?'Khám phá bản đồ':'Explore map'} ↗</button>
 </div>;
}
