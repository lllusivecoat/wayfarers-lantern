"""Beta-only presentation regression checks; uses a disposable browser save."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parents[2])))
Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  url=f'http://127.0.0.1:{s.server_port}/beta/'
  page.goto(url,wait_until='networkidle');page.evaluate("showView('quests')")
  assert not page.locator('#test-complete-quests').is_visible()
  assert page.evaluate('testCompleteAllQuests().length')==0
  page.evaluate('''() => {window.beforeGold=game.gold;game.gold+=25;render();}''')
  page.wait_for_timeout(100)
  assert page.locator('[data-pv-gold] .beta-treasury-change').inner_text()=='+25 gp'
  assert page.evaluate("game.gold===beforeGold+25 && document.getElementById('gold').textContent===game.gold+' gp'")
  page.wait_for_timeout(1800)
  assert page.locator('.beta-treasury-change').count()==0
  page.evaluate('''() => {const h=structuredClone(game.player);h.id='beta-crest-hero';h.name='Crest Test';h.className='Death Knight';h.wound={tier:2};h.dead=false;h.ready=true;game.heroes.push(h);render();showView('roster')}''')
  crest=page.locator('.v9-rrow[data-id="beta-crest-hero"] .beta-hero-crest')
  assert crest.inner_text()=='DK'
  assert 'wound' in crest.get_attribute('aria-label')
  assert crest.locator('.beta-wound-pip').get_attribute('data-tier')=='2'
  page.evaluate("openQuestDetails('gather-mining')")
  assert page.locator('#quest-detail-content .beta-hero-crest').count()>=2
  page.evaluate("closeQuestDetails();showView('hall')")
  page.locator('.beta-gear').click()
  sound=page.locator('[data-beta-pref="harbour-sounds"]')
  assert not sound.is_checked()
  page.locator('[data-beta-pref="dawn-variants"]').uncheck()
  assert page.evaluate('betaDawnCopy()')=='The harbour wakes. Your story continues.'
  page.reload(wait_until='networkidle')
  assert not page.locator('[data-beta-pref="dawn-variants"]').is_checked()
  assert not sound.is_checked()
  page.goto(url+'?debug=1',wait_until='networkidle');page.evaluate("showView('quests')")
  assert page.locator('#test-complete-quests').is_visible()
  # Reduced motion retains static gold feedback and never flashes the treasury.
  page.emulate_media(reduced_motion='reduce')
  page.evaluate('game.gold+=25;render()');page.wait_for_timeout(100)
  assert page.locator('[data-pv-gold] .beta-treasury-change').inner_text()=='+25 gp'
  assert page.locator('[data-pv-gold]').evaluate('e=>e.getAnimations().length')==0
  assert not errors,errors
  browser.close();print('PASS debug gate, stable gold feedback, class/wound crests, persistent opt-in atmosphere and reduced motion')
finally:s.shutdown()
