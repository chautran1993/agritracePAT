import {lazy,Suspense} from 'react';
const MapView=lazy(()=>import('../map/MapView'));
export default function MapPage(){return <Suspense fallback={<div className="h-[calc(100vh-136px)] animate-pulse rounded-xl bg-rice-100"/>}><MapView/></Suspense>;}
