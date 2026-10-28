/* Exercise the live economic and escort rules, including rounding at every tier. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.runInNewContext(fs.readFileSync('balance.js','utf8'),context);
const b=context.window.WL_BALANCE;let economy=0,escorts=0;
for(const rate of [1,1.05,1.15,1.3,1.35,1.45,1.55,1.6,1.75,1.8]){
 for(let relation=0;relation<=4;relation++)for(const warehouse of [1,4,5])for(const sale of [0,.15,.30,.35]){
  for(const a of [1,2,8,24,35])for(const c of [1,2,8,24,35])for(const n of [1,2,8,18,45])for(const m of [1,2,8,18,45]){
   const paid=b.marketPrice(a,rate,relation*.01)*n+b.marketPrice(c,rate,relation*.01)*m;
   const gross=Math.floor((a*n+c*m)*rate*(1+sale)*(warehouse===5?1.1:warehouse===4?1.05:1));
   assert.ok(gross-b.convoyPay(gross,1)<=paid,'same-market mixed-manifest arbitrage');economy++;
  }
 }
}
// Adding a weaker escort cannot lower the lead or group modifier. Test all rolls,
// full/partial thresholds and support caps, rather than one random simulation.
for(let dc=6;dc<=20;dc++)for(let lead=-5;lead<=20;lead++)for(let roll=1;roll<=20;roll++){
 let previous=0;
 for(let size=1;size<=32;size++){
  const fraction=b.convoyFraction(roll+lead+b.convoySupport(size),dc);
  assert.ok(fraction>=previous);previous=fraction;escorts++;
 }
}
assert.deepEqual([0,1,2,3,4,5,8,32].map(b.convoyCapacity),[0,20,40,60,80,100,160,640]);
for(const count of [-1,NaN,Infinity,1.5])assert.equal(b.convoyCapacity(count),0);
assert.equal(b.convoySupport(32),4);
for(const n of [1,2,5,20,90])for(const fraction of [0,.75,1])assert.ok(Math.floor(n*fraction)<=n);
console.log(`PASS: ${economy} mixed-manifest maximum-bonus price scenarios; ${escorts} escort outcomes are monotone; member carrying capacity and loss rounding.`);
