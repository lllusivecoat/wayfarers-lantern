from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parents[2])));Thread(target=s.serve_forever,daemon=True).start()
out=Path('/tmp/wayfarers-preview');out.mkdir(exist_ok=True)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':1000},is_mobile=True,has_touch=True);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{s.server_port}/beta/',wait_until='networkidle');page.wait_for_function("document.readyState==='complete' && !!document.querySelector('.pv-top')");page.wait_for_timeout(400)
  page.evaluate('''() => {
 const check=(x,m)=>{if(!x)throw Error(m)};check(document.querySelector('.pv-ledger-toggle').textContent.includes('Guild ledger'),'labelled ledger');document.querySelector('.pv-ledger-toggle').click();check(document.querySelector('.stats').classList.contains('beta-full'),'ledger action');
 const pick=WL_BETA_VISUAL_PREVIEW.contractArt;const escort=pick({id:'a',title:'A dungeon beneath Stormwind',locationId:'deadmines',kind:'Contract',label:'Escort / delivery'});check(['gromgol','ratchet','rebel-camp'].includes(escort),'category overrides ordinary contract location');check(pick({kind:'World Dungeon',locationId:'deadmines'})==='deadmines','world dungeon keeps actual art');
 const h=structuredClone(game.player);h.id='photo-check';h.name='Photo Hero';h.wound={tier:1,days:1};const canvas=document.createElement('canvas');canvas.width=canvas.height=16;canvas.getContext('2d').fillRect(0,0,16,16);h.image=canvas.toDataURL('image/jpeg');h.traits=['Brave',Object.keys(TRAITS).find(t=>TRAITS[t].cat==='Social')];game.heroes.push(h);showView('roster');render();const row=document.querySelector('.v9-rrow[data-id="photo-check"]');check(row.querySelector('img').src===h.image,'custom photo replaces letter');check(row.querySelector('.pv-photo-frame .pv-wound-icon'),'photo retains wound marker');
 viewingHeroId=h.id;renderHeroStats();const blue=document.querySelector('#hero-stats-content .trait-chip.blue'),gold=document.querySelector('#hero-stats-content .trait-chip.gold');check(getComputedStyle(blue).minHeight===getComputedStyle(gold).minHeight,'social chip same size');check(getComputedStyle(blue).color==='rgb(138, 185, 227)','social chip blue');
 showTraitPopup(blue);check(getComputedStyle(document.querySelector('#trait-popup .trait-pop-type.blue')).color===getComputedStyle(blue).color,'social label matches bubble');hideTraitPopup();
 showView('staff');betaR3State.stab='hire';betaR3Run();betaUxRun();for(const c of document.querySelectorAll('.staff-candidate')){check(c.querySelectorAll(':scope>.beta-candidate-details').length===1,'single Details disclosure');check(c.querySelectorAll(':scope>.beta-tog').length===0,'no duplicate Details buttons');const details=c.querySelector('.beta-candidate-details');details.open=true;check(details.querySelector('.staff-aptitudes'),'staff aptitude details retained')}
 }''')
  assert not errors,errors;b.close();print('PASS category artwork, labelled ledger, uploaded photo with condition overlay, equal social chip sizing/blue and one staff Details control')
finally:s.shutdown()
