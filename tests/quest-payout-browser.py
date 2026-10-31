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
 const h=game.player;h.ready=true;h.wound=null;h.traits=[];h.perks=[];h.equipment={};h.gear=null;h.utilitySupplies={};h.preparedBonus=0;game.pendingReports=[];game.gold=10000;game.market={day:game.day,n:0};
 for(let i=0;i<30;i++){const market=v9Market({kind:'Contract',rank:1});check(market.gold===1&&v9Pay(77,'Success',market)===77,'full payout attempt '+i)}game.day++;check(v9Market({kind:'Contract',rank:1}).gold===1&&game.market.n===1,'next day reset');
 const rates=[.03,.03,.04,.04,.05,.05,.07,.07,.10,.12];for(let rank=0;rank<10;rank++)check(contractRateForQuest({rank})===rates[rank],'member rate '+rank);
 const party=[{id:'p1',traits:[]},{id:'p2',traits:[]},{id:'p3',traits:[]}],cut=calculatePartyCompensation({kind:'Contract',rank:1},party,77);check(cut.total===9&&cut.awards.every(a=>a.amount===3),'77gp shares');
 const random=Math.random,tier=perkTier;Math.random=()=>.99;perkTier=()=>2;game.market={day:game.day,n:100};const q={id:'full-pay-test',templateKey:'full-pay-test',kind:'Contract',rank:1,ability:'str',dc:10,reward:77,goldRewardVersion:1,rep:1,minParty:1,title:'Full pay',desc:'Test contract'};queueQuestReport(q,[h.id],0,'full pay');const r=game.pendingReports.at(-1);check(r.payout+r.memberCut===77&&r.memberAwards[0].amount===3,'actual late-day report full pay');const gold=game.gold;r.dueAt=Date.now()-1;applyPendingReports();check(game.gold===gold+74,'treasury full net');Math.random=random;perkTier=tier;save();
 }''')
  page.reload(wait_until='networkidle')
  assert page.evaluate("v9Market({kind:'Contract',rank:1}).gold") == 1
  assert not errors,errors;b.close();print('PASS 30+ paid dispatches without gold decay, day reset, all rank cuts, 77gp share example, actual report/treasury payout and reload')
finally:s.shutdown()
