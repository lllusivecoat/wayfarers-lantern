"""Run against a local static server: python3 tests/staff-browser.py [base URL].
Requires Python Playwright and Chromium; uses isolated contexts, never a player save.
"""
import sys
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1280, 'height':900})
    page.set_default_timeout(5000)
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
      hireStaff('warehouse');hireStaff('test-workshop');
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
    page.locator('#trade-good').select_option(run('cargo.name'))
    page.locator('#trade-quantity').fill('1')
    run("""() => {dispatchTrade();const r=game.pendingReports.find(r=>r.kind==='trade');if(!r||r.inboundGoods)throw Error('outbound dispatch');r.dueAt=Date.now()-1;applyPendingReports();Math.random=oldRandom;save()}""")
    run("""() => {
      const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
      const smith=buildingStaff('workshop');
      for(const key of ['staffOffice','infirmary','armory','trainingHall','warRoom','huntersLodge','commandPost']){
        hireStaff('test-'+key);const st=buildingStaff(key);st.professionXP[staffProfessionForKey(key)]=0;
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
      hireStaff('test-kitchen');const cook=buildingStaff('kitchen');cook.professionXP.Cooking=0;
      let n=game.consumables.length;v9KitchenDay();assert(game.consumables.length===n+1,'novice rations');
      v9KitchenDay();assert(game.consumables.length===n+1,'once daily rations');game.day++;cook.professionXP.Cooking=275;n=game.consumables.length;v9KitchenDay();
      assert(game.consumables.length===n+3&&game.consumables.at(-1).bonus===2,'master rations');
      // Building upgrades and staff skill remain independent.
      assert(buildingLevel('workshop')===1&&staffProfessionLevel(smith)===10,'building/skill separation');
      game.warehouseLevel=2;hireStaff('warehouse');assert(v9StaffOf('warehouse').length===2,'warehouse slots');
      // Every recipe, including presence rings, has valid requirements.
      assert(renderGearCatalog().every(i=>Object.values(i.requirements).every(n=>Number.isInteger(n)&&n>0)),'recipe requirements');
      // Reject invalid inbound requests without charging the treasury.
      game.tradeParty=['player'];renderTrading();const gold=game.gold;
      document.getElementById('market-quantity').value='-2';window.alert=()=>{};dispatchInbound();
      assert(game.gold===gold,'invalid inbound quantity charged');
      // Check service formulas actually consume the trained skill.
      const keeper=buildingStaff('warehouse');game.tradeParty=['player'];renderTrading();
      document.getElementById('trade-good').value='Copper Ore';document.getElementById('trade-quantity').value='10';
      keeper.professionXP.Storekeeping=0;updateTradePreview();const noviceQuote=document.getElementById('trade-preview').textContent;
      keeper.professionXP.Storekeeping=275;updateTradePreview();const masterQuote=document.getElementById('trade-preview').textContent;
      const quote=t=>Number(t.match(/estimated (\\d+) gp/)[1]);
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
    # Work awards preserve partial progress and apply to every assigned member.
    run("""() => {const s=buildingStaff('workshop');window.xpBefore=staffPracticeCount(s);nextDay();if(staffPracticeCount(s)!==xpBefore+1)throw Error('daily work award')}""")
    for view in ['hall','roster','staff','buildings','warehouse','trading','quests','permanent-quests','world','chronicle','music']:
        run(f"showView('{view}')")
        assert page.locator(f"#{view}").is_visible()
    run("showView('staff')")
    run("v9InstById('test-kitchen').level=2;renderStaffTab()")
    page.locator('[data-staff-index=\"0\"]').select_option('test-kitchen')
    assert run("game.staffMembers[0].buildingKey") == 'kitchen'
    page.locator('[data-staff-index=\"0\"]').select_option('warehouse')
    assert run("game.staffMembers[0].buildingKey") == 'warehouse'
    assert 'Skills and next benefits' in page.locator('#staff-roster').inner_text()
    page.set_viewport_size({'width':390,'height':844})
    run("showView('warehouse')")
    assert len(page.locator('.gear-craft-controls').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns').split())==1
    assert not errors, errors
    browser.close()
    print('PASS: assignment, slot limits, identity, thresholds, carryover, daily/service practice, migration/reload, discovery gates, crafting, inbound/outbound delivery, screens, mobile layout; no page errors.')
