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
 game.hall=7;game.gold=100000;game.pendingReports=[];game.consumables=[];game.alchemyPotions=[];game.fieldKits=[];
 for(const [uid,key,skill] of [['batch-kitchen','kitchen','Cooking'],['batch-lab','alchemyLab','Alchemy'],['batch-office','staffOffice','Quartermastery']]){game.buildingList.push({uid,key,level:5});game.staffMembers.push({id:uid+'-worker',name:'Batch worker',wage:2,buildingUid:uid,buildingKey:key,professionXP:{[skill]:275}})}v9Sync();staffMigrate(game);
 game.materials.Meat=100;game.materials['Fresh Fish']=100;for(const r of alchemyRecipes())for(const k of Object.keys(r.ingredients))game.materials[k]=10000;
 const random=Math.random;Math.random=()=>.99;check(cookRations('batch-kitchen','trail',2),'manual cooking');check(game.consumables.length===2&&game.consumables.every(i=>i.uses===3),'manual three-use rations');const count=game.consumables.length;game.staffCostsPaidDay=game.day;game.kitchenRecipes={'batch-kitchen':'trail'};game.dailySupplyRecipes={alchemy:'field',kit:'trail'};const snapshot=JSON.stringify([game.materials,game.consumables,game.alchemyPotions,game.fieldKits]);v9KitchenDay();check(JSON.stringify([game.materials,game.consumables,game.alchemyPotions,game.fieldKits])===snapshot,'old schedules do not produce or consume ingredients');renderWarehouse();check(!document.querySelector('.daily-supply,[data-kitchen-index]'),'automatic controls removed');check(document.querySelector('[data-cook-now]')&&document.querySelector('#alchemy-brew')&&document.querySelector('#field-kit-craft'),'manual controls preserved');
 check(brewAlchemy('tonic'),'brew tonic');check(game.alchemyPotions.at(-1).uses===3,'tonic has three uses');check(fieldKitRecipes().every(r=>r.uses===3),'kits unchanged three');
 const h=game.player;h.ready=true;h.wound=null;h.equipment={};h.gear=null;h.utilitySupplies={};h.preparedBonus=0;h.preparedSupplyBonuses={ration:0,potion:0,legacy:0};const food=game.consumables[0];equipUtilitySupply(h.id,'utility1','supply:food:'+food.id);check(h.utilitySupplies.utility1.uses===3,'load full ration');consumeExpeditionSupplies([h]);check(h.utilitySupplies.utility1.uses===2,'consume exactly one');equipSlot(h.id,'utility1','');check(game.consumables.find(i=>i.id===food.id).uses===2,'return real remaining uses');
 game.consumables.push({id:'legacy-single',name:'Trail Rations',ration:true,uses:1});game.alchemyPotions.push({id:'legacy-tonic',recipe:'tonic',uses:1},{id:'partial-field',recipe:'field',uses:1});game.fieldKits.push({id:'partial-kit',recipe:'trail',uses:1});delete game.supplyBatchVersion;save();check(game.consumables.find(i=>i.id==='legacy-single').uses===3,'legacy ration converted');check(game.alchemyPotions.find(i=>i.id==='legacy-tonic').uses===3,'legacy tonic converted');check(game.alchemyPotions.find(i=>i.id==='partial-field').uses===1&&game.fieldKits[0].uses===1,'existing three-use batch leftovers preserved');check(game.consumables.find(i=>i.id===food.id).uses===2,'new partial ration not refilled');save();check(game.consumables.find(i=>i.id==='legacy-single').uses===3,'conversion once');renderWarehouse();check(document.getElementById('warehouse-consumables').textContent.includes('3 uses left'),'actual label');Math.random=random;save();
 }''')
  page.reload(wait_until='networkidle')
  assert page.evaluate("game.consumables.find(i=>i.id==='legacy-single').uses")==3
  assert page.evaluate("game.alchemyPotions.find(i=>i.id==='partial-field').uses")==1
  assert not errors,errors;b.close();print('PASS manual-only three-use rations, old automatic schedules inert, tonic/kit batches, equipped consumption/returns, legacy conversion once, real partial charges, UI and reload')
finally:s.shutdown()
