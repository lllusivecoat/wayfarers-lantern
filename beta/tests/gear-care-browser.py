"""Gear-tab and batch presentation on disposable beta saves."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright

class Quiet(SimpleHTTPRequestHandler):
 def log_message(self, *args): pass

root = Path(__file__).resolve().parents[2]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
try:
 with sync_playwright() as p:
  browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
  page = browser.new_page(viewport={'width':390, 'height':844}, is_mobile=True, has_touch=True)
  errors = []
  page.on('pageerror', lambda error: errors.append(str(error)))
  page.add_init_script("localStorage.setItem('wayfarers-lantern-beta-cover','seen')")
  page.goto(f'http://127.0.0.1:{server.server_port}/beta/', wait_until='networkidle')
  page.evaluate("""() => {
   game.player.gold=0;
   const g={id:'care-fixture',name:'Fixture worn sword',kind:'Weapon',tier:0,
    owner:'player',heroOwner:'player',durability:0,maxDurability:25};
   game.gear.push(g);game.player.equipment={weapon:g.id};
   render();openHeroStats('player');
  }""")
  page.locator('.beta-htabs [data-t="gear"]').click()
  assert page.locator('.gearcare-hero [data-gear-kind="repair"]').is_visible()
  assert page.locator('.gearcare-hero .gearcare-broken').inner_text() == 'Broken'
  repair = page.locator('.gearcare-hero [data-gear-action="repair"]')
  assert repair.is_disabled()
  assert 'purse 0 gp' in repair.inner_text()
  assert 'Needs' in page.locator('.gearcare-hero .gearcare-reason').first.inner_text()
  assert page.locator('.hero-stats-right').evaluate("e=>e.firstElementChild.classList.contains('gearcare-hero')")
  for width in [390, 820, 1280]:
   page.set_viewport_size({'width':width, 'height':900})
   for theme in ['dark', 'light']:
    page.evaluate('theme=>betaSetTheme(theme)', theme)
    assert page.locator('.beta-htabs').is_visible()
    assert page.locator('.gearcare-hero').is_visible()
    assert page.locator('.gearcare-hero').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  page.locator('.gearcare-hero .gearcare-link').first.click()
  page.wait_for_function("document.querySelector('#warehouse-gear [data-gear-hero=player] details').open")
  assert page.locator('#warehouse-gear .gearcare-filter input').is_checked()
  assert page.locator('#warehouse-gear [data-gear-chip="player"]').get_attribute('aria-pressed') == 'true'
  assert not page.locator('#hero-stats-modal').evaluate("e=>e.classList.contains('open')")
  page.evaluate("game.player.gold=1000;render();openHeroStats('player')")
  page.locator('.beta-htabs [data-t="gear"]').click()
  before = page.evaluate("({gold:game.player.gold,cost:gearRepairCost(game.gear.find(g=>g.id==='care-fixture'))})")
  page.locator('.gearcare-hero [data-gear-action="repair"]').click()
  assert page.evaluate('game.player.gold') == before['gold'] - before['cost']
  assert page.locator('.gearcare-hero [data-gear-kind="repair"]').inner_text().startswith('All gear repaired')
  assert page.locator('.gearcare-hero [data-gear-kind="repair"] .gearcare-item').count() == 0
  page.locator('.gearcare-hero [data-gear-kind="enhance"] .gearcare-link').click()
  assert page.locator('#gear-enhancement [data-gear-batch="enhance"]').count() == 1
  assert page.locator('#crafting').evaluate("e=>e.classList.contains('active')")
  assert not errors, errors
  browser.close()
  print('PASS hero Gear tab, mobile/tablet/desktop themes, inline purse state, repair action, compact complete state and batch deep links')
finally:
 server.shutdown()
