"""Lab gates, staff progression, brewing transactions, recovery and permanent stats."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];accept=[True]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 page.on('dialog',lambda d:d.dismiss() if d.type=='confirm' and not accept[0] else d.accept())
 page.goto('http://127.0.0.1:8000',wait_until='networkidle');page.wait_for_function("typeof alchemyRecipes==='function'")
 page.evaluate("""() => {
  window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
  const def=v9Def('alchemyLab');check(def&&v9CanBuild(def).includes('Hall Level 2'),'Hall 1 construction gate');
  game.hall=2;game.reputation=100;game.gold=100000;check(buildExtension('alchemyLab')==='','real Lab construction');
  check(!brewAlchemy('field'),'unfinished Lab cannot brew');completeConstructionProject(game.constructionProjects.find(p=>p.key==='alchemyLab'));
  check(!brewAlchemy('field'),'unstaffed Lab cannot brew');
  game.staffMembers.push({id:'alchemist-test',name:'Test Alchemist',wage:3,morale:3,buildingUid:null,buildingKey:null,professionXP:{}});
  const lab=v9Inst('alchemyLab')[0];check(v9AssignStaff('alchemist-test',lab.uid)==='','free assignment to Lab');
  const st=buildingStaff('alchemyLab');check(st.profession==='Alchemy'&&staffProfessionLevel(st)===0,'Alchemy profession starts at zero');
  game.materials.Peacebloom=10;const gold=game.gold;
  check(brewAlchemy('field'),'basic brew');check(game.gold===gold&&game.materials.Peacebloom===8,'exact base costs');
  check(game.alchemyPotions[0].uses===3&&st.professionXP.Alchemy===1,'three uses and one practice');
  check(!brewAlchemy('field'),'daily Lab 1 limit');const saved=loadGame();check(saved.alchemyBatches[lab.uid].count===1,'capacity saved');
  check(upgradeBuilding(lab.uid)==='','Lab upgrade follows existing construction');completeConstructionProject(game.constructionProjects.find(p=>p.uid===lab.uid));
  check(upgradeBuilding(lab.uid)==='hall','Lab upgrades respect Hall caps');
  game.hall=7;lab.level=5;st.professionXP.Alchemy=275;st.personality='Resourceful';st.aptitudes={Organisation:3,Craftsmanship:5,Care:2,Fieldcraft:2};
  const q=alchemyQuote('panacea');check(q.gold===0&&q.ingredients.Kingsblood<15,'ordinary staff discounts');
  const end=alchemyQuote('ascension-str');check(end.gold===0&&end.ingredients['Heritage Ore']===20,'endgame never discounted');
  game.alchemyBatches={};st.professionXP.Alchemy=225;
  for(const [k,n] of Object.entries(end.ingredients))game.materials[k]=n*20;
  const before=JSON.stringify([game.gold,game.materials,game.alchemyPotions]);check(!brewAlchemy('ascension-str'),'Alchemy 10 required');
  check(JSON.stringify([game.gold,game.materials,game.alchemyPotions])===before,'failed gate consumes nothing');st.professionXP.Alchemy=275;
  game.hall=6;check(!brewAlchemy('ascension-str'),'Hall 7 required');game.hall=7;
  lab.level=4;check(!brewAlchemy('ascension-str'),'Lab 5 required');lab.level=5;
  game.materials['Boss Trophy']=0;check(!brewAlchemy('ascension-str'),'every ingredient required');game.materials['Boss Trophy']=600;
  window.readyGold=game.gold;window.readyStock=JSON.stringify(game.materials);showView('crafting');
 }""")
 # Recipe changes rerender the panel: readiness inventory must retain Equip controls.
 page.select_option('#alchemy-recipe','tonic')
 assert page.locator('[data-alchemy-use="0"]').inner_text().startswith('Equip for')
 page.select_option('#alchemy-hero','player')
 assert page.locator('[data-alchemy-use="0"]').is_enabled()
 page.select_option('#alchemy-recipe','ascension-str');assert 'no gold charge' in page.locator('#alchemy-panel').inner_text()
 accept[0]=False;page.locator('#alchemy-brew').click();assert page.evaluate('game.gold===readyGold&&JSON.stringify(game.materials)===readyStock')
 accept[0]=True;page.locator('#alchemy-brew').click()
 page.evaluate("""() => {
  check(game.gold===readyGold,'endgame gold committed once');const lab=v9Inst('alchemyLab')[0];check(game.alchemyBatches[lab.uid].count===5,'endgame consumes whole daily capacity');
  for(const [k,n] of Object.entries(alchemyQuote('ascension-str').ingredients)){if(k!=='Boss Trophy')check(game.materials[k]===n*19,'full endgame ingredient cost '+k)}
  window.elixirId=game.alchemyPotions.at(-1).id;window.originalStr=game.player.abilities.str;game.player.ready=false;check(!useAlchemyPotion('player',elixirId),'away hero blocked');game.player.ready=true;
 }""")
 accept[0]=False;page.evaluate("useAlchemyPotion('player',elixirId)");assert page.evaluate('game.player.abilities.str===originalStr')
 accept[0]=True;page.evaluate("check(useAlchemyPotion('player',elixirId),'use elixir');check(game.player.abilities.str===originalStr+1&&game.player.alchemyStatGains.str===1,'exact permanent raw stat increase')")
 page.evaluate("""() => {
  game.alchemyPotions.push({id:'duplicate-elixir',recipe:'ascension-str',uses:1});
  check(!useAlchemyPotion('player','duplicate-elixir')&&game.alchemyPotions.at(-1).uses===1,'lifetime limit without waste');game.alchemyPotions.push({id:'other-stat-elixir',recipe:'ascension-dex',uses:1});check(!useAlchemyPotion('player','other-stat-elixir')&&game.alchemyPotions.at(-1).uses===1,'other stat also blocked after first enhancement');
  const expected=defaultAbilities(game.player.className,game.player.spec).str+1;check(abilitiesAfterRespec(game.player,game.player.className,game.player.spec).str===expected,'respec helper preserves permanent bonus');
  game.player.abilities=abilitiesAfterRespec(game.player,game.player.className,game.player.spec);window.savedStr=game.player.abilities.str;
  game.player.preparedBonus=2;const field=game.alchemyPotions.find(x=>x.recipe==='field');check(useAlchemyPotion('player',field.id)&&field.uses===2,'one use reserved without consuming expedition buff');check(consumeExpeditionSupplies([game.player]).length===0,'prepared legacy buff avoids waste');
  game.player.preparedBonus=0;consumeExpeditionSupplies([game.player]);check(game.player.preparedBonus===1,'Field effect at departure');
  game.alchemyPotions.push({id:'tonic-test',recipe:'tonic',uses:1});check(useAlchemyPotion('player','tonic-test'),'tonic equipped');consumeExpeditionSupplies([game.player]);check(game.player.preparedBonus===2,'stronger tonic replaces weaker readiness at departure');
  game.alchemyPotions.push({id:'panacea-test',recipe:'panacea',uses:2});game.player.wound={tier:3,days:7};
  check(useAlchemyPotion('player','panacea-test')&&game.player.wound.days===5,'Grievous wound recovery');
  check(!useAlchemyPotion('player','panacea-test')&&game.alchemyPotions.find(x=>x.id==='panacea-test').uses===1,'shared daily recovery cap');
  game.player.dead=true;check(!useAlchemyPotion('player','panacea-test'),'dead recipient blocked');game.player.dead=false;
  game.consumables.push({id:'old-draught',name:'Field Draught',uses:3});game.player.preparedBonus=0;useDraught('player','old-draught');check(game.consumables.find(x=>x.id==='old-draught').uses===2,'legacy Field Draught reservable');consumeExpeditionSupplies([game.player]);
  const st=buildingStaff('alchemyLab');st.professionXP.Alchemy=0;const xp=st.professionXP;game.gold=100000;game.pendingReports=[];nextDay();check(st.professionXP.Alchemy>0,'paid work trains Alchemy');
  const old=st.professionXP.Alchemy;practiceStaff('alchemyLab');practiceStaff('alchemyLab');check(st.professionXP.Alchemy===old+1,'service practice once per day');
  const newDay=game.day;nextDay();check(game.day===newDay+1&&brewAlchemy('field'),'capacity refresh next day');
  const points=[0,5,15,30,50,75,105,140,180,225,275],lab=v9Inst('alchemyLab')[0];
  for(const recipe of alchemyRecipes().filter(r=>!r.stat)){
   game.day++;game.alchemyBatches={};lab.level=recipe.lab;st.professionXP.Alchemy=points[recipe.skill];
   for(const [k,n] of Object.entries(recipe.ingredients))game.materials[k]=100;
   const q=alchemyQuote(recipe.id),cash=game.gold,prior=Object.fromEntries(Object.keys(q.ingredients).map(k=>[k,game.materials[k]]));
   check(brewAlchemy(recipe.id),'ordinary recipe '+recipe.id);check(game.gold===cash-q.gold,'quoted gold '+recipe.id);
   for(const [k,n] of Object.entries(q.ingredients))check(game.materials[k]===prior[k]-n,'quoted material '+recipe.id+' '+k);
  }
  const applicant=makeApplicant({race:'Human',className:'Warrior',spec:'Arms'});game.applicants.push(applicant);openRecruit(applicant.id);confirmHire();
  const hero=game.heroes.at(-1);hero.gold=100;game.alchemyPotions.push({id:'hero-elixir-test',recipe:'ascension-dex',uses:1});check(useAlchemyPotion(hero.id,'hero-elixir-test'),'ordinary hero permanent gain');
  openHeroStats(hero.id);document.getElementById('hero-spec-'+hero.id).value=specs[hero.className].find(s=>s!==hero.spec);changeHeroSpec(hero.id);
  check(hero.abilities.dex===defaultAbilities(hero.className,hero.spec).dex+1&&hero.alchemyStatGains.dex===1,'hero spec change retains permanent bonus');closeHeroStats();
  save();render();showView('crafting');check(!document.getElementById('provision-crafting'),'old Warehouse brewing removed');
 }""")
 page.evaluate("game.player.gold=1000;openPlayerRespec();document.getElementById('respec-spec').value=specs[game.player.className].find(s=>s!==game.player.spec);confirmPlayerRespec();check(game.player.abilities.str===defaultAbilities(game.player.className,game.player.spec).str+1,'actual build change keeps enhancement')")
 stat=page.evaluate('game.player.abilities.str');page.reload(wait_until='networkidle');assert page.evaluate('game.player.alchemyStatGains.str===1')
 page.reload(wait_until='networkidle');assert page.evaluate('game.player.abilities.str')==stat
 with page.expect_download() as download:page.evaluate('exportSave()')
 payload=Path(download.value.path()).read_bytes();page.evaluate('game.player.alchemyStatGains={}')
 page.locator('#import-file').set_input_files({'name':'alchemy-save.json','mimeType':'application/json','buffer':payload});page.wait_for_function('game.player.alchemyStatGains.str===1');assert page.evaluate('game.player.abilities.str')==stat
 page.evaluate("showView('crafting')");assert page.locator('#alchemy-panel').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
 assert not errors,errors;b.close();print('PASS: construction/staff/Hall/skill gates, discounted regular brewing, exact endgame costs, confirmations, daily capacity, consumption/recovery/lifetime limits, permanent stats/respec/reload/import, legacy draughts, practice and mobile UI')
