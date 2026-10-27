/* Proposed balance model, not loaded by the game. Run with node to verify bounds. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'balance.js'),'utf8'),context);
const live=context.window.WL_BALANCE;
const jobs={warehouse:'Organisation',staffOffice:'Organisation',workshop:'Craftsmanship',kitchen:'Craftsmanship',infirmary:'Care',armory:'Craftsmanship',trainingHall:'Care',warRoom:'Organisation',huntersLodge:'Fieldcraft',commandPost:'Organisation',cartographersOffice:'Fieldcraft',waystation:'Fieldcraft'};
const traits=['None','Meticulous','Resourceful','Industrious','Studious','Specialist','Adaptable','Cautious','Daring','Loyal','Ambitious'];
const candidateWage=(scores,trait)=>2+(scores.includes(5)?1:0)+(['Industrious','Ambitious'].includes(trait)?1:0);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function model(job,building,skill,aptitude,trait,streak=28,highest=skill){
  let fit=(aptitude-1)*.03;
  if(trait==='Studious')fit*=.75;
  if(trait==='Specialist'&&skill>0&&skill===highest)fit+=.04;
  if(trait==='Ambitious'&&building>=4)fit+=.04;
  if(trait==='Loyal')fit+=Math.min(.04,.01*Math.floor(streak/7));
  fit=Math.min(.16,fit);
  const support=clamp(live.supportBonus(skill)+(trait==='Cautious'?1:trait==='Daring'?-1:0),0,4);
  const quality=clamp(skill*.03+fit*.5+(trait==='Meticulous'?.06:trait==='Resourceful'?-.03:0),0,.4);
  const costs=trait==='Meticulous'?1.05:trait==='Resourceful'?.95:1;
  const discount=clamp(skill*.025*(1+fit)+(trait==='Resourceful'?.03:0),0,.3125);
  const r={job,building,skill,aptitude,trait,fit,support};
  if(job==='warehouse')Object.assign(r,{sale:clamp(skill*.03*(1+fit)+(trait==='Daring'?.04:trait==='Cautious'?-.03:0),0,.35),dangerCut:support+(building===5?1:0)});
  if(job==='workshop')Object.assign(r,{quality,materialDiscount:Math.min(.45,1-(1-discount)*(building===5?.8:1)),costs,extra:live.craftExtra(skill),buildingBonus:building>=4?2:building>=2?1:0,durability:(building>=5?20:building>=3?10:0)+(trait==='Industrious'?5:0)});
  if(job==='kitchen'){
    const count=building;
    Object.assign(r,{rations:count,maxRations:6,extraRationChance:Math.min(.3,fit+Math.floor(skill/4)*.05+(trait==='Industrious'?.15:0)),rationBonus:building>=2&&skill>=3?2:1,costs});
  }
  if(job==='infirmary')Object.assign(r,{costFactor:Math.max(.5,(building>=4?.75:1)*(1-Math.min(.2,live.supportBonus(skill)*.05*(1+fit)))*costs)});
  if(job==='trainingHall')Object.assign(r,{costFactor:Math.max(.3,.75*[0,1,.9,.8,.7,.6][building]*(1-Math.min(.2,live.supportBonus(skill)*.05*(1+fit)))*costs),durationCut:building>=5?2:building>=3?1:0});
  if(job==='armory')Object.assign(r,{repairUnit:Math.max(1,(5*[0,.7,.6,.5,.45,.4][building]-.5*live.supportBonus(skill))*(1-fit*.5)*costs)});
  if(job==='staffOffice')Object.assign(r,{preparationProc:fit,wageCut:building>=3?1:0,officeDC:building===5?1:0});
  if(['warRoom','huntersLodge','commandPost'].includes(job))Object.assign(r,{lootModifier:clamp(live.supportBonus(skill)*.05+(building>=5?.1:building>=2?.05:0)+fit+(trait==='Daring'?.03:trait==='Cautious'?-.03:0),0,.35),payout:building>=4?1.1:1,buildingDC:building>=3?1:0});
  if(job==='cartographersOffice')Object.assign(r,{partialDiscovery:Math.min(.5,.35+.03*(building-1)+fit),unlocksExploration:true});
  if(job==='waystation')Object.assign(r,{timeCut:Math.min(.8,live.questTimeCut(skill,building)+fit/3)});
  return r;
}
function practiceDays(points,trait,office=false,catchingUp=false){
  let earned=0,credit=0,days=0;
  while(earned<points){days++;credit+=100+(office?25:0)+(trait==='Studious'?20:trait==='Adaptable'&&catchingUp?25:0);earned+=Math.floor(credit/100)+1;credit%=100}
  return days;
}
function provision(current,incoming,ready=true){
  const next=Math.min(2,Math.max(0,incoming));
  return !ready||next<=current?{bonus:current,consumed:0}:{bonus:next,consumed:1};
}
function check(){
  let cases=0;
  for(const job of Object.keys(jobs))for(let building=1;building<=5;building++)for(let skill=0;skill<=10;skill++)for(let aptitude=1;aptitude<=5;aptitude++)for(const trait of traits){
    const r=model(job,building,skill,aptitude,trait);
    assert.ok(r.fit>=0&&r.fit<=.160000001);assert.ok(r.support<=4);
    if(job==='warehouse')assert.ok(r.sale<=.35&&r.dangerCut<=5);
    if(job==='waystation'){assert.ok(r.timeCut<=.8);if(building===5)assert.equal(r.timeCut,.8)}
    if(job==='workshop'){assert.ok(r.materialDiscount<=.45&&r.quality<=.4&&r.extra<=2);for(const base of [1,2,3,4])assert.ok(Math.min(6,base+r.buildingBonus+r.extra)<=6)}
    if(job==='kitchen')assert.ok(r.rations>=1&&r.rations<=5&&r.rations+1<=r.maxRations&&r.rationBonus<=2&&r.extraRationChance<=.3);
    if(r.costFactor!==undefined)assert.ok(r.costFactor>0);
    if(job==='armory')assert.ok(r.repairUnit>=1);
    if(r.lootModifier!==undefined)assert.ok(r.lootModifier<=.35&&Math.min(.95,.65+r.lootModifier)<=.95);
    if(job==='cartographersOffice')assert.ok(r.partialDiscovery<=.5);
    // No trait makes an upgrade or an additional skill level worse at a fixed context.
    if(building<5){const next=model(job,building+1,skill,aptitude,trait);if(r.sale!==undefined)assert.ok(next.sale>=r.sale);if(r.timeCut!==undefined)assert.ok(next.timeCut>=r.timeCut);if(r.costFactor!==undefined)assert.ok(next.costFactor<=r.costFactor+1e-9)}
    if(skill<10){const next=model(job,building,skill+1,aptitude,trait);
      for(const key of ['sale','support','quality','materialDiscount','rations','rationBonus','lootModifier','timeCut'])if(r[key]!==undefined)assert.ok(next[key]+1e-9>=r[key],`Skill regression: ${job} ${trait} ${key}`);
      if(r.costFactor!==undefined)assert.ok(next.costFactor<=r.costFactor+1e-9);
      if(r.repairUnit!==undefined)assert.ok(next.repairUnit<=r.repairUnit+1e-9);
    }
    cases++;
  }
  let trades=0;
  for(const rate of [1,1.05,1.15,1.3,1.35,1.45,1.55,1.6,1.75,1.8,1.9,2.05,2.2,2.35])for(const base of [1,2,3,4,5,7,8,10,12,14,18,22,24,30,35])for(const building of [1,4,5])for(let count=1;count<=30;count++){
    const paid=live.marketPrice(base,rate)*count,gross=Math.floor(base*count*rate*1.35*(building===5?1.1:building===4?1.05:1));
    const cut=Math.min(gross,Math.max(Math.floor(gross*.2),2));assert.ok(gross-cut<=paid,'Same-market arbitrage');trades++;
  }
  for(let count=0;count<100;count++)assert.equal(provision(2,2).consumed,0,'No ration stacking or wasted charges');
  assert.equal(provision(1,2).bonus,2);assert.equal(provision(2,1).consumed,0);assert.equal(provision(0,2,false).consumed,0);
  for(let level=1;level<=5;level++)assert.equal(model('kitchen',level,0,1,'None').rations,level);
  const vectors=[];
  for(let a=1;a<=5;a++)for(let b=1;b<=5;b++)for(let c=1;c<=5;c++)for(let d=1;d<=5;d++)if(a+b+c+d===12)vectors.push([a,b,c,d]);
  for(const scores of vectors)for(const trait of traits){const wage=candidateWage(scores,trait);assert.ok(wage>=2&&wage<=4)}
  assert.ok(vectors.length);assert.ok(vectors.every(v=>!v.every(n=>n===5)));
  assert.ok(model('workshop',2,4,3,'Loyal',28).fit>model('workshop',2,4,3,'Loyal',0).fit);
  const cheap=model('warehouse',5,10,4,'None'),promising=model('warehouse',5,10,5,'None');
  const extraPerCargoGP=(promising.sale-cheap.sale)*1.1*.8;
  assert.ok(extraPerCargoGP*100<1&&extraPerCargoGP*200>1,'Wage premium should depend on service volume');
  const experience=[];
  for(const job of ['warehouse','workshop','kitchen','staffOffice','waystation'])experience.push({job,veteran:model(job,2,6,2,'None'),beginner:model(job,2,0,5,'None')});
  assert.ok(experience[0].veteran.sale>experience[0].beginner.sale);
  assert.ok(experience[1].veteran.quality>experience[1].beginner.quality);
  assert.ok(experience[2].veteran.rationBonus>experience[2].beginner.rationBonus);
  assert.ok(experience[3].veteran.support>experience[3].beginner.support);
  assert.ok(experience[4].veteran.timeCut>experience[4].beginner.timeCut);
  return {status:'passed',staffScenarios:cases,tradeScenarios:trades,aptitudeVectors:vectors.length,warehousePremiumBreakEvenCargoGP:Math.ceil(1/extraPerCargoGP),masteryDays:{normal:practiceDays(275,'None'),studious:practiceDays(275,'Studious'),withOffice:practiceDays(275,'None',true),studiousWithOffice:practiceDays(275,'Studious',true),catchUpWithOffice:practiceDays(275,'Adaptable',true,true)},experience};
}
if(require.main===module)console.log(JSON.stringify(check(),null,2));
module.exports={jobs,traits,model,candidateWage,practiceDays,provision,check};
