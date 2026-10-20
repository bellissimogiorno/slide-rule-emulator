/** Optional numerical regression audit; no runtime dependencies.
 * Usage: node tools/compare_mappings.mjs --reference REFERENCE_REPOSITORY > REPORT_JSON
 * The reference must be an extracted compatible source repository. Current
 * source is resolved relative to this script, independently of the working dir.
 * Compares IEEE-754 results exactly (including NaN, infinities and signed zero),
 * generated ticks in both graduation/precision modes, and cache/error contracts.
 * Custom edge probes deliberately also exercise the low-level mapping factory
 * beyond public validation; they are diagnostics, not accepted programme examples.
 * This proves equality only for these samples, not arbitrary formulas or browser
 * painting; mathematical correctness requires independent identity/quadrature checks.
 */
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--reference') {
 console.error('Usage: node tools/compare_mappings.mjs --reference REFERENCE_REPOSITORY');
 process.exit(2);
}
const base = resolve(args[1]);
const work = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const get = (root, file) => import(pathToFileURL(`${root}/src/${file}`));
const [old, current, catalog, oldTicks, currentTicks] = await Promise.all([
 get(base, 'core/mappings.js'), get(work, 'core/mappings.js'),get(base, 'catalog/scales.js'),
 get(base, 'core/ticks/index.js'), get(work, 'core/ticks/index.js')]);
const custom = [
 {type:'log',min:.01,max:300,pMin:.1,pMax:.9},
 {type:'inverseLog',min:1e-200,max:1e200},
 {type:'loglog',min:1.001,max:20}, {type:'loglog',min:.1,max:.9},
 {type:'expression',pos:'log10(x)',value:'10^p'},
 ...['linear','sqrt','inverse','power'].map(relation=>({type:'tempDerived',relation,coeff:2,power:0})),
 ...[null,0,Infinity,NaN,Number.MIN_VALUE,1e308].flatMap(fold=>['foldedLog','foldedInverse'].map(type=>({type,fold}))),
 ...[-3,0,2].flatMap(decade=>[-1,1].flatMap(sign=>['loglog','loglog10'].map(type=>({type,decade,sign})))),
 ...['e','10','invalid'].map(logBase=>({type:'syncroLogLog',decade:-1,logBase})),
 {type:'tanh',max:3,pMin:.2,pMax:.8}, {type:'bbCurve',curve:'energySpectral',u0:.01,pMin:.2,pMax:.8}
];
const scalar = Object.values(catalog.BUILTIN_SCALES).filter(d=>!['composite','segmented','rootStack'].includes(d.type));
let comparisons=0,tickSets=0;
for (const d of [...scalar,...custom]) {
 const a=old.createRuntimeScale(d),b=current.createRuntimeScale(d);
 assert.deepEqual(Object.keys(b),Object.keys(a),`${d.id||d.type} keys`);
 for(const key of ['pMin','pMax']) assert.ok(Object.is(a[key],b[key]),`${d.id||d.type} ${key}`);
 const points = [-Infinity, NaN, -1, -0, Number.MIN_VALUE,0,1e-14,.5,1,2,Infinity];
 for (let i=0;i<=256;i++) points.push(a.pMin+(a.pMax-a.pMin)*i/256);
 for(const p of points) {
  const av=a.value(p),bv=b.value(p);
  assert.ok(Object.is(av,bv),`${d.id||d.type} value ${p}: ${av},${bv}`);
  assert.ok(Object.is(a.pos(av),b.pos(bv)),`${d.id||d.type} round trip ${p}`);
  assert.ok(Object.is(a.pos(p),b.pos(p)),`${d.id||d.type} raw pos ${p}`);
  comparisons+=3;
 }
 if (d.id) for(const graduationMode of ['conventional','adaptive']) for(const fullPrecision of [false,true]) {
  const options={graduationMode,fullPrecision};
  assert.deepEqual(currentTicks.generateTicks(d,b,1000,1.65,options),oldTicks.generateTicks(d,a,1000,1.65,options),`${d.id} ticks ${JSON.stringify(options)}`);
  tickSets++;
 }
}
for(const d of [{type:'constructor'}, {type:'misspelled'}, {type:'loglog10'}, {type:'syncroLogLog'}]) {
 let a,b;try{old.createRuntimeScale(d)}catch(e){a=e.message}try{current.createRuntimeScale(d)}catch(e){b=e.message}assert.equal(b,a);
}
for(const module of [old,current]) {
 const d={type:'log',min:1,max:10};
 assert.notEqual(module.makeRuntimeScale(d),module.makeRuntimeScale(d));
 d.max=100;assert.equal(module.makeRuntimeScale(d).value(1),100);
 Object.freeze(d);assert.equal(module.makeRuntimeScale(d),module.makeRuntimeScale(d));
 assert.throws(()=>module.makeRuntimeScale(null),TypeError);
}
const report = JSON.stringify({passed:true,scalarBuiltins:scalar.length,customDefinitions:custom.length,exactNumericComparisons:comparisons,exactTickSets:tickSets,cacheAndErrorChecks:'passed'}, null, 2) + '\n';
process.stdout.write(report);
