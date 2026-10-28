"""Field kit production, inventory, dispatch, actual wound protection and persistence."""
from pathlib import Path
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:8000',wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'")
 page.evaluate("""() => {
  window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
  game.hall=7;game.gold=100000;game.reputation=100000;
  check(!craftFieldKit('trail'),'Office required');check(buildExtension('staffOffice')==='','real Office construction');check(!craftFieldKit('trail'),'unfinished Office cannot make kits');
  completeConstructionProject(game.constructionProjects.find(x=>x.key==='staffOffice'));check(!craftFieldKit('trail'),'worker required');
  game.staffMembers.push({id:'test-quartermaster',name:'Quartermaster',wage:2,buildingUid:null,buildingKey:null,professionXP:{}});
  const office=v9Inst('staffOffice')[0];check(v9AssignStaff('test-quartermaster',office.uid)==='','assign any staff to Office');
  const st=buildingStaff('staffOffice');game.materials['Wool Cloth']=10;game.materials['Light Leather']=10;
  check(craftFieldKit('trail'),'untrained staff makes Trail kits');check(game.fieldKits[0].uses===3&&st.professionXP.Quartermastery===1,'three uses and service practice');
  const before=JSON.stringify([game.gold,game.materials,game.fieldKits]);check(!craftFieldKit('trail')&&JSON.stringify([game.gold,game.materials,game.fieldKits])===before,'daily cap blocks atomically');
  game.day++;office.level=5;game.fieldKitBatches={};st.professionXP.Quartermastery=275;
  const points=[0,5,15,30,50,75,105,140,180,225,275];
  for(const rec of fieldKitRecipes()){
   game.day++;game.fieldKitBatches={};office.level=rec.office;st.professionXP.Quartermastery=points[rec.skill];
   for(const [key,n] of Object.entries(rec.ingredients))game.materials[key]=100;
   if(rec.skill){st.professionXP.Quartermastery=points[rec.skill-1];check(!craftFieldKit(rec.id),'skill gate '+rec.id);st.professionXP.Quartermastery=points[rec.skill]}
   if(rec.office>1){office.level--;check(!craftFieldKit(rec.id),'Office gate '+rec.id);office.level++}
   const gold=game.gold;check(craftFieldKit(rec.id),'recipe '+rec.id);check(game.gold===gold-rec.gold,'quoted gold '+rec.id);
   for(const [key,n] of Object.entries(rec.ingredients))check(game.materials[key]===100-n,'quoted ingredient '+rec.id+' '+key);
   check(game.fieldKits.at(-1).recipe===rec.id&&game.fieldKits.at(-1).uses===3,'output '+rec.id);
  }
  game.day++;game.fieldKitBatches={};office.level=5;st.professionXP.Quartermastery=275;const xp=st.professionXP.Quartermastery;
  for(let n=0;n<5;n++)check(craftFieldKit('trail'),'Office 5 batch '+n);check(!craftFieldKit('trail'),'Office 5 five-batch cap');check(st.professionXP.Quartermastery===xp+1,'one service practice per day');
  game.day++;game.fieldKitBatches={};game.gold=0;const noGold=JSON.stringify(game.fieldKits);check(!craftFieldKit('trail')&&JSON.stringify(game.fieldKits)===noGold,'gold gate');game.gold=100000;
  game.materials['Wool Cloth']=0;check(!craftFieldKit('trail'),'ingredient gate');game.materials['Wool Cloth']=100;
  game.constructionProjects.push({key:'staffOffice',uid:office.uid,action:'upgrade',daysRemaining:2});check(!craftFieldKit('trail'),'upgrading Office pauses production');game.constructionProjects=[];
  check(craftFieldKit('trail'),'capacity refreshed on new game day');save();const loaded=loadGame();check(loaded.fieldKitBatches[office.uid].count===1&&loaded.fieldKits.length===game.fieldKits.length,'stock/capacity saved');
  game.player.ready=true;game.player.wound=null;game.pendingReports=[];game.player.preparedBonus=0;
  game.consumables=[{id:'ration-test',name:'Hearty Rations',uses:2,bonus:2,ration:true}];game.alchemyPotions=[{id:'tonic-test',recipe:'tonic',uses:2}];
  window.kitId=game.fieldKits.find(x=>x.recipe==='masterwork').id;window.base=readiness(game.player,'str');
  equipUtilitySupply('player','utility1','supply:food:ration-test');equipUtilitySupply('player','utility2','supply:alchemy:tonic-test');
  check(equipFieldKit('player',kitId),'equip kit in third utility');check(readiness(game.player,'str')===base+4&&!game.player.expeditionKitProtection,'kit adds no readiness and waits for departure');
  const kit=game.fieldKits.find(x=>x.id===kitId);check(kit.uses===2,'one use reserved');equipSlot('player','utility3','');check(kit.uses===3,'reservation refunded');equipFieldKit('player',kitId);save();
 }""")
 page.reload(wait_until='networkidle')
 page.evaluate("""() => {
  window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
  check(game.player.utilitySupplies.utility3.source==='kit','equipped kit survives reload');openHeroStats('player');
  check(document.querySelector('.slot-utility3 select').value==='loaded:utility3'&&document.querySelector('.slot-utility3').textContent.includes('20%'),'equipped effect shown');closeHeroStats();
  game.selected=['player'];chosenQuest='gather-mining';game.gold=0;const packed=JSON.stringify(game.player.utilitySupplies);dispatchQuest(true);check(JSON.stringify(game.player.utilitySupplies)===packed,'blocked dispatch uses no supplies');
  game.gold=100000;const random=Math.random;Math.random=()=>.99;dispatchQuest(true);Math.random=random;
  const r=game.pendingReports.at(-1);check(r.suppliesUsed.length===3&&r.suppliesUsed.find(x=>x.category==='kit').protection===.2,'three distinct supplies consumed');
  check(game.player.preparedBonus===4&&game.player.expeditionKitProtection===.2,'correct preparation applied');save();check(loadGame().player.expeditionKitProtection===.2,'active protection saved');
  check(!equipFieldKit('player',game.fieldKits[0].id),'away locking');showReportDetails(r);check(document.getElementById('report-detail-text').textContent.includes('20% less ordinary wound chance'),'consumed kit shown in report');closeReportDetails();
  r.dueAt=Date.now()-1;applyPendingReports();check(game.player.expeditionKitProtection===0&&game.player.preparedBonus===0,'all preparation clears on return');
  const weak=game.fieldKits.find(x=>x.recipe==='trail'),strong=game.fieldKits.find(x=>x.recipe==='masterwork');
  equipUtilitySupply('player','utility1','supply:kit:'+weak.id);equipUtilitySupply('player','utility2','supply:kit:'+strong.id);const used=consumeExpeditionSupplies([game.player]);
  check(used.length===1&&used[0].category==='kit'&&used[0].protection===.2&&game.player.utilitySupplies.utility1,'kits never stack; weaker kit kept');equipSlot('player','utility1','');game.player.expeditionKitProtection=0;
  // Sample the actual casualty engine at a draw between unprotected and protected thresholds.
  const a=makeApplicant({race:'Human',className:'Warrior',spec:'Fury'});game.applicants.push(a);openRecruit(a.id);confirmHire();const h=game.heroes.at(-1);h.traits=[];h.perks=[];game.bonds={};
  const q={kind:'Dungeon',rank:0,minParty:1};
  function risk(protection,natural=false){h.wound=null;h.expeditionKitProtection=protection;const checks=[{id:h.id,name:h.name,success:false,critical:natural,roll:natural?1:5}],ctx=perkPrepare(q,[h],0,true),tb=tbwPrepare(q,[h]);Math.random=()=>.135;try{return {res:tbwCasualties(q,[h],checks,ctx,'Partial Success',tb),ctx}}finally{Math.random=random}}
  check(risk(0).res.wounds[h.id]&&!risk(.2).res.wounds[h.id],'20% relative protection changes 15% ordinary wound risk to 12%');
  for(const rec of fieldKitRecipes()){const ctx=perkPrepare(q,[h],0,true),tb=tbwPrepare(q,[h]);h.expeditionKitProtection=rec.protection;h.wound=null;Math.random=()=>.15*(1-rec.protection)+.00001;const result=tbwCasualties(q,[h],[{id:h.id,success:false,critical:false}],ctx,'Partial Success',tb);Math.random=random;check(!result.wounds[h.id],'actual grade protection '+rec.id)}
  const normal=risk(0,true),protectedRisk=risk(.2,true);check(normal.res.wounds[h.id]&&protectedRisk.res.wounds[h.id]&&normal.ctx.deathChance[h.id]===protectedRisk.ctx.deathChance[h.id],'mandatory natural-1 wound and death chance unchanged');
  h.wound={tier:1,days:2};h.expeditionKitProtection=.2;Math.random=()=>.05;const ctx=perkPrepare(q,[h],0,true),tb=tbwPrepare(q,[h]);const worsened=tbwCasualties(q,[h],[{id:h.id,success:true,critical:false}],ctx,'Success',tb);Math.random=random;check(worsened.wounds[h.id].worsened,'existing-wound worsening unchanged');h.wound=null;
  // Both convoy directions share consumption and cleanup.
  game.staffMembers.push({id:'keeper',name:'Keeper',wage:2,buildingUid:'warehouse',buildingKey:'warehouse',professionXP:{Storekeeping:275}});staffMigrate(game);if(!game.world.discovered.includes('ratchet'))game.world.discovered.push('ratchet');selectedTradeRoute='ratchet';
  for(const inbound of [false,true]){equipFieldKit('player',weak.id);game.tradeParty=['player'];game.tradeCargo={'Copper Ore':1};game.materials['Copper Ore']=10;renderTrading();Math.random=()=>.99;if(inbound)dispatchInbound();else dispatchTrade();Math.random=random;const report=game.pendingReports.at(-1);check(report.suppliesUsed.some(x=>x.category==='kit')&&game.player.expeditionKitProtection===.1,'convoy consumes kit');report.dueAt=Date.now()-1;applyPendingReports();check(game.player.expeditionKitProtection===0,'convoy clears protection')}
  equipFieldKit(h.id,weak.id);const reserved=game.fieldKits.find(x=>x.id===weak.id)?.uses||0;openDismissHero(h.id);confirmDismissHero();check(game.fieldKits.find(x=>x.id===weak.id).uses===reserved+1,'dismissal refunds kit once');
  const f=makeApplicant({race:'Human',className:'Warrior',spec:'Fury'});game.applicants.push(f);openRecruit(f.id);confirmHire();const fallen=game.heroes.at(-1);equipFieldKit(fallen.id,weak.id);const stock=JSON.stringify(game.fieldKits);
  game.pendingReports=[{kind:'operation',questKind:'Dungeon',title:'Kit loss',outcome:'Failure',summary:'A fatal loss.',partyIds:[fallen.id],casualties:[fallen.id],payout:0,rep:0,rolls:[],growthAwards:[],dueAt:Date.now()-1}];applyPendingReports();check(!Object.keys(fallen.utilitySupplies).length&&JSON.stringify(game.fieldKits)===stock,'carried kit lost on death');check(fallen.memorial.finalReport.lostEquipment[0].items.some(x=>x.name==='Trail Field Kit'),'kit loss named in memorial');
  showView('crafting');save();
 }""")
 page.select_option('#field-kit-recipe','masterwork');assert '25 gp per batch' in page.locator('#field-kits-panel').inner_text()
 assert page.locator('#field-kits-panel').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
 with page.expect_download() as download:page.evaluate('exportSave()')
 payload=Path(download.value.path()).read_bytes();stock=page.evaluate('JSON.stringify(game.fieldKits)');page.evaluate('game.fieldKits=[]')
 page.locator('#import-file').set_input_files({'name':'kits.json','mimeType':'application/json','buffer':payload});assert page.evaluate('JSON.stringify(game.fieldKits)')==stock
 assert not errors,errors;b.close();print('PASS: all five kit recipes/gates/costs, batch limits/practice, reservation/refund/reload/import, triple-supply dispatch, strongest kit only, actual wound protection/natural-1/death behavior, both convoys, cleanup/dismissal/death losses, mobile UI; no console errors')
