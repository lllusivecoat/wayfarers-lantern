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
 const h=game.player;h.ready=true;h.wound=null;h.equipment={};h.gear=null;h.utilitySupplies={};h.preparedBonus=0;h.preparedSupplyBonuses={ration:0,potion:0,legacy:0};
 game.consumables=[{id:'charges-food',name:'Rations',ration:true,bonus:2,uses:6}];game.alchemyPotions=[{id:'charges-potion',recipe:'field',uses:3}];game.fieldKits=[{id:'charges-kit',recipe:'trail',uses:3}];
 for(const [slot,value] of [['utility1','food:charges-food'],['utility2','alchemy:charges-potion'],['utility3','kit:charges-kit']])check(equipUtilitySupply(h.id,slot,'supply:'+value),'equip '+slot);
 check(game.consumables[0].uses===3&&!game.alchemyPotions.length&&!game.fieldKits.length,'reserve three from storage');
 for(let i=2;i>=0;i--){const used=consumeExpeditionSupplies([h]);check(used.length===3,'one per category');for(const slot of ['utility1','utility2','utility3'])check(i?h.utilitySupplies[slot].uses===i:!h.utilitySupplies[slot],'remaining '+i);h.preparedBonus=0;h.preparedSupplyBonuses={ration:0,potion:0,legacy:0};h.expeditionKitProtection=0;}
 check(equipUtilitySupply(h.id,'utility1','supply:food:charges-food'),'reload');consumeExpeditionSupplies([h]);equipSlot(h.id,'utility1','');check(game.consumables[0].uses===2,'return unused two');h.preparedBonus=0;h.preparedSupplyBonuses={ration:0,potion:0,legacy:0};equipUtilitySupply(h.id,'utility1','supply:food:charges-food');check(h.utilitySupplies.utility1.uses===2,'low stock partial load');
 h.gold=10000;const caps=[20,32,48,64,96,128,160,200];for(let tier=0;tier<8;tier++){const armor={id:'repair-test-'+tier,owner:h.id,kind:'Armor',family:'plate',tier,durability:0,maxDurability:80};const two={...armor,kind:'Weapon',family:'greatsword',hands:2},one={...two,family:'sword',hands:1};check(gearRepairCost(armor)<=caps[tier]&&gearRepairCost(two)<=caps[tier],'repair cap '+tier);check(gearRepairCost(two)===2*gearRepairCost(one),'hand parity');const full=gearRepairCost(armor);armor.durability=79;check(gearRepairCost(armor)<=full,'partial cheaper');armor.durability=80;check(gearRepairCost(armor)===0,'no charge when full')}
 const g={id:'repair-actual',name:'Basic armor',owner:h.id,kind:'Armor',family:'plate',tier:0,durability:0,maxDurability:100};game.gear.push(g);const quote=gearRepairCost(g),gold=h.gold;repairGear(g.id);check(quote<=20&&h.gold===gold-quote&&g.durability===100,'actual Basic repair');
 const root=document.querySelector('.inventory-consumables');check(root&&!root.open,'consumables closed');root.querySelector('summary').click();check(root.open,'consumables expands');save();
 }''')
  page.reload(wait_until='networkidle')
  assert page.evaluate('game.player.utilitySupplies.utility1.uses')==2
  assert not errors,errors;b.close();print('PASS three-charge reservations/departures, all categories, returns/partial loads, tier repair caps/parity/actual payments, consumable collapse and reload')
finally:s.shutdown()
