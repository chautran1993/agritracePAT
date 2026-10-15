import {useRef,useState} from 'react';
import Map,{Source,Layer,Marker,Popup,AttributionControl,ScaleControl,type MapRef} from 'react-map-gl/maplibre';
import {setWorkerUrl} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {Radio,WifiOff,ArrowUpRight} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import * as turf from '@turf/turf';
import {mapData} from './mock/generatePlots';
import {useMapText} from './i18n';
import {baseStyle,colorExpression} from './layers/styles';
import 'maplibre-gl/dist/maplibre-gl.css';
import './iot-preview.css';
setWorkerUrl(workerUrl);
const style=baseStyle('satellite');
export default function IoTMapPreview(){
 const ref=useRef<MapRef>(null),{t,lang}=useMapText(),nav=useNavigate(),[selected,setSelected]=useState<number|null>(null);
 const station=selected===null?null:mapData.stations[selected];
 return <div className="iot-gis-preview"><Map ref={ref} initialViewState={{longitude:105.60,latitude:10.55,zoom:14}} mapStyle={style} attributionControl={false} scrollZoom={false} dragRotate={false} touchZoomRotate={false} onLoad={()=>{const b=turf.bbox(turf.featureCollection(mapData.stations));ref.current?.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:{left:70,right:70,top:65,bottom:65},duration:0,maxZoom:15});}}>
  <Source id="iot-preview-fields" type="geojson" data={mapData.plots}><Layer id="iot-preview-fill" type="fill" paint={{'fill-color':colorExpression('status'),'fill-opacity':.35}}/><Layer id="iot-preview-outline" type="line" paint={{'line-color':'white','line-width':1,'line-opacity':.75}}/></Source>
  <Source id="iot-preview-boundary" type="geojson" data={mapData.boundary}><Layer id="iot-preview-boundary-line" type="line" paint={{'line-color':'white','line-width':1.5,'line-dasharray':[4,3]}}/></Source>
  {mapData.stations.map((s,i)=><Marker key={s.properties.id} longitude={s.geometry.coordinates[0]} latitude={s.geometry.coordinates[1]}><button className={`iot-gis-station ${s.properties.online?'':'offline'}`} aria-label={`${s.properties.id} · ${s.properties.online?t.online:t.offline}`} onClick={e=>{e.stopPropagation();setSelected(i);}}><span className="iot-gis-icon">{s.properties.online?<Radio size={17}/>:<WifiOff size={17}/>}<i/></span><b>{s.properties.id}</b></button></Marker>)}
  {station&&<Popup longitude={station.geometry.coordinates[0]} latitude={station.geometry.coordinates[1]} anchor="bottom" offset={35} onClose={()=>setSelected(null)}><strong>{station.properties.id}</strong><p style={{color:station.properties.online?'#1F5130':'#D64545',fontSize:11,marginTop:5}}>{station.properties.online?t.online:t.offline}</p><small>{station.geometry.coordinates[1].toFixed(5)}° N · {station.geometry.coordinates[0].toFixed(5)}° E</small></Popup>}
  <ScaleControl position="bottom-right"/><AttributionControl position="bottom-right" compact={false}/>
 </Map><div className="iot-gis-legend"><span><i style={{background:'#4CAF50'}}/>{t.online} · 2</span><span><i style={{background:'#D64545'}}/>{t.offline} · 1</span></div><button className="iot-gis-open" onClick={()=>nav('/map')}>{lang==='vi'?'Mở bản đồ':'Open map'}<ArrowUpRight size={13}/></button></div>;
}
