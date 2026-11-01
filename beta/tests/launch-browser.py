"""Permanent launch cover: disposable storage, held network assets and real pixels."""
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
out=Path('/tmp/wayfarers-launch');out.mkdir(exist_ok=True)
url=f'http://127.0.0.1:{server.server_port}/beta/'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  errors=[];requests=[];held=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.on('request',lambda request:requests.append(request.url))
  page.add_init_script("localStorage.setItem('wayfarers-lantern-beta-cover','seen')")
  page.route('**/launch.js?*',lambda route:held.append(route))
  page.goto(url,wait_until='commit')
  page.wait_for_function("!!window.WL_BETA_BOOT && !!document.getElementById('beta-launch-cover')")
  assert page.locator('#beta-launch-cover').is_visible()
  assert page.locator('.shell').evaluate("e=>getComputedStyle(e).visibility==='hidden'")
  assert page.locator('#launch-skip').is_disabled()
  page.wait_for_function("document.getElementById('launch-art').complete && document.getElementById('launch-art').naturalWidth>0")
  for width,height in [(390,844),(820,1180),(1280,900)]:
   page.set_viewport_size({'width':width,'height':height})
   page.screenshot(path=str(out/f'splash-{width}.png'))
   assert page.locator('#beta-launch-cover').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  page.wait_for_function("document.readyState==='loading' && !!window.WL_BETA_GEAR_CARE")
  assert not [u for u in requests if '/chibi/' in u or '/thumbnails/' in u],requests
  assert held;held.pop(0).continue_();page.wait_for_function("window.WL_BETA_BOOT.phase==='done'")
  assert page.locator('#beta-launch-cover').count()==0
  assert page.locator('#beta-cover').count()==0
  assert page.locator('#hall').evaluate("e=>e.classList.contains('active')")
  assert page.locator('#beta-onb ol').is_visible()
  assert page.evaluate("localStorage.getItem('wayfarers-lantern-beta-cover')")=='seen'
  # A refresh must still show the launch cover with the seen flag present.
  page.reload(wait_until='commit');page.wait_for_function("!!document.getElementById('beta-launch-cover')")
  assert page.locator('#beta-launch-cover').is_visible()
  page.wait_for_function("!!window.WL_BETA_GEAR_CARE");assert held;held.pop(0).continue_()
  page.wait_for_function("window.WL_BETA_BOOT.phase==='done'")
  page.unroute('**/launch.js?*')
  # Skip can bypass unfinished artwork, but only after minimum initialization.
  pending=[];page.route('**/img/locations/booty-bay.webp',lambda route:pending.append(route))
  page.reload(wait_until='commit');page.wait_for_function("window.WL_BETA_BOOT?.minimumReady===true")
  page.locator('#launch-skip').click();page.wait_for_function("window.WL_BETA_BOOT.phase==='done'")
  for route in pending:route.abort()
  page.unroute('**/img/locations/booty-bay.webp')
  assert page.locator('#beta-launch-cover').count()==0
  # Earlier repair/enhancement entry points are still present in the real Hall.
  page.evaluate("openHeroStats('player')");page.locator('.beta-htabs [data-t=gear]').click()
  assert page.locator('.gearcare-hero [data-gear-kind=repair]').is_visible()
  assert page.locator('.gearcare-hero [data-gear-kind=enhance]').is_visible()
  page.locator('.gearcare-hero [data-gear-kind=repair] .gearcare-link').click()
  assert page.locator('#warehouse-gear [data-gear-batch=repair]').count()==1
  page.evaluate("openHeroStats('player')");page.locator('.beta-htabs [data-t=gear]').click()
  page.locator('.gearcare-hero [data-gear-kind=enhance] .gearcare-link').click()
  assert page.locator('#gear-enhancement [data-gear-batch=enhance]').count()==1
  assert not errors,errors
  # Reduced motion skips the fade delay. Corrupt saves keep their exact bytes.
  reduced=browser.new_page(reduced_motion='reduce')
  reduced.goto(url,wait_until='domcontentloaded');reduced.wait_for_function("window.WL_BETA_BOOT.phase==='done'")
  assert reduced.locator('#beta-launch-cover').count()==0
  bad=browser.new_page();bad.add_init_script("localStorage.setItem('wayfarers_lantern_offline_v1','{corrupt-save-fixture')")
  bad.goto(url,wait_until='domcontentloaded');bad.wait_for_function("window.WL_BETA_BOOT.failed")
  assert bad.locator('#launch-retry').is_visible()
  assert bad.evaluate("localStorage.getItem('wayfarers_lantern_offline_v1')")=='{corrupt-save-fixture'
  assert bad.locator('.shell').evaluate("e=>getComputedStyle(e).visibility==='hidden'")
  failure=browser.new_page();failure.route('**/gear-care.js?*',lambda route:route.abort())
  failure.goto(url,wait_until='domcontentloaded');failure.wait_for_function("window.WL_BETA_BOOT.failed")
  assert failure.locator('#launch-retry').is_visible()
  assert failure.locator('#launch-skip').is_hidden()
  browser.close();print('PASS first-frame splash, every-refresh seen independence, deferred assets, Skip, reduced motion, failure Retry, corrupt save and both Gear care links. Screenshots:',out)
finally:server.shutdown()
