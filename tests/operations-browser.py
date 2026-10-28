"""Daily staff choices, funded expeditions, mixed cargo and permanent gear loss."""
import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    page.set_default_timeout(15000);errors=[];dialogs=[];accept=[True]
    page.add_init_script("window.check=(ok,msg)=>{if(!ok)throw Error(msg)};window.oldRandom=Math.random;")
    def dialog(d):
        dialogs.append(d.message)
        if d.type=='confirm' and not accept[0]:d.dismiss()
        else:d.accept()
    page.on('dialog',dialog)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    page.wait_for_function("typeof ensureStaffCandidates==='function'")
    page.evaluate("showView('staff')")
    pool=page.evaluate('JSON.stringify(game.staffCandidates)')
    assert len(json.loads(pool))==2
    page.reload(wait_until='networkidle')
    assert page.evaluate('JSON.stringify(game.staffCandidates)')==pool
    page.evaluate("showView('staff')")
    accept[0]=False
    page.locator('[data-hire-candidate="0"]').click()
    assert page.evaluate('game.staffMembers.length')==0
    assert f"Base wage: {json.loads(pool)[0]['wage']} gp/day" in dialogs[-1]
    accept[0]=True
    page.locator('[data-hire-candidate="0"]').click()
    assert page.evaluate('game.staffMembers[0].name')==json.loads(pool)[0]['name']
    assert page.evaluate('game.staffMembers[0].buildingUid') is None
    accept[0]=False
    page.locator('[data-pass-candidate="1"]').click()
    assert page.evaluate('game.staffCandidates[1].status')=='available'
    accept[0]=True
    page.locator('[data-pass-candidate="1"]').click()
    assert page.evaluate('game.staffCandidates[1].status')=='passed'
    assert page.locator('[data-hire-candidate]').count()==0
    page.reload(wait_until='networkidle')
    assert page.evaluate('game.staffCandidates.map(c=>c.status)')==['hired','passed']
    page.evaluate("game.gold=10000;nextDay();showView('staff')")
    assert page.locator('[data-hire-candidate]').count()==2
    assert page.evaluate('JSON.stringify(game.staffCandidates)')!=pool
    page.locator('[data-hire-candidate="0"]').click()
    assert page.evaluate('game.staffMembers.length')==2
    assert page.locator('[data-hire-candidate="1"]').is_disabled()
    assert page.locator('[data-pass-candidate="1"]').is_enabled()
    page.evaluate("""() => {
      window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
      const before=JSON.stringify(game.staffCandidates),now=Date.now;Date.now=()=>now()+86400000;
      try{ensureStaffCandidates();check(JSON.stringify(game.staffCandidates)===before,'real-world clock cannot reroll pool')}finally{Date.now=now}
      check(hireStaff()==='candidate','no unlimited anonymous hiring');
      game.player.wound=null;game.player.ready=true;game.player.training=null;game.pendingReports=[];
      for(const key of abilityKeys)game.player.abilities[key]=100;
      const q=gatheringQuest('Skinning');chosenQuest=q.id;game.selected=['player'];
      window.fee=permanentExpeditionCost(q,1);game.gold=fee-1;renderQuestDetails();
      check(document.getElementById('quest-dispatch-btn').disabled,'unaffordable expedition disabled');
      const old=JSON.stringify([game.gold,game.player.ready,game.questDone,game.pendingReports]);dispatchQuest();
      check(JSON.stringify([game.gold,game.player.ready,game.questDone,game.pendingReports])===old,'unaffordable dispatch has no side effects');
      game.gold=10000;window.oldRandom=Math.random;Math.random=()=>.99;renderQuestDetails();
      check(document.getElementById('quest-dispatch-btn').textContent.includes('Pay '+fee+' gp'),'fee shown before dispatch');
      dispatchQuest();Math.random=oldRandom;
      const r=game.pendingReports.at(-1);check(r.organizingCost===fee&&r.payout===0,'fee recorded, no client payment');
      check(game.gold===10000-fee&&!game.player.ready,'upfront fee and departure committed');
      const paid=game.gold;r.dueAt=Date.now()-1;applyPendingReports();
      check(game.gold===paid,'no reward gold or second fee on return');
      check(game.materials['Light Leather']>0&&game.materials.Meat>0,'materials and cooking ingredients preserved');
      check(r.extendedSummary.includes('no client payment')&&r.summary.includes('organising cost'),'funding explained in report');
      game.player.wound=null;Math.random=()=>0;const beforeFailure=game.gold;
      queueQuestReport({...q,dc:1000},['player'],0,'A failed expedition');Math.random=oldRandom;
      const failed=game.pendingReports.at(-1);check(failed.outcome==='Failure','failure fixture');
      failed.dueAt=Date.now()-1;applyPendingReports();check(game.gold===beforeFailure-fee&&failed.payout===0,'failed expedition fee not refunded');
      game.player.wound=null;
      const clientDemand=game.market?.n||0;
      for(const kind of ['Gathering','Exploration','World Dungeon','World Boss','World Raid']){
        for(let rank=0;rank<9;rank++)check(WL_BALANCE.expeditionCost(kind,rank+1,2)>WL_BALANCE.expeditionCost(kind,rank,2),'rank cost scaling');
        check(WL_BALANCE.expeditionCost(kind,0,3)>WL_BALANCE.expeditionCost(kind,0,2),'party cost scaling');
        Math.random=()=>.99;const before=game.gold;
        queueQuestReport({...q,kind,reward:1000,minParty:1},['player'],0,'Guild-funded');
        const trip=game.pendingReports.pop();check(trip.payout===0&&game.gold===before-trip.organizingCost,'no payment for '+kind);
      }
      check((game.market?.n||0)===clientDemand,'guild-funded trips do not consume client demand');
      Math.random=()=>.99;const beforeContract=game.gold;
      queueQuestReport({...q,id:'paid-contract',templateKey:'paid-contract',kind:'Contract',persistent:false,reward:100,rep:1,dc:6},['player'],0,'A client contract');
      const contract=game.pendingReports.at(-1);check(contract.payout>0&&contract.organizingCost===0&&game.gold===beforeContract,'client contracts still pay');
      contract.dueAt=Date.now()-1;applyPendingReports();check(game.gold>beforeContract,'client payment received');Math.random=oldRandom;
      const legacy={kind:'operation',questKind:'Gathering',questPersistent:true,title:'Old paid expedition',outcome:'Success',summary:'Old terms',partyIds:['player'],casualties:[],payout:25,rep:0,rolls:[],growthAwards:[],dueAt:Date.now()-1};
      const beforeLegacy=game.gold;game.pendingReports=[legacy];applyPendingReports();check(game.gold===beforeLegacy+25,'already queued reports retain old terms');
      const savedGold=game.gold;game.gold=0;
      game.storySession={quest:q,partyIds:['player'],party:[game.player],choices:[],step:0,bonus:0,dueAt:Date.now()-1};
      finishStoryOnTimer();check(!game.storySession&&game.pendingReports.at(-1)?.organizingCost===0,'pre-update story expedition is not retroactively charged or discarded');
      game.pendingReports=[];game.gold=savedGold;
      // Use the staff actually recruited through the confirmation flow.
      const keeper=game.staffMembers[0];check(v9AssignStaff(keeper.id,'warehouse')==='','staff assignment');keeper.professionXP.Storekeeping=275;
      if(!game.world.discovered.includes('ratchet'))game.world.discovered.push('ratchet');selectedTradeRoute='ratchet';
      game.materials={'Copper Ore':10,Timber:8};game.tradeCargo={};game.tradeParty=['player'];game.player.ready=true;game.player.wound=null;render();showView('trading');
    }""")
    page.locator('[data-cargo-select="0"]').check()
    page.locator('[data-cargo-quantity="0"]').fill('3')
    page.locator('[data-cargo-select="1"]').check()
    page.locator('[data-cargo-quantity="1"]').fill('2')
    assert '3 Copper Ore, 2 Timber' in page.locator('#trade-preview').inner_text()
    assert 'escort pay' in page.locator('#trade-preview').inner_text()
    assert 'Danger DC' in page.locator('#trade-preview').inner_text()
    page.reload(wait_until='networkidle')
    assert page.evaluate('game.tradeCargo')=={'Copper Ore':3,'Timber':2}
    page.evaluate("game.tradeParty=['player'];showView('trading')")
    page.locator('[data-cargo-quantity="1"]').fill('99')
    assert page.locator('#trade-dispatch').is_disabled()
    page.evaluate("window.cargoBefore=JSON.stringify([game.materials,game.pendingReports,game.player.ready]);dispatchTrade();check(JSON.stringify([game.materials,game.pendingReports,game.player.ready])===cargoBefore,'entire manifest validates before commit')")
    page.locator('[data-cargo-quantity="1"]').fill('2.5')
    assert page.locator('#trade-dispatch').is_disabled()
    page.locator('[data-cargo-quantity="1"]').fill('2')
    page.evaluate('window.goldBeforeTrade=game.gold;Math.random=()=>.99')
    page.locator('#trade-dispatch').click()
    page.evaluate("""() => {
      Math.random=oldRandom;const r=game.pendingReports.at(-1);
      check(r.kind==='trade'&&r.cargo.length===2&&r.outcome==='Success','mixed cargo dispatch');
      check(game.materials['Copper Ore']===7&&game.materials.Timber===6,'every cargo line committed');
      check(Object.keys(game.tradeCargo).length===0&&!game.player.ready,'manifest cleared and escort away');
      check(r.summary.includes('3 Copper Ore')&&r.summary.includes('2 Timber'),'manifest included in report');save();
    }""")
    page.reload(wait_until='networkidle')
    page.evaluate("""() => {
      window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
      const r=game.pendingReports.at(-1),gold=game.gold;
      check(r.cargo.length===2&&!game.player.ready,'mixed cargo report survives reload');
      r.dueAt=Date.now()-1;applyPendingReports();check(game.gold===gold+r.payout,'one convoy payout');
      const paid=game.gold;applyPendingReports();check(game.gold===paid,'no duplicate payout');
      // Build actual heroes for mixed-cargo ambushes and equipment-loss cases.
      for(let i=0;i<3;i++){const a=makeApplicant({race:'Human',className:'Warrior',spec:'Arms'});game.applicants.push(a);openRecruit(a.id);confirmHire()}
      const [a,b,c]=game.heroes;for(const h of [a,b,c,game.player]){h.level=1;h.traits=[];h.perks=[];h.wound=null;h.ready=true;for(const k of abilityKeys)h.abilities[k]=10}
      game.materials={'Copper Ore':10,Timber:10};game.tradeCargo={'Copper Ore':3,Timber:3};game.tradeParty=['player',a.id,b.id];
      const random=Math.random;const route=tradeDestinations().find(r=>r.id===selectedTradeRoute),profile=WL_TRADE.escortProfile([game.player,a,b]);const roll=WL_TRADE.danger(route)-2-profile.modifier-profile.support;check(roll>=1&&roll<=20,'partial fixture');Math.random=()=> (roll-.5)/20;
      dispatchTrade();Math.random=random;const partial=game.pendingReports.at(-1);
      check(partial.outcome==='Partial Success'&&partial.deliveredFraction===.75,'partial shipment shares one travel outcome');
      check(game.materials['Copper Ore']===7&&game.materials.Timber===7,'partial shipment commits all lines');
      partial.dueAt=Date.now()-1;applyPendingReports();
      game.player.ready=true;game.player.wound=null;game.tradeCargo={'Copper Ore':2,Timber:2};game.tradeParty=['player'];Math.random=()=>0;
      dispatchTrade();Math.random=random;const failed=game.pendingReports.at(-1);
      check(failed.outcome==='Failure'&&failed.payout===0&&failed.cargo.length===2,'failed mixed convoy');failed.dueAt=Date.now()-1;applyPendingReports();
      const gear=(id,name,owner,kind='weapon')=>({id,name,owner,kind,slot:kind,durability:20,maxDurability:20,bonus:1,stat:'STR'});
      game.gear=[gear('death-weapon','Last Blade',a.id),gear('death-armor','Last Armor',a.id,'armor'),gear('death-ring','Last Ring',a.id,'amulet'),gear('death-legacy','Legacy Tool',null,'utility'),gear('spare','Warehouse Spare',null),gear('survivor','Survivor Blade',b.id),gear('master','Guildmaster Blade','player')];
      a.gear='death-weapon';a.equipment={weapon:'death-weapon',armor:'death-armor',amulet1:'death-ring',utility1:'death-legacy',offhand:'survivor'};
      b.gear='survivor';b.equipment={weapon:'survivor'};game.player.gear='master';game.player.equipment={weapon:'master'};
      const death={kind:'operation',questKind:'Dungeon',title:'The Last Watch',outcome:'Failure',summary:'The party failed.',partyIds:[a.id,b.id,'player'],casualties:[a.id,'player'],payout:0,rep:0,rolls:[],growthAwards:[],dueAt:Date.now()-1,dispatchedDay:game.day};
      game.pendingReports=[death];applyPendingReports();
      check(['death-weapon','death-armor','death-ring','death-legacy'].every(id=>!game.gear.some(g=>g.id===id)),'all carried slots and legacy primary lost');
      check(['spare','survivor','master'].every(id=>game.gear.some(g=>g.id===id)),'unrelated and guildmaster gear preserved');
      check(!a.gear&&Object.keys(a.equipment).length===0,'fallen equipment references cleared');
      check(death.lostEquipment[0].items.length===4&&a.memorial.finalReport.lostEquipment[0].items.length===4,'equipment loss preserved in final report');
      check(reportDeathsMarkup(death,true).includes('Last Armor')&&reportDeathsMarkup(death,true).includes('Equipment lost with them'),'equipment loss readable');
      const near={...death,title:'A Narrow Escape',casualties:[],lostEquipment:undefined,partyIds:[b.id],near:[b.id],wounds:{[b.id]:{tier:2,saved:true}},dueAt:Date.now()-1};
      game.pendingReports=[near];applyPendingReports();check(game.gear.some(g=>g.id==='survivor'),'prevented death retains gear');
      game.gear.push(gear('convoy-tool','Convoy Tool',c.id,'utility'));c.gear='convoy-tool';c.equipment={utility1:'convoy-tool'};
      game.pendingReports=[{...death,kind:'trade',partyIds:[c.id],casualties:[c.id],lostEquipment:undefined,dueAt:Date.now()-1}];applyPendingReports();
      check(!game.gear.some(g=>g.id==='convoy-tool')&&c.memorial.finalReport.lostEquipment[0].items[0].name==='Convoy Tool','convoy death loses gear');
      save();window.lossSnapshot=JSON.stringify(a.memorial.finalReport.lostEquipment);render();showView('staff');
    }""")
    loss=page.evaluate('lossSnapshot')
    page.reload(wait_until='networkidle')
    assert page.evaluate('JSON.stringify(game.heroes[0].memorial.finalReport.lostEquipment)')==loss
    assert page.evaluate("game.gear.some(g=>g.id==='death-armor')") is False
    page.evaluate("openMemorialRecord(game.heroes[0].id)")
    assert 'Equipment lost with them' in page.locator('.memorial-record').inner_text()
    for width in [390,1280]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('.memorial-record').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
    assert not errors,errors
    browser.close()
    print('PASS: two stable daily staff candidates, hire/pass confirmations and cancellation, capacity, expedition costs/payment/rewards, mixed cargo success/partial/failure/reload, atomic stock checks, permanent equipped-gear loss, survivor/guildmaster protection and mobile/desktop UI; no console errors')
