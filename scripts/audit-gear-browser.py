"""Read-only deterministic audit of live formulas and staged encounter resolution."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import json
import argparse
args=argparse.ArgumentParser();args.add_argument("--output",default="GEAR_BALANCE_AUDIT.json");options=args.parse_args()
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
root=Path(__file__).resolve().parent.parent
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
  result=page.evaluate('''() => {
   let seed=20261030;Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
   game.hall=7;game.reputation=10000;game.pendingReports=[];game.storySession=null;
   const liveReadiness=readiness;
   const profiles=[['Basic',0,0],['Basic enhanced',0,4],['Superior',3,0],['Superior enhanced',3,4],['Relic enhanced',5,4],['Legendary enhanced',6,4],['Heritage enhanced',7,4]];
   const output={thresholds:[],costs:[],slots:[],runs:[],trials:1500,seed:20261030};
   const unlock=[0,2,3,4,5,6,7,8];for(let tier=0;tier<8;tier++)output.thresholds.push({tier,unlock:unlock[tier],qualityAtUnlock:blacksmithQualityBonus(tier,unlock[tier]),firstPlusOne:Math.max(1,2*tier-5)});
   for(const r of [0,3,7]){const rows=renderGearCatalog(),dagger=rows.find(g=>g.id==='rogue-assassination-'+r),sword=rows.find(g=>g.id==='death-knight-frost-'+r),two=rows.find(g=>g.id==='warrior-arms-'+r);output.costs.push({tier:r,dagger:dagger.requirements,sword:sword.requirements,twohand:two.requirements,rawQuantityPair:2*Object.values(dagger.requirements).reduce((a,b)=>a+b,0),rawQuantityTwohand:Object.values(two.requirements).reduce((a,b)=>a+b,0)})}
   const makeParty=(n,tanks,healers,tier,enh,ability,supplies)=>{
    game.gear=[];game.heroes=[];
    for(let i=0;i<n;i++){const cls=i<tanks?'Warrior':i<tanks+healers?'Priest':'Warrior',spec=i<tanks?'Protection':i<tanks+healers?'Holy':'Arms';
     const pattern=WL_SPEC_WEAPONS.forHero({className:cls,spec}),stat=pattern.stat;const h={id:'audit-'+i,name:'Audit '+i,className:cls,spec,rank:9,level:20,heroXPVersion:1,growth:0,abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},equipment:{},ready:true,dead:false,perks:[],pendingPerks:[],perkCd:{},traits:[],traitProgress:{},preparedBonus:supplies,preparedSupplyBonuses:{ration:supplies/2,potion:supplies/2,legacy:0}};h.abilities[stat.toLowerCase()]=ability;
     const add=(slot,kind,family,s,hands)=>{const g={id:'audit-gear-'+game.gear.length,name:'Audit gear',kind,family,stat:s,hands,tier,enhancement:enh,enhancementVersion:2,bonus:[1,1,2,2,3,3,4,4][tier],owner:h.id,durability:100,maxDurability:100,madeByPlayer:true};if(kind==='Weapon')g.signatureKey=pattern.key;game.gear.push(g);h.equipment[slot]=g.id;return g};
     h.gear=add('weapon','Weapon',pattern.family,stat,pattern.hands).id;
     if(pattern.offhand==='shield')add('offhand','Offhand','shield',stat,1);
     add('armor','Armor',cls==='Priest'?'cloth':'plate',cls==='Priest'?'INT':'STR');add('cape','Cape','cape','WIS');for(let k=1;k<=3;k++)add('amulet'+k,'Ring','ring',stat);
     game.heroes.push(h);
    }return game.heroes;
   };
   // Isolate slot marginal value at the complete Heritage +4 loadout.
   let party=makeParty(8,1,1,7,4,20,4),h=party[0],baseline=WL_GEAR_EFFECTS.forHero(h);for(const slot of ['weapon','offhand','armor','cape','amulet1','amulet2','amulet3']){const id=h.equipment[slot],g=game.gear.find(g=>g.id===id),level=g.enhancement;g.enhancement=0;const fx=WL_GEAR_EFFECTS.forHero(h);output.slots.push({slot,baseline:{roll:baseline.roll,precision:baseline.precision,protection:baseline.protection,xp:baseline.xp},unenhanced:{roll:fx.roll,precision:fx.precision,protection:fx.protection,xp:fx.xp}});g.enhancement=level}
   for(const setup of [{name:'ordinary',ability:16,supplies:0,support:0},{name:'prepared',ability:18,supplies:4,support:3},{name:'high support',ability:20,supplies:4,support:6},{name:'optimized sensitivity',ability:20,supplies:4,support:6,combatBonus:3,extraDcCut:2}]){
    for(const [name,tier,enh] of profiles){
     for(const kind of ['World Dungeon','World Boss','World Raid']){for(const challenge of (kind==='World Dungeon'?['Renown']:['default','Renown'])){
      const [n,tanks,healers]=kind==='World Dungeon'?[8,1,1]:kind==='World Boss'?[20,2,4]:[32,5,10];const party=makeParty(n,tanks,healers,tier,enh,setup.ability,setup.supplies);
      game.permRanks=challenge==='Renown'?{'world-twilight-grove':9,'world-naxxramas':9}:{};const id=kind==='World Dungeon'?'well-of-eternity':kind==='World Boss'?'twilight-grove':'naxxramas';const q0=v9WorldQuest(V9_LOC[id]),stages=worldStageCount(q0),encs=q0.encounters;
      const readinessCache=new Map(party.map(h=>[h.id,Object.fromEntries(abilityKeys.map(a=>[a,liveReadiness(h,a)]))]));readiness=(h,a)=>readinessCache.get(h.id)[a||v9MainStat(h)];
      const effectCache=new Map(party.map(h=>[h.id,WL_GEAR_EFFECTS.forHero(h)])),template=perkPrepare(q0,party,0,true);
      const fastPrepare=q=>{const ctx={...template,q,notes:[],growth:{},wear:{},fx:{},gearRoll:{}};for(const k of ['used','vanished','noSpike','halve','painSup','skipDeath','tierSafe'])ctx[k]=new Set();for(const h of party){ctx.fx[h.id]=[];const fx=effectCache.get(h.id);if(fx.roll&&Math.random()<fx.roll)ctx.gearRoll[h.id]=1;if(fx.precision&&Math.random()<fx.precision)ctx.fx[h.id].push({crit19:true,perk:{id:'equipment-precision',name:'Equipment Precision'}})}return ctx};
      // Validate cached, perk-free preparation against the live implementation with the same RNG state.
      const savedSeed=seed,actual=perkPrepare(q0,party,0,true);seed=savedSeed;const cached=fastPrepare(q0);if(JSON.stringify(actual.gearRoll)!==JSON.stringify(cached.gearRoll)||party.some(h=>actual.fx[h.id].some(e=>e.crit19)!==cached.fx[h.id].some(e=>e.crit19)))throw Error('cached preparation differs');
      let full=0,totalCleared=0;const dc=Math.max(6,WL_BALANCE.questDc(q0)-setup.support-(setup.extraDcCut||0));
      for(let trial=0;trial<output.trials;trial++){let cleared=0;for(let i=0;i<stages;i++){const q={...q0,stageRun:'audit',stageIndex:i,stageCount:stages,encounters:[encs[i]],title:q0.title};const ctx=fastPrepare(q),checks=perkRollChecks(q,party,dc,ctx,h=>readiness(h,q.ability)+1+(setup.combatBonus||0));if(perkTier(q,party,checks,ctx)<2)break;cleared++}totalCleared+=cleared;if(cleared===stages)full++}
      output.runs.push({setup:setup.name,profile:name,kind,challenge,rank:q0.rank,stages,gearCap:typeof gearReadinessLimit==='function'?gearReadinessLimit(party.at(-1)):6,readiness:readiness(party.at(-1),v9MainStat(party.at(-1))),fullClearPercent:Math.round(full/output.trials*10000)/100,meanStagesCleared:Math.round(totalCleared/output.trials*100)/100});
     }}
    }
   }
   // Direct ingredient quotes from the current staff and crafting functions.
   game.buildingList=[{uid:'audit-workshop',key:'workshop',level:5}];game.staffMembers=[{id:'audit-smith',name:'Audit smith',buildingUid:'audit-workshop',buildingKey:'workshop',profession:'Blacksmithing',professionXP:{Blacksmithing:0},wage:2,aptitudes:{Organisation:1,Craftsmanship:1,Care:1,Fieldcraft:1},personality:null,staffProfileVersion:1}];v9Sync();staffMigrate(game);output.discounts=[];
   for(const [skill,xp] of [[0,0],[5,75],[10,275]]){game.staffMembers[0].professionXP.Blacksmithing=xp;for(const tier of [0,2,4,7]){const info=gearCraftInfo('death-knight-frost-'+tier);output.discounts.push({skill,tier,nominalDiscount:info.staff.materialDiscount,requirements:info.requirements,durability:info.durability,qualityChance:info.staff.quality,qualityBonus:info.extra})}}
   const owner=game.heroes[0],cost=perkRepairCost(owner,Math.max(1,Math.ceil(10/5)*v9RepairUnit()));output.repairs={lostDurability:10,twohandCost:cost,twoOnehandCost:cost*2};
   return output;
  }''')
  assert not errors,errors;b.close()
  (root/options.output).write_text(json.dumps(result,indent=2)+'\n')
  print(json.dumps(result,separators=(',',':')))
finally:server.shutdown()
