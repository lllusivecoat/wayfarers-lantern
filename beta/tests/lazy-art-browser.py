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
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));requests=[];bad=[];page.on('request',lambda r:requests.append(r.url));page.on('response',lambda r:bad.append(r.url) if r.status>=400 and '127.0.0.1' in r.url else None);page.goto(f'http://127.0.0.1:{s.server_port}/beta/',wait_until='networkidle');page.wait_for_function("document.readyState==='complete' && !!document.getElementById('beta-guild-rename')")
  page.wait_for_timeout(250)
  assert not [u for u in requests if '/thumbnails/' in u],requests
  requests.clear();page.evaluate("showView('quests')");page.wait_for_timeout(500)
  thumbs=[u for u in requests if '/thumbnails/' in u]
  assert thumbs,requests
  assert not [u for u in requests if '/locations/' in u],requests
  assert len(thumbs)<page.locator('#quest-list>article.quest').count(),(thumbs,page.locator('#quest-list>article.quest').count())
  print('Initial visible contract thumbnails:',len(thumbs),'bytes:',sum((Path(__file__).resolve().parents[1]/'img/thumbnails'/u.split('/')[-1]).stat().st_size for u in set(thumbs)),flush=True)
  count=len(thumbs);page.locator('#quest-list>article.quest').last.scroll_into_view_if_needed();page.wait_for_timeout(400)
  assert len(set(u for u in requests if '/thumbnails/' in u))>count
  page.evaluate("const h=structuredClone(game.player);h.id='backup-fixture';h.name='Backup Hero';game.heroes.push(h);save()")
  saved=page.evaluate("localStorage.getItem('wayfarers_lantern_offline_v1')")
  page.goto(f'http://127.0.0.1:{s.server_port}/beta/backup/',wait_until='networkidle');page.wait_for_function("document.readyState==='complete' && !!window.__betaSaveGuard")
  assert page.locator('.pv-top').count()==0
  assert page.evaluate("window.__betaSaveGuard.original")>=1
  assert page.evaluate("localStorage.getItem('wayfarers_lantern_offline_v1__beta_backup')")==saved
  assert page.evaluate("game.heroes.some(h=>h.id==='backup-fixture')")
  assert not bad,bad
  assert not errors,errors;b.close();print('PASS Hall-only banner, deferred thumbnail requests, scroll loading and accessible previous beta with preserved save guard')
finally:s.shutdown()
