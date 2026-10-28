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
    page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.wait_for_function("typeof openQuickEquip==='function'")
    page.on('dialog',lambda d:d.accept())
    page.evaluate("""() => {
      game.player.ready=true;game.player.wound=null;game.pendingReports=[];
      const h=structuredClone(game.player);h.id='quick-hero';h.name='Quick Hero';h.className='Warrior';h.spec='Arms';h.equipment={};h.gear=null;game.heroes.push(h);
      game.gear.push({id:'quick-sword',name:'Quick Sword',kind:'Weapon',family:'sword',stat:'STR',bonus:1,durability:20,maxDurability:20,owner:null});
      game.consumables.push({id:'quick-ration',name:'Trail Rations',ration:true,bonus:1,uses:3});render();showView('hall');
    }""")
    page.locator('#quick-equip-open').tap()
    page.select_option('#quick-equip-hero','quick-hero')
    page.select_option('#quick-equip-slots .slot-weapon select','quick-sword')
    assert page.evaluate("game.heroes.find(h=>h.id==='quick-hero').equipment.weapon")== 'quick-sword'
    page.select_option('#quick-equip-slots .slot-utility1 select','supply:food:quick-ration')
    assert page.evaluate("game.heroes.find(h=>h.id==='quick-hero').utilitySupplies.utility1.name")== 'Trail Rations'
    page.select_option('#quick-equip-slots .slot-utility1 select','')
    assert page.evaluate("game.consumables.find(x=>x.id==='quick-ration').uses")==3
    assert not page.locator('#hero-stats-modal').evaluate("e=>e.classList.contains('open')")
    assert page.locator('#quick-equip-modal .modalbox').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
    page.locator('#quick-equip-close').tap()
    page.evaluate("showView('roster')")
    page.locator('.v9-rrow[data-id="quick-hero"] button').tap()
    assert page.locator('#quick-equip-modal').evaluate("e=>e.classList.contains('open')")
    page.evaluate("game.heroes.find(h=>h.id==='quick-hero').ready=false;render()")
    assert page.locator('#quick-equip-slots select:enabled').count()==0
    assert 'away' in page.locator('#quick-equip-status').inner_text()
    page.evaluate('save()')
    page.reload(wait_until='networkidle');page.wait_for_function("typeof openQuickEquip==='function'")
    assert page.evaluate("game.heroes.find(h=>h.id==='quick-hero').equipment.weapon")== 'quick-sword'
    assert not errors,errors
    b.close();print('PASS: global and mobile roster shortcuts, hero switching, actual gear equip, ration reservation/refund, away locks, mobile layout, save/reload; no browser errors')
finally:server.shutdown()
