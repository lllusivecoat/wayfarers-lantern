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
 selectedTradeRoute='booty-bay';game.pendingReports=[];const h=game.player;h.ready=true;h.wound=null;h.gold=1000;for(const a of abilityKeys)h.abilities[a]=100;game.tradeParty=[h.id];
 game.gear.push({id:'sale-free',name:'Trade blade',price:100,durability:20,maxDurability:20},{id:'sale-owned',name:'Personal blade',price:100,heroOwner:h.id,durability:20,maxDurability:20});game.consumables=[{id:'sale-ration',name:'Trail ration',ration:true,uses:4,bonus:1}];
 const stock=tradeSaleStock();check(stock.some(r=>r.key==='gear:sale-free')&&!stock.some(r=>r.key==='gear:sale-owned'),'only guild gear');check(stock.find(r=>r.key==='consumables:sale-ration').count===4,'consumable uses');
 game.materials['Copper Ore']=10;game.tradeCargo={'gear:sale-free':1,'consumables:sale-ration':2,'Copper Ore':3};renderTrading();check(document.getElementById('outbound-cargo').textContent.includes('Trade blade'),'gear listed');
 const before=game.pendingReports.length,confirmOld=window.confirm;window.confirm=()=>false;dispatchTrade();check(game.pendingReports.length===before&&game.gear.some(g=>g.id==='sale-free'),'cancel reserves nothing');window.confirm=()=>true;
 const random=Math.random;Math.random=()=>.99;const report=dispatchTrade();Math.random=random;
 check(report&&report.cargo.length===3,'mixed manifest');check(!game.gear.some(g=>g.id==='sale-free')&&game.gear.some(g=>g.id==='sale-owned'),'gear removed once');check(game.consumables[0].uses===2&&game.materials['Copper Ore']===7,'quantities removed');check(report.payout>0&&report.summary.includes('Trade blade'),'sale valued and named');
 check(report.cargo.find(c=>c.material==='gear:sale-free').unitValue===40,'snapshot sale value');
 game.tradeParty=[h.id];dispatchTrade();check(game.pendingReports.length===before+1,'cannot dispatch again');window.confirm=confirmOld;save();
 }''')
  page.reload(wait_until='networkidle')
  assert page.evaluate("!game.gear.some(g=>g.id==='sale-free')")
  assert not errors,errors;b.close();print('PASS mixed gear/consumable/material cargo, owned gear exclusion, cancellation, dispatch removal, sale snapshots, repeat dispatch prevention and reload')
finally:s.shutdown()
