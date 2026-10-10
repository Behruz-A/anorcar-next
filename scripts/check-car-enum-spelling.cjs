const assert = require('assert/strict');
async function request(search={}) {
 const response=await fetch('http://localhost:3007/graphql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query($input:CarsInquiry!){getCars(input:$input){list{_id carTransmission carLocation}metaCounter{total}}}',variables:{input:{page:1,limit:100,sort:'createdAt',direction:'DESC',search}}}),signal:AbortSignal.timeout(15000)});
 return response.json();
}
(async()=>{
 const all=await request();assert.ok(!all.errors,JSON.stringify(all.errors));
 const list=all.data.getCars.list;assert.ok(list.length);assert.equal(list.length,all.data.getCars.metaCounter[0].total);
 assert.ok(list.every(car=>['AUTOMATIC','MANUAL'].includes(car.carTransmission)&&car.carLocation!=='DAEJON'));
 for(const [key,value,field] of [['transmissions','AUTOMATIC','carTransmission'],['locations','DAEJEON','carLocation']]){
  const filtered=await request({[key]:[value]});assert.ok(!filtered.errors,JSON.stringify(filtered.errors));
  assert.equal(filtered.data.getCars.metaCounter[0].total,list.filter(car=>car[field]===value).length);
  assert.ok(filtered.data.getCars.list.every(car=>car[field]===value));
 }
 for(const [key,value] of [['transmissions','AVTOMATIC'],['locations','DAEJON']])assert.ok((await request({[key]:[value]})).errors?.length,'Legacy GraphQL enum must be rejected');
 console.log('PASS: all '+list.length+' active cars serialize canonical enums; AUTOMATIC and DAEJEON filters match real inventory; old enum inputs are rejected.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
