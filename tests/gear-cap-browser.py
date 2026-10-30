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
 const make=(p,tier,bonus=10)=>{game.gear=[];const h={id:'cap-test',name:'Cap Test',className:p.className,spec:p.spec,abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},equipment:{},utilitySupplies:{},perks:[],rank:0,level:1,ready:true,dead:false,preparedBonus:0};game.heroes=[h];
 const add=(slot,kind,family,hands)=>{const g={id:'cap-'+game.gear.length,name:'Test gear',kind,family,hands,tier,stat:p.stat,signatureKey:kind==='Weapon'?p.key:undefined,bonus,owner:h.id,madeByPlayer:true,durability:30,maxDurability:30,enhancementVersion:2,enhancement:0};game.gear.push(g);h.equipment[slot]=g.id;return g};
 const weapon=add('weapon','Weapon',p.family,p.hands);h.gear=weapon.id;if(p.offhand==='dual')add('offhand','Weapon',p.family,1);else if(p.offhand!=='none')add('offhand','Offhand',p.offhand,1);add('armor','Armor','cloth');add('cape','Cape','cape');for(let k=1;k<=3;k++)add('amulet'+k,'Ring','ring');return h};
 for(const p of WL_SPEC_WEAPONS.all)for(let tier=0;tier<8;tier++){const h=make(p,tier);check(gearReadinessLimit(h)===6+Math.floor(tier/2),'uniform cap '+p.key+' '+tier)}
 const p=WL_SPEC_WEAPONS.byKey('warrior-arms');let h=make(p,0,3);check(gearReadinessLimit(h)===6&&readinessBase(h,p.stat.toLowerCase())===6,'high quality cannot raise Basic cap');
 game.gear.find(g=>g.id===h.equipment.weapon).tier=7;check(gearReadinessLimit(h)===6,'single high weapon no shortcut');
 h=make(p,7);check(readinessBase(h,p.stat.toLowerCase())===9,'new cap applied to readiness');const cape=game.gear.find(g=>g.id===h.equipment.cape);cape.durability=0;check(gearReadinessLimit(h)===8,'broken group stops contributing');cape.durability=30;
 const ring=game.gear.find(g=>g.id===h.equipment.amulet1);ring.tier=0;check(gearReadinessLimit(h)===8,'rings share one tier group');ring.tier=7;check(gearReadinessLimit(h)===9,'ring group complete');h.equipment.amulet2=h.equipment.amulet1;check(gearReadinessLimit(h)===8,'duplicate item cannot raise cap');
 h=make(WL_SPEC_WEAPONS.byKey('death-knight-frost'),7);check(gearReadinessLimit(h)===9,'dual parity');delete h.equipment.offhand;check(gearReadinessLimit(h)===8,'empty hand not full budget');
 h=make(p,7);const before=JSON.stringify(game.gear);game.gear.push({id:'cap-tool',tier:7,gatherTool:'Mining',kind:'Utility',owner:h.id,durability:30});h.equipment.utility1='cap-tool';check(gearReadinessLimit(h)===9,'tools do not add cap');game.gear.pop();delete h.equipment.utility1;check(JSON.stringify(game.gear)===before,'no save item mutations');
 const html=renderHeroEquipment(h);check(html.includes('Flat gear readiness')&&html.includes('+9 loadout cap'),'cap UI');save();
 }''')
  page.reload(wait_until='networkidle')
  assert page.evaluate("gearReadinessLimit(game.heroes.find(h=>h.id==='cap-test'))===9")
  assert not errors,errors;b.close();print('PASS 320 spec/tier caps, quality ceiling, single-piece bypass, broken/mixed/duplicate gear, hand parity, tool exclusion, UI and save/reload')
finally:s.shutdown()
