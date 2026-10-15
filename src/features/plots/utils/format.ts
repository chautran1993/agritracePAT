import type {Bilingual} from '../types';
export const text=(value:Bilingual,lang:string)=>value[lang==='vi'?'vi':'en'];
export const number=(value:number,lang:string,digits=1)=>new Intl.NumberFormat(lang==='vi'?'vi-VN':'en-US',{maximumFractionDigits:digits}).format(value);
export function date(value:string,lang:string){return new Date(`${value.slice(0,10)}T12:00:00+07:00`).toLocaleDateString(lang==='vi'?'vi-VN':'en-US',lang==='vi'?{day:'2-digit',month:'2-digit',year:'numeric'}:{month:'short',day:'numeric',year:'numeric'});}
export const dayDiff=(a:string,b:string)=>Math.floor((Date.parse(a.slice(0,10)+'T00:00:00Z')-Date.parse(b.slice(0,10)+'T00:00:00Z'))/86400000);
export const addDays=(value:string,days:number)=>new Date(Date.parse(value.slice(0,10)+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);
export const todaySaigon=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function download(name:string,data:string,type:string){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
