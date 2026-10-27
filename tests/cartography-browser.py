"""Run with the local static server on port 8000. Uses a disposable browser context."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page()
    page.set_default_timeout(5000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    page.wait_for_function("typeof staffSkillLevel==='function'")
    page.evaluate("""() => {
      window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
      check(!qlist().some(q=>q.kind==='Exploration'),'exploration absent before office');
      check(!questById('exploration'),'no dispatch lookup before office');
      game.world.discovered.push('ratchet');save();
      showView('permanent-quests');
    }""")
    assert page.locator('#exploration-office-notice').is_visible()
    assert page.get_by_text('Chart the Unknown',exact=True).count()==0
    page.reload(wait_until='networkidle')
    page.wait_for_function("typeof staffSkillLevel==='function'")
    page.evaluate("""() => {
      window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
      check(v9Known('ratchet'),'old discovery retained');
      check(!questById('exploration'),'old save does not get free office');
      game.gold=1000;game.reputation=50;
      const def=v9Def('cartographersOffice');game.hall=1;
      check(v9CanBuild(def)==='Upgrade the Hall first','Hall 2 gate');
      game.hall=2;game.reputation=20;check(v9CanBuild(def).includes('Established'),'reputation gate');
      game.reputation=50;check(buildExtension(def.key)==='','construction starts');
      check(game.gold===910,'construction cost');
      check(!questById('exploration'),'under construction stays locked');
      const project=game.constructionProjects.find(p=>p.key===def.key);
      completeConstructionProject(project);render();
      check(!buildingStaff(def.key),'office unstaffed');
      check(!!questById('exploration'),'completed office unlocks without staff');
      window.officeId=v9Inst(def.key)[0].uid;
      showView('permanent-quests');
    }""")
    assert page.locator('#exploration-office-notice').is_hidden()
    assert page.get_by_text('Chart the Unknown',exact=True).is_visible()
    page.evaluate("""() => {
      game.selected=['player'];game.player.ready=true;chosenQuest='exploration';
      window.oldRandom=Math.random;Math.random=()=>.99;
      dispatchQuest(true);
      const report=game.pendingReports.find(r=>r.questKind==='Exploration');
      check(!!report,'real exploration dispatch');
      const deadline=report.dueAt,known=game.world.discovered.slice();
      check(v9Destroy(officeId,true)==='ok','office destroyed');
      check(!questById('exploration'),'destroying office hides next offer');
      check(report.dueAt===deadline,'underway timer preserved');
      check(known.every(id=>v9Known(id)),'known places retained');
      report.dueAt=Date.now()-1;applyPendingReports();
      check(report.v9explored,'underway discovery report still resolves');
      check(game.world.discovered.length>known.length,'underway discovery kept');
      check(tradeDestinations().some(d=>d.id==='ratchet'),'known trade route kept');
      check(qlist().some(q=>q.kind==='World Dungeon'),'known world quests kept');
      Math.random=oldRandom;
      game.questDone={};buildExtension('cartographersOffice');
      completeConstructionProject(game.constructionProjects.find(p=>p.key==='cartographersOffice'));
      const office=v9Inst('cartographersOffice')[0];hireStaff(office.uid);
      const st=buildingStaff('cartographersOffice');check(st.profession==='Cartography','current skill');
      const original=perkRollChecks;let captured;
      perkRollChecks=function(q,party,dc){captured=dc;return original.apply(this,arguments)};
      const q=v9ExplorationQuest();st.professionXP.Cartography=0;
      queueQuestReport(q,['player'],0,'Cartography test');const noviceDC=captured;
      st.professionXP.Cartography=275;queueQuestReport(q,['player'],0,'Cartography test');
      check(noviceDC-captured===3,'master exploration DC reduction');perkRollChecks=original;
      practiceStaffForReport(game.pendingReports.at(-1));practiceStaffForReport(game.pendingReports.at(-1));
      check(st.professionXP.Cartography===276,'one service practice award');
      const discovered=game.world.discovered.slice();save();const restored=loadGame();
      check(restored.buildingList.some(i=>i.key==='cartographersOffice'),'office persists');
      check(restored.staffMembers.find(s=>s.id===st.id).professionXP.Cartography===276,'skill persists');
      check(discovered.every(id=>restored.world.discovered.includes(id)),'discovery save preserved');
      render();showView('staff');
    }""")
    page.locator('#staff-roster summary').first.click()
    assert 'Cartography' in page.locator('#staff-roster').inner_text()
    assert not errors,errors
    browser.close()
    print('PASS: Hall/rep gates, construction, unstaffed unlock, quest UI/dispatch, demolition, underway discoveries, existing world/trade routes, Cartography effects/practice, save/reload; no console errors.')
