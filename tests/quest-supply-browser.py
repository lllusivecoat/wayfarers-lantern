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
    page.evaluate("""() => {
      const check=(ok,msg)=>{if(!ok)throw Error(msg)};
      check(game.questBoard.filter(q=>q.kind==='Contract').length>=6,'opening supply');
      game.questBoard=game.questBoard.filter(q=>q.kind==='Contract').slice(0,1);
      const retained=JSON.stringify(game.questBoard[0]);delete game.questSupplyVersion;qlist();
      check(game.questBoard.filter(q=>q.kind==='Contract').length===6,'saved board top-up');
      check(JSON.stringify(game.questBoard[0])===retained,'existing terms retained');
      const length=game.questBoard.length;qlist();check(game.questBoard.length===length,'no repeated top-up');
      const random=Math.random;Math.random=()=>.01;
      for(const hall of [1,4,7]){
        game.hall=hall;const before=game.questBoard.filter(q=>q.kind==='Contract').length;
        generateDailyArrivals();
        const added=game.questBoard.filter(q=>q.kind==='Contract').length-before;
        check(added>=6+2*(hall-1),'daily minimum at Hall '+hall);
        check(game.boardRolls.count===added,'daily count recorded');
      }
      Math.random=random;save();window.savedBoard=JSON.stringify(game.questBoard);
    }""")
    saved=page.evaluate('savedBoard');page.reload(wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'")
    assert page.evaluate('JSON.stringify(game.questBoard)')==saved
    assert not errors,errors
    b.close();print('PASS: opening contracts, daily Hall scaling with minimum rolls, preserved contracts, one-time save migration and reload')
finally:server.shutdown()
