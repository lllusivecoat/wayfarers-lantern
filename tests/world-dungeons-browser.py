"""Fixed dungeon identities, discovery, recipes, sealed rewards, and save compatibility."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parent.parent)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.on('dialog',lambda d:d.accept())
  page.evaluate("""() => {
    window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
    check(WL_DUNGEONS.all.length===30,'30 themed dungeons');
    check(new Set(WL_DUNGEONS.all.map(d=>d.material)).size===30,'exclusive unique materials');
    const discoveries=[...game.world.discovered];
    check(!game.world.discovered.includes('well-of-eternity'),'new dungeons not auto-discovered');
    check(v9ExploreCandidates(0).every(l=>l.minRank===0),'low exploration cannot find high dungeons');
    game.permRanks={'world-sunken-temple':9};game.hall=1;
    for(const d of WL_DUNGEONS.all){const q=v9WorldQuest(V9_LOC[d.id]);check(q.rank===d.rank,'rank ignores Hall and saved selectors');check(q.signatureMaterial===d.material,'signature');check(!v9RankPicker(q).includes('<select'),'fixed rank UI');check(q.minParty===8&&q.maxParty===8,'eight heroes');check(questLootTable(q).some(r=>r[0]===d.material),'loot preview');}
    setPermRank('world-sunken-temple',0);check(v9WorldQuest(V9_LOC['sunken-temple']).rank===4,'cannot change rank');
    game.permRanks['world-dungeon']=9;check(v9WorldQuest(V9_LOC['deepdelve-vault']).fixedLoot[0].count===2,'legacy starter fixed rewards');
    const first=v9WorldQuest(V9_LOC['deadmines']);game.world.discovered.push('deadmines');game.questDone[first.templateKey]=true;check(!qlist().some(q=>q.id===first.id),'once per day');delete game.questDone[first.templateKey];check(qlist().some(q=>q.id===first.id),'returns next day');
    const catalog=renderGearCatalog(),used=new Set(catalog.flatMap(r=>Object.keys(r.requirements)));
    for(const d of WL_DUNGEONS.all)check(used.has(d.material)||alchemyRecipes().some(r=>r.ingredients[d.material])||fieldKitRecipes().some(r=>r.ingredients[d.material]),'material has recipe: '+d.material);
    check(catalog.filter(r=>r.tier===0).every(r=>!Object.keys(r.requirements).some(n=>WL_DUNGEONS.source(n))),'basic crafting preserved');
    check(alchemyRecipes().filter(r=>r.stat).every(r=>r.ingredients['Eternal Wellspring Essence']===20),'elixir endgame costs');
    game.hall=7;game.gold=100000;game.reputation=10000;game.pendingReports=[];
    game.heroes=Array.from({length:8},(_,i)=>({...structuredClone(game.player),id:'dungeon-'+i,name:'Tester '+i,rank:9,ready:true,dead:false,wound:null,equipment:{},gear:null}));
    const ids=game.heroes.map(h=>h.id),oldTier=perkTier,random=Math.random;Math.random=()=>.99;
    for(const d of WL_DUNGEONS.all){
      const q={...v9WorldQuest(V9_LOC[d.id]),stageRun:'isolated-final-stage',stageIndex:2,stageCount:3};
      for(const tier of [0,1,2,3]){
        perkTier=()=>tier;const n=game.pendingReports.length;queueQuestReport(q,ids,0,'Testing');check(game.pendingReports.length===n+1,'queued');const r=game.pendingReports.at(-1),drop=r.lootDrops.find(x=>x.signatureDrop);
        check(tier<2?!drop:drop?.material===d.material&&drop.count===(tier===3?3:2),'outcome signature quantity');
      }
    }
    perkTier=oldTier;Math.random=random;
    // Only due reports deliver inventory; invoking the return processor again cannot duplicate it.
    const r=game.pendingReports.find(r=>r.signatureMaterial==='Eternal Wellspring Essence'&&r.outcome==='Success');game.pendingReports=[r];r.dueAt=Date.now()-1;const before=game.materials['Eternal Wellspring Essence']||0;applyPendingReports();check(game.materials['Eternal Wellspring Essence']===before+2,'delivered on return');applyPendingReports();check(game.materials['Eternal Wellspring Essence']===before+2,'no duplicate');
    for(const [key,skill] of [['workshop','Blacksmithing'],['alchemyLab','Alchemy'],['staffOffice','Quartermastery']]){const uid='test-'+key;game.buildingList.push({uid,key,level:5,spent:100});game.staffMembers.push({id:'staff-'+key,name:skill,wage:2,buildingUid:uid,buildingKey:key,professionXP:{[skill]:275}})}v9Sync();staffMigrate(game);
    const recipe=renderGearCatalog().find(r=>r.id==='warrior-arms-7');for(const [k,n] of Object.entries(recipe.requirements))game.materials[k]=n;
    craftGear(recipe.id);check(game.materials['Origination Spark']===0,'gear consumes exclusive material');
    const potion=alchemyRecipes().find(r=>r.stat);for(const [k,n] of Object.entries(potion.ingredients))game.materials[k]=n;
    check(brewAlchemy(potion.id),'actual elixir brew');check(game.materials['Eternal Wellspring Essence']===0,'elixir consumes Renown resource');
    const kit=fieldKitRecipes().find(r=>r.id==='masterwork');for(const [k,n] of Object.entries(kit.ingredients))game.materials[k]=n;check(craftFieldKit(kit.id),'actual kit crafting');check(game.materials['Echo of Lost Time']===0,'kit consumes Renown resource');
    document.getElementById('gear-crafted-modal').classList.remove('open');
    game.world.discovered=[...new Set([...discoveries,'sunken-temple','well-of-eternity'])];game.materials['Old Custom Material']=17;save();render();showView('permanent-quests');
  }""")
  assert page.locator('#permanent-quests .v9-rank-pick').count()==page.evaluate('gatherProfessions.length') # gathering pickers, no dungeon selector
  page.reload(wait_until='networkidle')
  assert page.evaluate("game.world.discovered.includes('sunken-temple')&&game.materials['Old Custom Material']===17")
  assert page.evaluate("v9WorldQuest(V9_LOC['well-of-eternity']).rank===9")
  assert not errors,errors
  browser.close();print('PASS: 30 fixed identities, discovery gates, rank UI, every material used, 120 outcome reports, return delivery/idempotence, old discoveries/materials and save/reload; no page errors')
finally:server.shutdown()
