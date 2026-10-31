"""Party-size gathering yield, previews, food drops and sealed reports."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    page.wait_for_function("typeof WL_TRADE==='object'")
    page.evaluate("""() => {
      const check=(ok,msg)=>{if(!ok)throw Error(msg)};
      for(const profession of gatherProfessions)for(let rank=0;rank<=9;rank++){
        const q={...gatheringQuest(profession),rank,resourceQtyBase:2+2*rank};
        for(const outcome of ['Failure','Partial Success','Success','Exceptional Success']){
          let previous=0;
          for(let size=1;size<=20;size++){
            const qty=v9ResQty(q,outcome,size);
            check(qty>=previous,'yield must not decrease with party size');previous=qty;
            check(outcome!=='Failure'||qty===0,'failure gives no yield');
          }
        }
        check(v9ResQty(q,'Success',5)===2*(2+3*rank),'five members double base yield');
      }
      check(v9ResQty({kind:'Dungeon',rank:0,resourceQtyBase:4},'Success',10)===4,'other quest rewards unchanged');
      game.gold=10000;game.player.ready=true;game.player.wound=null;
      for(const key of abilityKeys)game.player.abilities[key]=100;
      const helper=structuredClone(game.player);helper.id='gather-helper';helper.name='Gather Helper';game.heroes.push(helper);
      const q=gatheringQuest('Skinning');game.selected=['player',helper.id];
      check(questLootTable(q).some(row=>row[1].includes('+25%')),'preview explains member bonus');
      const random=Math.random;Math.random=()=>.99;
      queueQuestReport(q,game.selected,0,'Gathering yield check');Math.random=random;
      const r=game.pendingReports.at(-1);
      check(r.resourceQty===v9ResQty(q,r.outcome,2),'actual report uses dispatched party size');
      check(r.lootDrops.some(d=>d.foodDrop),'food follows gathering yield');
      check(r.extendedSummary.includes(`Recovered ${r.resourceQty} ${r.resource}.`),'report matches sealed reward');
      // Force each outcome for a six-hero D-rank mission and verify the actual return.
      game.pendingReports=[];game.questDone={};
      const ids=['player',helper.id];while(ids.length<6){const h=structuredClone(helper);h.id='yield-'+ids.length;h.name=h.id;game.heroes.push(h);ids.push(h.id)}
      const tierFn=perkTier,gatherFn=resolveGatheringChecks;
      for(const tier of [0,1,2,3]){
       game.pendingReports=[];ids.forEach(id=>{purse(id).ready=true;purse(id).dead=false});
       const mission={...gatheringQuest('Mining'),rank:2,resourceQtyBase:6};
       perkTier=()=>tier;
       const checks=ids.map(id=>({id,name:purse(id).name,roll:15,modifier:3,total:18,success:true}));
       resolveGatheringChecks=()=>({checks,tier,phases:[]});
       queueQuestReport(mission,ids,0,'Six-hero reward fixture');
       const report=game.pendingReports.at(-1),expected=[0,9,18,27][tier];
       check(report.resourceQty===expected,'D rank six-hero outcome yield '+tier);
       if(expected)check(report.extendedSummary.includes(`Recovered ${expected} Copper Ore.`),'reported six-hero yield '+tier);
       const before=game.materials['Copper Ore']||0;report.dueAt=Date.now()-1;applyPendingReports();
       check((game.materials['Copper Ore']||0)-before===expected,'warehouse receives sealed reward '+tier);
      }
      perkTier=tierFn;resolveGatheringChecks=gatherFn;
      game.pendingReports=[r];window.yieldSnapshot=JSON.stringify(r);save();
    }""")
    snapshot=page.evaluate('yieldSnapshot')
    page.reload(wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'")
    assert page.evaluate('JSON.stringify(game.pendingReports.at(-1))')==snapshot
    page.evaluate("""() => {
      game.pendingReports=[];game.gold=100000;game.reputation=100000;game.player.ready=false;
      const h=game.heroes.find(h=>h.id==='gather-helper');h.rank=0;h.ready=true;h.dead=false;h.wound=null;
      const veteran=structuredClone(h);veteran.id='rank-veteran';veteran.rank=9;veteran.level=19;veteran.ready=false;game.heroes.push(veteran);
      const q=gatheringQuest('Mining');if(q.rank<2)throw Error('high-rank fixture required');
      if(!heroEligible(h,q))throw Error('low-rank gatherer blocked');
      if(heroEligible(h,{...q,kind:'Contract',rank:9}))throw Error('contract rank restrictions lost');
      game.questDone[q.templateKey]=true;game.selected=[];showView('permanent-quests');
    }""")
    page.locator("#gather-quest-list button[onclick*=\"gather-mining\"]").tap()
    page.locator('#quest-detail-content .quest-member-list label').first.tap()
    assert page.locator('#quest-dispatch-btn').is_enabled()
    page.locator('#quest-dispatch-btn').tap()
    assert page.evaluate("game.pendingReports.at(-1).partyIds.includes('gather-helper')")
    assert page.evaluate("!game.heroes.find(h=>h.id==='gather-helper').ready")
    assert not errors,errors
    b.close()
    print('PASS: all gathering professions/ranks/outcomes, member yield scaling, non-gathering rewards, preview, actual dispatch, food drops and saved reports')
