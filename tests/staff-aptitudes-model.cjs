/* Verify the same formulas used by the browser, including economic hard caps. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);
vm.runInContext(fs.readFileSync('balance.js','utf8'),context);context.WL_BALANCE=context.window.WL_BALANCE;
vm.runInContext(fs.readFileSync('staff-aptitudes.js','utf8'),context);
const m=context.window.WL_STAFF,b=context.WL_BALANCE;
assert.equal(m.combos.length,85);assert.equal(Object.keys(m.traits).length,10);
let rolls=0,cases=0,trades=0;
for(let i=0;i<85;i++)for(let j=0;j<10;j++){
 const values=[(i+.1)/85,(j+.1)/10],p=m.roll(()=>values.shift());
 assert.equal(Object.values(p.aptitudes).reduce((n,x)=>n+x,0),12);
 assert.ok(Object.values(p.aptitudes).every(x=>x>=1&&x<=5));assert.ok(Object.hasOwn(m.traits,p.personality));
 assert.equal(p.wage,2+(Object.values(p.aptitudes).includes(5)?1:0)+(['Industrious','Ambitious'].includes(p.personality)?1:0));rolls++;
}
for(const key of Object.keys(m.jobs))for(let building=1;building<=5;building++)for(let skill=0;skill<=10;skill++)for(let score=1;score<=5;score++)for(const trait of [null,...Object.keys(m.traits)]){
 const scores={Organisation:3,Craftsmanship:3,Care:3,Fieldcraft:3};scores[m.jobs[key]]=score;
 const r=m.evaluate(key,building,skill,scores,trait,28,10);assert.ok(r.fit>=0&&r.fit<=.16);assert.ok(r.support>=0&&r.support<=4);
 if(key==='warehouse')assert.ok(r.sale>=0&&r.sale<=.35);
 if(key==='workshop'){assert.ok(r.materialDiscount<=.45&&r.quality<=.4);assert.ok(r.buildingBonus<=2&&r.durability<=25);assert.ok(r.extra<=2)}
 if(key==='alchemyLab')assert.ok(r.materialDiscount<=.25&&r.goldFactor>=.95&&r.goldFactor<=1.05);
 if(key==='kitchen')assert.ok(r.extraRationChance<=.3);
 if(key==='infirmary')assert.ok(r.treatmentFactor>=.5);
 if(key==='armory')assert.ok(r.repairUnit>=1);
 if(key==='cartographersOffice')assert.ok(r.partialDiscovery<=.5);
 if(key==='waystation'){assert.ok(r.timeCut<=.8);if(building===5)assert.equal(r.timeCut,.8)}
 if(r.loot!==undefined)assert.ok(r.loot<=.35);
 if(skill<10){const n=m.evaluate(key,building,skill+1,scores,trait,28,10);for(const k of ['sale','quality','materialDiscount','extraRationChance','partialDiscovery','timeCut','loot'])if(r[k]!==undefined)assert.ok(n[k]+1e-9>=r[k],key+' '+trait+' '+k);for(const k of ['repairUnit','treatmentFactor','trainerFactor'])if(r[k]!==undefined)assert.ok(n[k]<=r[k]+1e-9)}
 cases++;
}
for(const rate of [1,1.05,1.15,1.3,1.45,1.8,2.2])for(const base of [1,2,3,8,12,24,35])for(let count=1;count<=30;count++)for(const building of [1,4,5]){
 const bought=b.marketPrice(base,rate)*count,gross=Math.floor(base*count*rate*1.35*(building===5?1.1:building===4?1.05:1)),cut=Math.min(gross,Math.max(Math.floor(gross*.2),2));
 assert.ok(gross-cut<=bought,'same-market arbitrage');trades++;
}
console.log(`PASS: ${rolls} candidate profiles, ${cases} live skill/aptitude/trait combinations, ${trades} maximum-bonus trade scenarios.`);
