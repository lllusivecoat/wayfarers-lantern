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
      check(document.getElementById('alchemy-brew').textContent==='Requires Alchemy Lab','missing Lab label');
      check(document.getElementById('field-kit-craft').textContent==='Requires Staff Office','missing Office label');
      check(document.querySelector('#craft-actions button').textContent==='Requires Workshop','missing Workshop label');
      game.hall=7;game.gold=0;game.pendingReports=[];
      for(const key of ['workshop','alchemyLab','staffOffice']){
        const uid='free-'+key;game.buildingList.push({uid,key,level:5,spent:100});v9Sync();
        const st={id:uid,name:key,wage:2,buildingUid:null,buildingKey:null,professionXP:{Blacksmithing:275,Alchemy:275,Quartermastery:275}};
        game.staffMembers.push(st);check(v9AssignStaff(st.id,uid)==='','assign '+key);
      }
      for(const rec of [...renderGearCatalog(),...alchemyRecipes(),...fieldKitRecipes()]){
        for(const name of Object.keys(rec.requirements||rec.ingredients||{}))game.materials[name]=100000;
      }
      for(const rec of alchemyRecipes()){
        game.day++;check(brewAlchemy(rec.id),'brew '+rec.id);check(game.gold===0,'potion gold unchanged');
      }
      for(const rec of fieldKitRecipes()){
        game.day++;check(craftFieldKit(rec.id),'kit '+rec.id);check(game.gold===0,'kit gold unchanged');
      }
      const gear=renderGearCatalog()[0],before=game.gear.length;game.day++;craftGear(gear.id);
      check(game.gear.length===before+1&&game.gold===0,'gear crafted without gold');
      check(game.gear.at(-1).price>0,'personal equip price retained');
      document.getElementById('gear-crafted-modal').classList.remove('open');
      game.day++;game.materials.Peacebloom=0;
      check(!brewAlchemy('field'),'material requirement retained');
      check(game.gold===0,'failed craft leaves treasury unchanged');
      render();showView('crafting');save();
    }""")
    assert not errors,errors
    b.close();print('PASS: zero-gold crafting of gear, all potions including Ascension, all field kits; retained material checks and gear equip prices; no browser errors')
finally:server.shutdown()
