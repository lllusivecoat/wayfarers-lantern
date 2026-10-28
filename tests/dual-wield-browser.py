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
      const check=(ok,msg)=>{if(!ok)throw Error(msg)};
      game.pendingReports=[];game.heroes=[];game.gear=[];
      const h=game.player;h.ready=true;h.wound=null;h.className='Rogue';h.spec='Assassination';h.equipment={};h.gear=null;h.utilitySupplies={};h.preparedBonus=0;h.preparedSupplyBonuses={};h.abilities.dex=10;
      const add=(id,family,bonus=2,stat='DEX')=>{const g={id,name:id,kind:'Weapon',family,bonus,stat,durability:20,maxDurability:20,owner:null};game.gear.push(g);return g};
      const dagger=add('dagger-one','dagger'),other=add('dagger-two','dagger'),pistol=add('pistol-one','pistol'),second=add('pistol-two','pistol'),rifle=add('rifle','gun'),staff=add('staff','staff',2,'INT');
      for(const cls of ['Warrior','Rogue','Hunter']){
        for(const g of [dagger,pistol])for(const slot of ['weapon','offhand'])check(canHeroEquipInSlot({className:cls},g,slot),cls+' '+g.family+' '+slot);
      }
      for(const cls of ['Mage','Priest','Warlock','Shaman','Druid','Paladin','Death Knight','Monk','Demon Hunter','Evoker']){
        check(!canHeroEquipInSlot({className:cls},dagger,'offhand'),'reject offhand dagger '+cls);
        check(!canHeroEquipInSlot({className:cls},pistol,'offhand'),'reject offhand pistol '+cls);
      }
      check(!canHeroEquipInSlot(h,rifle,'offhand'),'rifle cannot go offhand');
      const base=readinessBase(h,'dex');equipSlot('player','weapon',dagger.id);equipSlot('player','offhand',other.id);
      check(h.equipment.offhand===other.id&&readinessBase(h,'dex')===base+4,'dual daggers add both stats');
      equipSlot('player','weapon',pistol.id);equipSlot('player','offhand',second.id);
      check(h.equipment.weapon===pistol.id&&h.equipment.offhand===second.id&&readinessBase(h,'dex')===base+4,'dual pistols');
      const html=renderHeroEquipment(h),box=document.createElement('div');box.innerHTML=html;
      check([...box.querySelectorAll('.slot-offhand option')].some(o=>o.value===dagger.id),'offhand selector offers dagger');
      equipSlot('player','weapon',rifle.id);
      check(!h.equipment.offhand&&!second.owner,'rifle returns offhand');
      check(readinessBase(h,'dex')===base+4,'rifle matches same-quality pair');
      const purse=h.gold;equipSlot('player','offhand',dagger.id);check(!h.equipment.offhand&&h.gold===purse,'blocked before payment');
      rifle.durability=0;check(readinessBase(h,'dex')===base,'broken twohand grants nothing');rifle.durability=20;
      for(let bonus=1;bonus<=6;bonus++){
        rifle.bonus=bonus;const two=readinessBase(h,'dex');
        equipSlot('player','weapon',dagger.id);dagger.bonus=bonus;other.bonus=bonus;equipSlot('player','offhand',other.id);
        check(readinessBase(h,'dex')===two,'pair and twohand equal at bonus '+bonus);
        check(two-base===Math.min(6,bonus*2),'global cap retained');equipSlot('player','weapon',rifle.id);
      }
      equipSlot('player','weapon',dagger.id);equipSlot('player','offhand',other.id);
      h.ready=false;equipSlot('player','offhand',pistol.id);check(h.equipment.offhand===other.id,'away lock');h.ready=true;
      check(canHeroEquipInSlot({className:'Mage'},staff,'weapon')&&!canHeroEquipInSlot({className:'Mage'},staff,'offhand'),'staff uses main hand only');
      game.hall=7;game.reputation=100000;game.gold=0;
      game.buildingList.push({uid:'dual-shop',key:'workshop',level:5,spent:100});v9Sync();
      game.staffMembers.push({id:'dual-smith',name:'Smith',wage:2,buildingUid:null,buildingKey:null,professionXP:{Blacksmithing:275}});v9AssignStaff('dual-smith','dual-shop');
      const pistols=renderGearCatalog().filter(r=>r.family==='pistol');check(pistols.length===8,'pistol recipes at every tier');
      for(const r of pistols)for(const name of Object.keys(r.requirements))game.materials[name]=100000;
      for(const r of pistols){const before=game.gear.length;craftGear(r.id);check(game.gear.length===before+1&&game.gear.at(-1).family==='pistol'&&!gearIsTwoHanded(game.gear.at(-1)),'craft one-handed pistol '+r.id)}
      const glaives=renderGearCatalog().filter(r=>r.family==='warglaive');check(glaives.length===8,'eight warglaive tiers');
      for(const r of glaives)for(const name of Object.keys(r.requirements))game.materials[name]=100000;
      for(const r of glaives){const n=game.gear.length;craftGear(r.id);check(game.gear.length===n+1,'craft '+r.id)}
      craftGear('warglaive-0');
      const pair=game.gear.filter(g=>g.family==='warglaive'&&g.tier===0);
      const dh=structuredClone(h);Object.assign(dh,{id:'glaive-hero',name:'Glaive Hero',className:'Demon Hunter',spec:'Havoc',equipment:{},gear:null,gold:10000});game.heroes.push(dh);
      check(!canHeroEquip(h,pair[0]),'Rogue cannot use warglaive');
      equipSlot(dh.id,'weapon',pair[0].id);equipSlot(dh.id,'offhand',pair[1].id);
      check(dh.equipment.weapon===pair[0].id&&dh.equipment.offhand===pair[1].id,'Demon Hunter dual glaives');
      document.getElementById('gear-crafted-modal').classList.remove('open');
      render();openQuickEquip('player');save();
      window.dualIds=JSON.stringify(h.equipment);
    }""")
    eq=page.evaluate('dualIds')
    assert page.locator('#quick-equip-slots .slot-offhand select option[value="pistol-one"]').count()==1
    page.reload(wait_until='networkidle');page.wait_for_function("typeof openQuickEquip==='function'")
    assert page.evaluate('JSON.stringify(game.player.equipment)')==eq
    assert page.evaluate("!!game.heroes.find(h=>h.id==='glaive-hero').equipment.offhand")
    assert not errors,errors
    b.close();print('PASS: dagger/pistol class and slot matrix, dual equip, rifle/staff restrictions, same-tier twohand/pair parity, global cap, broken gear, away lock, quick UI and reload')
finally:server.shutdown()
