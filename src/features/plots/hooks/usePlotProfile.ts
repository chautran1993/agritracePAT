import {useEffect,useState} from 'react';import {plotProfiles} from '../mock/plotProfiles';
export function usePlotProfile(pdi:string|undefined){const[loading,setLoading]=useState(true);useEffect(()=>{setLoading(true);const timer=setTimeout(()=>setLoading(false),400);return()=>clearTimeout(timer);},[pdi]);return{loading,plot:plotProfiles.find(p=>p.pdi===pdi||p.shortCode===pdi)};}
