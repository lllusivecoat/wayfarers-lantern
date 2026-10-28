"""Ingredient cooking, gathering food, single-staff saves and provision regression."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844});page.set_default_timeout(15000);errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 page.goto('http://127.0.0.1:8000',wait_until='networkidle');page.wait_for_function("typeof kitchenRecipes==='function'")
 page.evaluate("""() => {
 window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
 // Isolate base batches here; aptitude tests exercise the extra-ration roll.
 Math.random=()=>.99;
 game.hall=7;game.gold=10000;game.buildingList=[{uid:'kitchen-test',key:'kitchen',level:5,spent:35},{uid:'training-test',key:'trainingHall',level:5,spent:80}];v9Sync();
 // Simulate a pre-update save with several workers at a leveled building.
 game.staffMembers=[{id:'cook-low',name:'Kept Name',wage:5,buildingUid:'kitchen-test',buildingKey:'kitchen',profession:'Cooking',professionXP:{Cooking:15,Blacksmithing:50}},{id:'cook-high',name:'Better Cook',wage:2,buildingUid:'kitchen-test',buildingKey:'kitchen',profession:'Cooking',professionXP:{Cooking:30}}];
 save();check(game.staffMembers.length===2,'migration preserves staff');check(game.staffMembers[0].buildingUid===null,'extra worker unassigned');check(buildingStaff('kitchen').id==='cook-high','experienced worker retained');
 check(game.staffMembers[0].wage===5&&game.staffMembers[0].professionXP.Blacksmithing===50,'identity/wage/all skills preserved');
 check(v9AssignStaff('cook-low','kitchen-test')==='full','level 5 still one slot');check(v9Eff(v9InstById('kitchen-test'))===5,'full building service with one worker');
 v9AssignStaff('cook-low','training-test');check(v9Slots()===4,'upgraded Training Hall slots preserved');
 const before=game.consumables.length;nextDay();check(game.consumables.length===before,'no ingredient-free rations');
 game.materials.Meat=3;game.materials['Fresh Fish']=2;nextDay();
 check(game.consumables.length===before+2,'ingredient-limited daily batch');check(game.materials.Meat===1&&game.materials['Fresh Fish']===0,'both ingredients consumed');
 const count=game.consumables.length;v9KitchenDay();check(game.consumables.length===count,'no repeated daily production');
 const reloaded=loadGame();check(reloaded.kitchenProduction['kitchen-test']===game.day,'production marker saved');
 check(setKitchenRecipe('kitchen-test','hearty'),'advanced recipe unlock');game.materials['Prime Meat']=9;game.materials['Deviate Fish']=9;nextDay();
 check(game.consumables.filter(c=>c.recipe==='hearty').length===5,'building capacity sets output');check(game.materials['Prime Meat']===4&&game.materials['Deviate Fish']===4,'advanced ingredients consumed');
 check(game.consumables.at(-1).bonus===2,'advanced recipe bonus');
 const cook=buildingStaff('kitchen');cook.professionXP.Cooking=0;check(!setKitchenRecipe('kitchen-test','hearty'),'skill gate cannot bypass');const n=game.consumables.length;nextDay();check(game.consumables.length===n,'locked recipe pauses instead of substituting');
 cook.professionXP.Cooking=30;setKitchenRecipe('kitchen-test','trail');game.materials.Meat=100;game.materials['Fresh Fish']=100;
 game.gold=0;nextDay();check(game.consumables.length===n,'unpaid shift pauses');game.gold=10000;
 game.consumables.push({id:'legacy',name:'Legacy Rations',uses:40,bonus:3});const oldStock=JSON.stringify(game.consumables);nextDay();check(JSON.stringify(game.consumables)===oldStock,'legacy over-cap food retained without new production');
 game.consumables=[{id:'one',name:'Trail Rations',uses:1,bonus:1,ration:true},{id:'two',name:'Hearty Rations',uses:2,bonus:2,ration:true}];
 game.player.ready=true;game.player.dead=false;game.player.preparedBonus=0;game.player.wound={tier:1,days:5};game.pendingReports=[];
 useDraught('player','one');check(game.player.preparedBonus===1&&game.player.wound.days===4,'ration and light-wound recovery');
 useDraught('player','two');check(game.player.preparedBonus===2&&game.player.wound.days===4,'stronger replaces, healing once daily');
 window.alert=()=>{};const uses=game.consumables[0].uses;useDraught('player');check(game.consumables[0].uses===uses,'no equal bonus waste/stacking');
 game.player.preparedBonus=0;game.player.ready=false;useDraught('player');check(game.consumables[0].uses===uses,'no feeding dispatched hero');game.player.ready=true;
 // Successful actual gathering reports add food without replacing leather/fish.
 game.reputation=1400;game.player.abilities.dex=100;const random=Math.random;Math.random=()=>.99;
 for(const profession of ['Skinning','Fishing']){
  const q=gatheringQuest(profession);queueQuestReport(q,['player'],0,'Food test');const r=game.pendingReports.at(-1);
  check(r.outcome==='Exceptional Success','gathering success');check(r.resourceQty>0,'original gathered material preserved');
  check(r.lootDrops.some(d=>d.material===(profession==='Skinning'?'Prime Meat':'Deviate Fish')&&d.count>0),'high-rank ingredient reward');
  if(profession==='Skinning')check(r.lootDrops.some(d=>d.material==='Meat'),'basic meat preserved at high rank');
  const material=r.resource,prior=game.materials[material]||0;r.dueAt=Date.now()-1;applyPendingReports();check(game.materials[material]>prior,'original reward reaches storage');
 }
 const q={...gatheringQuest('Skinning'),rank:0};queueQuestReport(q,['player'],0,'Basic food');check(!game.pendingReports.at(-1).lootDrops.some(d=>d.material==='Prime Meat'),'low rank cannot award premium meat');
 Math.random=()=>0;const impossible={...q,dc:1000};queueQuestReport(impossible,['player'],0,'Failure');check(!game.pendingReports.at(-1).lootDrops.some(d=>d.foodDrop),'failed gathering no food');Math.random=random;
 // Check every new recipe's unlock, consumption, output and persisted recovery effects.
 const chef=buildingStaff('kitchen'),station=v9InstById('kitchen-test'),points=[0,5,15,30,50,75,105,140,180,225,275];
 for(const recipe of kitchenRecipes()){
  station.level=recipe.building;chef.professionXP.Cooking=points[recipe.skill];game.day++;game.staffCostsPaidDay=game.day;game.consumables=[];
  game.materials[recipe.meat]=9;game.materials[recipe.fish]=9;
  check(setKitchenRecipe(station.uid,recipe.id),'recipe unlocked '+recipe.name);v9KitchenDay();
  check(game.consumables.length===station.level,'recipe capacity '+recipe.name);
  check(game.materials[recipe.meat]===9-station.level&&game.materials[recipe.fish]===9-station.level,'recipe ingredient charge '+recipe.name);
  check(game.consumables[0].repair===(recipe.repair||0),'repair metadata');
  if(recipe.skill>0){chef.professionXP.Cooking=points[recipe.skill-1];check(!setKitchenRecipe(station.uid,recipe.id),'skill boundary '+recipe.name);chef.professionXP.Cooking=points[recipe.skill]}
  if(recipe.building>1){station.level--;check(!setKitchenRecipe(station.uid,recipe.id),'building boundary '+recipe.name);station.level++}
 }
 const grades=[{rank:0,meat:'Meat',fish:'Fresh Fish'},{rank:3,meat:'Prime Meat',fish:'Deviate Fish'},{rank:5,meat:'Rich Game Meat',fish:'Silverfin'},{rank:6,meat:'Wild Game Meat',fish:'Deepwater Fish'},{rank:7,meat:'Primal Meat',fish:'Royal Salmon'}];
 Math.random=()=>.99;game.player.ready=true;game.player.dead=false;
 for(let rank=0;rank<=9;rank++)for(const profession of ['Skinning','Fishing']){
  const quest={...gatheringQuest(profession),rank};queueQuestReport(quest,['player'],0,'Rank boundary');const report=game.pendingReports.pop();
  const foods=(report.lootDrops||[]).filter(d=>d.foodDrop);
  grades.forEach(g=>{if(profession==='Fishing'&&g.rank===0)return;const name=profession==='Skinning'?g.meat:g.fish;check(foods.some(d=>d.material===name)===(rank>=g.rank),'food grade boundary '+rank+' '+name)});
  const preview=questLootTable(quest).flat().join(' ');check(!preview.includes('rank 3'),'letter rank preview');
 }
 Math.random=random;
 game.gear.push({id:'ration-repair-test',name:'Test Blade',owner:'player',durability:5,maxDurability:20,bonus:1,stat:'STR'});game.player.gear='ration-repair-test';game.player.equipment={Weapon:'ration-repair-test'};game.player.wound={tier:1,days:6};game.player.preparedBonus=2;
 game.pendingReports=[];game.rationHealedDays={};game.rationRepairDays={};game.consumables=kitchenRecipes().slice(2).map(r=>({id:r.id,...r,ration:true,recipe:r.id,uses:2}));
 useDraught('player','restorative');check(game.player.wound.days===5,'Restorative recovery');
 useDraught('player','fortifying');check(game.gear.at(-1).durability===6,'Fortifying repair');
 useDraught('player','feast');check(game.gear.at(-1).durability===7&&game.player.wound.days===5,'Feast upgrades recovery without stacking');
 const remaining=game.consumables.find(i=>i.id==='feast').uses;useDraught('player','feast');check(game.consumables.find(i=>i.id==='feast').uses===remaining,'no wasted advanced meal at daily cap');
 game.player.preparedBonus=0;game.player.wound={tier:2,days:5};save();const mealSave=loadGame();check(mealSave.rationRepairDays.player.amount===2,'daily repair saved');check(mealSave.consumables.some(i=>i.repair===2),'meal effects saved');
 showView('warehouse');
 }""")
 page.evaluate("useDraught('player')")
 page.get_by_role('button',name='Use Grand Feast Rations',exact=True).click()
 assert page.evaluate('game.player.preparedBonus')==2
 assert page.evaluate('game.player.wound.days')==5, 'Serious wounds must not heal from food'
 page.locator('[data-kitchen-index]').select_option('feast')
 assert page.evaluate("game.kitchenRecipes['kitchen-test']")=='feast'
 page.reload(wait_until='networkidle');page.wait_for_function("typeof kitchenRecipes==='function'")
 page.evaluate("showView('warehouse')")
 assert page.locator('[data-kitchen-index]').input_value()=='feast'
 assert page.locator('#kitchen-recipes').is_visible()
 assert 'Prime Meat' in page.locator('#kitchen-recipes').inner_text() or page.locator('[data-kitchen-index]').count()==1
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 b.close();print('PASS: one-worker migration, upgraded services, basic/advanced ingredients, stock/skill/payment limits, daily/reload guards, non-stacking provisions, wound recovery, gathering success/failure rewards and mobile UI; no console errors.')
