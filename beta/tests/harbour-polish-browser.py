"""Disposable beta saves only: cover, guided targets, discoveries and both themes."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
root=Path(__file__).resolve().parents[2]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
output=Path('/tmp/wayfarers-harbour');output.mkdir(exist_ok=True)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  page.goto(f'http://127.0.0.1:{server.server_port}/beta/',wait_until='networkidle')
  assert page.locator('#beta-cover').is_visible()
  assert page.locator('#harbour-cover-title').inner_text()=='The Wayfarer’s Lantern'
  assert page.locator('.harbour-skip').is_visible()
  page.screenshot(path=str(output/'cover-mobile.png'))
  before=page.evaluate('JSON.stringify(game)');page.locator('.harbour-begin').tap()
  assert page.evaluate('JSON.stringify(game)')==before
  assert page.locator('#hall').evaluate("e=>e.classList.contains('active')")
  assert page.locator('#beta-onb ol').is_visible()
  assert page.evaluate("localStorage.getItem('wayfarers-lantern-beta-cover')")=='seen'
  page.locator('#beta-onb li[data-k="recruit"] button').tap()
  assert page.locator('#applicant-list').is_visible()
  assert page.locator('#applicant-list').evaluate("e=>e.classList.contains('harbour-target')")
  page.locator('#beta-onb li[data-k="rest"] button').tap()
  assert page.locator('.beta-sheet-item.harbour-target').is_visible()
  assert page.evaluate('game.day')==1
  page.evaluate("document.querySelector('.beta-sheet')?.remove();showView('roster')")
  assert page.locator('#harbour-empty-heroes').is_visible()
  page.evaluate("showView('staff')");assert page.locator('#harbour-empty-staff').count()==1
  page.evaluate("showView('buildings')");assert page.locator('#harbour-empty-buildings').is_visible()
  page.evaluate("""() => {const hero=structuredClone(game.player);Object.assign(hero,{id:'away-fixture',name:'Fixture Hero',ready:false});game.heroes.push(hero);game.pendingReports.push({kind:'operation',title:'Testing the road',dueAt:Date.now()+60000,partyIds:[hero.id],dispatchedDay:game.day});render();showView('roster')}""")
  assert 'Away on quest' in page.locator('.v9-rrow[data-id="away-fixture"] .harbour-away-badge').inner_text()
  assert page.locator('#harbour-return-chip').is_visible()
  for width in [390,820,1280]:
   page.set_viewport_size({'width':width,'height':900})
   for theme in ['dark','light']:
    page.evaluate('theme=>{betaSetTheme(theme);showView("quests")}',theme)
    assert page.locator('.harbour-contract-seal').count()>0
    page.screenshot(path=str(output/f'contracts-{width}-{theme}.png'))
    page.evaluate("showView('world')")
    assert page.locator('#pv-world-map').is_visible()
    page.screenshot(path=str(output/f'atlas-{width}-{theme}.png'))
  location=page.evaluate('v9Discover(0)')
  assert location and location['name'] in page.locator('.harbour-discovery').inner_text()
  page.locator('.harbour-discovery .btn').click()
  assert page.locator('#world').evaluate("e=>e.classList.contains('active')")
  page.evaluate("save();localStorage.removeItem('wayfarers-lantern-beta-cover')")
  page.reload(wait_until='networkidle');assert page.locator('#beta-cover').count()==0
  page.locator('.beta-gear').click();page.locator('#harbour-replay-intro').click()
  snapshot=page.evaluate('JSON.stringify(game)');page.locator('.harbour-skip').click()
  assert page.evaluate('JSON.stringify(game)')==snapshot
  assert page.locator('#beta-onb ol').is_visible()
  page.emulate_media(reduced_motion='reduce');page.locator('#beta-onb li[data-k="recruit"] button').click()
  assert page.locator('#applicant-list').evaluate("e=>getComputedStyle(e).animationName==='none'")
  assert not errors,errors
  browser.close();print('PASS beta cover, guided targets, empty states, away countdown, discoveries and theme/width screenshots:',output)
finally:server.shutdown()
