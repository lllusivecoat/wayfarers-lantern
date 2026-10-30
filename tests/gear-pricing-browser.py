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
 const checkOld=game.gear.length;
 let count=0;
 for(const r of renderGearCatalog()){
 const g={...r,craftRequirements:r.requirements,durability:r.durability,maxDurability:r.durability};const q=gearEconomyQuote(g);
 const sum=Object.entries(r.requirements).reduce((n,[k,v])=>n+v*(tradeValues[k]||2),0);
 check(q.ingredientValue===sum&&q.convoyValue===Math.ceil(sum*1.35),'ingredient premium '+r.id);
 check(gearEconomyQuote({...g,durability:0}).convoyValue===0,'broken zero');check(gearEconomyQuote({...g,durability:g.maxDurability/2}).convoyValue===Math.floor(q.fullValue/2),'condition scales');count++;
 }
 const h=game.player;h.ready=true;h.equipment={};game.gold=10000;
 const g={id:'economy-test',name:'Test blade',family:'sword',kind:'Weapon',tier:0,price:10000,purchaseValue:10000,owner:h.id,durability:25,maxDurability:25,craftRequirements:{'Copper Ore':2}};game.gear.push(g);
 check(gearEconomyQuote(g).convoyValue===6,'basic example');check(gearSellQuote(g.id).value===3,'buyback capped below export');
 const snapshot=JSON.stringify(gearEconomyQuote(g));game.staffMembers.find(s=>s.id==='cost-smith').professionXP.Blacksmithing=0;check(JSON.stringify(gearEconomyQuote(g))===snapshot,'snapshot not repriced by staff');
 check(gearEconomyQuote({price:100,durability:10,maxDurability:10}).convoyValue===40,'unknown legacy fallback');
 save();
 }''')
  page.reload(wait_until='networkidle')
  assert page.evaluate("gearEconomyQuote(game.gear.find(g=>g.id==='economy-test')).convoyValue===6")
  assert not errors,errors;b.close();print('PASS all recipe export premiums, wear/broken pricing, buyback cap, immutable paid costs, legacy fallback and save/reload')
finally:s.shutdown()
