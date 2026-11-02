const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const index=fs.readFileSync('index.html','utf8');
const line=name=>index.match(new RegExp('^function '+name+'\\([^\\n]+','m'))[0];
function fixture(outcome,rolls,kind='operation'){
 const heroes=['a','b'].map(id=>({id,name:id,rank:9,ready:false,equipment:{weapon:id+'-gear',offhand:id+'-gear',utility1:id+'-tool'}}));
 const gear=heroes.flatMap(h=>[{id:h.id+'-gear',durability:10,maxDurability:10},{id:h.id+'-tool',gatherTool:'Mining',durability:10,maxDurability:10}]);
 const report={outcome,rolls,kind,partyIds:['a','b'],casualties:[],dueAt:0,title:'Fixture',summary:'',growthAwards:[]};
 const ctx={console,game:{day:1,gold:0,reputation:0,pendingReports:[report],heroes,player:{id:'player'},gear},migratePendingReports(){},protectGuildmaster(){},tbwApplyReport(){},practiceStaffForReport(){},reportDeathAccounts(){},addLog(){},ensureHeroEquipment:h=>h.equipment,heroPerkFx:()=>[{wearMinus:99}],tbwWearSkip:()=>1};ctx.purse=id=>heroes.find(h=>h.id===id);ctx.window=ctx;vm.createContext(ctx);
 for(const fn of ['wearHeroEquipment','missionWearAmount','applyPendingReports'])vm.runInContext(line(fn),ctx);
 ctx.applyPendingReports();return {ctx,gear,report};
}
for(const kind of ['operation','trade']){
 for(const [outcome,rolls,expected] of [
 ['Success',[{id:'a',success:true},{id:'b',success:true}],[0,0]],
 ['Exceptional Success',[{id:'a',success:true},{id:'b',success:true}],[0,0]],
 ['Success',[{id:'a',success:false},{id:'b',success:true}],[1,0]],
 ['Partial Success',[{id:'a',success:false},{id:'b',success:true}],[1,0]],
 ['Failure',[{id:'a',success:false},{id:'b',success:true}],[2,1]],
 ['Success',[{id:'a',success:true,failedChecks:2},{id:'b',success:true,failedChecks:0}],[2,0]],
 ['Success',[],[0,0]],['Failure',[],[1,1]]]){
  const {ctx,gear}=fixture(outcome,rolls,kind);for(let i=0;i<2;i++){assert.equal(gear[i*2].durability,10-expected[i]);assert.equal(gear[i*2+1].durability,10-expected[i])}
  const before=JSON.stringify(gear);ctx.applyPendingReports();assert.equal(JSON.stringify(gear),before,'no duplicate wear on re-settlement');
 }
}
const ctx={V9_ENCOUNTERS:{Dungeon:[{dc:0},{dc:0}]},V9_GROUP_TUNE:{dcShift:0,kindShift:{},excShare:1},v9Role:()=> 'dps',v9RoleMod:()=>0,readiness:()=>0,v9Quota:()=>0,v9CritNeed:()=>1,v9EncRoll:()=>20};vm.createContext(ctx);const start=index.indexOf('function v9GroupResolve('),end=index.indexOf('\nconst _v9PerkTier',start);vm.runInContext(index.slice(start,end),ctx);const checks=[{id:'a',roll:1,modifier:0}];ctx.v9GroupResolve({kind:'Dungeon',ability:'str'},[{id:'a'}],checks,10);assert.equal(checks[0].failedChecks,1);assert.equal(checks[0].checkCount,2);assert.equal(checks[0].success,true);
console.log('PASS per-check wear, successful/partial/failed quests, convoy rules, gathering tools, unique equipped items, multi-encounter counts and single settlement');
