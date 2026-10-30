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
 game.pendingReports=[];game.gold=100000;game.hall=7;const h=game.player;h.ready=true;h.wound=null;h.equipment={};h.gear=null;h.utilitySupplies={};
 game.gatheringExpertiseVersion=1;game.professionXP={};
 for(let level=1;level<=10;level++){const points=5*(level-1)*level/2;game.professionXP.Mining=points;check(gatheringExpertise('Mining').level===level,'threshold '+level);if(points){game.professionXP.Mining=points-1;check(gatheringExpertise('Mining').level===level-1,'before threshold '+level)}}
 game.professionXP.Mining=0;const q=gatheringQuest('Mining');q.rank=9;q.dc=28;q.resourceQtyBase=20;const base=v9ResQty(q,'Success',5);game.professionXP.Mining=225;const extra=v9ResQty(q,'Success',5);check(extra===Math.floor(base*1.45),'yield cap');game.professionXP.Mining=1000;check(v9ResQty(q,'Success',5)===extra,'above cap');check(gatheringExpertise('Fishing').level===1,'separate professions');
 game.professionXP.Mining=4;const tier=perkTier,random=Math.random;Math.random=()=>.99;perkTier=()=>2;queueQuestReport(q,['player'],0,'gather test');const report=game.pendingReports.at(-1),qty=report.resourceQty;check(game.professionXP.Mining===4,'no dispatch practice');report.dueAt=Date.now()-1;applyPendingReports();check(game.professionXP.Mining===8&&gatheringExpertise('Mining').level===2,'rank success practice and carry');check(report.resourceQty===qty,'sealed yield unchanged');applyPendingReports();check(game.professionXP.Mining===8,'no duplicate practice');
 perkTier=()=>3;queueQuestReport(q,['player'],0,'exceptional');game.pendingReports.at(-1).dueAt=Date.now()-1;applyPendingReports();check(game.professionXP.Mining===16,'exceptional double practice');
 for(const result of [0,1]){perkTier=()=>result;queueQuestReport(q,['player'],0,'no practice');game.pendingReports.at(-1).dueAt=Date.now()-1;applyPendingReports();check(game.professionXP.Mining===16,'no failure/partial practice')}
 delete game.gatheringExpertiseVersion;game.professionXP.Fishing=12;const migrated=gatheringExpertise('Fishing');check(migrated.level>=5&&migrated.points>=12,'old level preserved');const saved=migrated.points;gatheringExpertise('Fishing');check(game.professionXP.Fishing===saved,'migration once');
 renderGathering();check(document.getElementById('gathering-list').querySelectorAll('progress').length===8,'all eight trackers');perkTier=tier;Math.random=random;save();window.expectedFishing=saved;
 }''')
  fishing=page.evaluate('expectedFishing')
  page.reload(wait_until='networkidle')
  assert page.evaluate('game.professionXP.Fishing')==fishing
  assert page.evaluate("gatheringExpertise('Mining').level")>=3
  assert not errors,errors;b.close();print('PASS expertise thresholds, yield cap and party scaling, separate professions, returned practice, carryover, exceptional/failure outcomes, idempotence, legacy migration, UI and reload')
finally:s.shutdown()
