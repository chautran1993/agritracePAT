import {useSearchParams} from 'react-router-dom';
import {useState,useMemo,useRef,useEffect} from 'react';
import Map,{Source,Layer,Marker,Popup,ScaleControl,AttributionControl,type MapRef,type MapLayerMouseEvent} from 'react-map-gl/maplibre';
import * as turf from '@turf/turf';import {Satellite,Map as MapIcon,Mountain,Plus,Minus,LocateFixed,Leaf,Radio,Copy} from 'lucide-react';
import type {Feature,Polygon,Position} from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';import './map.css';
import {setWorkerUrl} from 'maplibre-gl';
import MapWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
setWorkerUrl(MapWorker);
import {mapData,type Plot} from './mock/generatePlots';import {useMapText} from './i18n';
import {baseStyle,colorExpression,type Theme,type Base} from './layers/styles';
import LayerPanel,{type LayerSettings} from './components/LayerPanel';import Legend from './components/Legend';import KpiStrip from './components/KpiStrip';import PlotDrawer from './components/PlotDrawer';import MapToolbar,{type Tool} from './components/MapToolbar';
const initialLayers:LayerSettings={boundary:{show:true,opacity:100},zones:{show:true,opacity:80},plots:{show:true,opacity:100},iot:{show:true,opacity:100},alerts:{show:true,opacity:100}};
export default function MapView(){
 const[searchParams]=useSearchParams();const focused=mapData.plots.features.find(p=>p.properties.pdi===searchParams.get('focus'));const[loaded,setLoaded]=useState(false);
 const{t,lang}=useMapText(),ref=useRef<MapRef>(null),container=useRef<HTMLDivElement>(null);
 const[base,setBase]=useState<Base>('satellite'),[theme,setTheme]=useState<Theme>('status'),[layers,setLayers]=useState(initialLayers),[query,setQuery]=useState('');
 const[zoom,setZoom]=useState(14),[selected,setSelected]=useState<Plot|null>(null),[hover,setHover]=useState<{plot:Plot;lng:number;lat:number}|null>(null),[cursor,setCursor]=useState([105.60,10.55]);
 const[tool,setToolState]=useState<Tool>(null),[points,setPoints]=useState<Position[]>([]),[finished,setFinished]=useState(false),[region,setRegion]=useState<Feature<Polygon>|null>(null),[coordinate,setCoordinate]=useState<Position|null>(null),[copied,setCopied]=useState(false),[threeD,setThreeD]=useState(false),[error,setError]=useState(false);
 const style=useMemo(()=>baseStyle(base),[base]);
 const filtered=useMemo(()=>mapData.plots.features.filter(p=>`${p.properties.id} ${p.properties.pdi} ${p.properties.zoneId} ${p.properties.owner}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())&&(!region||turf.booleanPointInPolygon(turf.centerOfMass(p),region))),[query,region]);
 const visible=useMemo(()=>turf.featureCollection(filtered),[filtered]);const centers=useMemo(()=>turf.featureCollection(filtered.map(p=>turf.point(turf.centerOfMass(p).geometry.coordinates,{...p.properties,label:`${p.properties.id}\n${p.properties.areaHa.toFixed(1)} ha`}))),[filtered]);
 const zones=useMemo(()=>turf.featureCollection(mapData.zones.features.filter(z=>filtered.some(p=>p.properties.zoneId===z.properties.id))),[filtered]);
 const selectedCollection=useMemo(()=>turf.featureCollection(selected&&filtered.includes(selected)?[selected]:[]),[selected,filtered]);
 const drawing=useMemo(()=>turf.featureCollection<Polygon | import('geojson').LineString>(points.length>=3&&tool!=='length'?[turf.polygon([[...points,points[0]]])]:points.length>=2?[turf.lineString(points)]:[]),[points,tool]);
 const result=points.length>=2&&tool==='length'?`${(turf.length(turf.lineString(points))*1000).toFixed(1)} m`:points.length>=3?`${(turf.area(turf.polygon([[...points,points[0]]]))/10000).toFixed(2)} ha`:'';
 const fit=(feature:Feature,drawer=false)=>{const b=turf.bbox(feature),width=container.current?.clientWidth||1100;ref.current?.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:{left:Math.min(285,width*.25),right:drawer?Math.min(416,width*.42):80,top:155,bottom:170},duration:900,maxZoom:18});};
 const choose=(plot:Plot)=>{setSelected(plot);setHover(null);fit(plot,true);};
 const setTool=(next:Tool)=>{setToolState(next);setPoints([]);setFinished(false);setCoordinate(null);setCopied(false);setHover(null);if(next==='searchArea')setRegion(null);};
 useEffect(()=>{const handle=(e:KeyboardEvent)=>{if(e.key==='Escape'){setSelected(null);setTool(null);}};window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);},[]);
 useEffect(()=>{if(selected&&!filtered.includes(selected))setSelected(null);},[filtered,selected]);
 useEffect(()=>{if(loaded&&focused)choose(focused);},[loaded,focused]);
 const click=(e:MapLayerMouseEvent)=>{if(tool==='coord'){setCoordinate([e.lngLat.lng,e.lngLat.lat]);setCopied(false);return;}if(tool&&!finished){setPoints(p=>[...p,[e.lngLat.lng,e.lngLat.lat]]);return;}if(tool)return;const id=e.features?.[0]?.properties?.id,plot=filtered.find(p=>p.properties.id===id);if(plot)choose(plot);};
 const finish=()=>{if(tool==='length'?points.length<2:points.length<3)return;setFinished(true);if(tool==='searchArea')setRegion(turf.polygon([[...points,points[0]]]));};
 const plotOpacity=layers.plots.opacity/100*(base==='satellite'?.55:.7);
 const counts={boundary:1,zones:zones.features.length,plots:filtered.length,iot:mapData.stations.length,alerts:mapData.alerts.length};
 return <div ref={container} className="gis-map">
  <Map ref={ref} initialViewState={{longitude:105.60,latitude:10.55,zoom:14}} mapStyle={style} attributionControl={false} interactiveLayerIds={layers.plots.show?['plot-fill']:[]} cursor={tool?'crosshair':hover?'pointer':'grab'} onLoad={()=>{setLoaded(true);if(focused)choose(focused);else fit(mapData.boundary);}} onMove={e=>setZoom(e.viewState.zoom)} onClick={click} doubleClickZoom={!tool} onError={e=>{console.error(e.error);setError(true);}} onIdle={()=>setError(false)} onMouseLeave={()=>setHover(null)} onMouseMove={e=>{setCursor([e.lngLat.lng,e.lngLat.lat]);if(tool)return;const plot=filtered.find(p=>p.properties.id===e.features?.[0]?.properties?.id);setHover(plot?{plot,lng:e.lngLat.lng,lat:e.lngLat.lat}:null);}}>
   <Source id="zones" type="geojson" data={zones}>
    <Layer id="zone-fill" type="fill" layout={{visibility:layers.zones.show?'visible':'none'}} paint={{'fill-color':'#4CAF50','fill-opacity':['interpolate',['linear'],['zoom'],13.8,.2*layers.zones.opacity/100,14,0]}}/>
    <Layer id="zone-border" type="line" layout={{visibility:layers.zones.show?'visible':'none'}} paint={{'line-color':'#4CAF50','line-width':2,'line-opacity':['interpolate',['linear'],['zoom'],13.8,.9*layers.zones.opacity/100,14,.2*layers.zones.opacity/100]}}/>
   </Source>
   <Source id="plots" type="geojson" data={visible}>
    <Layer id="plot-fill" type="fill" layout={{visibility:layers.plots.show?'visible':'none'}} paint={{'fill-color':colorExpression(theme),'fill-opacity':['interpolate',['linear'],['zoom'],13.8,0,14,plotOpacity],'fill-opacity-transition':{duration:250}}}/>
    <Layer id="plot-outline" type="line" layout={{visibility:layers.plots.show?'visible':'none'}} paint={{'line-color':'#FFFFFF','line-width':1.5,'line-opacity':['interpolate',['linear'],['zoom'],13.8,0,14,.9*layers.plots.opacity/100]}}/>
    <Layer id="plot-extrusion" type="fill-extrusion" layout={{visibility:threeD&&layers.plots.show?'visible':'none'}} minzoom={14} paint={{'fill-extrusion-color':colorExpression(theme),'fill-extrusion-height':['*',['get','areaHa'],12],'fill-extrusion-opacity':plotOpacity}}/>
   </Source>
   <Source id="hover" type="geojson" data={turf.featureCollection(hover?[hover.plot]:[])}>
    <Layer id="hover-fill" type="fill" minzoom={14} paint={{'fill-color':colorExpression(theme),'fill-opacity':Math.min(1,plotOpacity+.2)}}/>
    <Layer id="hover-outline" type="line" minzoom={14} paint={{'line-color':'white','line-width':2.5}}/>
   </Source>
   <Source id="selection" type="geojson" data={selectedCollection}>
    <Layer id="selection-glow" type="line" paint={{'line-color':'#1F5130','line-width':6,'line-blur':4}}/>
    <Layer id="selection-outline" type="line" paint={{'line-color':'#FFFFFF','line-width':3}}/>
   </Source>
   <Source id="canals" type="geojson" data={mapData.canals}><Layer id="canals-line" type="line" layout={{'line-cap':'round','line-join':'round'}} paint={{'line-color':'#4FA3D9','line-width':['interpolate',['linear'],['zoom'],12,3,18,6],'line-opacity':.8}}/></Source>
   <Source id="boundary" type="geojson" data={mapData.boundary}>
    <Layer id="boundary-halo" type="line" layout={{visibility:layers.boundary.show?'visible':'none'}} paint={{'line-color':'#12341F','line-width':5,'line-opacity':layers.boundary.opacity/100*.8}}/>
    <Layer id="boundary-dash" type="line" layout={{visibility:layers.boundary.show?'visible':'none'}} paint={{'line-color':'white','line-width':2,'line-dasharray':[4,3],'line-opacity':layers.boundary.opacity/100}}/>
   </Source>
   <Source id="labels" type="geojson" data={centers}><Layer id="plot-label" type="symbol" minzoom={16} layout={{visibility:layers.plots.show?'visible':'none','text-field':['get','label'],'text-font':['Open Sans Semibold'],'text-size':11,'text-allow-overlap':false,'text-padding':4}} paint={{'text-color':'white','text-halo-color':'#183a28','text-halo-width':2}}/></Source>
   <Source id="drawing" type="geojson" data={drawing}>
    <Layer id="draw-fill" type="fill" filter={['==',['geometry-type'],'Polygon']} paint={{'fill-color':'#E0A526','fill-opacity':.18}}/>
    <Layer id="draw-line" type="line" paint={{'line-color':'#E0A526','line-width':3,'line-dasharray':[2,1]}}/>
   </Source>
   {points.map((p,i)=><Marker key={i} longitude={p[0]} latitude={p[1]}><span style={{display:'block',width:9,height:9,borderRadius:9,background:'#E0A526',border:'2px solid white'}}/></Marker>)}
   {zoom<14&&layers.zones.show&&zones.features.map(z=>{const c=turf.centerOfMass(z).geometry.coordinates,area=filtered.filter(p=>p.properties.zoneId===z.properties.id).reduce((s,p)=>s+p.properties.areaHa,0),color=area>300?'#1F5130':area>=100?'#4CAF50':'#E0A526';return <Marker key={z.properties.id} longitude={c[0]} latitude={c[1]} style={{opacity:layers.zones.opacity/100}}><button className="gis-zone-marker" onClick={()=>fit(z)}><span className="gis-zone-pin" style={{background:color}}><Leaf size={18}/></span><span className="gis-zone-chip">{z.properties.id} · {t.zoneName} {z.properties.name}<b>{area.toFixed(1)} ha</b></span></button></Marker>;})}
   {layers.iot.show&&mapData.stations.map(s=><Marker key={s.properties.id} longitude={s.geometry.coordinates[0]} latitude={s.geometry.coordinates[1]} style={{opacity:layers.iot.opacity/100}}><div title={`${s.properties.id} · ${s.properties.online?t.online:t.offline}`} className="gis-station"><Radio size={16}/><span className={`gis-dot ${s.properties.online?'':'offline'}`}/></div></Marker>)}
   {layers.alerts.show&&mapData.alerts.map(s=><Marker key={s.properties.id} longitude={s.geometry.coordinates[0]} latitude={s.geometry.coordinates[1]} style={{opacity:layers.alerts.opacity/100}}><div title={`${t.alert} · ${s.properties.id}`} className="gis-alert">!</div></Marker>)}
   {hover&&zoom>=14&&!selected&&<Popup longitude={hover.lng} latitude={hover.lat} closeButton={false} offset={12} className="gis-hover"><strong>{hover.plot.properties.pdi}</strong><small>{hover.plot.properties.owner} · {hover.plot.properties.areaHa.toFixed(2)} ha</small></Popup>}
   {coordinate&&<Popup longitude={coordinate[0]} latitude={coordinate[1]} onClose={()=>setCoordinate(null)}><div>{coordinate[1].toFixed(6)}, {coordinate[0].toFixed(6)}</div><button style={{display:'flex',gap:5,marginTop:8}} onClick={async()=>{try{await navigator.clipboard.writeText(`${coordinate[1].toFixed(6)}, ${coordinate[0].toFixed(6)}`);setCopied(true);}catch{setCopied(false);}}}><Copy size={13}/>{copied?t.copied:t.copy}</button></Popup>}
   <ScaleControl position="bottom-left" unit="metric"/><AttributionControl position="bottom-right" compact={false}/>
  </Map>
  <div className="gis-glass gis-base">{([['satellite',Satellite,'sat'],['street',MapIcon,'street'],['terrain',Mountain,'terrain']] as const).map(([key,Icon,label])=><button key={key} className={base===key?'active':''} onClick={()=>{setBase(key);setError(false);}}><Icon size={15}/><span>{t[label]}</span></button>)}</div>
  <MapToolbar tool={tool} setTool={setTool}/><LayerPanel layers={layers} setLayers={setLayers} theme={theme} setTheme={setTheme} query={query} setQuery={setQuery} counts={counts}/>
  <Legend theme={theme} plots={filtered} overview={zoom<14}/><PlotDrawer plot={selected} onClose={()=>setSelected(null)} onFly={()=>selected&&fit(selected,true)}/><KpiStrip plots={filtered}/>
  {tool&&tool!=='coord'&&<div className="gis-glass gis-tool-result"><p>{tool==='searchArea'?t.areaHint:t.hint}</p><strong>{result}</strong><div style={{marginTop:8}}><button disabled={finished||(tool==='length'?points.length<2:points.length<3)} onClick={finish}>{t.finish}</button><button onClick={()=>{setPoints([]);setFinished(false);setRegion(null);}}>{t.clear}</button><button onClick={()=>setTool(null)}>{t.close}</button></div></div>}
  {error&&<div role="status" className="gis-glass gis-error">{t.error}</div>}
  <div className="gis-glass gis-navigation"><button title="Zoom +" onClick={()=>ref.current?.zoomIn()}><Plus size={16}/></button><button title="Zoom −" onClick={()=>ref.current?.zoomOut()}><Minus size={16}/></button><button title={t.locate} onClick={()=>fit(mapData.boundary,!!selected)}><LocateFixed size={16}/></button>{[false,true].map(v=><button key={String(v)} className={threeD===v?'active':''} onClick={()=>{setThreeD(v);ref.current?.easeTo({pitch:v?50:0,duration:700});}}>{v?'3D':'2D'}</button>)}</div>
  <div className="gis-cursor">{cursor[1].toFixed(5)}° N · {cursor[0].toFixed(5)}° E</div><div className="gis-caption">{t.mock}{!filtered.length?` · ${t.empty}`:''} · {lang.toUpperCase()}</div>
 </div>;
}
