const assert = require('assert/strict');
const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText, filename);
const { CompareSelection, parseCompareSlots, replaceCompareCar } = require('../libs/compareSelection.ts');
const { createCompareCarLoader, COMPARE_CAR_CACHE } = require('../libs/hooks/useCompareSelection.ts');
const { InMemoryCache } = require('@apollo/client');
const { formatCarPrice } = require('../libs/carCompare.ts');
const ids = ['0123456789abcdef01234567','1123456789abcdef01234567','2123456789abcdef01234567'];
const car = (id, extra = {}) => ({ __typename:'Car', _id:id, carStatus:'ACTIVE', carFuelType:'GASOLINE', carCondition:'USED',
 carModel:'Test car', carYear:2024, carMileage:0, carLocation:'SEOUL', carAddress:'Seoul', carTransmission:'AUTOMATIC',
 carTitle:'Test car', carPrice:25900, carColor:'White', carViews:0, carLikes:0, carComments:0, carRank:0,
 carImages:[], brandId:ids[2], carDesc:null, carBarter:false, carRent:false, memberId:ids[2],
 soldAt:null, deletedAt:null, createdAt:'2026-10-09', updatedAt:'2026-10-09',
 brandData:null, memberData:null, meLiked:null, ...extra });
const deferred = () => { let resolve,reject; const promise = new Promise((yes,no) => {resolve=yes;reject=no;}); return {promise,resolve,reject}; };
const tick = () => new Promise(resolve => setTimeout(resolve,0));
async function main() {
 assert.deepEqual(parseCompareSlots([ids[0],ids[0].toUpperCase(),ids[1]]), [ids[0],null,ids[1]]);
 assert.deepEqual(parseCompareSlots('invalid'), [null,null,null]);
 assert.equal(formatCarPrice(25900,'en'), '$25,900');
 const original=[car(ids[0]),null,null];
 assert.equal(replaceCompareCar(original,car(ids[1],{carStatus:'SOLD'}),0),original);
 assert.equal(replaceCompareCar(original,car(ids[0]),1),original);
 assert.equal(replaceCompareCar(original,car(ids[1]),4),original);
 for (const action of ['select','remove','clear','cancel']) {
  const task=deferred(); const state=new CompareSelection(() => task.promise);
  state.restore([ids[0],null,null]); await tick();
  assert.equal(state.getSnapshot().pending[0],true);
  if(action==='select') assert.equal(state.select(car(ids[1]),0),true);
  else if(action==='remove') state.remove(0);
  else state[action]();
  const before=state.getSnapshot();
  task.resolve(car(ids[0])); await tick();
  assert.equal(state.getSnapshot(),before, action+' must invalidate older restoration');
 }
 const task=deferred(); let requests=0;
 const strict=new CompareSelection(() => {requests++;return task.promise;});
 strict.restore([ids[0],null,null]); strict.cancel(); strict.restore([ids[0],null,null]);
 await tick(); assert.equal(requests,1,'Strict Mode replay deduplicates pending IDs');
 task.resolve(car(ids[0])); await tick(); assert.equal(strict.getSnapshot().slots[0]._id,ids[0]);
 const two=[deferred(),deferred()];
 const reordered=new CompareSelection(id => two[ids.indexOf(id)].promise);
 reordered.restore([ids[0],ids[1],null]);
 two[1].resolve(car(ids[1])); await tick(); reordered.select(car(ids[2]),0);
 two[0].resolve(car(ids[0])); await tick();
 assert.deepEqual(reordered.getSnapshot().ids,[ids[2],ids[1],null]);
 const failed=new CompareSelection(async()=>{throw new Error('offline');});
 failed.restore([ids[0],null,null]); await tick();
 assert.equal(failed.getSnapshot().ids[0],ids[0]); assert.equal(failed.getSnapshot().errors[0],true);
 const missing=new CompareSelection(async()=>{throw {graphQLErrors:[{message:'No data found!'}]};});
 missing.restore([ids[0],null,null]); await tick();
 assert.equal(missing.getSnapshot().ids[0],null); assert.equal(missing.getSnapshot().unavailable,true);
 const sold=new CompareSelection(async()=>car(ids[0],{carStatus:'SOLD'}));
 sold.restore([ids[0],null,null]); await tick(); assert.equal(sold.getSnapshot().ids[0],null);
 let attempt=0;
 const retry=new CompareSelection(async()=>{ if(++attempt===1) throw new Error('offline'); return car(ids[0]); });
 retry.restore([ids[0],null,null]); await tick(); retry.retry(0); await tick();
 assert.equal(retry.getSnapshot().slots[0]._id,ids[0]);
 const replacement=new CompareSelection(async()=>car(ids[0]));
 replacement.restore([]); replacement.select(car(ids[0]),0);
 const unchanged=replacement.getSnapshot();
 assert.equal(replacement.select(car(ids[1],{carStatus:'DELETE'}),0),false);
 assert.equal(replacement.getSnapshot(),unchanged,'Failed replacement is atomic');
 assert.equal(replacement.select(car(ids[1]),0),true);
 assert.equal(replacement.getSnapshot().slots[0]._id,ids[1]);
 const cache=new InMemoryCache();
 cache.writeFragment({id:'Car:'+ids[0],fragment:COMPARE_CAR_CACHE,data:car(ids[0])});
 let network=0; const pending=deferred();
 const client={cache,readFragment:options=>cache.readFragment(options),query:()=>{network++;return pending.promise;}};
 const load=createCompareCarLoader(client);
 assert.equal((await load(ids[0]))._id,ids[0]); assert.equal(network,0,'Complete cache restoration avoids GET_CAR');
 const first=load(ids[1]); const second=createCompareCarLoader(client)(ids[1]);
 assert.equal(network,1,'Concurrent loaders share one uncached GET_CAR');
 pending.resolve({data:{getCar:car(ids[1])}}); await Promise.all([first,second]);
 console.log('Restoration tests passed: generations/revisions, clear/remove/replace/unmount races, Strict Mode deduplication, out-of-order responses, failures/retry, unavailable cars, cache reuse and unchanged USD.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
