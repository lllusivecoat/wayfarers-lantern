from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parents[2])));Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{s.server_port}/beta/',wait_until='networkidle');page.wait_for_function("document.readyState==='complete' && !!document.getElementById('beta-guild-rename')")
  page.on('dialog',lambda d:d.accept())
  page.evaluate('''() => {game.gold=1000;game.pendingReports=[];game.player.ready=true;game.player.wound=null;game.player.dead=false;for(const k of abilityKeys)game.player.abilities[k]=100;render();window.goldChanges=0;new MutationObserver(()=>goldChanges++).observe(document.getElementById('gold'),{childList:true,subtree:true,characterData:true})}''')
  page.evaluate("chosenQuest='gather-mining';game.selected=['player'];window.dispatchCost=permanentExpeditionCost(questById(chosenQuest),1);dispatchQuest(true)")
  page.wait_for_timeout(2000)
  assert page.evaluate('game.pendingReports.length')==1
  assert page.evaluate('game.gold===1000-dispatchCost')
  assert page.evaluate("document.getElementById('gold').textContent===game.gold+' gp'")
  assert page.evaluate('goldChanges')<10
  page.evaluate('''() => {game.gold-=7;render();game.gold-=8;game.reputation+=3;render()}''')
  page.wait_for_timeout(1000)
  assert page.evaluate("document.getElementById('gold').textContent===game.gold+' gp'")
  assert page.evaluate("document.getElementById('reputation').textContent===String(game.reputation)")
  assert page.evaluate('goldChanges')<15
  assert page.locator('.beta-float[data-counter=gold]').count()<=1
  assert not errors,errors;b.close();print('PASS real quest dispatch cost, stable treasury/reputation totals, rapid updates and bounded animation mutations')
finally:s.shutdown()
