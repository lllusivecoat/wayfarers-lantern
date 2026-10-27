"""Test real offline installs and release updates at a GitHub Pages-style subpath.
Run: python3 tests/offline-browser.py (requires Playwright and Chromium).
"""
from pathlib import Path
import functools
import http.server
import json
import re
import shutil
import subprocess
import tempfile
import threading
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

with tempfile.TemporaryDirectory(prefix='lantern-offline-') as temporary:
    served=Path(temporary);game=served/'game';game.mkdir()
    files=json.loads(re.search(r'const FILES=(.*);', (ROOT/'sw.js').read_text()).group(1))
    for item in files:
        target=game/item['path'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/item['path'],target)
    (game/'scripts').mkdir()
    for name in ['build-offline.py','sw-template.js']: shutil.copy2(ROOT/'scripts'/name,game/'scripts'/name)
    def build(): subprocess.run(['python3',str(game/'scripts/build-offline.py')],check=True,capture_output=True)
    build()
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=served))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    url=f'http://127.0.0.1:{server.server_port}/game/'
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
            context=browser.new_context();page=context.new_page();errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(url,wait_until='networkidle')
            page.wait_for_function("navigator.serviceWorker.controller && document.querySelector('#offline-status').textContent.startsWith('Offline ready')",timeout=30000)
            manifest=page.evaluate("fetch('manifest.webmanifest').then(r=>r.json())")
            assert manifest['start_url']=='./' and manifest['scope']=='./'
            assert len(manifest['icons'])==2
            page.evaluate("game.gold=6543;save();caches.open('unrelated-app-cache')")
            context.set_offline(True);page.reload(wait_until='networkidle')
            page.wait_for_function("typeof generateRaceName==='function' && typeof dispatchInbound==='function'")
            assert page.evaluate('game.gold')==6543
            page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(url+'index.html',wait_until='networkidle')
            page.wait_for_function("typeof staffSkillLevel==='function'")
            assert page.evaluate('game.gold')==6543
            print('PASS: complete offline install, reload and reopening at subpath; game modules and save retained')
            def release(number):
                with (game/'offline.js').open('a') as out:out.write(f'\nwindow.OFFLINE_TEST_RELEASE={number};\n')
                build()
            def update():
                page.locator('#check-game-update').click()
                page.wait_for_function("navigator.serviceWorker.getRegistration().then(reg=>!!reg.waiting)",timeout=30000)
                page.wait_for_function("!document.querySelector('#apply-game-update').hidden")
            release(2);context.set_offline(False);update()
            assert page.evaluate('typeof OFFLINE_TEST_RELEASE')=='undefined'
            # A failed save must leave the existing version running and the update waiting.
            page.evaluate("""() => {window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===SAVE_KEY)throw Error('Simulated quota failure');return originalSetItem.call(this,key,value)};game.gold=6544}""")
            page.locator('#apply-game-update').click()
            page.wait_for_function("document.querySelector('#offline-status').textContent.startsWith('Could not save progress')")
            assert page.evaluate('typeof OFFLINE_TEST_RELEASE')=='undefined'
            assert page.evaluate("navigator.serviceWorker.getRegistration().then(reg=>!!reg.waiting)")
            page.evaluate("() => {Storage.prototype.setItem=originalSetItem}")
            # The new cache is complete before restart, so activation also works offline.
            context.set_offline(True);page.locator('#apply-game-update').click()
            page.wait_for_function('window.OFFLINE_TEST_RELEASE===2',timeout=30000)
            assert page.evaluate('game.gold')==6544
            print('PASS: update waits for consent, activates offline, reloads coherent release, preserves save')
            release(3);context.set_offline(False);update()
            second=context.new_page();second.goto(url,wait_until='networkidle')
            page.locator('#apply-game-update').click()
            page.wait_for_function("document.querySelector('#offline-status').textContent.startsWith('Close other game tabs')")
            assert page.evaluate('OFFLINE_TEST_RELEASE')==2
            second.close();page.locator('#apply-game-update').click()
            page.wait_for_function('window.OFFLINE_TEST_RELEASE===3',timeout=30000)
            assert page.evaluate('game.gold')==6544
            print('PASS: additional tabs block activation until closed')
            # Simulate a partial deployment: worker expects a changed asset but server
            # still serves the old bytes. Integrity must reject the entire new release.
            previous=(game/'balance.js').read_bytes()
            (game/'balance.js').write_bytes(previous+b'\n// fourth-release asset\n');release(4)
            (game/'balance.js').write_bytes(previous)
            page.evaluate("""async () => {
              const reg=await navigator.serviceWorker.getRegistration();
              await reg.update();const worker=reg.installing;
              if(worker)await new Promise(resolve=>{worker.addEventListener('statechange',()=>{if(worker.state==='redundant')resolve()})});
            }""")
            assert not page.evaluate("navigator.serviceWorker.getRegistration().then(reg=>!!reg.waiting)")
            context.set_offline(True);page.reload(wait_until='networkidle')
            page.wait_for_function('window.OFFLINE_TEST_RELEASE===3')
            assert page.evaluate('game.gold')==6544
            assert not errors,errors
            print('PASS: mismatched release rejected; previous version and save remain usable offline')
            # Install failure must not affect other applications on the same origin.
            keys=page.evaluate('caches.keys()')
            assert 'unrelated-app-cache' in keys,keys
            assert len([key for key in keys if key.startswith('wayfarers-lantern:')])==1,keys
            browser.close()
    finally:server.shutdown();server.server_close()
