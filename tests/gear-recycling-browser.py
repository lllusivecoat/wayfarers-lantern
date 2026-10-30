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
 const h=game.player;h.className='Warrior';h.spec='Arms';h.ready=true;h.gold=1000;h.equipment={};game.gold=1000;
 const g={id:'sell-test',name:'Old blade',kind:'Weapon',family:'greatsword',hands:2,tier:0,bonus:1,price:100,purchaseValue:100,madeByPlayer:true,durability:20,maxDurability:40,owner:h.id,craftRequirements:{'Copper Ore':8,'Heritage Ore':2,'World Dungeon Relic':2}};game.gear.push(g);h.equipment.weapon=g.id;h.gear=g.id;
 const oldGold=h.gold,treasury=game.gold;
 check(gearSellQuote(g.id).value===12,'condition adjusted value');check(gearSalvageQuote(g.id).reason.includes('Sell'),'owned salvage blocked');
 equipSlot(h.id,'weapon','');check(g.heroOwner===h.id,'stored ownership retained');equipSlot(h.id,'weapon',g.id);check(h.gold===oldGold,'own gear reequips free');
 const confirmation=window.confirm;window.confirm=()=>false;check(!sellHeroGear(g.id)&&g.owner===h.id,'cancel sale');window.confirm=()=>true;
 h.ready=false;check(!sellHeroGear(g.id),'away blocked');h.ready=true;
 check(sellHeroGear(g.id)&&h.gold===oldGold+12&&game.gold===treasury-12,'sale transfer');check(!g.owner&&!g.heroOwner&&!h.equipment.weapon&&!h.gear,'references cleared');check(!sellHeroGear(g.id),'repeat sale blocked');
 const q=gearSalvageQuote(g.id);check(q.materials['Copper Ore']===2&&!q.materials['Heritage Ore']&&!q.materials['World Dungeon Relic'],'ordinary only');const copper=game.materials['Copper Ore']||0;
 window.confirm=()=>false;check(!dismantleGuildGear(g.id),'cancel dismantle');window.confirm=()=>true;check(dismantleGuildGear(g.id)&&!game.gear.some(x=>x.id===g.id),'dismantled');check(game.materials['Copper Ore']===copper+2&&!dismantleGuildGear(g.id),'resources once');window.confirm=confirmation;
 save();
 }''')
  page.reload(wait_until='networkidle')
  assert page.evaluate("!game.gear.some(g=>g.id==='sell-test')")
  assert not errors,errors;b.close();print('PASS ownership, free re-equip, condition pricing, confirmations, away checks, gold transfer, reference cleanup, rare exclusion, salvage once and reload')
finally:s.shutdown()
