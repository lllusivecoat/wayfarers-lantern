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
 const check=(x,msg)=>{if(!x)throw Error(msg)};
 game.gold=100000;game.reputation=0;
 const keys=['supplyDepot','contractsOffice','adventurersEndowment'];
 for(const key of keys){game.hall=3;check(v9CanBuild(v9Def(key)).includes('Hall Level 4'),'Hall4 gate');game.hall=4;check(v9CanBuild(v9Def(key))==='','Hall4 no reputation gate');check(buildExtension(key)==='','build');completeConstructionProject(game.constructionProjects.find(p=>p.key===key));check(v9CanBuild(v9Def(key))==='Unique building','unique');const i=v9Inst(key)[0];game.staffMembers.push({id:key+'-st',name:key,wage:2,buildingUid:i.uid,buildingKey:key,professionXP:{}})}staffMigrate(game);v9Sync();
 check(buildingUpgradeCap(4,'supplyDepot')===2&&buildingUpgradeCap(5,'supplyDepot')===3&&buildingUpgradeCap(6,'supplyDepot')===4&&buildingUpgradeCap(7,'supplyDepot')===5,'new caps');check(buildingUpgradeCap(4)===3,'old cap preserved');
 check(v9UpCost('supplyDepot',5)===1800&&v9UpCost('contractsOffice',2)===650&&v9UpCost('adventurersEndowment',3)===1600,'costs');
 const i=v9Inst('supplyDepot')[0];i.level=2;check(upgradeBuilding(i.uid)==='hall','backend cap');game.hall=5;check(upgradeBuilding(i.uid)==='ok'||projectForBuilding(i.uid),'permitted upgrade');completeConstructionProject(projectForBuilding(i.uid));
 game.hall=7;for(const key of keys)v9Inst(key)[0].level=5;
 const logistician=buildingStaff('supplyDepot');logistician.professionXP.Logistics=75;
 const negotiator=buildingStaff('contractsOffice');negotiator.professionXP.Negotiation=275;
 const steward=buildingStaff('adventurersEndowment');steward.professionXP.Stewardship=275;
 check(Math.abs(WL_ECONOMY_BUILDINGS.depot()-.55)<1e-9,'5% by Logistics5');check(Math.abs(WL_ECONOMY_BUILDINGS.office()-.25)<1e-9,'maxgold25');
 logistician.professionXP.Logistics=275;check(WL_ECONOMY_BUILDINGS.discount('supplyDepot')===.2,'Logistics10 upkeep20');check(Math.abs(WL_ECONOMY_BUILDINGS.depot()-.55)<1e-9,'no yield beyond5');
 game.professionXP.Mining=225;game.gatheringExpertiseVersion=1;
 const support=WL_ECONOMY_BUILDINGS.snapshot({kind:'Gathering',profession:'Mining'});
 const record=(kind='Gathering')=>({kind:'operation',title:'Fixture',questKind:kind,questRank:2,outcome:'Success',payout:0,rep:0,partyIds:[],casualties:[],wounds:{},resource:'Copper Ore',resourceQty:14,resourceBaseQty:10,profession:kind==='Gathering'?'Mining':undefined,lootDrops:[],summary:'Recovered 14 Copper Ore.',extendedSummary:'Recovered 14 Copper Ore.',economySupport:structuredClone(support),dueAt:Date.now()-1});
 let r=record();game.pendingReports=[r];const before=game.materials['Copper Ore']||0;applyPendingReports();check(r.resourceQty===20,'additive +100 not multiplicative');check(game.materials['Copper Ore']-before===20,'actual warehouse bonus');check(r.extendedSummary.includes('Recovered 20 Copper Ore.'),'report agrees');const xp=logistician.professionXP.Logistics;WL_ECONOMY_BUILDINGS.settle(r);check(logistician.professionXP.Logistics===xp&&r.resourceQty===20,'idempotent');
 game.depotMaterialCredits={};let sum=0;for(let n=0;n<20;n++){const loot=record('Contract');loot.economySupport.expertise=0;loot.resourceQty=0;loot.lootDrops=[{material:'Exclusive Relic',count:1}];WL_ECONOMY_BUILDINGS.settle(loot);sum+=loot.lootDrops[0].count}check(sum===31,'fraction carry 20 items +55%=31');check(game.logisticsService.count===3,'max three service practice/day');
 game.logisticsService={day:game.day,count:0};for(let n=0;n<3;n++){const stage=record('World Dungeon');stage.stagePlan={id:'practice-run'};WL_ECONOMY_BUILDINGS.settle(stage)}check(game.logisticsService.count===1,'one practice per world run');
 const partial=record();partial.outcome='Partial Success';const count=game.logisticsService.count;WL_ECONOMY_BUILDINGS.settle(partial);check(game.logisticsService.count===count,'partial no Logistics practice');
 const old=record();delete old.economySupport;WL_ECONOMY_BUILDINGS.settle(old);check(old.resourceQty===14,'legacy rewards preserved');
 const q={kind:'Contract',reward:100,rank:2};check(v9Pay(q.reward*v9PayoutMul(q),'Success',{gold:1})===125,'office fullgold');check(v9Pay(q.reward*v9PayoutMul(q),'Partial Success',{gold:1})===62,'office partialgold');check(v9PayoutMul({...q,persistent:true})===1,'no funded gold');
 // Real dispatch seals the support, and gathering partial pays half the boosted base.
 const h=game.player;h.ready=true;h.dead=false;for(const k of abilityKeys)h.abilities[k]=100;
 const gather=resolveGatheringChecks;resolveGatheringChecks=(q,party)=>({tier:1,checks:party.map(m=>({id:m.id,name:m.name,roll:15,modifier:20,total:35,success:true})),phases:[]});
 const mission={...gatheringQuest('Mining'),rank:2,resourceQtyBase:6};game.pendingReports=[];
 queueQuestReport(mission,[h.id],0,'economy dispatch');let queued=game.pendingReports.at(-1);check(queued.economySupport.depot===.55,'dispatch sealed support');
 resolveGatheringChecks=gather;game.depotMaterialCredits={};const priorOre=game.materials['Copper Ore']||0;queued.dueAt=Date.now()-1;applyPendingReports();check(queued.resourceQty===8&&game.materials['Copper Ore']-priorOre===8,'real partial boosted warehouse');h.ready=true;
 game.heroes=[{...structuredClone(game.player),id:'injured',name:'Injured',gold:0,wound:{tier:1},ready:false},{...structuredClone(game.player),id:'fallen',name:'Fallen',gold:0,dead:true}];game.player.gold=0;
 const day=game.day;nextDay();check(game.day===day+1&&game.player.gold===5&&game.heroes[0].gold===5&&game.heroes[1].gold===0,'daily all living only');check(game.endowmentReport.total===10,'daily report');const paid=game.player.gold;completeStaffWorkDay();check(game.player.gold===paid,'no duplicate payout');
 check(game.endowmentReport.awards.length===2,'individual awards');
 const previousXP=logistician.professionXP.Logistics;game.gold=0;nextDay();check(game.player.gold===paid,'unpaid day no payout');check(logistician.professionXP.Logistics===previousXP,'unpaid no work practice');
 renderBuildings();renderStaffTab();check(document.getElementById('staff-roster').textContent.includes('Logistics'),'staff tracker');save();
 }''')
  page.reload(wait_until='networkidle');page.wait_for_function("typeof WL_ECONOMY_BUILDINGS==='object'")
  assert page.evaluate('game.endowmentReport.total')==10
  assert page.evaluate("Object.values(game.depotMaterialCredits).every(n=>n>=0&&n<1)")
  assert not errors,errors;b.close();print('PASS economy building gates/costs, additive yields, credits, real warehouse deposits, daily grants, work/service practice, limits, reports and persistence')
finally:s.shutdown()
