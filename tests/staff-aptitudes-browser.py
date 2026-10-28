"""Actual service effects, saved candidate profiles, paid practice and loyalty."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);page.set_default_timeout(15000);errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:8000',wait_until='networkidle');page.wait_for_function("typeof staffMigrate==='function'")
 profiles=page.evaluate('JSON.stringify(game.staffCandidates)');pool=json.loads(profiles)
 assert all(sum(c['aptitudes'].values())==12 and c['personality'] and 2<=c['wage']<=4 for c in pool)
 page.reload(wait_until='networkidle');assert page.evaluate('JSON.stringify(game.staffCandidates)')==profiles
 page.evaluate("showView('staff')");assert page.locator('.staff-candidate .staff-aptitudes').count()==2
 page.locator('[data-hire-candidate="0"]').click()
 hired=page.evaluate('game.staffMembers.at(-1)');assert hired['aptitudes']==pool[0]['aptitudes'] and hired['personality']==pool[0]['personality'] and hired['wage']==pool[0]['wage']
 page.evaluate("""() => {
  window.check=(x,m)=>{if(!x)throw Error(m)};
  game.hall=7;game.gold=100000;game.reputation=1400;game.pendingReports=[];game.heroes=[];
  game.buildingList=buildingDefs.filter(d=>d.key!=='warehouse').map(d=>({key:d.key,uid:'apt-'+d.key,level:5,spent:d.cost}));v9Sync();
  // Existing staff receive neutral potential, with no wage/XP/identity changes.
  game.staffMembers=[{id:'legacy',name:'Kept Name',wage:7,morale:3,buildingUid:'warehouse',buildingKey:'warehouse',profession:'Storekeeping',professionXP:{Storekeeping:50,Medicine:30,Blacksmithing:15}}];
  staffMigrate(game);const legacy=game.staffMembers[0];
  check(Object.values(legacy.aptitudes).every(v=>v===3)&&legacy.personality===null,'neutral old-staff migration');
  check(legacy.wage===7&&legacy.name==='Kept Name'&&legacy.professionXP['First Aid']===30&&legacy.professionXP.Blacksmithing===15,'identity/wage/all progress preserved');
  const before=JSON.stringify(legacy);staffMigrate(game);check(JSON.stringify(legacy)===before,'migration idempotent');
  window.byJob=key=>game.staffMembers.find(s=>s.buildingKey===key);
  for(const key of Object.keys(WL_STAFF.jobs)){
   let st=byJob(key);
   if(!st){st={id:'apt-worker-'+key,name:key+' worker',wage:2,morale:3,buildingUid:'apt-'+key,buildingKey:key,profession:WL_STAFF.skills[key],professionXP:{},skillAwards:{}};game.staffMembers.push(st)}
   const others=WL_STAFF.aptitudes.filter(a=>a!==WL_STAFF.jobs[key]);st.aptitudes={[WL_STAFF.jobs[key]]:5,[others[0]]:3,[others[1]]:2,[others[2]]:2};
   st.personality=null;st.professionXP={[WL_STAFF.skills[key]]:275};WL_STAFF.migrate(st);
  }
  staffMigrate(game);
  const keeper=byJob('warehouse'),known=JSON.stringify(game.world.discovered),route=tradeDestinations()[0];
  const quote=()=>tradeQuote(route,[{material:'Copper Ore',count:100}],1).gross;
  const standard=quote();keeper.personality='Daring';check(quote()>standard&&WL_STAFF.service('warehouse').sale===.35,'Daring sale cap applied to actual quote');
  check(staffSkillBonus('warehouse')===2,'Daring safety penalty');keeper.personality='Cautious';check(staffSkillBonus('warehouse')===4,'Cautious safety');
  check(quote()<standard&&JSON.stringify(game.world.discovered)===known,'Cautious price tradeoff without discoveries');
  const medic=byJob('infirmary');game.player.wound={tier:3,days:7};medic.personality='Meticulous';const expensive=treatCost(game.player);medic.personality='Resourceful';check(treatCost(game.player)<expensive&&treatCost(game.player)>=60,'treatment price and floor');game.player.wound=null;
  const trainer=byJob('trainingHall'),trait=Object.keys(TRAITS).find(k=>TRAITS[k].train);trainer.personality='Meticulous';const training=v9TrainPrice(trait);trainer.personality='Resourceful';check(v9TrainPrice(trait)<=training&&v9TrainPrice(trait)>=Math.round(TRAITS[trait].train.gold*.3),'training price/floor');
  const armorer=byJob('armory'),armory=v9Inst('armory')[0];armory.level=1;armorer.professionXP.Armoring=0;armorer.personality='Meticulous';const repair=v9RepairUnit();armorer.personality='Resourceful';check(v9RepairUnit()<repair&&v9RepairUnit()>=1,'repair trait actually applied');armory.level=5;armorer.professionXP.Armoring=275;check(v9RepairUnit()===1,'repair floor');
  const path=byJob('waystation');path.personality='Ambitious';check(waystationTimeCut()===.8,'speed hard cap');check(WL_STAFF.describe('waystation',path,5,path.buildingUid).includes('At the 80% cap'),'cap disclosed');
  const office=byJob('staffOffice'),carto=byJob('cartographersOffice');office.personality=carto.personality='Cautious';
  check(WL_STAFF.preparation({kind:'Exploration'},()=>0)===6,'combined preparation cap');
  for(const key of ['warRoom','huntersLodge','commandPost']){const st=byJob(key);st.personality='Daring';check(WL_STAFF.service(key).loot<=.35&&WL_STAFF.service(key).loot>0,'specialist loot '+key)}
  const random=Math.random,oldChecks=perkRollChecks;let actualDC;
  perkRollChecks=function(q,party,dc){actualDC=dc;return oldChecks.apply(this,arguments)};
  game.player.perks=[];game.player.traits=[];game.player.wound=null;game.player.ready=true;for(const k of abilityKeys)game.player.abilities[k]=100;
  Math.random=()=>.99;
  queueQuestReport({...v9ExplorationQuest(),rank:3,minParty:1,dc:100},['player'],0,'Preparation test');
  const expedition=game.pendingReports.at(-1);check(expedition.staffSupport===6&&actualDC===94,'support applied once to actual checks');
  check(expedition.explorationFindChance===.5,'discovery chance saved on dispatch');
  perkRollChecks=oldChecks;expedition.outcome='Partial Success';expedition.wounds={};expedition.near=[];expedition.casualties=[];
  carto.personality=null;carto.aptitudes={Organisation:5,Craftsmanship:3,Care:3,Fieldcraft:1};carto.professionXP.Cartography=0;v9Inst('cartographersOffice')[0].level=1;
  Math.random=()=>.49;expedition.dueAt=Date.now()-1;applyPendingReports();check(expedition.v9found.length===1,'queued discovery chance retained after staff changes');
  Math.random=random;game.pendingReports=[];
  // The proc is not rolled in rendering, but recipe preview includes every bonus.
  const smith=byJob('workshop');smith.personality='Industrious';smith.professionXP.Blacksmithing=275;
  const recipe=renderGearCatalog().find(i=>i.id==='sword-7');Object.entries(recipe.requirements).forEach(([name])=>game.materials[name]=100);
  check(recipe.requirements['Heritage Ore']===1,'special recipe material never bypassed');
  game.craftLog={day:game.day,n:0};Math.random=()=>0;craftGear('sword-7');Math.random=random;
  const gear=game.gear.at(-1);check(gear.bonus===6&&gear.extraBonus===0&&gear.extraDurability===5&&gear.maxDurability===90,'capped quality converts to durability, building and Industrious bonuses apply');
  check(document.getElementById('gear-crafted-details').textContent.includes('quality added +5 durability'),'popup describes actual proc');closeGearCrafted();
  smith.personality='Resourceful';check(WL_STAFF.service('workshop').materialDiscount<=.45,'combined crafting discount cap');
  smith.professionXP.Blacksmithing=0;const count=game.gear.length,gold=game.gold;craftGear('sword-7');check(game.gear.length===count&&game.gold===gold,'aptitudes cannot bypass recipe gates');smith.professionXP.Blacksmithing=275;
  const cook=byJob('kitchen'),kitchen=v9Inst('kitchen')[0];cook.personality='Industrious';game.consumables=[];game.materials['Primal Meat']=10;game.materials['Royal Salmon']=10;game.staffCostsPaidDay=game.day;
  check(setKitchenRecipe(kitchen.uid,'feast'),'recipe gates retained');game.kitchenProduction={};Math.random=()=>0;v9KitchenDay();Math.random=random;
  check(game.consumables.length===6&&game.materials['Primal Meat']===4&&game.materials['Royal Salmon']===4,'one extra ration consumes real ingredients');
  check(game.consumables.every(c=>c.bonus===2),'ration strength not inflated');
  Math.random=()=>{throw Error('render/duplicate batch rolled a bonus')};v9KitchenDay();renderWarehouse();renderStaffTab();Math.random=random;check(game.consumables.length===6,'no repeat production');
  const creditBefore=JSON.stringify(cook.professionXP);game.staffCostsPaidDay=null;game.day++;v9KitchenDay();check(game.consumables.length===6&&JSON.stringify(cook.professionXP)===creditBefore,'unpaid kitchen paused');
  // Isolate paid-day practice from service awards and other daily production.
  const learner=keeper;learner.personality='Studious';learner.professionXP={Storekeeping:0,Blacksmithing:5};learner.passiveCredit=0;learner.lastWorkDay=0;
  game.buildingList=game.buildingList.filter(i=>i.key==='staffOffice');v9Inst('staffOffice')[0].level=2;
  game.staffMembers=[learner,office];game.pendingReports=[];game.gold=100000;game.player.traits=[];game.player.training=null;
  for(let n=0;n<5;n++)nextDay();check(learner.professionXP.Storekeeping===7&&learner.passiveCredit===25,'Studious and Office credits retained');
  check(learner.professionXP.Blacksmithing===5,'other skill progress retained');
  const xp=learner.professionXP.Storekeeping;game.staffWorkSnapshot={day:game.day-1,office:true,workers:[{id:learner.id,uid:learner.buildingUid,key:learner.buildingKey}]};completeStaffWorkDay();check(learner.professionXP.Storekeeping===xp,'no duplicate shift award');
  learner.personality='Adaptable';learner.professionXP={Storekeeping:0,Blacksmithing:5};learner.passiveCredit=0;
  for(let n=0;n<5;n++)nextDay();check(learner.professionXP.Storekeeping===7&&learner.passiveCredit===25,'Adaptable stops at skill parity');
  check(WL_STAFF.describe('warehouse',learner,1,learner.buildingUid).includes('Adaptable inactive'),'inactive catchup disclosed');
  learner.personality='Loyal';learner.loyalDays=0;
  for(let n=0;n<28;n++)nextDay();check(learner.loyalDays===28&&WL_STAFF.service('warehouse').fit===.16,'saved 28-day loyalty cap');
  const fixedWage=learner.wage;v9AssignStaff(learner.id,'warehouse');check(learner.loyalDays===28,'same assignment preserves streak');
  check(v9AssignStaff(learner.id,office.buildingUid)==='full'&&learner.loyalDays===28,'failed assignment preserves loyalty');
  const beforeMissed=learner.professionXP.Storekeeping;game.gold=0;nextDay();check(learner.loyalDays===0&&learner.professionXP.Storekeeping===beforeMissed,'unpaid day breaks consecutive loyalty without removing skill');game.gold=100000;
  office.buildingUid=null;office.buildingKey=null;staffMigrate(game);v9AssignStaff(learner.id,'apt-staffOffice');check(learner.loyalDays===0&&learner.wage===fixedWage,'moving resets loyalty only');
  learner.personality='Specialist';learner.professionXP={Quartermastery:0,Storekeeping:275};check(WL_STAFF.describe('staffOffice',learner,2,learner.buildingUid).includes('Specialist inactive'),'Specialist inactivity shown');
  learner.personality='Ambitious';check(WL_STAFF.describe('staffOffice',learner,2,learner.buildingUid).includes('Ambitious inactive'),'Ambitious inactive below L4');
  learner.personality='Studious';const old=JSON.stringify([learner.professionXP,learner.passiveCredit,learner.loyalDays]);game.gold=0;nextDay();check(JSON.stringify([learner.professionXP,learner.passiveCredit,learner.loyalDays])===old,'unpaid shifts grant no practice/loyalty');
  game.gold=1000;save();render();showView('staff');window.snapshot=JSON.stringify(game.staffMembers);
 }""")
 snapshot=page.evaluate('snapshot');page.reload(wait_until='networkidle');assert page.evaluate('JSON.stringify(game.staffMembers)')==snapshot
 page.evaluate("showView('staff')")
 for width in [390,1280]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.locator('.staff-candidate').first.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  assert page.locator('#staff-roster').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
 # Real export/import retains profiles, agreed wages, practice and fractional credit.
 with page.expect_download() as download:page.evaluate('exportSave()')
 payload=Path(download.value.path()).read_bytes()
 page.evaluate('game.staffMembers[0].personality=null;game.staffMembers[0].passiveCredit=0')
 page.locator('#import-file').set_input_files({'name':'aptitude-save.json','mimeType':'application/json','buffer':payload})
 page.wait_for_function('(snapshot)=>JSON.stringify(game.staffMembers)===snapshot',arg=snapshot)
 assert not errors,errors
 b.close();print('PASS: saved candidate rolls/wages, neutral legacy migration, all twelve services, capped support/speed/quality, paid extra rations, fractional practice, catch-up, loyalty, reassignment/reload and mobile UI; no console errors')
