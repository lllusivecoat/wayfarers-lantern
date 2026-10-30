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
 selectedTradeRoute='booty-bay';game.pendingReports=[];game.gear=[];game.consumables=[];game.alchemyPotions=[];game.fieldKits=[];game.materials={};game.tradeCargo={};const h=game.player;h.ready=true;h.wound=null;for(const a of abilityKeys)h.abilities[a]=100;game.tradeParty=[h.id];
 const gear={name:'Traveler Mantle',kind:'Cape',family:'cape',tier:0,bonus:1,stat:'WIS',price:100,durability:25,maxDurability:25};for(let i=0;i<3;i++)game.gear.push({...gear,id:'stack-'+i});game.gear.push({...gear,id:'worn',durability:10},{...gear,id:'better',bonus:2},{...gear,id:'personal',heroOwner:h.id});
 game.alchemyPotions=[{id:'p1',recipe:'field',uses:2},{id:'p2',recipe:'field',uses:3},{id:'p3',recipe:'field',uses:3}];
 let groups=tradeSaleGroups(),g=groups.find(r=>r.count===3&&r.type==='gear'),p=groups.find(r=>r.type==='supply');check(g&&g.members.length===3,'gear grouped');check(p.count===8&&p.members.length===3,'supply uses grouped');check(groups.filter(r=>r.type==='gear').length===3,'variants separate and personal excluded');
 renderTrading();let rows=tradeSaleGroups(),i=rows.findIndex(r=>r.type==='gear'&&r.count===3),j=rows.findIndex(r=>r.type==='supply');
 const select=(i,n)=>{const box=document.querySelector(`[data-sale-check="${i}"]`),input=document.querySelector(`[data-sale-count="${i}"]`);box.checked=true;input.value=n;box.dispatchEvent(new Event('change'))};select(i,2);select(j,6);check(tradeCargo().reduce((n,c)=>n+c.count,0)===8,'stack quantities allocate');check(document.getElementById('trade-preview').textContent.includes('2 Traveler Mantle'),'combined preview');
 save();window.groupGear=i;window.groupSupply=j;
 }''')
  page.reload(wait_until='networkidle')
  page.evaluate("""() => {const check=(ok,msg)=>{if(!ok)throw Error(msg)};selectedTradeRoute='booty-bay';renderTrading();const groups=tradeSaleGroups(),i=groups.findIndex(r=>r.type==='gear'&&r.count===3),j=groups.findIndex(r=>r.type==='supply');check(document.querySelector(`[data-sale-count="${i}"]`).value==='2','gear selection saved');check(document.querySelector(`[data-sale-count="${j}"]`).value==='6','supply selection saved');const random=Math.random;Math.random=()=>.99;const r=dispatchTrade();Math.random=random;check(r&&r.cargo.reduce((n,c)=>n+c.count,0)===8,'mixed stack dispatch');check(game.gear.filter(g=>g.id.startsWith('stack-')).length===1,'two gear consumed');check(game.alchemyPotions.reduce((n,p)=>n+p.uses,0)===2,'six uses consumed');check(game.gear.some(g=>g.id==='personal')&&game.gear.some(g=>g.id==='better')&&game.gear.some(g=>g.id==='worn'),'variants and ownership retained');}""")
  assert not errors,errors;b.close();print('PASS gear/use stacking, variants/ownership, quantity allocation, combined preview, saved selections and exact dispatch removal')
finally:s.shutdown()
