from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parent.parent)));Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(f'http://127.0.0.1:{s.server_port}',wait_until='networkidle')
  page.evaluate('''() => {
 window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
 check(worldStageCount({kind:'World Dungeon'})===3,'dungeon stages');check(worldStageCount({kind:'World Raid'})===5,'raid stages');check(worldStageCount({kind:'World Boss',world:true})===2,'boss stages');check(worldStageCount({kind:'World Boss'})===1&&worldStageCount({kind:'Dungeon'})===1,'normal single stage');
 game.gold=100000;game.hall=7;game.pendingReports=[];game.heroes=[];
 game.player.ready=false;game.player.wound=null;game.player.equipment={};game.player.gear=null;game.player.utilitySupplies={};game.player.level=20;
 window.oldTier=perkTier;window.oldRandom=Math.random;perkTier=()=>2;Math.random=()=>.99;
 game.consumables=[{id:'stage-food',name:'Rations',ration:true,bonus:2,uses:3}];game.alchemyPotions=[{id:'stage-potion',recipe:'field',uses:3}];game.fieldKits=[{id:'stage-kit',recipe:'trail',uses:3}];game.player.ready=true;equipUtilitySupply('player','utility1','supply:food:stage-food');equipUtilitySupply('player','utility2','supply:alchemy:stage-potion');equipUtilitySupply('player','utility3','supply:kit:stage-kit');game.player.ready=false;
 const q=v9WorldQuest(V9_LOC.deadmines),gold=game.gold,duration=v9QuestMs(q);queueQuestReport(q,['player'],0,'stage test');
 check(game.pendingReports.length===1,'only first stage queued');let r=game.pendingReports[0];check(r.stageCount===3&&r.stageIndex===0,'first stage');check(!r.lootDrops.some(d=>d.signatureDrop),'signature locked');check(r.durMs===stageShare(duration,0,3),'split time');check(game.gold===gold-permanentExpeditionCost(q,1),'fee once');
 window.runDuration=duration;window.runGold=game.gold;window.firstDue=r.dueAt;window.firstXP=r.growthAwards[0].amount;r.dueAt=Date.now()-1;applyPendingReports();
 check(!game.player.ready&&game.pendingReports[0].stageIndex===1,'party continues');check(game.gold===runGold,'no second fee');check(game.player.preparedBonus===3&&game.player.expeditionKitProtection===.1,'supplies persist');check(game.player.utilitySupplies.utility1.uses===2&&game.player.utilitySupplies.utility2.uses===2&&game.player.utilitySupplies.utility3.uses===2,'no repeated consumption');check(!game.pendingReports[0].lootDrops.some(d=>d.signatureDrop),'rare still locked');save();
 }''')
  page.reload(wait_until='networkidle')
  page.evaluate('''() => {
 window.check=(ok,msg)=>{if(!ok)throw Error(msg)};const old=perkTier,random=Math.random;perkTier=()=>2;Math.random=()=>.99;check(!game.player.ready&&game.pendingReports[0].stageIndex===1,'save retains stage and busy');let r=game.pendingReports[0];const run=r.stagePlan;r.dueAt=Date.now()-1;applyPendingReports();r=game.pendingReports[0];check(r.stageIndex===2&&r.lootDrops.some(d=>d.signatureDrop),'signature final only');r.dueAt=Date.now()-1;applyPendingReports();check(!game.pendingReports.length&&game.player.ready,'returns at end');check(game.materials['Defias Steel']===2,'final reward received');check(game.gold===100000-permanentExpeditionCost(run.quest,1),'single organizing fee');check(game.todayReports.at(-1).runComplete,'full clear');check(game.questDone[run.quest.templateKey]&&game.worldClearDays[run.quest.templateKey]===game.day,'clear recorded independently of dispatch');game.questDone={};renderQuests();check(game.questDone[run.quest.templateKey],'UI flag restored');const gold=game.gold;check(queueQuestReport(run.quest,['player'],0,'duplicate')===false&&game.gold===gold&&!game.pendingReports.length,'second successful run blocked without charge');save();
 const before=game.materials['Defias Steel'];applyPendingReports();check(game.materials['Defias Steel']===before,'no duplicate payout');
 // A partial stage ends the expedition and allows a fresh attempt from stage one.
 game.day++;game.questDone={};perkTier=()=>1;const q=v9WorldQuest(V9_LOC.deadmines);game.questDone[q.templateKey]=true;game.player.ready=false;queueQuestReport(q,['player'],0,'failure test');r=game.pendingReports[0];check(!r.growthAwards.length&&!r.lootDrops.length,'uncleared stage no rewards');r.dueAt=Date.now()-1;applyPendingReports();check(!game.pendingReports.length&&game.player.ready&&!game.questDone[q.templateKey],'failed run reset');
 perkTier=()=>2;queueQuestReport(q,['player'],0,'retry');check(game.pendingReports[0].stageIndex===0,'retry starts over');game.pendingReports=[];
 // Catch up all overdue stages, preserving exact total duration.
 queueQuestReport(q,['player'],0,'offline catchup');r=game.pendingReports[0];r.dueAt=Date.now()-r.stagePlan.duration-1;const reports=applyPendingReports();check(reports.length===3&&reports.at(-1).runComplete&&!game.pendingReports.length,'offline all stages');
 // World boss and raid lifecycle, not just declared counts.
 for(const id of ['twilight-grove','molten-core']){const loc=V9_LOC[id];if(!loc?.world)continue;const q=v9WorldQuest(loc);game.player.ready=false;queueQuestReport(q,['player'],0,'world run');const r=game.pendingReports[0],n=worldStageCount(q);r.dueAt=Date.now()-r.stagePlan.duration-1;const done=applyPendingReports();check(done.length===n&&done.at(-1).runComplete,'world lifecycle '+id)}
 // Unstaged reports remain untouched.
 game.pendingReports.push({kind:'operation',title:'Legacy report',questKind:'World Dungeon',questRank:0,outcome:'Success',payout:0,rep:0,partyIds:[],growthAwards:[],lootDrops:[{material:'Legacy Loot',count:4}],dueAt:Date.now()-1});applyPendingReports();check(game.materials['Legacy Loot']===4,'legacy reports retained');perkTier=old;Math.random=random;
 }''')
  page.evaluate('save()')
  page.reload(wait_until='networkidle')
  page.evaluate("() => { const q=v9WorldQuest(V9_LOC.deadmines),gold=game.gold; if(game.worldClearDays[q.templateKey]!==game.day||queueQuestReport(q,['player'],0,'reload duplicate')!==false||game.gold!==gold)throw Error('clear lock survives reload'); }")
  assert not errors,errors;b.close();print('PASS stage counts, split timers, single fee, busy party, final-only loot, save/reload, failure/retry, offline catchup, idempotence and legacy reports')
finally:s.shutdown()
