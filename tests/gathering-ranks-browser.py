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
      for(let hall=1;hall<=7;hall++){game.hall=hall;check(staffCap()===plotCap(),'staff matches plots at Hall '+hall);check(V9_HALL[hall].staff===plotCap(),'upgrade preview matches cap')}
      game.hall=7;game.reputation=100000;
      const h=structuredClone(game.player);h.id='rank-helper';h.rank=9;h.level=19;game.heroes.push(h);
      render();showView('permanent-quests');
    }""")
    professions=page.evaluate('gatherProfessions')
    for profession in professions:
      key='gather-'+profession.lower()
      picker=page.locator('#gather-quest-list article').filter(has=page.locator('button[onclick*=\"'+key+'\"]')).locator('select')
      for rank in [0,3,7]:
        picker.select_option(str(rank))
        assert page.evaluate('(p)=>gatheringQuest(p).rank',profession)==rank
        assert picker.input_value()==str(rank)
        assert page.evaluate('(p)=>gatheringQuest(p).dc',profession)==10+rank*2
        assert page.evaluate('(p)=>gatheringQuest(p).minParty',profession)==1+rank//2
    page.evaluate("check(gatheringQuest('Mining').rareResource==='Thorium Ore','rank changes rare ore');save()")
    page.reload(wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'")
    assert page.evaluate('gatherProfessions.every(p=>gatheringQuest(p).rank===7)')
    assert not errors,errors
    b.close();print('PASS: actual rank selectors for all seven professions, difficulty/party/rare resources and saved choices')
finally:server.shutdown()
