/* Run: node tests/balance-model.cjs. Exhaustive bounds, not a playtest simulation. */
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const context={window:{}};
vm.runInNewContext(readFileSync(new URL('../balance.js',`file://${__filename}`),'utf8'),context);
const b=context.window.WL_BALANCE;
let cases=0;
// Even with two perfect journeys, no buying and reselling at the same market
// can print treasury gold. Include integer rounding, escort cuts and warehouse perks.
for(const rate of [1,1.05,1.15,1.3,1.35,1.45,1.55,1.6,1.75,1.8,1.9,2.05,2.2,2.35]){
  for(let level=0;level<=10;level++)for(const building of [1,4,5]){
    for(const base of [1,2,3,4,5,7,8,10,12,14,18,22,24,30,35]){
      for(let count=1;count<=18;count++){
        const paid=b.marketPrice(base,rate)*count;
        const gross=Math.floor(base*count*rate*(1+level*b.salePerLevel)*(building===5?1.1:building===4?1.05:1));
        const cut=Math.min(gross,Math.max(Math.floor(gross*.2),2));
        assert.ok(gross-cut<=paid,`local arbitrage: ${rate}, ${level}, ${base}, ${count}`);
        cases++;
      }
    }
  }
}
// A mixed manifest must retain the same no-profit bound at a single market,
// even when one escort fee is shared across cargo types.
let mixedCases=0;
for(const rate of [1,1.15,1.45,1.8,2.2])for(const level of [0,3,6,10])for(const building of [1,4,5]){
  for(const a of [1,2,8,18])for(const c of [1,2,8,18])for(const n of [1,2,8,18])for(const m of [1,2,8,18]){
    const paid=b.marketPrice(a,rate)*n+b.marketPrice(c,rate)*m;
    const gross=Math.floor((a*n+c*m)*rate*(1+level*b.salePerLevel)*(building===5?1.1:building===4?1.05:1));
    const cut=Math.min(gross,Math.max(Math.floor(gross*.2),2));
    assert.ok(gross-cut<=paid,'same-market mixed-cargo arbitrage');mixedCases++;
  }
}
for(const kind of ['Gathering','Exploration','World Dungeon','World Boss','World Raid'])for(let rank=0;rank<=9;rank++)for(let party=1;party<=40;party++){
  const cost=b.expeditionCost(kind,rank,party);
  assert.ok(Number.isSafeInteger(cost)&&cost>0);
  if(rank<9)assert.equal(b.expeditionCost(kind,rank+1,party),cost+2);
  assert.equal(b.expeditionCost(kind,rank,party+1),cost+1);
}
assert.equal(b.expeditionCost('Gathering',0,1),3);
assert.equal(b.expeditionCost('Exploration',0,2),6);
console.log(`PASS: ${mixedCases} mixed-cargo economy scenarios and permanent-expedition fee bounds.`);
for(let level=0;level<=10;level++){
  for(let building=1;building<=5;building++){
    assert.ok(b.questTimeCut(level,building)>=.1&&b.questTimeCut(level,building)<=.8);
    assert.equal(b.questTimeCut(level,5),.8);
  }
  assert.ok(b.supportBonus(level)<=3);
  assert.ok(level*b.craftChancePerLevel<=.3);
  assert.ok(level*b.materialPerLevel<=.25);
  assert.ok(b.craftExtra(level)<=2);
  for(let building=1;building<=5;building++){
    assert.ok(b.rationCount(building,level)<=5);
    assert.ok(b.rationCount(building,level)>=1);
    assert.ok(b.rationBonus(level)<=2);
  }
}
// Trading between distant markets can still pay; account for the 20% escort share.
const buy=b.marketPrice(8,1.05)*12;
const gross=Math.floor(8*12*1.8*1.3*1.1);
const cut=Math.max(Math.floor(gross*.2),2);
assert.ok(gross-cut>buy);
console.log(`PASS: ${cases} same-market economy scenarios; kitchen, crafting and support bounds.`);
console.log(`Example: buy 12 goods (base 8 gp) in Ratchet for ${buy} gp; master sale in Stormwind yields ${gross-cut} gp treasury on full success (${gross-cut-buy} gp before upkeep and journey risk).`);
