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
 game.hall=7;game.gold=100000;game.pendingReports=[];game.questBoard=[];game.questDone={};delete game.dailyDungeonDispatchedDay;game.player.ready=true;game.player.wound=null;const q=specialQuest('Dungeon');q.id=q.templateKey='dungeon-'+(game.day-1);game.questBoard.push(q,{...q,id:'duplicate'});ensureFeatureQuests();check(game.questBoard.filter(q=>q.kind==='Dungeon').length===1,'duplicates removed');
 const tier=perkTier,random=Math.random;perkTier=()=>2;Math.random=()=>.99;queueQuestReport(q,['player'],0,'daily dungeon');check(game.dailyDungeonDispatchedDay===game.day,'dispatch date recorded');game.questBoard=game.questBoard.filter(q=>q.kind!=='Dungeon');
 for(let i=0;i<5;i++){qlist();ensureFeatureQuests();check(!game.questBoard.some(q=>q.kind==='Dungeon'),'not replenished')}
 const gold=game.gold,count=game.pendingReports.length;check(queueQuestReport(specialQuest('Dungeon'),['player'],0,'duplicate')===false&&game.gold===gold&&game.pendingReports.length===count,'second dispatch blocked');
 game.pendingReports.at(-1).dueAt=Date.now()-1;applyPendingReports();game.questDone={};qlist();check(!game.questBoard.some(q=>q.kind==='Dungeon'),'return and cleared UI flags do not replenish');
 window.dailyDay=game.day;perkTier=tier;Math.random=random;save();
 }''')
  day=page.evaluate('dailyDay')
  page.reload(wait_until='networkidle')
  assert page.evaluate('game.dailyDungeonDispatchedDay')==day
  page.evaluate("() => {qlist();if(game.questBoard.some(q=>q.kind==='Dungeon'))throw Error('reload replenished');game.day++;game.questDone={};for(let i=0;i<4;i++)ensureFeatureQuests();if(game.questBoard.filter(q=>q.kind==='Dungeon').length!==1)throw Error('next day not exactly one');}")
  assert not errors,errors;b.close();print('PASS carried-over dungeon, duplicate cleanup, no refresh replenishment, atomic repeat block, return/reload lock and exactly one next day')
finally:s.shutdown()
