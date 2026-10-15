import assert from 'node:assert/strict';
import * as turf from '@turf/turf';
import {generatePlots} from './generatePlots';
const a=generatePlots(),b=generatePlots();
assert.deepEqual(a,b,'Geometry must be deterministic');
assert.equal(a.plots.features.length,50);assert.equal(a.zones.features.length,4);
for(const [i,p] of a.plots.features.entries()){
 assert(turf.booleanWithin(p,a.boundary),`${p.properties.id} outside boundary`);
 assert(p.properties.areaHa>=.5&&p.properties.areaHa<=3);
 assert.equal(p.properties.areaHa,turf.area(p)/10000);
 for(const q of a.plots.features.slice(i+1))assert(!turf.booleanOverlap(p,q)&&!turf.booleanIntersects(p,q),`${p.properties.id} intersects ${q.properties.id}`);
}
for(const p of [...a.stations,...a.alerts])assert(a.plots.features.some(plot=>turf.booleanPointInPolygon(p,plot)));
console.log('PASS: 50 stable plots, 4 zones, no intersections, all within boundary, computed areas, 6 markers inside plots.');
