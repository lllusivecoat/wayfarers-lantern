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
  page.wait_for_function("typeof WL_ECONOMY_BUILDINGS==='object' && document.readyState==='complete'")
  page.evaluate('''() => {
 const check=(x,msg)=>{if(!x)throw Error(msg)};game.gold=100000;game.hall=7;game.reputation=10000;
 const h=game.player;h.gold=0;h.ready=true;h.wound=null;for(const k of abilityKeys)h.abilities[k]=100;
 const helper=structuredClone(h);helper.id='gold-helper';helper.name='Helper';helper.rank=9;game.heroes.push(helper);
 const resolve=resolveGatheringChecks;let outcome=2;
 resolveGatheringChecks=(q,party)=>({tier:outcome,checks:party.map(m=>({id:m.id,name:m.name,roll:18,modifier:20,total:38,success:true})),phases:[]});
 for(let rank=0;rank<10;rank++)for(outcome=0;outcome<4;outcome++){
  game.goldGatheringDays={};game.pendingReports=[];h.ready=helper.ready=true;h.dead=helper.dead=false;h.gold=helper.gold=0;game.permRanks['gather-salvage-gold']=rank;
  const q=questById('gather-salvage-gold');check(v9QuestMins(q)===45,'fixed timing');const treasury=game.gold;
  queueQuestReport(q,[h.id,helper.id],0,'gold test');const r=game.pendingReports.at(-1),expected=Math.floor([40,60,80,100,125,150,175,200,225,250][rank]*1.25*[0,.5,1,1.5][outcome]);
  check(r.memberCut===expected&&r.memberAwards.reduce((n,a)=>n+a.amount,0)===expected,'100 percent hero distribution rank '+rank+' qrank '+q.rank+' outcome '+outcome+' got '+r.memberCut+' expected '+expected);check(!r.payout&&!r.rep&&!r.resourceQty&&!r.lootDrops.length&&!r.growthAwards.length,'no other rewards');check(!heroEligible(h,q),'daily eligibility');const n=game.pendingReports.length;queueQuestReport(q,[h.id],0,'duplicate');check(game.pendingReports.length===n,'backend repeat blocked');
  const cost=r.organizingCost;r.dueAt=Date.now()-1;applyPendingReports();check(h.gold+helper.gold===expected,'actual purse payments');check(game.gold===treasury-cost,'guild only pays organising cost');
 }
 resolveGatheringChecks=resolve;renderQuests();check(document.getElementById('gather-quest-list').textContent.includes('Salvage for Coin'),'gathering card');save();
 }''')
  page.reload(wait_until='networkidle');page.wait_for_function("document.readyState==='complete'")
  assert page.evaluate("!heroEligible(game.player,questById('gather-salvage-gold'))")
  assert not errors,errors;b.close();print('PASS all ranks/outcomes, 100% hero-only gold, real purse payments, organising costs, fixed timing, daily limits and persistence')
finally:s.shutdown()
