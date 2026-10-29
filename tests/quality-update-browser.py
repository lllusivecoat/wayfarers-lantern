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
  game.hall=7;game.gold=10000;game.pendingReports=[];
  for(const [key,skill] of [['alchemyLab','Alchemy'],['staffOffice','Quartermastery']]){const uid='quality-'+key;game.buildingList.push({uid,key,level:1,spent:100});game.staffMembers.push({id:uid,name:key,wage:2,buildingUid:uid,buildingKey:key,professionXP:{[skill]:275}})}v9Sync();staffMigrate(game);
  game.materials.Peacebloom=30;check(brewAlchemy('field')&&brewAlchemy('field'),'unlimited manual potion');
  game.materials['Wool Cloth']=30;game.materials['Light Leather']=30;check(craftFieldKit('trail')&&craftFieldKit('trail'),'unlimited manual kits');
  game.dailySupplyRecipes={alchemy:'field',kit:'trail'};game.staffCostsPaidDay=game.day;const herbs=game.materials.Peacebloom;v9KitchenDay();check(game.materials.Peacebloom===herbs-2,'daily potion');const after=game.materials.Peacebloom;v9KitchenDay();check(game.materials.Peacebloom===after,'daily once only');
  check(contractRateForQuest({rank:0})===.03&&contractRateForQuest({rank:9})===.12,'shares +2pp');check(calculatePartyCompensation({kind:'Contract',rank:0},[{id:'player'}],101).awards[0].amount===4,'round up');
  const q={id:'quality-contract',templateKey:'quality-contract',kind:'Contract',rank:0,ability:'str',minParty:1,reward:100,rep:1,dc:6};game.questBoard.push({...q,expiresDay:game.day+1});check(qlist().find(q=>q.id==='quality-contract').reward===120,'reward 20 percent');check(qlist().find(q=>q.id==='quality-contract').reward===120,'no repeat increase');
  game.gear.push({id:'quality-gear',owner:'player',name:'Test gear',bonus:1,stat:'STR',durability:1,maxDurability:11});renderWarehouse();check(document.querySelector('#warehouse-gear summary').textContent.includes(game.player.name),'repairs by hero');check(document.querySelector('[data-repair-id="quality-gear"]').textContent.includes('10 gp'),'repair cost shown');
  game.heroes=[{...structuredClone(game.player),id:'low',name:'Low',rank:0,abilities:{str:5},dead:false},{...structuredClone(game.player),id:'high',name:'High',rank:2,abilities:{str:20},dead:false}];renderHeroes();document.getElementById('hero-sort').value='str';document.getElementById('hero-sort').dispatchEvent(new Event('change'));check(document.getElementById('hero-list').textContent.indexOf('High')<document.getElementById('hero-list').textContent.indexOf('Low'),'stat sorting');
  game.player.ready=true;game.player.wound=null;game.selected=['player'];chosenQuest='gather-mining';renderQuestDetails();check(document.querySelectorAll('.quest-provisions button').length===3,'party quick equip');check(!document.querySelector('.quest-provisions .boss-name'),'no encounter list in preparation');document.querySelector('[data-kind="kit"]').click();check(Object.values(game.player.utilitySupplies||{}).some(p=>p.source==='kit'),'kit reserved for selection');
  check(V9_LOC.deadmines.world.encounters[0].name==='Rhahk’Zor','dungeon bosses');check(V9_LOC.naxxramas.world.encounters[0].name==='Heigan the Unclean','raid bosses');game.todayReports=[{title:'The Deadmines',outcome:'Success',extendedSummary:'Rhahk’Zor, DC 12: defeated. Captain Greenskin, DC 13: defeated.',partyIds:[],casualties:[]}];openReportDetails(0);check(document.querySelectorAll('#report-detail-text .boss-name').length===2,'boss names colored in full report');save();
  }''');assert not errors,errors;b.close();print('PASS daily/manual crafting, repeat protection, reward increase/rounding, repair costs/grouping, stat sort, selected-party kits and boss names; no page errors')
finally:s.shutdown()
