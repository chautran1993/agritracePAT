import {householdForPlot} from '../../data/owners';
import * as turf from '@turf/turf';
import type {Feature,Polygon,MultiPolygon} from 'geojson';
export const statuses=['Đã cấp mã','Đang đăng ký','Chưa đăng ký'];
export const varieties=['OM5451','ST25','Đài Thơm 8'];
export const stages=['Gieo sạ','Đẻ nhánh','Làm đòng – Trổ','Chín – Thu hoạch'];
export type PlotProps={id:string;pdi:string;owner:string;areaHa:number;variety:string;stage:string;codeStatus:string;zoneId:string};
export type Plot=Feature<Polygon,PlotProps>;
const ll=([x,y]:number[])=>[105.60+x/109450,10.55+y/111320];
export function generatePlots(seed=660412){
 let state=seed;const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
 const boundary=turf.polygon([[[-1500,-950],[-1250,-1230],[-400,-1190],[650,-1080],[1460,-690],[1380,120],[1510,860],[800,1220],[-180,1130],[-1420,780],[-1500,-950]].map(ll)]);
 const paths=[[-850,-620,1250],[-160,-1190,1300],[650,-1220,1120]].map(([y,start,end],index)=>turf.lineString(Array.from({length:17},(_,i)=>{const x=start+(end-start)*i/16;return ll([x,y+Math.sin(x/650+index)*42+x*.13]);}),{id:`canal-${index}`}));
 const plots:Plot[]=[];
 for(let strip=0;strip<6&&plots.length<50;strip++){
  const canal=paths[Math.floor(strip/2)],side=strip%2===0?1:-1,total=turf.length(canal,{units:'meters'});let along=180; const target=plots.length+(strip<2?9:8);
  while(along<total-160&&plots.length<target){
   const width=56+random()*24,length=200+random()*130,gap=5+random();
   const anchor=turf.along(canal,along/1000),next=turf.along(canal,(along+width)/1000),bearing=turf.bearing(anchor,next),center=turf.midpoint(anchor,next);
   const local=(x:number,y:number)=>turf.destination(turf.destination(center,x/1000,bearing),y/1000,bearing+90).geometry.coordinates;
   const jitter=()=>(random()<.5?-1:1)*(2+random()*4);
   const far=18+length,vertices=[[-width/2+8,side*18],[width/2-8,side*18],[width/2-8,side*far],[-width/2+8,side*far]];
   if(random()<.35)vertices.splice(3,0,[0,side*(far+2)]);
   const ring=vertices.map(([x,y])=>local(x+jitter(),y+jitter()));ring.push(ring[0]);
   const candidate=turf.polygon([ring]),ha=turf.area(candidate)/10000;
   if(ha>=.5&&ha<=3&&turf.booleanWithin(candidate,boundary)&&!plots.some(p=>turf.booleanOverlap(p,candidate)||turf.booleanIntersects(p,candidate))){
    const i=plots.length,id=`T${String(i+1).padStart(3,'0')}`;
    plots.push({...candidate,properties:{id,pdi:`VN-66-04-12-HTX01-${id}`,owner:householdForPlot(id).name,areaHa:ha,variety:id==='T015'?'OM5451':varieties[i%3],stage:stages[i%4],codeStatus:statuses[i<21?0:i<39?1:2],zoneId:`VT00${1+Math.min(3,Math.floor(i/13))}`}});
   }along+=width+gap;
  }
 }
 if(plots.length!==50)throw new Error(`Expected 50 plots, generated ${plots.length}`);
 const zones=Array.from({length:4},(_,i)=>{
  const id=`VT00${i+1}`,members=plots.filter(p=>p.properties.zoneId===id),merged=turf.union(turf.featureCollection(members))!;
  const shape=turf.simplify(turf.buffer(merged,15,{units:'meters'})!,{tolerance:.000025,highQuality:true});
  return {...shape,properties:{id,name:String.fromCharCode(65+i),areaHa:members.reduce((s,p)=>s+p.properties.areaHa,0)}} as Feature<Polygon|MultiPolygon,{id:string;name:string;areaHa:number}>;
 });
 const stations=[20,33,46].map((i,n)=>({...turf.point(turf.centerOfMass(plots[i]).geometry.coordinates),properties:{id:`IoT-0${n+1}`,online:n!==1}}));
 const alerts=[12,31,46].map((i,n)=>({...turf.point(turf.centerOfMass(plots[i]).geometry.coordinates),properties:{id:`AL-0${n+1}`}}));
 return {boundary,canals:turf.featureCollection(paths),plots:turf.featureCollection(plots),zones:turf.featureCollection(zones),stations,alerts};
}
export const mapData=generatePlots();
