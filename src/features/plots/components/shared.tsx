import type {ReactNode} from 'react';import {FileSearch,Tractor,Sprout,Droplets,FlaskConical,ShieldAlert,Recycle,Wheat} from 'lucide-react';import type {Group} from '../types';
export const groupIcons={LAM_DAT:Tractor,GIEO_SA:Sprout,NUOC_AWD:Droplets,PHAN_BON:FlaskConical,BVTV:ShieldAlert,ROM_RA:Recycle,THU_HOACH:Wheat};
export function GroupIcon({group}:{group:Group}){const Icon=groupIcons[group];return <Icon size={17}/>;}
export function Card({title,children,id,className=''}:{title?:string;children:ReactNode;id?:string;className?:string}){return <section id={id} className={`pp-card ${className}`}>{title&&<h3>{title}</h3>}{children}</section>;}
export function Chip({children,tone='green'}:{children:ReactNode;tone?:string}){return <span className={`pp-chip ${tone}`}>{children}</span>;}
export function Empty({children}:{children:ReactNode}){return <div className="pp-empty"><FileSearch size={28}/><p>{children}</p></div>;}
export function Ring({score,label}:{score:number;label:string}){return <div className="pp-ring-wrap"><div className="pp-ring" style={{background:`conic-gradient(#2E9E4F ${score*3.6}deg,#e9efea 0deg)`}}><b>{score}</b></div><small>{label}</small></div>;}
