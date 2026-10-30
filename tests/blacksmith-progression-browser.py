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
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};game.hall=7;game.gold=10000;game.pendingReports=[];game.buildingList.push({uid:'enh-shop',key:'workshop',level:5});game.staffMembers.push({id:'enh-smith',name:'Smith',wage:2,buildingUid:'enh-shop',buildingKey:'workshop',professionXP:{Blacksmithing:225},aptitudes:{Organisation:1,Craftsmanship:1,Care:1,Fieldcraft:1},personality:null,staffProfileVersion:1});v9Sync();staffMigrate(game);
 const smith=game.staffMembers.find(s=>s.id==='enh-smith');
 const unlocks=[0,2,3,4,5,6,7,8],firsts=[1,2,3,4,5,6,7,9];
 for(const r of renderGearCatalog())for(const k of Object.keys(r.requirements))game.materials[k]=1000000;
 const random=Math.random;Math.random=()=>0;
 let last;
 for(let tier=0;tier<8;tier++){
 const p=blacksmithTierProgression(tier);check(p.unlock===unlocks[tier]&&p.plusOne===firsts[tier]&&p.plusTwo===firsts[tier]+1,'progression '+tier);
 for(let skill=0;skill<=10;skill++){
 smith.professionXP.Blacksmithing=[0,5,15,30,50,75,105,140,180,225,275][skill];
 const expected=skill>=p.plusTwo?2:skill>=p.plusOne?1:0;
 check(blacksmithQualityBonus(tier,skill)===expected,'quality '+tier+'/'+skill);
 const before=game.gear.length;craftGear('death-knight-frost-'+tier);
 if(skill<p.unlock)check(game.gear.length===before,'locked recipe '+tier+'/'+skill);
 else{last=game.gear.at(-1);check(game.gear.length===before+1&&last.extraBonus===expected,'crafted quality '+tier+'/'+skill)}
 }
 }
 check(blacksmithQualityBonus(-1,10)===0&&blacksmithQualityBonus(8,10)===0,'invalid tiers safe');
 const snapshot=JSON.stringify(last);smith.professionXP.Blacksmithing=0;render();check(JSON.stringify(last)===snapshot,'owned gear retained');
 gearCraftSetCategory('weapon');gearCraftSetFamily('death-knight-frost');gearCraftSetTier(7);renderWarehouse();check(document.body.textContent.includes('Quality progression'),'quality preview');
 Math.random=random;save();window.savedEnhancementId=last.id;
 }''')
  saved=page.evaluate('savedEnhancementId')
  page.reload(wait_until='networkidle')
  assert page.evaluate('(id)=>game.gear.find(g=>g.id===id).extraBonus',saved)==2
  assert not errors,errors;b.close();print('PASS all 88 tier/skill combinations, recipe locks, forced quality crafting, reachable +1/+2 milestones, UI, frozen gear and reload')
finally:s.shutdown()
