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
 const smith=game.staffMembers.find(s=>s.id==='enh-smith'),id='death-knight-frost-7';
 check(blacksmithQualityBonus(7,8)===0&&blacksmithQualityBonus(7,9)===1&&blacksmithQualityBonus(7,10)===2,'Heritage boundary');check(blacksmithQualityBonus(6,6)===0&&blacksmithQualityBonus(6,7)===1&&blacksmithQualityBonus(6,8)===2,'Legendary boundary');check(blacksmithQualityBonus(5,5)===0&&blacksmithQualityBonus(5,6)===1&&blacksmithQualityBonus(5,7)===2,'Relic boundary');
 for(const r of renderGearCatalog())for(const k of Object.keys(r.requirements))game.materials[k]=100000;
 const random=Math.random;Math.random=()=>0;craftGear(id);const nine=game.gear.at(-1);check(nine.bonus===5&&nine.extraBonus===1&&nine.enhancement===0&&nine.maxDurability===78,'skill9 Heritage');
 smith.professionXP.Blacksmithing=275;craftGear(id);const ten=game.gear.at(-1);check(ten.bonus===6&&ten.extraBonus===2&&ten.maxDurability===80,'skill10 Heritage');check(nine.maxDurability===78&&nine.bonus===5,'existing gear frozen');
 const req10=gearCraftInfo(id).requirements;smith.professionXP.Blacksmithing=0;const req0=gearCraftInfo(id).requirements;check(req10['Eternium Ore']<req0['Eternium Ore'],'skill saves materials');smith.professionXP.Blacksmithing=275;
 const h=game.player;h.className='Death Knight';h.spec='Frost';h.ready=true;h.wound=null;h.equipment={};h.utilitySupplies={};h.gear=null;h.gold=10000;h.preparedBonus=0;equipSlot('player','weapon',ten.id);
 const gold=game.gold;for(let n=1;n<=4;n++){const q=gearEnhancementQuote(ten.id),ore=game.materials['Eternium Ore'];check(!q.reason&&q.next===n,'upgrade available');check(enhanceGear(ten.id),'upgrade applied');check(game.materials['Eternium Ore']===ore-q.materials['Eternium Ore'],'exact materials')}
 check(ten.bonus===6&&ten.maxDurability===80&&ten.enhancement===4&&game.gold===gold,'effects do not add stats, durability or gold fee');check(heroEnhancementReadiness(h,'str')===0&&gearBaseReadinessBonus(ten)===6,'original flat cap');check(WL_GEAR_EFFECTS.effects(ten).length===2,'second effect unlocked');const e=WL_GEAR_EFFECTS.effects(ten);check(Math.abs(e[0].value-.205)<1e-9&&Math.abs(e[1].value-.08)<1e-9,'Heritage final effect percentages');for(let step=0;step<=4;step++){const effects=WL_GEAR_EFFECTS.effects({...ten,enhancement:step});check(effects.length===(step>=3?2:1),'effect count milestone');if(step>=1)check(effects[0].value>WL_GEAR_EFFECTS.effects({...ten,enhancement:0})[0].value,'primary strengthens');if(step===4)check(effects[1].value>WL_GEAR_EFFECTS.effects({...ten,enhancement:3})[1].value,'secondary strengthens')}check(WL_GEAR_EFFECTS.effects({...ten,tier:0,enhancement:0}).length===0&&WL_GEAR_EFFECTS.effects({...ten,tier:0,enhancement:1}).length===1,'flat-tier unlock');check(!enhanceGear(ten.id),'max enforced');
 const old={id:'old-enh',name:'Old crafted sword',kind:'Weapon',family:'sword',tier:3,bonus:5,buildingBonus:2,extraBonus:1,durability:17,maxDurability:40,madeByPlayer:true};game.gear.push(old);render();check(old.enhancement===2&&old.baseCraftBonus===5&&old.bonus===5&&old.durability===17,'legacy bonus credit');render();check(old.enhancement===2,'migration once');
 game.buildingList.find(i=>i.uid==='enh-shop').level=1;check(gearEnhancementQuote(nine.id).reason.includes('Workshop Level 2'),'Workshop cap');game.buildingList.find(i=>i.uid==='enh-shop').level=5;h.ready=false;check(gearEnhancementQuote(ten.id).reason==='All four effect stages complete','max precedence');h.ready=true;Math.random=random;save();window.savedEnhancementId=ten.id;
 }''')
  saved=page.evaluate('savedEnhancementId')
  page.reload(wait_until='networkidle')
  assert page.evaluate('(id)=>game.gear.find(g=>g.id===id).enhancement',saved)==4
  assert page.evaluate('(id)=>game.gear.find(g=>g.id===id).maxDurability',saved)==80
  assert not errors,errors;b.close();print('PASS tier quality thresholds, durability/material scaling, frozen crafts, four paid effect milestones, costs/caps, legacy credit and save/reload')
finally:s.shutdown()
