"""Party-size gathering yield, previews, food drops and sealed reports."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page();errors=[]
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
      check(questLootTable(q)[0][1].includes('+25%'),'preview explains member bonus');
      const random=Math.random;Math.random=()=>.99;
      queueQuestReport(q,game.selected,0,'Gathering yield check');Math.random=random;
      const r=game.pendingReports.at(-1);
      check(r.resourceQty===v9ResQty(q,r.outcome,2),'actual report uses dispatched party size');
      check(r.lootDrops.some(d=>d.foodDrop),'food follows gathering yield');
      window.yieldSnapshot=JSON.stringify(r);save();
    }""")
    snapshot=page.evaluate('yieldSnapshot')
    page.reload(wait_until='networkidle');page.wait_for_function("typeof WL_TRADE==='object'")
    assert page.evaluate('JSON.stringify(game.pendingReports.at(-1))')==snapshot
    assert not errors,errors
    b.close()
    print('PASS: all gathering professions/ranks/outcomes, member yield scaling, non-gathering rewards, preview, actual dispatch, food drops and saved reports')
