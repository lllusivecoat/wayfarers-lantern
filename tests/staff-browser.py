"""Run against a local static server: python3 tests/staff-browser.py [base URL].
Requires Python Playwright and Chromium; uses isolated contexts, never a player save.
"""
import sys
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1280, 'height':900})
    page.add_init_script("window.hireStaffTo=(uid)=>{const st={id:'fixture-staff-'+game.staffMembers.length,name:'Fixture worker '+game.staffMembers.length,wage:2,morale:3,buildingUid:null,buildingKey:null,profession:'Generalist',professionXP:{},skillAwards:{}};game.staffMembers.push(st);if(v9AssignStaff(st.id,uid)!=='')throw Error('Assignment failed')}")
    page.set_default_timeout(15000)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda message: errors.append(message.text) if message.type=='error' else None)
    page.goto(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8000', wait_until='networkidle')
    page.wait_for_function("typeof staffSkillLevel==='function'")
    def run(js): return page.evaluate(js)
    run("""() => {
      window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
      const bounds=[5,15,30,50,75,105,140,180,225,275];
      bounds.forEach((n,i)=>{check(staffSkillLevel(n)===i+1,'threshold '+n);check(staffSkillLevel(n-1)===i,'below threshold '+n)});
      check(staffSkillLevel(1000)===10,'level cap');
      game.hall=7;game.gold=10000;
      buildingDefs.forEach((b,i)=>game.buildingList.push({uid:'test-'+b.key,key:b.key,level:1,spent:b.cost}));v9Sync();
      hireStaffTo('warehouse');hireStaffTo('test-workshop');
      const st=buildingStaff('warehouse'),smith=buildingStaff('workshop');
      st.professionXP={Storekeeping:50,Medicine:30};staffMigrate(game);
      check(st.professionXP['First Aid']===30&&!('Medicine' in st.professionXP),'Medicine rename');
      check(v9AssignStaff(st.id,'test-workshop')==='full','full slot');
      const identity=[st.name,st.wage];
      check(v9AssignStaff(st.id,'test-kitchen')==='','free assignment');
      practiceStaff('kitchen');practiceStaff('kitchen');
      check(st.professionXP.Cooking===1,'one service award per day');
      check(st.professionXP.Storekeeping===50,'inactive skill unchanged');
      check(v9AssignStaff(st.id,'warehouse')==='','warehouse reassignment');
      check(st.name===identity[0]&&st.wage===identity[1]&&st.professionXP.Cooking===1,'identity and practice preserved');
      st.professionXP.Storekeeping=14;practiceStaff('warehouse');
      check(staffProfessionLevel(st)===2&&st.professionXP.Storekeeping===15,'practice carryover');
      game.day++;practiceStaff('warehouse');check(st.professionXP.Storekeeping===16,'next day practice');
      const old=JSON.stringify(game.world.discovered);st.professionXP.Storekeeping=275;
      check(!tradeDestinations().some(d=>d.id==='stormwind'),'skills cannot discover routes');
      check(JSON.stringify(game.world.discovered)===old,'discovery unchanged');
      game.world.discovered.push('ratchet');check(tradeDestinations().some(d=>d.id==='ratchet'),'discovered market');
      smith.professionXP.Blacksmithing=5;game.materials['Copper Ore']=100;
      check(renderGearCatalog().find(i=>i.id==='sword-0').requirements['Copper Ore']===2,'basic recipe');
      smith.professionXP.Blacksmithing=275;
      check(renderGearCatalog().find(i=>i.id==='sword-7').requirements['Eternium Ore']===4,'material discount');
      save();window.testStaffId=st.id;
    }""")
    page.reload(wait_until='networkidle')
    page.wait_for_function("typeof staffSkillLevel==='function'")
    run("""() => {
      window.check=(ok,msg)=>{if(!ok)throw Error(msg)};
      const st=buildingStaff('warehouse');check(st.professionXP.Cooking===1&&st.professionXP['First Aid']===30,'reload migration');
      // Numeric legacy practice must survive the built-in loader too.
      const legacy=JSON.parse(localStorage.getItem(SAVE_KEY));legacy.staffMembers.find(s=>s.buildingKey==='workshop').professionXP=25;
      localStorage.setItem(SAVE_KEY,JSON.stringify(legacy));
    }""")
    page.reload(wait_until='networkidle')
    page.wait_for_function("typeof staffSkillLevel==='function'")
    assert run("staffPracticeCount(buildingStaff('workshop'))") == 25
    run("buildingStaff('workshop').professionXP.Blacksmithing=275;render();showView('warehouse')")
    assert page.locator('.gear-craft-controls select').count() == 3
    page.get_by_role('button',name='Craft Iron Shortblade',exact=True).click()
    popup=page.locator('#gear-crafted-modal')
    assert 'open' in popup.get_attribute('class')
    assert 'readiness on STR checks' in popup.inner_text()
    assert 'Extra crafted bonus:' in popup.inner_text()
    page.get_by_role('button',name='Continue',exact=True).click()
    run("""() => {
      const st=buildingStaff('warehouse');st.professionXP.Storekeeping=275;
      selectedTradeRoute='ratchet';game.player.ready=true;game.tradeParty=['player'];game.player.abilities.str=100;game.player.abilities.dex=100;
      render();showView('trading');
    }""")
    page.locator('#market-quantity').fill('2')
    page.locator('#market-quantity').dispatch_event('change')
    assert 'Total ' in page.locator('#market-cost').inner_text()
    run("""() => {window.beforeGold=game.gold;window.beforeStock=Number(document.getElementById('market-good').selectedOptions[0].textContent.match(/(\\d+) in stock/)[1]);window.oldRandom=Math.random;Math.random=()=>.99}""")
    page.locator('#market-buy').click()
    run("""() => {
      const r=game.pendingReports.find(r=>r.inboundGoods);if(!r)throw Error('missing inbound report');
      if(game.gold>=beforeGold||game.player.ready)throw Error('payment or escort not committed');
      window.cargo=r.inboundGoods;window.beforeCargo=game.materials[cargo.name]||0;r.dueAt=Date.now()-1;applyPendingReports();
      if(game.materials[cargo.name]!==beforeCargo+2)throw Error('inbound delivery');
      tbwApplyReport(r);if(game.materials[cargo.name]!==beforeCargo+2)throw Error('duplicate cargo');
      game.player.ready=true;game.tradeParty=['player'];renderTrading();
    }""")
    run("game.tradeCargo={[cargo.name]:1};renderTrading()")
    run("""() => {dispatchTrade();const r=game.pendingReports.find(r=>r.kind==='trade');if(!r||r.inboundGoods)throw Error('outbound dispatch');r.dueAt=Date.now()-1;applyPendingReports();Math.random=oldRandom;save()}""")
    run("""() => {
      const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
      const smith=buildingStaff('workshop');
      for(const key of ['staffOffice','infirmary','armory','trainingHall','warRoom','huntersLodge','commandPost']){
        hireStaffTo('test-'+key);const st=buildingStaff(key);st.professionXP[staffProfessionForKey(key)]=0;
        assert(staffSkillBonus(key)===0,'novice '+key);st.professionXP[staffProfessionForKey(key)]=275;
        assert(staffSkillBonus(key)===3,'master '+key);
      }
      const armorer=buildingStaff('armory');armorer.professionXP.Armoring=0;const repair=v9RepairUnit();armorer.professionXP.Armoring=275;
      assert(v9RepairUnit()<repair,'armoring repair discount');
      const trainer=buildingStaff('trainingHall');trainer.professionXP.Training=0;const mul=v9TrainerMul();trainer.professionXP.Training=275;
      assert(v9TrainerMul()<mul,'training discount');
      const medic=buildingStaff('infirmary');game.player.wound={tier:1,days:5};medic.professionXP['First Aid']=0;
      const cost=treatCost(game.player);medic.professionXP['First Aid']=275;
      assert(treatCost(game.player)<cost,'first aid discount');game.player.wound=null;
      hireStaffTo('test-kitchen');const cook=buildingStaff('kitchen');cook.professionXP.Cooking=0;
      game.materials.Meat=10;game.materials['Fresh Fish']=10;game.staffCostsPaidDay=game.day;let n=game.consumables.length;v9KitchenDay();assert(game.consumables.length===n+1,'novice rations');
      v9KitchenDay();assert(game.consumables.length===n+1,'once daily rations');game.day++;game.staffCostsPaidDay=game.day;v9InstById('test-kitchen').level=2;cook.professionXP.Cooking=275;game.materials['Prime Meat']=10;game.materials['Deviate Fish']=10;setKitchenRecipe('test-kitchen','hearty');n=game.consumables.length;v9KitchenDay();
      assert(game.consumables.length===n+2&&game.consumables.at(-1).bonus===2,'master rations');
      // Building upgrades and staff skill remain independent.
      assert(buildingLevel('workshop')===1&&staffProfessionLevel(smith)===10,'building/skill separation');
      game.warehouseLevel=2;assert(v9StaffOf('warehouse').length===1,'one warehouse worker after upgrade');
      // Every recipe, including presence rings, has valid requirements.
      assert(renderGearCatalog().every(i=>Object.values(i.requirements).every(n=>Number.isInteger(n)&&n>0)),'recipe requirements');
      // Reject invalid inbound requests without charging the treasury.
      game.tradeParty=['player'];renderTrading();const gold=game.gold;
      document.getElementById('market-quantity').value='-2';window.alert=()=>{};dispatchInbound();
      assert(game.gold===gold,'invalid inbound quantity charged');
      // Check service formulas actually consume the trained skill.
      const keeper=buildingStaff('warehouse');game.tradeParty=['player'];renderTrading();
      game.tradeCargo={'Copper Ore':10};updateTradePreview();
      keeper.professionXP.Storekeeping=0;updateTradePreview();const noviceQuote=document.getElementById('trade-preview').textContent;
      keeper.professionXP.Storekeeping=275;updateTradePreview();const masterQuote=document.getElementById('trade-preview').textContent;
      const quote=t=>Number(t.match(/estimate: (\\d+) gp gross/)[1]);
      assert(quote(masterQuote)>quote(noviceQuote),'storekeeping sale price');
      const q={kind:'Raid',ability:'str',minParty:1};
      assert(staffSkillBonus('staffOffice')===3&&staffSkillBonus('warRoom')===3&&staffSkillBonus('huntersLodge')===3&&staffSkillBonus('commandPost')===3,'expedition skill modifiers');
      const rand=Math.random;Math.random=()=>0;
      game.craftLog={day:game.day,n:0};craftGear('sword-0');Math.random=rand;
      const crafted=game.gear.at(-1);assert(crafted.extraBonus===2&&crafted.bonus===3,'master crafted bonus');closeGearCrafted();
      // Persist unassignment, then test it through the actual loader below.
      window.unassignedId=smith.id;const savedPractice=smith.professionXP.Blacksmithing;smith.buildingUid=null;smith.buildingKey=null;save();
      const loaded=loadGame().staffMembers.find(s=>s.id===smith.id);
      assert(loaded.buildingKey===null&&loaded.professionXP.Blacksmithing===savedPractice,'unassigned reload');
      v9AssignStaff(smith.id,'test-workshop');
    }""")
    run("""() => {
      const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
      const q={kind:'Contract',rank:0};
      assert(v9QuestMins(q)===5,'unstaffed Waystation');
      const convoy=v9ConvoyMs('ratchet');
      hireStaffTo('test-waystation');const guide=buildingStaff('waystation');
      assert(Math.abs(v9QuestMins(q)-4.5)<1e-8,'novice 10% reduction');
      assert(v9DurLabel(q)==='4 min 30 s (Waystation −10%)','duration label');
      guide.professionXP.Pathfinding=275;
      assert(Math.abs(v9QuestMins(q)-3.5)<1e-8,'master 30% reduction');
      for(const kind of ['Contract','Gathering','Dungeon','Raid','World Boss','World Raid','World Dungeon','Exploration']){
        for(let rank=0;rank<10;rank++)assert(Math.abs(v9QuestMs({kind,rank})-v9QuestBaseMins({kind,rank})*.7*60000)<1,'quest type timer '+kind);
      }
      assert(v9ConvoyMs('ratchet')===convoy,'convoy unchanged');
      // Complete an upgrade through the existing construction system.
      const project={key:'waystation',uid:'test-waystation',action:'upgrade',targetLevel:2};
      game.constructionProjects.push(project);completeConstructionProject(project);
      assert(v9StaffOf('test-waystation').length===1&&v9Eff(v9InstById('test-waystation'))===2,'one worker operates upgraded service');
      assert(Math.abs(waystationTimeCut()-.45)<1e-8,'no stacking from multiple staff');
      const gathering=gatheringQuest('Mining');const now=Date.now();
      queueQuestReport(gathering,['player'],0,'Waystation timer test');
      const report=game.pendingReports.at(-1),remaining=report.dueAt-now;
      assert(Math.abs(remaining-v9QuestMs(gathering))<1000,'dispatch actual deadline');
      assert(guide.professionXP.Pathfinding===276,'Pathfinding service practice');
      const due=report.dueAt;
      v9AssignStaff(guide.id,'warehouse'); // Full warehouse rejects reassignment.
      guide.buildingUid=null;guide.buildingKey=null;

      assert(v9QuestMins(q)===5,'vacant building stops reduction');
      assert(report.dueAt===due,'underway quest deadline preserved');
      v9AssignStaff(guide.id,'test-waystation');
      const station=v9InstById('test-waystation');station.level=5;
      guide.professionXP.Pathfinding=0;
      assert(waystationTimeCut()===.8,'max building gives 80% with novice staff');
      assert(v9QuestMins(q)===1,'one-minute minimum');
      assert(Math.abs(v9QuestMins({kind:'Raid',rank:9})-13)<1e-8,'max upgrade raid duration');
      guide.professionXP.Pathfinding=276;
      assert(waystationTimeCut()===.8,'master cannot exceed 80%');
      assert(report.dueAt===due,'upgrade leaves existing timer unchanged');
      save();
      const restored=loadGame();assert(restored.buildingList.some(i=>i.key==='waystation'&&i.level===5),'Waystation saved');
      assert(restored.staffMembers.find(st=>st.id===guide.id).professionXP.Pathfinding===276,'Pathfinding saved');
      game.pendingReports=game.pendingReports.filter(r=>r!==report);render();
    }""")
    run("""() => {
      const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
      const fits=(name,race)=>{const data=RACE_NAME_CULTURES[race];const [first,last]=name.split(' ');return data.first.includes(first)&&data.roots.some(root=>data.endings.some(end=>root+end===last))};
      for(const race of APPLICANT_RACES){
        const cls=APPLICANT_CLASSES.find(cls=>comboAllowed(race,cls));
        const applicant=makeApplicant({race,className:cls});
        assert(applicant.race===race&&fits(applicant.name,race),'targeted recruit naming: '+race);
        game.applicants.push(applicant);
      }
      for(let i=0;i<50;i++){
        const applicant=makeApplicant();assert(fits(applicant.name,applicant.race),'random recruit naming');game.applicants.push(applicant);
      }
      assert(game.staffMembers.filter(st=>st.race).every(st=>fits(st.name,st.race)),'staff names fit race');
      const oldPlayerName=game.player.name;
      game.heroes.push({id:'custom-naming-test',name:'My Custom Hero',race:'Orc',className:'Warrior',spec:'Arms',ready:true,rank:0,level:1,abilities:defaultAbilities('Warrior')});
      save();const restored=loadGame();
      assert(restored.heroes.find(h=>h.id==='custom-naming-test').name==='My Custom Hero','custom name preserved');
      assert(restored.player.name===oldPlayerName,'guildmaster name preserved');
      const staff=game.staffMembers[0];assert(restored.staffMembers.find(st=>st.id===staff.id).name===staff.name,'staff name persisted');
      assert(restored.applicants.at(-1).name===game.applicants.at(-1).name,'applicant name persisted');
      game.heroes=game.heroes.filter(h=>h.id!=='custom-naming-test');render();
    }""")
    # Work awards preserve partial progress and apply to every assigned member.
    run("""() => {const s=buildingStaff('workshop');window.xpBefore=staffPracticeCount(s);nextDay();if(staffPracticeCount(s)!==xpBefore+1)throw Error('daily work award')}""")
    for view in ['hall','roster','staff','buildings','warehouse','trading','quests','permanent-quests','world','chronicle','music']:
        run(f"showView('{view}')")
        assert page.locator(f"#{view}").is_visible()
    run("showView('staff')")
    run("v9InstById('test-kitchen').level=2;renderStaffTab()")
    page.locator('[data-staff-index=\"0\"]').select_option('test-cartographersOffice')
    assert run("game.staffMembers[0].buildingKey") == 'cartographersOffice'
    page.locator('[data-staff-index=\"0\"]').select_option('warehouse')
    assert run("game.staffMembers[0].buildingKey") == 'warehouse'
    assert 'Skills and next benefits' in page.locator('#staff-roster').inner_text()
    page.set_viewport_size({'width':390,'height':844})
    run("showView('warehouse')")
    assert len(page.locator('.gear-craft-controls').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns').split())==1
    assert not errors, errors
    browser.close()
    print('PASS: assignment, slot limits, identity, thresholds, carryover, daily/service practice, migration/reload, discovery gates, crafting, inbound/outbound delivery, screens, mobile layout; no page errors.')
