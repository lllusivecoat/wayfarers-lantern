"""Persistent memorials, bond snapshots, legacy saves, epitaphs and remembrance UI."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    page.set_default_timeout(15000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    page.wait_for_function("typeof memorialMigrate==='function'")
    page.evaluate("""() => {
      window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
      check(document.getElementById('guild-remembrance').hidden,'no empty remembrance card on a new guild');
      game.gold=10000;game.day=10;
      for(let i=0;i<4;i++){
        const a=makeApplicant({race:'Human',className:'Warrior',spec:'Arms'});
        game.applicants.push(a);openRecruit(a.id);confirmHire();
      }
      const [a,b,c,d]=game.heroes;window.memorialIds=[a.id,b.id,c.id,d.id];
      [a.name,b.name,c.name,d.name]=['Thora Ember','Brann Oak','Mira Reed','Doran Stone'];
      check(a.recruitedDay===10,'real recruitment date recorded and saved');
      a.missions=12;b.missions=4;
      a.level=8;a.rank=2;a.perks=[{id:'general-general-field-medic',level:3}];
      game.bonds=game.bonds||{};
      game.bonds[bondKey(a.id,b.id)]={v:85,lastDay:10,n:17};
      game.bonds[bondKey(a.id,'player')]={v:55,lastDay:10,n:11};
      const report=(extra={})=>({kind:'operation',questKind:'Raid',title:'The Last Beacon',outcome:'Exceptional Success',summary:'The beacon was secured.',extendedSummary:'The beacon was secured at a terrible cost.',partyIds:[a.id,b.id,'player'],casualties:[],rolls:[],growthAwards:[],payout:0,rep:0,dispatchedDay:10,dueAt:Date.now()-1,...extra});
      const success=report({title:'A Safe Passage',outcome:'Success'});game.pendingReports=[success];applyPendingReports();
      check(a.missions===13&&a.serviceRecord.successes===1,'normal career tracking');
      game.day=11;
      const death=report({casualties:[a.id,b.id]});game.pendingReports=[death];applyPendingReports();
      const m=a.memorial,n=b.memorial;
      check(m&&n,'all fatalities captured');
      check(m.companions[0].name==='Brann Oak'&&m.companions[0].tier==='Sworn','closest companion snapshot');
      check(n.companions.some(x=>x.id===a.id),'mutual bond preserved for simultaneous deaths');
      check(!game.bonds[bondKey(a.id,b.id)],'existing bond cleanup preserved');
      check(m.level===8&&m.rank===2&&m.missions===13,'service at time of death');
      check(m.recruitedDay===10&&m.deathDay===11,'known service dates');
      check(m.achievements.some(x=>x.includes('exceptional'))&&m.achievements.some(x=>x.includes('perk')),'achievements recorded');
      check(m.service.reports===2&&m.service.dangerousVictories===2,'tracked career includes final expedition');
      check(m.finalReport.returnedDay===11&&m.finalReport.deathAccounts.length===2,'complete final report archived after resolution');
      check(m.honored&&n.honored,'new fallen heroes honoured if places available');
      death.extendedSummary='Later mutation';game.todayReports=[];game.log=[];
      check(m.finalReport.extendedSummary!=='Later mutation','final report independent of temporary reports');
      check(m.companions[0].name==='Brann Oak','bond history remains after cleanup');
      // Other future deaths fill the final place and then require a choice.
      game.pendingReports=[report({title:'Convoy Ambush',kind:'trade',questKind:undefined,outcome:'Failure',partyIds:[c.id,d.id,'player'],casualties:[c.id,d.id]})];applyPendingReports();
      check(c.memorial.honored&&!d.memorial.honored,'three-place limit');
      check(!setMemorialHonor(d.id),'cannot exceed hall limit programmatically');
      check(setMemorialHonor(b.id)&&setMemorialHonor(d.id),'replace an honoured hero');
      check(!b.memorial.honored&&d.memorial.honored,'honour selection saved');
      const economy=JSON.stringify([game.gold,game.materials,game.gear,game.staffMembers,game.buildingList]);
      memorialMigrate(game);memorialMigrate(game);
      check(JSON.stringify([game.gold,game.materials,game.gear,game.staffMembers,game.buildingList])===economy,'migration preserves economy, staff, buildings and equipment');
      // Unknown old history must stay unknown, not become a fabricated date or bond.
      const legacy={...cloneForTest(a),id:'legacy-fallen',name:'Old Rowan',missions:18};
      delete legacy.memorial;delete legacy.serviceRecord;delete legacy.recruitedDay;
      game.heroes.push(legacy);game.todayReports=[];memorialMigrate(game);
      check(legacy.memorial.deathDay===null&&legacy.memorial.recruitedDay===null,'unknown legacy dates');
      check(legacy.memorial.missions===18&&!legacy.memorial.finalReport,'old totals preserved without invented report');
      check(!legacy.memorial.companionsKnown&&legacy.memorial.companions.length===0,'unknown old bonds');
      const oldReportHero={...cloneForTest(legacy),id:'legacy-report',name:'Edda Brook'};delete oldReportHero.memorial;
      game.heroes.push(oldReportHero);
      game.todayReports=[report({partyIds:[oldReportHero.id,'player'],casualties:[oldReportHero.id],returnedDay:7,title:'An Older Expedition'})];
      memorialMigrate(game);check(oldReportHero.memorial.finalReport.title==='An Older Expedition'&&oldReportHero.memorial.deathDay===7,'available legacy report recovered');
      // Fallen guildmasters are included too.
      game.player.dead=true;memorialMigrate(game);
      check(game.player.memorial.achievements.includes('Guildmaster of the Wayfarer’s Lantern'),'guildmaster memorial');
      game.todayReports=[];save();render();openFallenMemorial();
      check(document.getElementById('hero-list').textContent.includes('Kael Arden'),'fallen guildmaster discoverable');
      check(document.getElementById('v9-rfilters').style.display==='none','living roster filters hidden in memorial');
      openMemorialRecord(a.id);
      check(document.getElementById('hero-stats-content').textContent.includes('Brann Oak'),'companions visible in record');
      check(document.getElementById('hero-stats-content').textContent.includes('13 completed missions'),'service visible in record');
      function cloneForTest(x){return JSON.parse(JSON.stringify(x))}
    }""")
    epitaph='She kept the Lantern burning.\n<Keep & remember> </textarea><script>window.epitaphExecuted=true</script>'
    page.locator('#memorial-epitaph').fill(epitaph)
    page.locator('#memorial-save-epitaph').click()
    assert page.locator('#memorial-save-status').inner_text()=='Epitaph saved.'
    assert page.locator('#memorial-epitaph').input_value()==epitaph
    assert page.evaluate('window.epitaphExecuted') is None
    page.locator('#memorial-final-report').click()
    assert page.locator('#report-detail-title').inner_text()=='The Last Beacon · Exceptional Success'
    assert 'Thora Ember has died.' in page.locator('#report-detail-deaths').inner_text()
    page.locator('#report-detail-modal').get_by_role('button',name='Close',exact=True).click()
    assert page.locator('#hero-stats-modal').is_visible()
    page.evaluate('closeHeroStats();showView("hall")')
    assert page.locator('#guild-remembrance .remembrance-plaque').count()==3
    assert epitaph in page.locator('#guild-remembrance').inner_text()
    page.locator('#guild-remembrance [data-memorial-open]').first.click()
    assert page.locator('#memorial-epitaph').input_value()==epitaph
    assert page.evaluate('window.epitaphExecuted') is None
    # Honest legacy placeholders and editable remembrance controls.
    page.evaluate("closeHeroStats();openMemorialRecord('legacy-fallen')")
    for text in ['Date of death unrecorded','Earlier companion records are unavailable.','final quest report is no longer available']:
        assert text in page.locator('.memorial-record').inner_text()
    assert page.locator('#memorial-honor').is_disabled()
    page.evaluate("closeHeroStats();openMemorialRecord('player')")
    assert 'Guildmaster' in page.locator('.memorial-record').inner_text()
    page.evaluate('closeHeroStats();openMemorialRecord(memorialIds[0])')
    for width in [390,1280]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('.memorial-record').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
        assert page.locator('#memorial-epitaph').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
    # Export/import uses the real UI and must retain permanent history and epitaphs.
    page.evaluate('closeHeroStats();save()')
    with page.expect_download() as download:
        page.evaluate('exportSave()')
    payload=Path(download.value.path()).read_text()
    exported=json.loads(payload)
    assert exported['heroes'][0]['memorial']['epitaph']==epitaph
    page.on('dialog',lambda dialog:dialog.accept())
    page.evaluate('game.heroes[0].memorial.epitaph="Changed after export"')
    page.locator('#import-file').set_input_files({'name':'memorial-save.json','mimeType':'application/json','buffer':payload.encode()})
    page.wait_for_function('(epitaph)=>game.heroes[0].memorial.epitaph===epitaph',arg=epitaph)
    saved=page.evaluate('JSON.stringify(game.heroes[0].memorial)')
    page.reload(wait_until='networkidle')
    page.wait_for_function("typeof memorialMigrate==='function'")
    assert page.evaluate('JSON.stringify(game.heroes[0].memorial)')==saved
    page.evaluate('openMemorialRecord(game.heroes[0].id);openMemorialReport(game.heroes[0].id)')
    assert 'The Last Beacon' in page.locator('#report-detail-title').inner_text()
    assert not errors,errors
    browser.close()
    print('PASS: permanent final reports, simultaneous-death bond snapshots, achievements, service dates, legacy migration, fallen guildmaster, epitaphs, honor limits, export/import, reload and mobile/desktop layout; no console errors')
