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
  page.evaluate("""() => {const pick=WL_BETA_VISUAL_PREVIEW.contractArt;if(pick({title:'The Deadmines',desc:'A daily expedition from Booty Bay'})!=='deadmines')throw Error('specific dungeon artwork');if(pick({title:'A job',locationId:'stormwind'})!=='stormwind')throw Error('explicit location artwork');if(pick({title:'Zul’Farrak · Daily dungeon'})!=='zulfarrak')throw Error('punctuation alias');const used=new Map(),images=Array.from({length:6},(_,i)=>pick({id:'harbour-'+i,title:'Harbour job',label:'Escort / delivery',location:'Booty Bay'},used));if(new Set(images).size<3)throw Error('fallback artwork repeats');}""")
  assert page.locator('#beta-guild-rename').is_hidden()
  page.screenshot(path=str(out/'01-fresh-hall-mobile.png'),full_page=True)
  page.locator('.pv-pencil').tap();page.locator('#beta-guild-name-input').fill('The Gilded Compass');page.locator('#beta-guild-rename button').tap()
  page.evaluate('''() => {game.hall=3;game.day=19;game.gold=255;game.reputation=272;game.player.className='Paladin';game.player.spec='Protection';game.player.level=6;game.player.gold=68;const names=[['Elara Whitfield','Monk','Brewmaster'],['Aethas Sunblade','Demon Hunter','Vengeance'],['Sabine Westvale','Death Knight','Frost'],['Dorin Anvilhammer','Death Knight','Unholy']];for(const [i,[name,cls,spec]] of names.entries()){const h=structuredClone(game.player);Object.assign(h,{id:'preview-'+i,name,className:cls,spec,level:3+i,rank:1+i,traits:i===0?['Frail','Debt-Ridden']:['Brave'],wound:i===0?{tier:2,days:1}:null});game.heroes.push(h)}for(const [key,skill] of [['cartographersOffice','Cartography'],['kitchen','Cooking'],['trainingHall','Training']]){const uid='preview-'+key;game.buildingList.push({key,uid,level:1});game.staffMembers.push({id:uid+'-staff',name:'Mara',wage:2,buildingUid:uid,buildingKey:key,professionXP:{[skill]:15}})}staffMigrate(game);v9Sync();game.world.discovered=[...new Set([...game.world.discovered,'goldshire','stormwind','ironforge','darkshire','sentinel-hill','deadmines','orgrimmar','crossroads','ratchet','theramore','gadgetzan','undercity','everlook','zulgurub'])];game.log.push({day:19,title:'Supplies secured',text:'The party brings home 25 gp and a cache of Copper Ore.'},{day:19,title:'A new adventurer',text:'Elara Whitfield joins the guild.'});render();save()}''');page.wait_for_timeout(250)
  page.screenshot(path=str(out/'02-established-hall-mobile.png'),full_page=True)
  page.evaluate("showView('quests')");page.wait_for_timeout(250);page.screenshot(path=str(out/'03-contracts-mobile.png'),full_page=True)
  page.evaluate("showView('roster')");page.wait_for_timeout(200);page.screenshot(path=str(out/'04-heroes-mobile.png'),full_page=True)
  page.set_viewport_size({'width':1440,'height':1100});page.evaluate("showView('world')");page.wait_for_timeout(200);page.screenshot(path=str(out/'05-atlas-desktop.png'))
  page.locator('#pv-world-map .pv-pin').first.click();assert page.locator('#pv-map-modal').evaluate("e=>e.classList.contains('open')");page.wait_for_timeout(200);page.screenshot(path=str(out/'06-location-desktop.png'))
  page.evaluate("document.getElementById('pv-map-modal').classList.remove('open');showView('hall')");page.screenshot(path=str(out/'07-hall-desktop.png'))
  page.evaluate("nextDay()");assert page.locator('.pv-dawn').count()==1
  page.wait_for_timeout(2000);page.emulate_media(reduced_motion='reduce');page.evaluate("nextDay()");assert page.locator('.pv-dawn').count()==0
  assert page.evaluate("getComputedStyle(document.querySelector('.pv-time>span')).transitionDuration==='0s'")
  snapshot=page.evaluate("localStorage.getItem('wayfarers_lantern_offline_v1')");page.reload(wait_until='networkidle');page.wait_for_function("document.readyState==='complete' && !!document.querySelector('.pv-top')");assert page.evaluate("localStorage.getItem('wayfarers_lantern_offline_v1__beta_backup')")==snapshot
  page.evaluate("const key='wayfarers_lantern_offline_v1',s=localStorage.getItem(key);localStorage.setItem(key,JSON.stringify({...JSON.parse(s),heroes:[]}));if(localStorage.getItem(key)!==s)throw Error('Save guard broken')")
  assert not errors,errors;b.close();print('PASS preview rendering, rename, artwork, atlas pin, dawn, reduced motion and save backup guard. Screenshots:',out)
finally:s.shutdown()
