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
 const h=game.player;h.name='Kael Arden';
 const r={title:'The Deepdelve Vault · Stage 3/3 · Guardian hall',outcome:'Exceptional Success',summary:'Report',extendedSummary:'Guardian hall cleared. Level progress earned: Kael Arden +21 XP. Bonus find secured: 3 Ancient Trade Goods. Crafting materials secured: 2 Wool Cloth. Kael Arden suffers a Light wound.',partyIds:[h.id],growthAwards:[{id:h.id,amount:21}],lootDrops:[{material:'Ancient Trade Goods',count:3}],wounds:{player:{tier:1}},stageIndex:2,stagePlan:{quest:{locationId:'deepdelve-vault'},encounters:[{name:'Flooded gallery'},{name:'Warded vault'},{name:'Guardian hall'}]},dispatchedDay:1,returnedDay:1};
 const before=JSON.stringify(r);showReportDetails(r);const root=document.getElementById('report-detail-text');check(root.querySelector('.report-fight .boss-name').textContent==='Korvash, Vault Sentinel','legacy boss identity');check(root.querySelector('.report-fight').textContent.includes('decisive victory'),'fight outcome');check(root.querySelector('.report-xp').textContent.includes('+21 XP'),'XP colored');check(root.querySelector('.report-loot').textContent.includes('Ancient Trade Goods'),'loot colored');check([...root.querySelectorAll('.report-wound')].some(n=>n.textContent.includes('Kael Arden')&&n.textContent.includes('Light wound')),'injured name and wound red');check(!document.getElementById('report-detail-title').textContent.includes('Guardian hall'),'title boss name');check(JSON.stringify(r)===before,'sealed report unchanged');
 for(const outcome of ['Success','Partial Success','Failure']){showReportDetails({...r,outcome});check(root.querySelector('.report-fight'),'fight renders '+outcome)}
 game.todayReports=[{...r,memberAwards:[{id:h.id,amount:7}],memberCut:7}];openReportDetails(0);
 const xpNode=root.querySelector('.report-xp'),goldNode=root.querySelector('.report-member-gold');check(xpNode&&goldNode,'list opening preserves XP and gold paragraphs');check(goldNode.getBoundingClientRect().top-xpNode.getBoundingClientRect().bottom>=14,'list opening preserves paragraph gap');check(root.querySelector('.report-fight .boss-name'),'list opening preserves boss structure');check(xpNode.closest('.report-component')!==goldNode.closest('.report-component'),'XP and gold have separate labelled sections');
 showReportDetails({...r,extendedSummary:'Outcome: Success. Level progress earned: Kael Arden +21 XP. Supplies used: '+('Trail Rations; '.repeat(50))+' Discovery: A new route.'});check([...root.querySelectorAll('details.report-component')].some(d=>d.querySelector('summary').textContent==='Supplies used'&&!d.open),'long supply lists collapse');check(root.querySelector('.report-discovery').textContent.includes('new route'),'discovery stays separate');
 game.reportPresentationFixture=r;save();
 }''')
  page.reload(wait_until='networkidle')
  page.evaluate("showReportDetails(game.reportPresentationFixture)")
  assert page.locator('.report-fight .boss-name').inner_text()=='Korvash, Vault Sentinel'
  assert not errors,errors;b.close();print('PASS legacy boss aliases, title, outcome narratives, loot/XP colors, wound names and severity, sealed report preservation and reload')
finally:s.shutdown()
