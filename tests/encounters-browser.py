"""Explicit boss/raid parties, fixed roll targets, costs, legacy saves and mobile UI."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:8000',wait_until='networkidle');page.wait_for_function("typeof encounterPartyError==='function'")
 page.evaluate("""() => {
  window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
  window.makeCrew=(size,tanks,healers)=>{game.heroes=Array.from({length:size},(_,i)=>{const className=i>=tanks&&i<tanks+healers?'Priest':'Warrior',spec=i<tanks?'Protection':i<tanks+healers?'Holy':'Fury';return {...makeApplicant({race:'Human',className,spec}),ready:true,level:20,rank:9,gold:100,traits:[],perks:[],pendingPerks:[],equipment:{},abilities:defaultAbilities(className,spec)}});return game.heroes};
  window.selectCrew=()=>{game.selected=game.heroes.map(h=>h.id);renderQuestDetails()};
  window.finish=()=>{const r=game.pendingReports.at(-1);r.dueAt=Date.now()-1;applyPendingReports();game.questDone={};return r};
  game.hall=7;game.gold=100000;game.reputation=100000;game.pendingReports=[];game.questDone={};
  game.buildingList=buildingDefs.filter(x=>x.key!=='warehouse').map(x=>({key:x.key,uid:'fixture-'+x.key,level:5,spent:x.cost}));v9Sync();
  game.staffMembers=Object.entries(WL_STAFF.skills).map(([key,skill])=>({id:'st-'+key,name:key,wage:2,buildingUid:key==='warehouse'?'warehouse':'fixture-'+key,buildingKey:key,professionXP:{[skill]:275}}));staffMigrate(game);
  game.world.discovered=V9_WORLD.locations.map(x=>x.id);game.permRanks={};for(const l of V9_WORLD.locations.filter(x=>x.world))game.permRanks[l.world.legacy?'world-dungeon':'world-'+l.id]=9;
  makeCrew(12,2,2);const daily=specialQuest('World Boss');window.dailyId=daily.id;
  game.questBoard=[{...daily,minParty:12,maxParty:20,jobType:'Boss'}];delete game.questBoard[0].encounterVersion;
  // A sealed 20-person report retains its saved outcome and loot across this update.
  game.pendingReports=[{kind:'operation',questKind:'World Raid',questRank:9,title:'Sealed legacy raid',outcome:'Success',summary:'Sealed terms',partyIds:[],payout:123,rep:0,lootDrops:[{material:'Campaign Spoils',count:2}],rolls:[{roll:17,total:30}],growthAwards:[],dueAt:Date.now()+999999}];
  window.sealed=JSON.stringify(game.pendingReports[0]);save();check(questById(dailyId).maxParty===12&&game.questBoard[0].maxParty===20,'saved offer normalized without rewriting stored report');
 }""")
 page.reload(wait_until='networkidle');page.wait_for_function("typeof encounterPartyError==='function'")
 page.evaluate("""() => {
  window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
  check(game.pendingReports[0].rolls[0].roll===17&&game.pendingReports[0].lootDrops[0].count===2,'sealed report preserved');const gp=game.gold,spoils=game.materials['Campaign Spoils']||0;game.pendingReports[0].dueAt=Date.now()-1;applyPendingReports();check(game.gold===gp+123&&game.materials['Campaign Spoils']===spoils+2,'sealed rewards not rescaled');game.pendingReports=[];
  window.makeCrew=(size,tanks,healers)=>{game.heroes=Array.from({length:size},(_,i)=>{const className=i>=tanks&&i<tanks+healers?'Priest':'Warrior',spec=i<tanks?'Protection':i<tanks+healers?'Holy':'Fury';return {...makeApplicant({race:'Human',className,spec}),ready:true,level:20,rank:9,gold:100,traits:[],perks:[],pendingPerks:[],equipment:{},abilities:defaultAbilities(className,spec)}});return game.heroes};
  window.selectCrew=()=>{game.selected=game.heroes.map(h=>h.id);renderQuestDetails()};window.finish=()=>{const r=game.pendingReports.at(-1);r.dueAt=Date.now()-1;applyPendingReports();game.questDone={};return r};
  makeCrew(12,2,2);chosenQuest=game.questBoard.find(q=>q.kind==='World Boss').id;selectCrew();const q=questById(chosenQuest);
  check(q.maxParty===12&&WL_BALANCE.partyProfile(q).healer===2,'daily Boss 12/2/2');check(!document.getElementById('quest-dispatch-btn').disabled,'correct party enabled');
  game.consumables=[{id:'food',name:'Hearty Rations',uses:1,bonus:2,ration:true}];game.alchemyPotions=[{id:'potion',recipe:'tonic',uses:1}];game.fieldKits=[{id:'kit',recipe:'masterwork',uses:1}];const first=game.heroes[0];
  equipUtilitySupply(first.id,'utility1','supply:food:food');equipUtilitySupply(first.id,'utility2','supply:alchemy:potion');equipFieldKit(first.id,'kit');
  game.selected.pop();renderQuestDetails();check(document.getElementById('quest-dispatch-btn').disabled,'wrong size disabled');const blocked=JSON.stringify([game.gold,game.heroes,game.pendingReports]);dispatchQuest(true);check(JSON.stringify([game.gold,game.heroes,game.pendingReports])===blocked,'confirmation cannot bypass size; no side effects');
  selectCrew();first.spec='Fury';renderQuestDetails();const badRoles=JSON.stringify([game.gold,game.heroes,game.pendingReports]);dispatchQuest(true);check(JSON.stringify([game.gold,game.heroes,game.pendingReports])===badRoles,'missing required tank cannot dispatch');check(document.querySelector('.v9-rolepanel').textContent.includes('Tanks 1/2 minimum'),'minimum shown');first.spec='Protection';
  game.heroes[2].spec='Fury';renderQuestDetails();check(document.getElementById('quest-dispatch-btn').disabled,'missing healer disabled');game.heroes[2].spec='Holy';
  const random=Math.random;Math.random=()=>.99;selectCrew();dispatchQuest();Math.random=random;const daily=game.pendingReports.at(-1);
  check(daily.partyIds.length===12&&daily.partyRequirements.tank===2&&daily.partyRequirements.healer===2,'daily party snapshot');check(daily.suppliesUsed.length===3,'supplies consumed only after validation');check(daily.v9group.results.every(x=>x.quotas.tank.need===2&&x.quotas.healer.need===2&&x.quotas.dps.need===6),'daily fixed roll targets');check(daily.outcome==='Exceptional Success'&&daily.payout>0,'daily client payment preserved');
  finish();makeCrew(20,2,4);const boss=V9_WORLD.locations.find(x=>x.world?.kind==='World Boss');chosenQuest=v9WorldQuest(boss).id;selectCrew();
  check(questById(chosenQuest).maxParty===20,'World Boss 20');game.heroes[2].spec='Fury';renderQuestDetails();const beforeBoss=game.gold;dispatchQuest(true);check(game.gold===beforeBoss&&!game.pendingReports.length,'World Boss four healers required');game.heroes[2].spec='Holy';selectCrew();
  Math.random=()=>.99;dispatchQuest();Math.random=random;const world=game.pendingReports.at(-1);check(world.partyIds.length===20&&world.partyRequirements.healer===4&&world.payout===0,'World Boss roles/funding');check(world.v9group.results.every(x=>x.quotas.tank.need===2&&x.quotas.healer.need===3&&x.quotas.dps.need===10),'World Boss fixed roll targets');finish();
  makeCrew(32,5,10);const raid=V9_WORLD.locations.find(x=>/Naxxramas/.test(x.world?.title||''));chosenQuest=v9WorldQuest(raid).id;selectCrew();const raidQuest=questById(chosenQuest);
  check(raidQuest.maxParty===32&&raidQuest.minParty===32&&WL_BALANCE.partyProfile(raidQuest).tank===5,'World Raid 32/5/10');check(document.querySelectorAll('.quest-member-list input:checked').length===32,'all 32 visible/selected');check(![...document.querySelectorAll('.quest-member-list input:not(:checked)')].some(x=>!x.disabled),'picker enforces 32-slot limit');
  check(document.querySelector('.v9-rolepanel').textContent.includes('Healers 10/10 minimum'),'ten-healer requirement visible');window.raidFee=permanentExpeditionCost(raidQuest,32);check(permanentExpeditionCost(raidQuest,1)===raidFee,'partial selection still quotes mandatory full-party fee');check(raidFee===59&&document.getElementById('quest-dispatch-btn').textContent.includes(raidFee+' gp'),'32-person fee and Command Post discount shown');const cp=v9Inst('commandPost')[0],cpLevel=cp.level;cp.level=3;check(permanentExpeditionCost(raidQuest,32)===66,'discount requires level 4');cp.level=cpLevel;
  game.selected.pop();renderQuestDetails();dispatchQuest(true);check(!game.pendingReports.length,'31 cannot dispatch');selectCrew();game.heroes[5].spec='Fury';dispatchQuest(true);check(!game.pendingReports.length,'nine healers cannot dispatch');game.heroes[5].spec='Holy';
  // Even a confirmed direct dispatch cannot exceed the party cap.
  const extra={...game.heroes[0],id:'extra-hero',name:'Extra hero',ready:true};game.heroes.push(extra);game.selected.push(extra.id);dispatchQuest(true);check(!game.pendingReports.length,'33 cannot dispatch');game.heroes.pop();selectCrew();
  const loot=bonusLootSpec(raidQuest);check(loot.min===4&&loot.max===7,'Campaign Spoils scale for 32 heroes');
  const rolls=perkRollChecks,encRoll=v9EncRoll;perkRollChecks=function(){const before=Math.random;Math.random=()=>.99;try{return rolls.apply(this,arguments)}finally{Math.random=before}};v9EncRoll=()=>20;Math.random=()=>0;
  dispatchQuest();Math.random=random;perkRollChecks=rolls;v9EncRoll=encRoll;const report=game.pendingReports.at(-1);
  check(report.partyIds.length===32&&report.partyRequirements.tank===5&&report.partyRequirements.healer===10,'32-person dispatch snapshot');check(report.organizingCost===raidFee&&report.payout===0,'guild-funded raid fee');check(report.v9group.results.every(x=>x.quotas.tank.need===4&&x.quotas.healer.need===7&&x.quotas.dps.need===12),'raid fixed roll targets');
  check(report.v9group.results[2].dc-report.v9group.results[1].dc===2,'Naxxramas final phase adjustment applied once');check(report.lootDrops.some(x=>x.material==='Campaign Spoils'&&x.count>=4),'scaled loot actually awarded');save();check(loadGame().pendingReports.at(-1).partyIds.length===32,'32-person save');finish();
  // Old unrolled story sessions retain the old party and payment rules too.
  makeCrew(20,2,2);const old={...raidQuest,minParty:20,maxParty:20,reward:100};delete old.encounterVersion;
  game.storySession={quest:old,partyIds:game.heroes.map(h=>h.id),choices:['A','B'],bonus:0,dueAt:Date.now()+10000};const gold=game.gold;Math.random=()=>.99;finishStoryOnTimer();Math.random=random;const legacy=game.pendingReports.at(-1);
  check(legacy.partyIds.length===20&&legacy.organizingCost===0&&game.gold===gold,'old story not recharged or resized');check(legacy.partyRequirements===null&&legacy.worldDcAdjustment===0&&legacy.v9group.results.every(x=>x.quotas.healer.need===2),'old story uses original quotas/DC');check(!old.legacyEncounter,'temporary legacy marker cleaned');finish();
  openQuestDetails(raidQuest.id);save();
 }""")
 assert page.locator('#quest-detail-content').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
 assert not errors,errors;b.close();print('PASS: 12/20/32 party sizes, required role minima, fixed success targets, validation before costs/supplies, picker limits, daily/world funding, scaled raid loot, phase difficulty, sealed reports/story migration, save/load and mobile UI; no console errors')
