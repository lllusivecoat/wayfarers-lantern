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
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};game.gold=100000;game.hall=7;game.pendingReports=[];
 game.buildingList.push({uid:'tool-shop',key:'workshop',level:5});game.staffMembers.push({id:'tool-smith',name:'Smith',wage:2,buildingUid:'tool-shop',buildingKey:'workshop',professionXP:{Blacksmithing:275}});v9Sync();staffMigrate(game);
 for(const r of gatheringToolRecipes())for(const k of Object.keys(r.requirements))game.materials[k]=10000;
 check(gatheringToolRecipes().length===40,'40 recipes');check(gatheringQuest('Hunting').resource==='Meat','basic meat');game.permRanks={'gather-hunting':9};game.heroes.push({...structuredClone(game.player),id:'rank-test',rank:9,dead:false});check(gatheringQuest('Hunting').resource==='Primal Meat','high meat');
 game.player.ready=true;game.player.wound=null;game.player.equipment={};game.player.utilitySupplies={};game.player.gear=null;
 check(craftGatheringTool('Hunting-0')&&craftGatheringTool('Hunting-4')&&craftGatheringTool('Mining-4'),'craft');const tools=game.gear.filter(g=>g.gatherTool);tools.forEach((g,i)=>equipSlot('player','utility'+(i+1),g.id));
 const q=gatheringQuest('Hunting');check(gatheringToolReduction(q,[game.player])===5,'strongest only');check(gatheringToolReduction({kind:'Contract',profession:'Hunting'},[game.player])===0,'gather only');check(gatheringToolReduction({kind:'Gathering',profession:'Fishing'},[game.player])===0,'matching only');
 const before=tools.map(g=>g.durability),old=perkTier,random=Math.random;perkTier=()=>2;Math.random=()=>.99;queueQuestReport(q,['player'],0,'test');perkTier=old;Math.random=random;const r=game.pendingReports.at(-1);check(r.toolReduction===5,'report');check(tools[1].durability===before[1]-1&&tools[0].durability===before[0]&&tools[2].durability===before[2],'one wears');
 const stock=game.materials['Primal Meat']||0;r.dueAt=Date.now()-1;applyPendingReports();check(game.materials['Primal Meat']>stock,'meat delivered');check(tools[0].durability===before[0]&&tools[2].durability===before[2],'unrelated no wear');tools[1].durability=0;check(gatheringToolReduction(q,[game.player])===1,'broken fallback');save();
 }''' );assert not errors,errors;b.close();print('PASS meat tiers and delivery, 40 tool recipes, utility equip, matching/nonstacking/broken tool rules and durability; no page errors')
finally:s.shutdown()
