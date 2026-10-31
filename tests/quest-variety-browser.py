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
  page.wait_for_function("typeof WL_QUEST_VARIETY==='object' && document.readyState==='complete'")
  assert not errors,errors
  page.evaluate('''() => {
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 game.hall=7;game.gold=100000;game.reputation=10000;game.pendingReports=[];game.questBoard=[];game.questDone={};game.player.rank=9;game.heroes=[{...game.player,id:'variety-top',name:'Veteran',rank:9,level:20,equipment:{},utilitySupplies:{},perks:[],traits:[]}];
 for(let hall=1;hall<=7;hall++)for(const rep of [0,200,1000,10000]){game.hall=hall;game.reputation=rep;const q=specialQuest('Dungeon'),rank=Math.max(0,Math.min(maxQuestRankForHall(),missionRankCeiling()));check(q.rank===rank&&q.dc===12+rank&&q.reward===60+rank*30,'Hall/rep scaling '+hall+'/'+rep)}game.hall=7;game.reputation=10000;
 const discovered=JSON.stringify(game.world.discovered),dungeonTitles=new Set(),raidTitles=new Set(),bossTitles=new Set();
 for(let day=1;day<=12;day++){game.day=day;game.questBoard=[];game.questDone={};generateDailyArrivals();const offers=qlist().filter(q=>q.kind==='Contract');for(const stat of abilityKeys)check(offers.some(q=>q.ability===stat),'daily stat '+day+' '+stat);const ids=new Set(game.questBoard.map(q=>q.id));check(ids.size===game.questBoard.length,'unique IDs');const snapshot=JSON.stringify(game.questBoard);for(let i=0;i<3;i++)qlist();check(JSON.stringify(game.questBoard)===snapshot,'refresh stable');
 const q=specialQuest('Dungeon'),r=q.rank;check(q.dc===12+r&&q.reward===60+30*r&&q.rep===4+r&&q.minParty===5&&q.maxParty===5,'dungeon scaling');check(worldStageCount(q)===1&&q.encounters.length===1,'normal single stage');dungeonTitles.add(q.title);
 const raid=specialQuest('Raid');check(raid.dc===13+raid.rank&&raid.reward===250+75*raid.rank&&raid.minParty===20,'raid scaling');raidTitles.add(raid.title);
 const boss=specialQuest('World Boss');check(boss.dc===14+boss.rank&&boss.reward===400+100*boss.rank&&boss.minParty===12&&boss.maxParty===12,'boss scaling and role profile');bossTitles.add(boss.title);
 for(const q of offers.filter(q=>q.statCoverage)){const t=V9_TYPES.find(t=>t.label===q.label);check(q.dc===t.dc+2*q.rank&&q.reward===Math.ceil((t.reward+30*q.rank)*1.2),'contract scale and reward boost once')}
 }
 check(dungeonTitles.size===12&&raidTitles.size===6&&bossTitles.size===6,'rotation diversity');check(JSON.stringify(game.world.discovered)===discovered,'no automatic discoveries');
 const titles=new Set();for(let i=0;i<144;i++)titles.add(makeGeneratedQuest(i%6+1,3,'variety-test').title);check(titles.size>=40,'expanded contract titles');
 const permanent=v9WorldQuest(V9_LOC.deadmines);for(const d of WL_DUNGEONS.all){const world=v9WorldQuest(V9_LOC[d.id]);check(world.rank===d.rank&&world.signatureMaterial===d.material&&!world.dailyVariant,'fixed world dungeon '+d.id)}check(permanent.title==='The Deadmines'&&permanent.rank===0&&permanent.signatureMaterial==='Defias Steel','permanent dungeon unchanged');
 const before=game.questBoard.length;game.questBoard=game.questBoard.filter(q=>q.kind!=='Contract');for(let i=0;i<3;i++)ensureFeatureQuests();check(!game.questBoard.some(q=>q.kind==='Contract'),'no same-day contract refill');
 // Stable pending results and today's variants survive save/reload.
 game.questBoard.push({...makeGeneratedQuest(1,3),id:'reload-contract',templateKey:'reload-contract'});const q=specialQuest('Dungeon'),tier=perkTier,random=Math.random;perkTier=()=>2;Math.random=()=>.99;game.player.ready=true;queueQuestReport(q,['player'],0,'daily variant');const r=game.pendingReports.at(-1);check(r.dailyBossNames.length===1&&r.dailyBossNames[0]===q.encounters[0].name,'named boss recorded');showReportDetails(r);check(document.querySelector('.report-fight .boss-name').textContent===r.dailyBossNames[0],'named boss report');perkTier=tier;Math.random=random;save();window.rotationTitle=q.title;window.sealedSnapshot=JSON.stringify(r);window.reloadedOffer=game.questBoard.find(q=>q.id==='reload-contract').title;
 }''')
  title=page.evaluate('rotationTitle');report=page.evaluate('sealedSnapshot');offer=page.evaluate('reloadedOffer')
  page.reload(wait_until='networkidle')
  page.wait_for_function("typeof WL_QUEST_VARIETY==='object' && document.readyState==='complete'")
  assert page.evaluate("specialQuest('Dungeon').title")==title,(title,page.evaluate("({day:game.day,title:specialQuest('Dungeon').title,loaded:typeof WL_QUEST_VARIETY})"),errors)
  assert page.evaluate("JSON.stringify(game.pendingReports.find(r=>r.dailyBossNames))")==report
  assert page.evaluate("game.questBoard.find(q=>q.id==='reload-contract').title")==offer
  assert not errors,errors;b.close();print('PASS 12-day six-stat coverage, 12/6/6 rotations, numeric scaling/roles, reward boost once, title diversity, stable refresh, no refill/discovery bypass, boss reports and reload')
finally:s.shutdown()
