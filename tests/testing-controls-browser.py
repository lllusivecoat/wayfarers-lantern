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
 game.hall=7;game.gold=100000;game.pendingReports=[];game.todayReports=[{title:'Earlier report',outcome:'Success',summary:'Preserve this report'}];game.heroes=[];game.consumables=[];game.alchemyPotions=[];game.fieldKits=[];
 const h=game.player;h.ready=true;h.wound=null;h.equipment={};h.gear=null;h.utilitySupplies={};for(const a of abilityKeys)h.abilities[a]=100;
 const random=Math.random,tier=perkTier;Math.random=()=>.99;perkTier=()=>2;
 game.pendingReports.push({kind:'operation',questKind:'Contract',questRank:0,title:'Timed contract',outcome:'Success',payout:7,rep:0,partyIds:[],growthAwards:[],lootDrops:[{material:'Testing Ore',count:2}],summary:'Normal contract result.',dueAt:Date.now()+600000,dispatchedDay:game.day});
 game.pendingReports.push({kind:'promotion',targetId:h.id,title:'Do not accelerate training',outcome:'Success',dueAt:Date.now()+600000});
 const q=v9WorldQuest(V9_LOC.deadmines);queueQuestReport(q,[h.id],0,'test expedition');const day=game.day,gold=game.gold,applicants=JSON.stringify(game.applicants),projects=JSON.stringify(game.constructionProjects),kitchen=JSON.stringify(game.kitchenProduction);renderReports();check(!document.getElementById('test-complete-quests').disabled,'button available');
 const done=testCompleteAllQuests();check(done.length===4&&done.filter(r=>r.stagePlan).length===3,'all world stages plus contract');check(game.pendingReports.length===1&&game.pendingReports[0].kind==='promotion','training timer untouched');check(game.day===day&&game.gold===gold+7,'day unchanged and payout once');check(JSON.stringify(game.applicants)===applicants&&JSON.stringify(game.constructionProjects)===projects&&JSON.stringify(game.kitchenProduction)===kitchen,'no daily arrivals/construction/production');check(game.materials['Testing Ore']===2,'normal loot');check(game.todayReports.length===5&&game.todayReports[0].title==='Earlier report','old and new reports visible');check(h.ready&&game.worldClearDays[q.templateKey]===day,'hero returned and daily lock');check(document.getElementById('test-quest-status').textContent.includes('Day '+day+' unchanged'),'status shown');testCompleteAllQuests();check(game.gold===gold+7&&game.materials['Testing Ore']===2,'no repeat awards');
 selectedTradeRoute='booty-bay';game.materials['Copper Ore']=2;game.tradeCargo={'Copper Ore':2};game.tradeParty=[h.id];const convoy=dispatchTrade();const before=game.gold;const tradeDone=testCompleteAllQuests();check(tradeDone.length===1&&tradeDone[0].kind==='trade'&&game.gold===before+convoy.payout&&game.day===day,'convoy return without day change');
 Math.random=random;perkTier=tier;save();window.testingDay=day;
 }''')
  day=page.evaluate('testingDay')
  page.reload(wait_until='networkidle')
  assert page.evaluate('game.day')==day
  assert page.evaluate("!game.pendingReports.some(r=>r.kind==='operation'||r.kind==='trade')")
  assert not errors,errors;b.close();print('PASS all quest/stage/convoy timers, normal results, day/arrivals/buildings/production unchanged, old reports retained, no duplicate awards, training untouched and reload')
finally:s.shutdown()
