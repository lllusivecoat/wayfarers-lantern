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
 const smith=game.staffMembers.find(s=>s.id==='cost-smith');
 for(const xp of [0,75,275]){smith.professionXP.Blacksmithing=xp;for(let t=0;t<8;t++){
 const one=gearCraftInfo('sword-'+t).requirements,two=gearCraftInfo('greatsword-'+t).requirements;
 check(Object.keys(one).length===Object.keys(two).length,'same materials');for(const [k,n] of Object.entries(one))check(two[k]===2*n,'twohand materials '+xp+' '+t+' '+k);
 }}
 const h=game.player;h.ready=true;h.gold=10000;h.equipment={};h.className='Warrior';h.spec='Arms';
 const one={id:'cost-one',name:'Sword',kind:'Weapon',family:'sword',tier:7,bonus:4,madeByPlayer:true,owner:h.id,durability:50,maxDurability:60,enhancement:0,enhancementVersion:2};
 const two={...one,id:'cost-two',name:'Greatsword',family:'greatsword',hands:2};game.gear.push(one,two);
 for(const step of [0,1,2,3]){one.enhancement=two.enhancement=step;const a=gearEnhancementQuote(one.id),b=gearEnhancementQuote(two.id);for(const [k,n] of Object.entries(a.materials))check(b.materials[k]===2*n,'enhancement parity '+step)}
 for(const missing of [1,5,6,10,60]){one.durability=two.durability=60-missing;check(gearRepairCost(two)===2*gearRepairCost(one),'repair parity '+missing)}
 one.durability=two.durability=50;const expected=gearRepairCost(two),gold=h.gold;repairGear(two.id);check(h.gold===gold-expected&&two.durability===60,'actual repair charge');check(gearRepairCost(two)===0,'full repair zero');
 const catalog=renderGearCatalog();for(const r of catalog.filter(r=>r.tier===7&&['weapon','offhand'].includes(r.category)))check(r.requirements['Heritage Ore']>=1,'all Heritage hand patterns use ore');
 save();
 }''')
  page.reload(wait_until='networkidle')
  assert page.evaluate("game.gear.find(g=>g.id==='cost-two').durability===60")
  assert not errors,errors;b.close();print('PASS crafting parity across tiers/discounts, four enhancement costs, repair parity and actual charges, Heritage hand materials, save/reload and console')
finally:s.shutdown()
