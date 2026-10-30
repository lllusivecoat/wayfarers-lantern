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
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};const h=game.player;h.className='Warrior';h.spec='Arms';h.equipment={};h.gear=null;h.utilitySupplies={};h.ready=true;h.wound=null;h.perks=[];game.gear=[];
 const add=(slot,kind,family,tier,stat='STR',hands)=>{const g={id:'effect-'+game.gear.length,owner:h.id,name:'Test '+family,kind,family,tier,stat,hands,bonus:1,durability:30,maxDurability:30,madeByPlayer:true};game.gear.push(g);h.equipment[slot]=g.id;return g};
 const weapon=add('weapon','Weapon','greatsword',7,'STR',2);let fx=WL_GEAR_EFFECTS.forHero(h);check(fx.roll===.25&&!fx.pieces,'full twohand effect');
 h.equipment={};add('weapon','Weapon','sword',7,'STR',1);add('offhand','Weapon','sword',7,'STR',1);check(WL_GEAR_EFFECTS.forHero(h).roll===.25,'two onehand effects share full budget');
 h.equipment={weapon:weapon.id};const armor=add('armor','Armor','plate',7),cape=add('cape','Cape','cape',7,'WIS'),ring=add('amulet1','Ring','might',7);fx=WL_GEAR_EFFECTS.forHero(h);check(fx.pieces===4&&fx.xp===.05,'four groups');check(fx.protection>.12&&fx.protection<.15,'protection multiplicative');
 add('amulet2','Ring','might',7);check(WL_GEAR_EFFECTS.forHero(h).pieces===4,'duplicate rings do not inflate sets');cape.durability=0;fx=WL_GEAR_EFFECTS.forHero(h);check(fx.pieces===3&&fx.xp===0,'broken piece disables four piece');armor.tier=5;ring.tier=5;fx=WL_GEAR_EFFECTS.forHero(h);check(fx.pieces===2&&fx.xp===0,'tiers do not mix');

 // At a full, enhanced Heritage loadout, every paid item upgrade contributes.
 h.equipment={weapon:weapon.id,armor:armor.id,cape:cape.id,amulet1:ring.id};
 const ring2=add('amulet2','Ring','might',7),ring3=add('amulet3','Ring','might',7);
 for(const g of [weapon,armor,cape,ring,ring2,ring3]){g.tier=7;g.durability=30;g.enhancement=4}
 const full=WL_GEAR_EFFECTS.forHero(h);
 for(const g of [weapon,armor,cape,ring,ring2,ring3]){g.enhancement=0;const less=WL_GEAR_EFFECTS.forHero(h);check(full.roll>less.roll||full.precision>less.precision||full.protection>less.protection,'upgrade contributes '+g.family);g.enhancement=4}
 check(full.roll<.45&&full.precision<.45&&full.protection<.383,'bounded overlapping effects');
 const order=WL_GEAR_EFFECTS.forHero(h);h.equipment=Object.fromEntries(Object.entries(h.equipment).reverse());check(JSON.stringify(order)===JSON.stringify(WL_GEAR_EFFECTS.forHero(h)),'slot order independent');
 for(const g of game.gear)g.enhancement=0;
 for(let t=0;t<8;t++)check(!!WL_GEAR_EFFECTS.effect({category:'weapon',weaponFamily:'sword',stat:'STR',hands:2,tier:t})===(t%2===1),'paired tier effect '+t);
 h.equipment={weapon:weapon.id};const random=Math.random;Math.random=()=>0;const q={kind:'Dungeon',rank:0,ability:'str',minParty:1};let ctx=perkPrepare(q,[h],0,true);check(ctx.gearRoll[h.id]===1,'penetration triggers');ctx=perkPrepare({...q,kind:'Gathering'},[h],0,false);check(!ctx.gearRoll[h.id],'combat only');
 weapon.family='dagger';weapon.stat='DEX';weapon.hands=1;ctx=perkPrepare(q,[h],0,true);check(ctx.fx[h.id].some(e=>e.crit19),'precision integrated');Math.random=random;
 h.equipment={weapon:weapon.id,armor:armor.id,cape:cape.id,amulet1:ring.id};for(const g of [weapon,armor,cape,ring]){g.tier=7;g.durability=30}const base=questHeroXP(q,h);cape.durability=0;check(base>questHeroXP(q,h),'four-piece XP applies');
 weapon.family='greatsword';weapon.stat='STR';weapon.hands=2;cape.durability=30;render();const html=renderHeroEquipment(h);check(html.includes('Equipment effects & sets')&&html.includes('4/4'),'equipment UI');save();
 }''')
  page.reload(wait_until='networkidle')
  assert page.evaluate("WL_GEAR_EFFECTS.forHero(game.player).pieces===4")
  assert not errors,errors;b.close();print('PASS paired tiers, dual/twohand budgets, 2/4 sets, duplicate rings, broken gear, tier matching, combat procs, XP effect, UI and reload')
finally:s.shutdown()
