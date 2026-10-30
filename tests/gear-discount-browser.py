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
 const smith=game.staffMembers.find(s=>s.id==='cost-smith');smith.professionXP.Blacksmithing=275;
 game.gearMaterialCredits={};for(const r of renderGearCatalog())for(const k of Object.keys(r.requirements))game.materials[k]=1000000;
 const discount=WL_STAFF.service('workshop').materialDiscount,start=game.materials['Copper Ore'];
 const ledger=JSON.stringify(game.gearMaterialCredits);for(let i=0;i<5;i++){gearCraftInfo('sword-0');renderGearCatalog();render()}check(JSON.stringify(game.gearMaterialCredits)===ledger,'quotes and renders never spend credit');
 for(let i=0;i<10;i++){const q=gearCraftInfo('sword-0'),before=game.materials['Copper Ore'];craftGear('sword-0');check(before-game.materials['Copper Ore']===q.requirements['Copper Ore'],'preview matches actual charge')}
 check(start-game.materials['Copper Ore']===20-Math.floor(20*discount+1e-9),'fractional savings realized over ten crafts');
 const credits=JSON.stringify(game.gearMaterialCredits);game.materials['Copper Ore']=0;const count=game.gear.length;craftGear('sword-0');check(game.gear.length===count&&JSON.stringify(game.gearMaterialCredits)===credits,'failed craft keeps credit');
 const one=renderGearCatalog().find(r=>r.id==='sword-7');for(let i=0;i<20;i++){const q=gearMaterialQuote(one);check(q.materials['Heritage Ore']===1,'one-unit rare ingredient never free');game.gearMaterialCredits=q.credits}
 // Enhancements share the same ledger, and failed enhancement quotes do not commit.
 const item={id:'credit-enh',kind:'Weapon',family:'sword',tier:0,madeByPlayer:true,bonus:1,durability:25,maxDurability:25,enhancement:0,enhancementVersion:2};game.gear.push(item);
 const beforeFail=JSON.stringify(game.gearMaterialCredits);check(!enhanceGear(item.id)&&JSON.stringify(game.gearMaterialCredits)===beforeFail,'failed enhancement keeps credit');
 game.materials['Copper Ore']=100;const q=gearEnhancementQuote(item.id),stock=game.materials['Copper Ore'];check(enhanceGear(item.id),'enhancement succeeds');check(stock-game.materials['Copper Ore']===q.materials['Copper Ore']&&JSON.stringify(game.gearMaterialCredits)===JSON.stringify(q.credits),'enhancement commits quoted credit');
 save();window.expectedCredits=JSON.stringify(game.gearMaterialCredits);window.expectedNext=gearCraftInfo('sword-0').requirements['Copper Ore'];
 }''')
  credits=page.evaluate('expectedCredits');cost=page.evaluate('expectedNext')
  page.reload(wait_until='networkidle')
  assert page.evaluate('JSON.stringify(game.gearMaterialCredits)')==credits
  assert page.evaluate("gearCraftInfo('sword-0').requirements['Copper Ore']")==cost
  assert not errors,errors;b.close();print('PASS fractional savings, exact previews, non-mutating quotes, failed transactions, rare minimum, enhancement ledger and save/reload')
finally:s.shutdown()
