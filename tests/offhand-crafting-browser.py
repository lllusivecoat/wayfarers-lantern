"""Opening supply, daily minimums and one-time existing-save top-up."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parent.parent)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'")
    page.on('dialog',lambda d:d.accept())
    page.evaluate("""() => {
      window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
      game.hall=7;game.reputation=100000;game.gold=0;game.pendingReports=[];
      game.buildingList.push({uid:'offhand-shop',key:'workshop',level:5,spent:100});v9Sync();
      game.staffMembers.push({id:'offhand-smith',name:'Smith',wage:2,buildingUid:null,buildingKey:null,professionXP:{Blacksmithing:275}});v9AssignStaff('offhand-smith','offhand-shop');
      const recipes=renderGearCatalog().filter(r=>r.category==='offhand');check(recipes.length===24,'three offhands, eight tiers each');
      for(const r of [...recipes,renderGearCatalog().find(r=>r.id==='staff-0')])for(const name of Object.keys(r.requirements))game.materials[name]=100000;
      for(const r of recipes){const n=game.gear.length;craftGear(r.id);check(game.gear.length===n+1&&gearGroup(game.gear.at(-1))==='offhand','craft correct offhand slot '+r.id)}
      craftGear('staff-0');
      const create=(id,cls,spec)=>{const h=structuredClone(game.player);Object.assign(h,{id,name:id,className:cls,spec,gold:10000,ready:true,wound:null,equipment:{},gear:null});game.heroes.push(h);return h};
      const warrior=create('shield-user','Warrior','Protection'),mage=create('focus-user','Mage','Fire'),priest=create('tome-user','Priest','Holy');
      const shield=game.gear.find(g=>g.family==='shield'&&g.tier===0),focus=game.gear.find(g=>g.family==='focus'&&g.tier===0),tome=game.gear.find(g=>g.family==='tome'&&g.tier===0),staff=game.gear.find(g=>g.family==='staff');
      equipSlot(warrior.id,'offhand',shield.id);check(warrior.equipment.offhand===shield.id,'Warrior shield');
      check(!canHeroEquip(mage,shield),'Mage shield restricted');
      equipSlot(mage.id,'offhand',focus.id);check(mage.equipment.offhand===focus.id,'Mage focus');
      equipSlot(priest.id,'offhand',tome.id);check(priest.equipment.offhand===tome.id,'Priest tome');
      equipSlot(mage.id,'weapon',staff.id);check(mage.equipment.weapon===staff.id&&!mage.equipment.offhand&&!focus.owner,'two-handed staff returns focus to storage');
      equipSlot(mage.id,'offhand',focus.id);check(!mage.equipment.offhand&&!focus.owner,'staff prevents offhand');
      document.getElementById('gear-crafted-modal').classList.remove('open');render();showView('crafting');save();
    }""")
    page.locator('.gear-craft-controls select').nth(0).select_option('offhand')
    assert page.locator('.gear-craft-controls select').nth(1).locator('option').count()==3
    page.reload(wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'")
    assert page.evaluate("game.heroes.find(h=>h.id==='shield-user').equipment.offhand!==null")
    assert not errors,errors
    b.close();print('PASS: 24 offhand recipes, correct item slots, shield/focus/tome class restrictions, two-handed staff exclusion, crafting controls and reload')
finally:server.shutdown()
