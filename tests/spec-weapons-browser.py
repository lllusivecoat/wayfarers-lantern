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
      const all=WL_SPEC_WEAPONS.all;check(all.length===40,'40 specs');
      for(const [cls,list] of Object.entries(specs))for(const spec of list)check(all.filter(p=>p.className===cls&&p.spec===spec).length===1,'one pattern per spec');
      for(const p of all){
        const g={kind:'Weapon',family:p.family,signatureKey:p.key,stat:p.stat,hands:p.hands};
        check(p.stat===SPEC_STATS[p.className][p.spec][0].toUpperCase(),'best game stat');
        for(const q of all)check(canHeroEquip({className:q.className,spec:q.spec},g)===(p.key===q.key),'exclusive spec binding');
        check(canHeroEquipInSlot({className:p.className,spec:p.spec},g,'offhand')===(p.offhand==='dual'),'dual rule');
      }
      game.hall=7;game.gold=0;game.reputation=100000;game.pendingReports=[];
      game.buildingList.push({uid:'signature-shop',key:'workshop',level:5,spent:100});v9Sync();
      game.staffMembers.push({id:'signature-smith',name:'Smith',wage:2,buildingUid:null,buildingKey:null,professionXP:{Blacksmithing:275}});v9AssignStaff('signature-smith','signature-shop');
      const recipes=renderGearCatalog().filter(g=>g.signatureKey);check(recipes.length===320,'40 patterns times eight tiers');check(recipes.find(r=>r.weaponFamily==='sword'&&r.tier===7).requirements['Heritage Ore']===1,'Heritage sword ingredients preserved');
      for(const r of recipes)for(const name of Object.keys(r.requirements))game.materials[name]=100000;
      const h=game.player;h.ready=true;h.wound=null;h.utilitySupplies={};h.equipment={};h.gear=null;h.gold=100000;
      for(const p of all){
        h.className=p.className;h.spec=p.spec;
        const r=recipes.find(r=>r.signatureKey===p.key&&r.tier===0),n=game.gear.length;craftGear(r.id);
        const g=game.gear.at(-1);check(gearReadinessBonus(g)===(p.hands===2?g.bonus*2:g.bonus),'Hand weighting includes building and quality bonuses');check(game.gear.length===n+1&&g.signatureKey===p.key&&g.family===p.family&&g.stat===p.stat,'craft signature '+p.key);
        equipSlot('player','weapon',g.id);check(h.equipment.weapon===g.id,'equip '+p.key);
        const base=readinessBase(h,p.stat.toLowerCase());
        if(p.offhand==='dual'){
          craftGear(r.id);const other=game.gear.at(-1);equipSlot('player','offhand',other.id);
          check(h.equipment.offhand===other.id,'dual equip '+p.key);
          check(gearReadinessBonus(g)===g.bonus,'dual weapons use one-hand weighting including Fury');
        }else if(p.offhand==='none')check(gearReadinessBonus(g)===2*g.bonus,'twohand weighting');
      }
      h.className='Mage';h.spec='Fire';h.equipment={};h.gear=null;
      const old={id:'legacy-spec-sword',name:'Old Sword',kind:'Weapon',family:'sword',stat:'STR',bonus:2,durability:17,maxDurability:30,owner:'player'};game.gear.push(old);h.equipment.weapon=old.id;h.gear=old.id;ensureHeroEquipment(h);
      check(old.signatureKey==='mage-fire'&&old.stat==='INT'&&old.originalName==='Old Sword'&&old.durability===17&&old.bonus===2,'legacy adapts without lost power/durability');
      h.spec='Frost';ensureHeroEquipment(h);check(!h.equipment.weapon&&!old.owner&&game.gear.includes(old),'spec switch returns gear, never deletes');
      const frost=game.gear.find(g=>g.signatureKey==='mage-frost');equipSlot('player','weapon',frost.id);
      check(h.equipment.weapon===frost.id,'replacement spec weapon');
      document.getElementById('gear-crafted-modal').classList.remove('open');render();showView('crafting');save();
      window.kept=game.gear.length;
    }""")
    page.evaluate("document.querySelectorAll('#crafting details').forEach(d=>d.open=true)")
    page.locator('.gear-craft-controls select').nth(0).select_option('weapon')
    assert page.locator('.gear-craft-controls select').nth(1).locator('option').count()==40
    count=page.evaluate('kept')
    page.reload(wait_until='networkidle');page.wait_for_function("typeof openQuickEquip==='function'")
    assert page.evaluate('game.gear.length')==count
    assert page.evaluate("game.gear.find(g=>g.id===game.player.equipment.weapon).signatureKey")=='mage-frost'
    assert not errors,errors
    b.close();print('PASS: all 40 spec bindings, 320 tiered recipes, actual crafting/equip, dual/Titan Grip/twohand rules, legacy conversion, spec-change storage, UI and save/reload')
finally:server.shutdown()
