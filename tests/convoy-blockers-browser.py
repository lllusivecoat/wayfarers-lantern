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
      game.tradeParty=[];game.tradeCargo={};renderTrading();showView('trading');
      check(document.getElementById('trade-dispatch-reason').textContent.includes('Assign a staff member'),'Warehouse staffing blocker');
      check(document.getElementById('trade-dispatch-reason').textContent.includes('Select at least one'),'escort blocker');
      check(document.getElementById('trade-dispatch-reason').textContent.includes('goods to sell'),'cargo blocker');
      game.staffMembers.push({id:'convoy-keeper',name:'Keeper',wage:2,buildingUid:null,buildingKey:null,professionXP:{}});
      check(v9AssignStaff('convoy-keeper','warehouse')==='','assign staff');
      game.player.ready=true;game.player.wound=null;game.tradeParty=['player'];game.materials['Copper Ore']=100;game.tradeCargo={'Copper Ore':21};renderTrading();
      check(document.getElementById('trade-dispatch-reason').textContent.includes('21/20'),'capacity blocker');
      game.tradeCargo={'Copper Ore':101};renderTrading();
      check(document.getElementById('trade-dispatch-reason').textContent.includes('only 100'),'warehouse stock blocker');
      game.tradeCargo={'Copper Ore':1.5};renderTrading();
      check(document.getElementById('trade-dispatch-reason').textContent.includes('whole quantity'),'quantity blocker');
      game.tradeCargo={'Copper Ore':2};game.gold=0;renderTrading();
      check(!document.getElementById('trade-dispatch').disabled&&document.getElementById('trade-dispatch-reason').hidden,'valid sale allowed without upfront gold');
      check(document.getElementById('market-buy-reason').textContent.includes('Not enough guild gold'),'purchase treasury blocker');
      window.random=Math.random;Math.random=()=>.99;
    }""")
    page.locator('#trade-dispatch').click()
    page.evaluate("""() => {
      Math.random=random;const r=game.pendingReports.at(-1);
      check(r.kind==='trade'&&r.cargo[0].count===2,'outbound button dispatches');r.dueAt=Date.now()-1;applyPendingReports();
      game.gold=1000;game.player.ready=true;game.player.wound=null;game.tradeParty=['player'];renderTrading();
      check(!document.getElementById('market-buy').disabled&&document.getElementById('market-buy-reason').hidden,'purchase unblocked');Math.random=()=>.99;
    }""")
    page.locator('#market-buy').click()
    page.evaluate("Math.random=random;check(game.pendingReports.at(-1).inboundCargo.length>0,'inbound button dispatches')")
    assert not errors,errors
    b.close();print('PASS: explicit staffing/escort/cargo/quantity/stock/capacity/treasury blockers; actual outbound and inbound button dispatch; no page errors')
finally:server.shutdown()
