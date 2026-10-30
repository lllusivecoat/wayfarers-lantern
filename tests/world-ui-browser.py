from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parent.parent)));Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(f'http://127.0.0.1:{s.server_port}',wait_until='networkidle')
  page.evaluate('''() => {
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 game.hall=7;game.buildingList.push({uid:'cost-shop',key:'workshop',level:5});game.staffMembers.push({id:'cost-smith',name:'Smith',wage:2,buildingUid:'cost-shop',buildingKey:'workshop',professionXP:{Blacksmithing:275}});v9Sync();staffMigrate(game);
 const h=game.player;h.name='Elara Ashfield';const r={title:'Chart the Unknown',outcome:'Success',extendedSummary:'The party returns. Level progress earned: Elara Ashfield +20 XP. Traits, bonds & wounds: Elara Ashfield suffers a Light wound. Discovery: The Deadmines (Westfall) — unlocks World Dungeon.',partyIds:[h.id],wounds:{player:{tier:1}},dispatchedDay:1,returnedDay:1};showReportDetails(r);
 const root=document.getElementById('report-detail-text');check(root.querySelector('.report-traits').textContent.includes('Traits, bonds'),'traits section');check(!root.querySelector('.report-traits').textContent.includes('Discovery:'),'discovery separated');check(root.querySelector('.report-discovery').textContent.includes('The Deadmines'),'discovery section');check(getComputedStyle(root.querySelector('.report-discovery')).color!==getComputedStyle(root).color,'discovery colored');check(root.querySelector('.report-xp')&&root.querySelector('.report-wound'),'other colors retained');
 renderWarehouse();const help=document.querySelector('.gear-crafting-help');check(help&&!help.open&&help.textContent.includes('Eight tiers'),'collapsed crafting explanation');check(!help.contains(document.querySelector('.gear-craft-controls')),'controls outside help');
 v9WorldEnsure(game);const known=[...game.world.discovered];check(WL_WORLD_EXPANSION.ids.length===12,'twelve locations');check(!WL_WORLD_EXPANSION.ids.some(id=>v9Known(id)),'not auto discovered');game.reputation=0;check(!v9ExploreCandidates(0).some(l=>l.id==='firelands-approach'),'rank and reputation gates');
 for(const id of WL_WORLD_EXPANSION.ids){const loc=V9_LOC[id];check(loc.sites.length===1&&loc.minRank>=0&&loc.minRank<=9,'contract site '+id);check(V9_WORLD.locations.filter(l=>l.id===id).length===1,'unique '+id)}
 game.world.discovered.push('goldshire');check(tradeDestinations().some(r=>r.id==='goldshire'),'discovered town market');check(!tradeDestinations().some(r=>r.id==='everlook'),'undiscovered town hidden');game.reportPresentationFixture=r;save();
 }''')
  page.reload(wait_until='networkidle')
  page.evaluate("showReportDetails(game.reportPresentationFixture)")
  assert page.locator('.report-discovery').inner_text().startswith('Discovery:')
  assert page.evaluate("V9_TYPES[0].pool.some(x=>x[0]==='Lion’s Pride Supply Escort')")
  assert not errors,errors;b.close();print('PASS separate colored discovery/traits, preserved XP/injury colors, collapsed crafting help, twelve gated contract sites, discovered-only markets and reload')
finally:s.shutdown()
