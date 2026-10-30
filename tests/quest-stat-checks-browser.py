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
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 game.hall=7;game.buildingList.push({uid:'cost-shop',key:'workshop',level:5});game.staffMembers.push({id:'cost-smith',name:'Smith',wage:2,buildingUid:'cost-shop',buildingKey:'workshop',professionXP:{Blacksmithing:275}});v9Sync();staffMigrate(game);
 const h=game.player;h.ready=true;h.wound=null;h.equipment={};h.gear=null;h.utilitySupplies={};h.perks=[];h.traits=[];h.preparedBonus=0;h.preparedSupplyBonuses={ration:0,potion:0,legacy:0};h.abilities.str=10;h.abilities.con=20;game.pendingReports=[];
 for(const profession of gatherProfessions){const q=gatheringQuest(profession);check(q.gatherAbilities?.length===2&&q.gatherAbilities[0]!==q.gatherAbilities[1],'two stats '+profession);check(v9StatName(q).includes(' + '),'two-stat label');}
 const q=gatheringQuest('Mining');q.rank=0;const random=Math.random;Math.random=()=>.5;const pk=perkPrepare(q,[h],0,false),tb=tbwPrepare(q,[h]),result=resolveGatheringChecks(q,[h],14,pk,tb,0);check(result.phases.length===2&&result.phases[0].checks.length===1&&result.phases[1].checks.length===1,'separate rolls');check(result.phases[1].checks[0].modifier-result.phases[0].checks[0].modifier===5,'secondary readiness used');check(result.tier===Math.floor((result.phases[0].tier+result.phases[1].tier)/2),'combined outcome');check(pk.q===q,'context restored');
 game.gold=10000;game.consumables=[{id:'dual-food',name:'Rations',ration:true,bonus:2,uses:3}];equipUtilitySupply(h.id,'utility1','supply:food:dual-food');const gold=game.gold;queueQuestReport(q,[h.id],0,'two checks');const r=game.pendingReports.at(-1);check(r.gatheringChecks.length===2&&game.gold===gold-permanentExpeditionCost(q,1),'one report/fee');check(h.utilitySupplies.utility1.uses===2&&r.suppliesUsed.length===1,'one utility charge');check(r.growthAwards.length<=1,'XP not doubled');showReportDetails(r);check(document.getElementById('report-detail-text').textContent.includes('CON check'),'full report phases');
 check(v9RollStat('Diplomatic courier','wis')==='cha','diplomatic CHA');Math.random=()=>.9;for(const label of ['Escort / delivery','Investigation / observation','Exploration / rescue'])check(v9RollStat(label,'str')==='cha','social CHA '+label);
 delete game.chaOfferDay;game.questBoard=[{id:'social-test',templateKey:'social-test',kind:'Contract',label:'Escort / delivery',ability:'wis',expiresDay:game.day+1}];ensureFeatureQuests();check(game.questBoard.find(q=>q.id==='social-test').ability==='cha','unaccepted social offer uses CHA');const sealed=JSON.stringify(r);ensureFeatureQuests();check(JSON.stringify(r)===sealed,'sealed report unchanged');Math.random=random;game.statFixture=r;save();
 }''')
  page.reload(wait_until='networkidle')
  assert page.evaluate('game.statFixture.gatheringChecks.length')==2
  page.evaluate('showReportDetails(game.statFixture)')
  assert 'CON check' in page.locator('#report-detail-text').inner_text()
  assert not errors,errors;b.close();print('PASS eight stat pairs, independent phase modifiers/results, one fee/charge/XP award, report/reload, social CHA weights and sealed-report preservation')
finally:s.shutdown()
