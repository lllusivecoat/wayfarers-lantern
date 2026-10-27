"""Death notices, persistent narratives, legacy reports and mobile report layouts."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    page.set_default_timeout(15000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    page.wait_for_function("typeof reportDeathAccounts==='function' && typeof kitchenRecipes==='function'")
    page.evaluate("""() => {
      const check=(ok,msg)=>{if(!ok)throw Error(msg)};
      window.deathCheck=check;
      game.gold=10000;
      for(let i=0;i<2;i++){const applicant=makeApplicant({race:'Human',className:'Warrior',spec:'Arms'});game.applicants.push(applicant);openRecruit(applicant.id);confirmHire()}
      const a=game.heroes[0],b=game.heroes[1];
      check(a&&b,'starter heroes');
      a.name='Thora <Ash & Ember>';b.name='Brann';
      const report=(extra={})=>({kind:'operation',questKind:'Dungeon',title:'The Broken Gate',outcome:'Success',summary:'The gate is secured.',extendedSummary:'The objective was secured.',partyIds:[a.id,b.id,'player'],casualties:[a.id],rolls:[],growthAwards:[],payout:0,rep:0,dispatchedDay:game.day,dueAt:Date.now()-1,...extra});
      // Resolve actual pending reports, rather than only testing display helpers.
      const r=report();game.pendingReports=[r];applyPendingReports();
      check(a.dead&&!a.ready&&!b.dead,'death resolution preserved');
      check(r.deathAccounts.length===1&&r.deathAccounts[0].name===a.name,'snapshot recorded');
      check(r.deathAccounts[0].text.includes('objective was secured'),'costly success narrative');
      const before=JSON.stringify(r.deathAccounts);
      save();const loaded=loadGame();
      check(JSON.stringify(loaded.todayReports[0].deathAccounts)===before,'death account persists through save migration');
      game=loaded;render();showView('quests');openReportDetails(0);
      const box=document.querySelector('#report-detail-deaths');
      check(box.textContent.includes('Thora <Ash & Ember> has died.'),'explicit full-report death notice');
      check(box.querySelectorAll('ash').length===0,'hero name escaped');
      check(box.previousElementSibling.id==='report-detail-date','death section at report end');
      check(document.querySelector('#report-list .report-deaths').textContent.includes('has died'),'report card notice');
      check(getComputedStyle(box.querySelector('strong')).color==='rgb(255, 170, 170)','red notice');
      check(box.getBoundingClientRect().width<=390,'mobile width');
      closeReportDetails();
      // Old reports without accounts, duplicate casualties and unknown names remain readable.
      const legacy=report({deathAccounts:undefined,casualties:[a.id,a.id,b.id]});
      check(reportDeathAccounts(legacy).length===2,'one notice per fallen hero');
      check(reportDeathsMarkup(legacy,true).includes('Brann has died.'),'multiple casualties');
      check(reportDeathAccounts(report({casualties:['missing'],rolls:[{id:'missing',name:'Remembered Hero'}]}))[0].name==='Remembered Hero','legacy roll name fallback');
      check(reportDeathAccounts(report({casualties:['unknown']}))[0].name==='An unnamed hero','missing hero fallback');
      const alive=report({casualties:[],near:[b.id],wounds:{[b.id]:{tier:3}}});
      check(reportDeathsMarkup(alive,true)==='','wounds and prevented deaths never declared dead');
      game.todayReports=[alive];openReportDetails(0);check(!box.textContent,'previous death notice cleared');closeReportDetails();
      // Distinct mission contexts and no invented eyewitnesses after a total loss.
      for(const [extra,word] of [[{kind:'trade'},'convoy'],[{questKind:'Gathering'},'gathering'],[{questKind:'Exploration'},'uncharted|unknown|territory|exploration'],[{},'fighting|battle|defence|enemy']]){
        const item=report({...extra,outcome:'Failure'});check(new RegExp(word).test(reportDeathAccounts(item)[0].text),'mission-specific account '+word);
      }
      const solo=report({partyIds:[a.id],outcome:'Failure'});
      check(reportDeathAccounts(solo)[0].text.includes('final moments remain unknown'),'no eyewitness story for solo loss');
      const wipe=report({partyIds:[a.id,b.id],casualties:[a.id,b.id]});
      check(reportDeathAccounts(wipe).every(x=>x.text.includes('No member')),'total party loss');
      const variants=new Set();
      for(let i=0;i<20;i++)variants.add(reportDeathAccounts(report({title:'Mission '+i}))[0].text);
      check(variants.size>=3,'varied accounts');
      // Pure narrative generation must never consume any random rolls.
      const random=Math.random;Math.random=()=>{throw Error('narrative changed gameplay RNG')};
      try{reportDeathAccounts(report());reportDeathsMarkup(report(),true)}finally{Math.random=random}
      // A real expedition produces death-aware prose before being delivered.
      game.heroes.forEach(h=>{h.dead=false;h.ready=true});game.pendingReports=[];
      const casualties=tbwCasualties;
      tbwCasualties=()=>({dead:[a.id],wounds:{},near:[]});Math.random=()=>.99;
      try{
        queueQuestReport({...gatheringQuest('Skinning'),kind:'Contract',persistent:false,minParty:1,rank:0,dc:6,reward:10,rep:1},[a.id,b.id,'player'],0,'The party sets out');
        const pending=game.pendingReports.at(-1);
        check(['Success','Exceptional Success'].includes(pending.outcome),'success fixture');
        check(pending.extendedSummary.includes('lives are lost'),'costly success prose');
        check(!pending.extendedSummary.includes('return to Booty Bay with an exceptional'),'no safe-return claim');
        pending.dueAt=Date.now()-1;applyPendingReports();
        check(pending.deathAccounts[0].id===a.id,'queued expedition records fallen');
      }finally{tbwCasualties=casualties;Math.random=random}
      save();window.deathSnapshot=JSON.stringify(game.todayReports[0].deathAccounts);
    }""")
    snapshot=page.evaluate('deathSnapshot')
    page.reload(wait_until='networkidle')
    assert page.evaluate('JSON.stringify(game.todayReports[0].deathAccounts)')==snapshot
    page.evaluate("showView('quests');openReportDetails(0)")
    assert page.locator('#report-detail-deaths').inner_text().count('has died.')==1
    # Both mobile and desktop layouts retain readable content and bounded width.
    for width in [390,1280]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('#report-detail-deaths').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
    assert not errors,errors
    browser.close()
    print('PASS: resolved deaths, varied context, costly success, near misses, legacy saves, reload, red notices and mobile/desktop layouts; no console errors')
