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
  page.locator('.beta-ledger-more').tap();assert page.locator('.stats').evaluate("e=>e.classList.contains('beta-full')")
  page.locator('.beta-ledger-more').tap();assert not page.locator('.stats').evaluate("e=>e.classList.contains('beta-full')")
  page.locator('#beta-guild-name-input').fill('The Brass Lantern');page.locator('#beta-guild-rename button').tap();assert page.locator('#beta-guild-name').inner_text()=='The Brass Lantern'
  page.evaluate('''() => {const h=structuredClone(game.player);h.id='beta-fixture';h.name='Test Hero';game.heroes.push(h);save();window.storedBeforeReload=localStorage.getItem('wayfarers_lantern_offline_v1')}''');saved=page.evaluate('storedBeforeReload');page.reload(wait_until='networkidle');page.wait_for_function("document.readyState==='complete'")
  assert page.locator('#beta-guild-name').inner_text()=='The Brass Lantern'
  assert page.evaluate("localStorage.getItem('wayfarers_lantern_offline_v1__beta_backup')")==saved
  page.evaluate('''() => {const hall=document.getElementById('hall'),gm=document.getElementById('player-name-label').closest('article'),latest=document.getElementById('latest-title').closest('article');if(hall.querySelector('article')!==gm||hall.lastElementChild!==latest)throw Error('Hall ordering');viewingHeroId='player';renderHeroStats();document.getElementById('hero-stats-modal').classList.add('open')}''')
  for theme in ['dark','light']:
   page.evaluate("document.documentElement.classList.toggle('beta-light',"+str(theme=='light').lower()+")")
   assert page.evaluate("getComputedStyle(document.querySelector('.hero-ability')).backgroundColor===getComputedStyle(document.querySelector('.equipment-slot')).backgroundColor")
  page.evaluate('''() => {const key='wayfarers_lantern_offline_v1',before=localStorage.getItem(key);localStorage.setItem(key,JSON.stringify({...JSON.parse(before),heroes:[]}));if(localStorage.getItem(key)!==before||!window.__betaSaveBlocked)throw Error('empty-guild guard broken')}''')
  assert not errors,errors;b.close();print('PASS mobile ledger open/close, guild rename persistence, live-save backup and empty-guild guard, Hall ordering, dark/light stat and equipment palette')
finally:s.shutdown()
