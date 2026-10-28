"""Utility reservations, actual dispatch consumption and rank-only DC adjustments."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:8000',wait_until='networkidle')
 page.evaluate("""() => {
  window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
  game.hall=7;game.gold=100000;game.pendingReports=[];game.player.wound=null;game.player.ready=true;game.player.preparedBonus=0;
  const a=makeApplicant({race:'Human',className:'Warrior',spec:'Arms'});game.applicants.push(a);openRecruit(a.id);confirmHire();window.heroId=game.heroes.at(-1).id;
  game.consumables=[{id:'food-test',name:'Hearty Rations',uses:3,bonus:2,ration:true},{id:'weak-food',name:'Trail Rations',uses:2,bonus:1,ration:true}];
  game.alchemyPotions=[{id:'field-test',recipe:'field',uses:3},{id:'heal-test',recipe:'panacea',uses:1},{id:'tonic-test',recipe:'tonic',uses:1}];
  const base=readiness(game.player,'str');
  check(equipUtilitySupply('player','utility1','supply:food:food-test'),'equip ration');
  check(game.consumables[0].uses===2&&game.player.preparedBonus===0,'reservation only');check(readiness(game.player,'str')===base+2,'preview includes equipped food');
  check(equipUtilitySupply('player','utility2','supply:alchemy:field-test'),'equip potion');check(readiness(game.player,'str')===base+3,'one food and one potion combine');
  check(!equipUtilitySupply('player','utility3','supply:alchemy:heal-test'),'wound potion cannot equip');check(equipUtilitySupply('player','utility3','supply:alchemy:tonic-test'),'second potion equipped as backup');check(readiness(game.player,'str')===base+4,'strongest potion only; category caps combine');
  check(equipUtilitySupply(heroId,'utility1','supply:food:food-test'),'other hero reserves separate use');check(game.consumables[0].uses===1,'stock cannot double reserve');
  equipSlot('player','utility1','');check(game.consumables[0].uses===2&&!game.player.utilitySupplies.utility1,'unequip returns exactly one');
  equipUtilitySupply('player','utility1','supply:food:food-test');openHeroStats('player');check(document.querySelector('#hero-stats-content .slot-utility1 select').value==='loaded:utility1','reserved supply shown as selected');closeHeroStats();save();
 }""")
 page.reload(wait_until='networkidle')
 page.evaluate("""() => {
  window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
  check(game.player.utilitySupplies.utility1.name==='Hearty Rations','reservation persisted');
  game.selected=['player'];chosenQuest='gather-mining';game.gold=0;
  const before=JSON.stringify(game.player.utilitySupplies);dispatchQuest(true);check(JSON.stringify(game.player.utilitySupplies)===before,'failed dispatch consumes nothing');
  game.gold=100000;const random=Math.random;Math.random=()=>.99;dispatchQuest(true);Math.random=random;
  const r=game.pendingReports.at(-1);check(r&&r.suppliesUsed.length===2&&r.suppliesUsed[0].name==='Hearty Rations'&&r.suppliesUsed[1].name==='Expedition Tonic','dispatch consumes one ration and strongest potion');
  check(!game.player.utilitySupplies.utility1&&game.player.utilitySupplies.utility2&&!game.player.utilitySupplies.utility3,'weaker potion retained');check(game.player.preparedBonus===4,'correct hero receives combined readiness');save();const activeSave=loadGame();check(activeSave.player.preparedSupplyBonuses.ration===2&&activeSave.player.preparedSupplyBonuses.potion===2&&activeSave.pendingReports.at(-1).suppliesUsed.length===2,'active categorized preparation and sealed report survive load');
  const other=game.heroes[0];check((Number(other.preparedBonus)||0)===0&&other.utilitySupplies.utility1,'other hero untouched');
  check(!equipUtilitySupply('player','utility3','supply:food:weak-food'),'away equipment locked');
  r.dueAt=Date.now()-1;applyPendingReports();check(game.player.preparedBonus===0&&game.player.utilitySupplies.utility2,'bonus clears on return; unused supplies stay');
  game.selected=['player'];chosenQuest='gather-mining';Math.random=()=>.99;dispatchQuest(true);Math.random=random;
  const second=game.pendingReports.at(-1);check(second.suppliesUsed[0].name==='Field Draught'&&game.player.preparedBonus===1,'next departure uses backup potion');second.dueAt=Date.now()-1;applyPendingReports();
  // Duplicate rations never combine; they remain usable backups.
  equipUtilitySupply('player','utility1','supply:food:food-test');equipUtilitySupply('player','utility2','supply:food:weak-food');
  check(game.player.preparedBonus===0,'return cleared categorized preparation');const used=consumeExpeditionSupplies([game.player]);check(used.length===1&&used[0].category==='ration'&&game.player.preparedBonus===2&&game.player.utilitySupplies.utility2,'one ration consumed, extra kept');
  equipSlot('player','utility2','');game.player.preparedBonus=0;game.player.preparedSupplyBonuses={ration:0,potion:0,legacy:0};
  game.consumables.push({id:'food-test',name:'Hearty Rations',uses:1,bonus:2,ration:true});
  // Utility gear and consumables share the same real slots.
  game.gear.push({id:'utility-gear',name:'Utility Tool',kind:'Utility',owner:null,bonus:0,stat:'STR',durability:20,maxDurability:20});equipUtilitySupply('player','utility3','supply:food:weak-food');
  equipSlot('player','utility3','utility-gear');check(!game.player.utilitySupplies.utility3&&game.player.equipment.utility3==='utility-gear','gear replaces supply without losing stock');
  equipUtilitySupply('player','utility3','supply:food:weak-food');check(game.player.equipment.utility3===null&&game.gear.find(g=>g.id==='utility-gear').owner===null,'supply replaces gear');
  // Automatic equipment migration must not fill a reserved supply slot.
  game.gear.push({id:'owned-auto-utility',name:'Old Utility',kind:'Utility',owner:'player',bonus:0,stat:'STR',durability:20,maxDurability:20});
  ensureHeroEquipment(game.player);check(!game.player.equipment.utility3&&game.player.utilitySupplies.utility3,'auto equipment skips reserved supply slot');
  game.gear=game.gear.filter(g=>g.id!=='owned-auto-utility');game.player.equipment.utility1=null;game.player.equipment.utility2=null;
  // Both convoy directions consume at dispatch too.
  game.staffMembers.push({id:'keeper-test',name:'Keeper',wage:2,buildingUid:'warehouse',buildingKey:'warehouse',professionXP:{Storekeeping:275}});staffMigrate(game);
  if(!game.world.discovered.includes('ratchet'))game.world.discovered.push('ratchet');selectedTradeRoute='ratchet';game.tradeCargo={'Copper Ore':1};game.materials['Copper Ore']=10;game.tradeParty=['player'];
  equipUtilitySupply('player','utility1','supply:alchemy:field-test');Math.random=()=>.99;dispatchTrade();Math.random=random;const trade=game.pendingReports.at(-1);check(trade.suppliesUsed.length===2&&game.player.preparedBonus===2,'outbound ration/potion combine');trade.dueAt=Date.now()-1;applyPendingReports();
  equipUtilitySupply('player','utility1','supply:food:food-test');equipUtilitySupply('player','utility2','supply:alchemy:field-test');game.tradeParty=['player'];renderTrading();Math.random=()=>.99;dispatchInbound();Math.random=random;
  const inbound=game.pendingReports.at(-1);check(inbound.inboundGoods&&inbound.suppliesUsed.length===2&&game.player.preparedBonus===3,'inbound ration/potion combine');inbound.dueAt=Date.now()-1;applyPendingReports();
  game.player.wound={tier:3,days:5};check(useAlchemyPotion('player','heal-test')&&game.player.wound.days===3,'wound remedy still works from storage');
  for(const kind of ['Dungeon','Raid','World Boss','World Raid'])for(let rank=0;rank<=9;rank++){const bonus=WL_BALANCE.highRankDcBonus({kind,rank});check(bonus>=0,'nonnegative bonus');if(rank<=4)check(bonus===0,'low ranks unchanged');if(rank>4)check(bonus>=WL_BALANCE.highRankDcBonus({kind,rank:rank-1}),'rank growth monotone')}
  for(const kind of ['World Dungeon','Gathering','Exploration','Contract'])check(WL_BALANCE.highRankDcBonus({kind,rank:9})===0,'other scaling preserved');
  // Adjusted DC is shown before dispatch and stored in the actual report.
  game.player.wound=null;game.player.ready=true;const q={...specialQuest('Dungeon'),id:'balance-test',templateKey:'balance-test',rank:9,dc:21,locked:false};game.questBoard.push(q);chosenQuest=q.id;game.selected=['player'];renderQuestDetails();check(document.getElementById('quest-detail-content').textContent.includes('DC 28'),'rank adjustment visible');
  let capturedDc;const roll=perkRollChecks;perkRollChecks=function(q,party,dc,...args){capturedDc=dc;return roll.call(this,q,party,dc,...args)};Math.random=()=>.99;dispatchQuest(true);Math.random=random;perkRollChecks=roll;
  const balanced=game.pendingReports.at(-1);check(balanced.highRankDcBonus===7&&capturedDc>=28,'real dispatch stores and applies adjustment');balanced.dueAt=Date.now()-1;applyPendingReports();
  const fallen=game.heroes[0],beforeLoss=JSON.stringify(game.consumables);game.pendingReports=[{kind:'operation',questKind:'Dungeon',title:'Supply loss',outcome:'Failure',summary:'A fatal loss.',partyIds:[fallen.id],casualties:[fallen.id],payout:0,rep:0,rolls:[],growthAwards:[],dueAt:Date.now()-1}];applyPendingReports();
  check(Object.keys(fallen.utilitySupplies).length===0&&JSON.stringify(game.consumables)===beforeLoss,'unused carried supplies lost on death');check(fallen.memorial.finalReport.lostEquipment[0].items.some(i=>i.name==='Hearty Rations'),'supply loss preserved in memorial');
  const applicant=makeApplicant({race:'Human',className:'Warrior',spec:'Arms'});game.applicants.push(applicant);openRecruit(applicant.id);confirmHire();const leaving=game.heroes.at(-1),stockBefore=game.consumables.find(x=>x.id==='weak-food').uses;
  game.consumables.push({id:'legacy-field',name:'Field Draught',uses:1,bonus:1});game.alchemyPotions.push({id:'extra-tonic',recipe:'tonic',uses:1});
  equipUtilitySupply(leaving.id,'utility2','supply:food:legacy-field');equipUtilitySupply(leaving.id,'utility3','supply:alchemy:extra-tonic');const legacyUses=consumeExpeditionSupplies([leaving]);check(legacyUses.length===1&&legacyUses[0].category==='potion'&&leaving.preparedBonus===2&&leaving.utilitySupplies.utility2,'legacy draught is potion; cannot stack with tonic');equipSlot(leaving.id,'utility2','');
  equipUtilitySupply(leaving.id,'utility1','supply:food:weak-food');openDismissHero(leaving.id);confirmDismissHero();check(game.consumables.find(x=>x.id==='weak-food').uses===stockBefore,'dismissal returns supplies once');
  openHeroStats('player');check(document.querySelectorAll('#hero-stats-content .slot-utility1 select').length===1,'utility UI retained');save();
 }""")
 assert page.locator('#hero-stats-content').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
 assert not errors,errors;b.close();print('PASS: slot reservations/refunds, save/reload, preview/cap, rejected/real quest dispatch, both convoy directions, equipment swaps, away locking, storage wound remedies, rank caps and mobile UI')
