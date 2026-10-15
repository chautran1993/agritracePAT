import type {StyleSpecification,ExpressionSpecification} from 'maplibre-gl';
import {statuses,varieties,stages} from '../mock/generatePlots';
export type Theme='status'|'variety'|'stage';export type Base='satellite'|'street'|'terrain';
export const palettes={status:['#2E9E4F','#E0A526','#8A94A6'],variety:['#2E9E4F','#1F7A8C','#C98B2B'],stage:['#A8D99A','#70B86B','#388A48','#1F5130']};
export const categories={status:statuses,variety:varieties,stage:stages};
export const fields={status:'codeStatus',variety:'variety',stage:'stage'} as const;
export function colorExpression(theme:Theme):ExpressionSpecification{return ['match',['get',fields[theme]],...categories[theme].flatMap((s,i)=>[s,palettes[theme][i]]),'#8A94A6'] as unknown as ExpressionSpecification;}
export const detailOpacity:ExpressionSpecification=['interpolate',['linear'],['zoom'],13.8,0,14,1];
export function baseStyle(base:Base):StyleSpecification{
 const cartoKey=import.meta.env.VITE_CARTO_API_KEY;
 const tiles=base==='satellite'?['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']:base==='street'?(cartoKey?['a','b','c','d'].map(s=>`https://${s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(cartoKey)}`):['https://tile.openstreetmap.org/{z}/{x}/{y}.png']):['a','b','c'].map(s=>`https://${s}.tile.opentopomap.org/{z}/{x}/{y}.png`);
 return {version:8,glyphs:'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',sources:{basemap:{type:'raster',tiles,tileSize:256,maxzoom:base==='terrain'?17:19,attribution:base==='satellite'?'Tiles © Esri — Esri, Maxar, Earthstar Geographics, GIS User Community':base==='street'?(cartoKey?'© OpenStreetMap contributors © CARTO':'© OpenStreetMap contributors'):'© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)'}},layers:[{id:'base',type:'raster',source:'basemap'}]};
}
