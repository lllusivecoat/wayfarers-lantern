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
      game.gold=0;game.hall=7;game.consumables=[];
      game.buildingList.push({uid:'manual-kitchen',key:'kitchen',level:5,spent:100});v9Sync();
      const st={id:'manual-cook',name:'Cook',wage:2,buildingUid:null,buildingKey:null,professionXP:{Cooking:275}};game.staffMembers.push(st);v9AssignStaff(st.id,'manual-kitchen');
      game.kitchenRecipes={'manual-kitchen':'paused'};game.kitchenProduction={'manual-kitchen':game.day};
      const random=Math.random;Math.random=()=>.99;
      for(const r of kitchenRecipes()){
        game.materials[r.meat]=10;game.materials[r.fish]=10;
        check(cookRations('manual-kitchen',r.id,2),'cook '+r.id);
        check(game.materials[r.meat]===8&&game.materials[r.fish]===8,'exact ingredients');
        check(game.gold===0,'no gold charge');
      }
      check(game.kitchenRecipes['manual-kitchen']==='paused'&&game.kitchenProduction['manual-kitchen']===game.day,'daily recipe and marker preserved');
      const before=JSON.stringify([game.consumables,game.materials]);
      for(const n of [0,-1,1.5,100])check(!cookRations('manual-kitchen','trail',n),'bad quantity rejected');
      check(JSON.stringify([game.consumables,game.materials])===before,'invalid batch atomic');
      st.professionXP.Cooking=0;check(!cookRations('manual-kitchen','feast',1),'skill gate');st.professionXP.Cooking=275;
      game.materials.Meat=100;game.materials['Fresh Fish']=100;
      check(cookRations('manual-kitchen','trail',20),'repeat cooking reaches stock limit');
      check(!cookRations('manual-kitchen','trail',1),'stock limit respected');
      check(new Set(game.consumables.map(x=>x.id)).size===30,'unique saved item IDs');
      game.consumables=[];game.materials.Meat=0;
      check(!cookRations('manual-kitchen','trail',1),'insufficient ingredients');game.materials.Meat=10;
      Math.random=random;render();showView('crafting');save();
    }""")
    page.locator('[data-cook-quantity="0"]').fill('2')
    page.locator('[data-cook-now="0"]').click()
    assert page.evaluate('game.consumables.length')>=2
    count=page.evaluate('game.consumables.length')
    page.reload(wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'")
    assert page.evaluate('game.consumables.length')==count
    assert page.evaluate("game.kitchenRecipes['manual-kitchen']")=='paused'
    assert not errors,errors
    b.close();print('PASS: instant cooking all recipes, repeat batches, ingredients/gold/skill/stock guards, unique IDs, independent daily schedule, actual UI and reload')
finally:server.shutdown()
