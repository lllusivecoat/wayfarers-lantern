const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),source=fs.readFileSync(path.join(root,'beta/gear-care.js'),'utf8'),index=fs.readFileSync(path.join(root,'beta/index.html'),'utf8');
function setup(){
 const recipes=[{id:'greatsword-0',category:'weapon',hands:2,requirements:{'Copper Ore':4,Leather:2}},{id:'sword-0',category:'weapon',hands:1,requirements:{'Copper Ore':4,Leather:2}}];
 const player={id:'player',name:'Kael',gold:10000,ready:true,perks:[],equipment:{weapon:'two',offhand:'two',armor:'armor',cape:'cape'}};
 const other={id:'other',name:'Nyla',gold:777,ready:true,equipment:{weapon:'other-gear'}};
 const gear=[{id:'two',name:'Two hander',kind:'Weapon',family:'greatsword',signatureKey:'greatsword',hands:2,tier:0,bonus:1,owner:'player',heroOwner:'player',durability:5,maxDurability:25,madeByPlayer:true,enhancement:0,enhancementVersion:2},{id:'armor',name:'Worn armor',kind:'Armor',tier:7,owner:'player',heroOwner:'player',durability:0,maxDurability:100},{id:'cape',name:'Worn cape',kind:'Cape',tier:7,owner:'player',heroOwner:'player',durability:0,maxDurability:100},{id:'spare',name:'Owned spare',kind:'Weapon',family:'sword',signatureKey:'sword',hands:1,tier:0,bonus:1,owner:'player',heroOwner:'player',durability:10,maxDurability:25,madeByPlayer:true,enhancement:0,enhancementVersion:2},{id:'other-gear',name:'Other sword',kind:'Weapon',owner:'other',durability:1,maxDurability:20}];
 const armorer={id:'smith-armory',buildingUid:'armory',buildingKey:'armory',professionXP:{Armoring:29},aptitudes:{Craftsmanship:1},personality:null,skillAwards:{},name:'Armorer'};
 const smith={id:'smith-workshop',buildingUid:'workshop',buildingKey:'workshop',professionXP:{Blacksmithing:4},aptitudes:{Craftsmanship:1},personality:null,skillAwards:{},name:'Smith'};
 const ctx={console,structuredClone,game:{player,heroes:[other],gear,day:1,gold:500,materials:{'Copper Ore':1000,Leather:1000},gearMaterialCredits:{'["Copper Ore",4]':.95},staffMembers:[armorer,smith],workshopLevel:5,armoryLevel:1},renderCalls:0,saveCalls:0,logCalls:0,alertCalls:0,randomCalls:0,render(){ctx.renderCalls++},save(){ctx.saveCalls++},addLog(){ctx.logCalls++},alert(){ctx.alertCalls++},renderGearCatalog:()=>recipes,rawRequirements:item=>item.requirements,handMultiplier:item=>item.hands===2?2:1,gearGroup:g=>String(g?.kind||'').toLowerCase(),gearIsTwoHanded:g=>g?.hands===2,gearReadinessBonus:g=>Number(g?.bonus)||0,projectForBuilding:()=>null,hasActiveQuestFor:id=>!!ctx.game.pending?.includes(id),blacksmithTierProgression:()=>({unlock:0}),heroPerkFx:()=>[],buildingLevel:key=>key==='armory'?ctx.game.armoryLevel:ctx.game.workshopLevel,buildingStaff:key=>ctx.game.staffMembers.find(st=>st.buildingKey===key),buildingOperational:key=>!!ctx.buildingStaff(key)&&ctx.buildingLevel(key)>0,staffMigrate:()=>{ctx.Math.random()},assigned:st=>!!st.buildingUid};
 ctx.window=ctx;ctx.purse=id=>[ctx.game.player,...ctx.game.heroes].find(h=>h.id===id);ctx.v9Ops=key=>ctx.buildingOperational(key)?[{uid:key,key,level:ctx.buildingLevel(key)}]:[];vm.createContext(ctx);vm.runInContext('Math.random=()=>{randomCalls++;return .123};window.Math=Math',ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'staff-aptitudes.js'),'utf8'),ctx);
 ctx.staffProfessionLevel=st=>ctx.WL_STAFF.level(st?.professionXP?.Blacksmithing||0);
 for(const name of ['perkRepairCost','v9RepairUnit','gearRepairCost','repairGear']){const line=index.match(new RegExp('^function '+name+'\\([^\\n]+','m'));assert(line,name);vm.runInContext(line[0],ctx)}
 const staff=fs.readFileSync(path.join(root,'staff-system.js'),'utf8');const award=staff.slice(staff.indexOf('  function award('),staff.indexOf('  const oldDay=',staff.indexOf('  function award(')));
 vm.runInContext('const skills=WL_STAFF.skills;\n'+award,ctx);
 const gearSystem=fs.readFileSync(path.join(root,'gear-system.js'),'utf8'),a=gearSystem.indexOf('  window.gearMaterialQuote=function'),b=gearSystem.indexOf('  function requirements(',a);vm.runInContext(gearSystem.slice(a,b),ctx);
 const enhancements=fs.readFileSync(path.join(root,'gear-enhancement.js'),'utf8');vm.runInContext(enhancements.slice(0,enhancements.indexOf(" let selected='';"))+'})();',ctx);
 const core={repair:ctx.repairGear,enhance:ctx.enhanceGear,repairCost:ctx.gearRepairCost,enhanceQuote:ctx.gearEnhancementQuote,render:ctx.render,save:ctx.save,addLog:ctx.addLog,alert:ctx.alert,random:ctx.Math.random};
 vm.runInContext(source,ctx);return {ctx,api:ctx.WL_BETA_GEAR_CARE,core};
}
{
 const {ctx,api,core}=setup(),game=ctx.game,snapshot=JSON.stringify(game),gear=game.gear[0],plan=api.quotePlan('repair','player');
 assert.equal(ctx.game,game);assert.equal(ctx.game.gear[0],gear);assert.equal(JSON.stringify(game),snapshot);assert.equal(ctx.renderCalls,0);assert.equal(ctx.saveCalls,0);assert.equal(ctx.logCalls,0);assert.equal(ctx.alertCalls,0);assert.equal(ctx.randomCalls,0);
 for(const [key,value]of Object.entries({repairGear:core.repair,enhanceGear:core.enhance,gearRepairCost:core.repairCost,gearEnhancementQuote:core.enhanceQuote,render:core.render,save:core.save,addLog:core.addLog,alert:core.alert}))assert.equal(ctx[key],value,key);assert.equal(ctx.Math.random,core.random);
 assert.equal(plan.ids.filter(x=>x==='two').length,1);assert(!plan.ids.includes('spare'));assert(!plan.ids.includes('other-gear'));assert(!plan.reason);const wallet=game.player.gold,otherGold=game.heroes[0].gold,guildGold=game.gold;
 const result=api.perform('repair','player');assert(result.ok);assert.equal(result.completed,3);assert.equal(wallet-game.player.gold,plan.gold);assert.equal(game.heroes[0].gold,otherGold);assert.equal(game.gold,guildGold);assert.equal(game.gear.find(g=>g.id==='spare').durability,10);assert.equal(ctx.saveCalls,3);assert.equal(ctx.alertCalls,0);
 assert.equal(plan.steps[1].gold,ctx.gearRepairCost({...game.gear.find(g=>g.id==='armor'),durability:0}));
 console.log('PASS core repair quotes/actions unchanged, preview has no live/RNG/save side effects, exact Armory-practice batch total, two-hand deduplication and hero/equipped scope');
}
{
 const {ctx,api}=setup();ctx.game.player.gold=1;const before=JSON.stringify(ctx.game);let result=api.perform('repair','player');assert(!result.ok);assert.match(result.reason,/personal purse/);assert.equal(JSON.stringify(ctx.game),before);assert.equal(ctx.alertCalls,0);result=api.perform('repair','player','equipped','other-gear');assert(!result.ok);assert.equal(JSON.stringify(ctx.game),before);
 ctx.game.player.gold=1000;const spare=ctx.game.gear.find(g=>g.id==='spare');const q=ctx.gearRepairCost(spare);result=api.perform('repair','player','owned','spare');assert(result.ok);assert.equal(ctx.game.player.gold,1000-q);assert.equal(spare.durability,spare.maxDurability);
 console.log('PASS inline insufficient-purse result without alerts/spending, wrong-hero rejection and owned batch scope');
}
{
 const {ctx,api,core}=setup();ctx.game.player.equipment.armor='spare';ctx.game.gear.find(g=>g.id==='spare').kind='Weapon';const before=JSON.stringify(ctx.game),wallet=ctx.game.player.gold,guild=ctx.game.gold,materials={...ctx.game.materials};const plan=api.quotePlan('enhance','player');
 assert(!plan.reason,plan.reason);assert.equal(plan.ids.length,2);assert.equal(JSON.stringify(ctx.game),before);assert.equal(ctx.randomCalls,0);assert.equal(ctx.enhanceGear,core.enhance);const flat=ctx.game.gear.filter(g=>plan.ids.includes(g.id)).map(g=>[g.id,g.bonus,g.maxDurability,g.durability]);
 const result=api.perform('enhance','player');assert(result.ok,result.reason);assert.equal(result.completed,2);assert.equal(wallet-ctx.game.player.gold,plan.gold);assert.equal(ctx.game.gold-guild,plan.gold);for(const [key,n]of Object.entries(plan.materials))assert.equal(materials[key]-ctx.game.materials[key],n,key);
 for(const [id,bonus,max,dur]of flat){const g=ctx.game.gear.find(g=>g.id===id);assert.equal(g.enhancement,1);assert.equal(g.bonus,bonus);assert.equal(g.maxDurability,max);assert.equal(g.durability,dur)}assert.equal(ctx.game.heroes[0].gold,777);assert.equal(ctx.alertCalls,0);
 console.log('PASS exact core enhancement gold/material/credit totals through staff progression, one stage per item, two-hand deduplication, personal-to-guild payment and unchanged flat stats/durability');
}
{
 const {ctx,api}=setup();ctx.game.materials={};const before=JSON.stringify(ctx.game);let result=api.perform('enhance','player');assert(!result.ok);assert.match(result.reason,/materials/);assert.equal(JSON.stringify(ctx.game),before);assert.equal(ctx.alertCalls,0);
 ctx.game.materials={'Copper Ore':1000,Leather:1000};ctx.game.player.ready=false;const q=api.enhancementQuote('two','player');assert.match(q.reason,/return/);result=api.perform('enhance','player');assert(!result.ok);assert.equal(ctx.saveCalls,0);
 ctx.game.player.ready=true;ctx.game.player.gold=0;const poor=JSON.stringify(ctx.game);result=api.perform('enhance','player');assert(!result.ok);assert.match(result.reason,/personal purse/);assert.equal(JSON.stringify(ctx.game),poor);assert.equal(ctx.alertCalls,0);
 ctx.game.player.gold=1000;ctx.game.workshopLevel=1;assert.match(api.quotePlan('enhance','player').reason,/Workshop Level 2/);assert.equal(ctx.saveCalls,0);
 console.log('PASS material/purse/away/Workshop affordance failures stay inline with no partial spending or alert-only failures');
}
