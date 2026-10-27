"""Recruitment/vacancy UI regression. Serve the checkout on localhost:8000 first."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':900});page.set_default_timeout(15000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    response=page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    assert page.evaluate("!document.documentElement.innerHTML.includes('Open positions')"), 'Legacy hiring UI remains in base page'
    page.wait_for_function("typeof staffMigrate==='function'")
    page.evaluate("""() => {
      game.gold=1000;
      game.staffMembers.push({id:'legacy-cook',name:'Custom Old Name',race:'Human',job:'Cook',wage:5,buildingUid:null,buildingKey:null,profession:'Cooking',professionXP:{Cooking:30,Blacksmithing:15}});
      game.buildingList.push({uid:'workshop-test',key:'workshop',level:1,spent:45});v9Sync();render();showView('staff');
    }""")
    assert page.get_by_role('heading',name='Recruit staff').is_visible()
    assert page.get_by_role('heading',name='Building vacancies').is_visible()
    assert 'Open positions' not in page.locator('#staff').inner_text()
    assert 'every 3 practice' not in page.locator('#staff').inner_text()
    assert 'Hire Smith' not in page.locator('#staff').inner_text()
    # Assign the existing person; no duplicate hiring, lost skills or wage changes.
    warehouse=page.get_by_label('Assign staff to Warehouse',exact=True)
    warehouse.select_option('0')
    page.locator('[data-fill-vacancy="0"]').click()
    assert page.evaluate('game.staffMembers.length')==1
    assert page.evaluate('staffWages()')==5
    # General recruitment leaves the new person unassigned and charges no immediate fee.
    page.locator('#hire-general-staff').click()
    assert page.evaluate('game.staffMembers.length')==2
    assert page.evaluate('game.staffMembers[1].buildingUid') is None
    assert page.evaluate('game.gold')==1000
    assert page.evaluate('staffWages()')==5
    assert page.locator('#hire-general-staff').is_disabled()
    assert 'Unassigned' in page.locator('#staff-roster').inner_text()
    # Hall is full, but moving someone to an empty building remains possible.
    workshop=page.get_by_label('Assign staff to Workshop',exact=True)
    workshop.select_option('0')
    page.locator('[data-fill-vacancy="1"]').click()
    assert page.evaluate("game.staffMembers[0].buildingKey")=='workshop'
    assert page.evaluate('game.staffMembers[0].wage')==5
    assert page.evaluate('game.staffMembers[0].name')=='Custom Old Name'
    assert page.evaluate('game.staffMembers[0].professionXP.Cooking')==30
    assert page.evaluate('game.staffMembers[0].professionXP.Blacksmithing')==15
    # XP follows the current building, while previous skill progress is retained.
    page.evaluate("practiceStaff('workshop')")
    assert page.evaluate('game.staffMembers[0].professionXP.Blacksmithing')==16
    assert page.evaluate('game.staffMembers[0].professionXP.Cooking')==30
    # Fill Warehouse with the new general recruit; full slots cannot overfill.
    page.get_by_label('Assign staff to Warehouse',exact=True).select_option('1')
    page.locator('[data-fill-vacancy="0"]').click()
    assert page.evaluate('staffWages()')==7
    assert page.evaluate("v9AssignStaff(game.staffMembers[0].id,'warehouse')")=='full'
    assert page.get_by_label('Assign staff to Warehouse',exact=True).count()==0
    # Roster unassignment restores a vacancy and pauses wages.
    page.locator('[data-staff-index="0"]').select_option('')
    assert page.evaluate('staffWages()')==2
    assert page.get_by_label('Assign staff to Workshop',exact=True).is_enabled()
    page.reload(wait_until='networkidle');page.wait_for_function("typeof staffMigrate==='function'")
    assert page.evaluate('game.staffMembers.length')==2
    assert page.evaluate('game.staffMembers[0].buildingUid') is None
    assert page.evaluate('game.staffMembers[0].wage')==5
    assert page.evaluate('game.staffMembers[0].professionXP.Cooking')==30
    # Recruitment works even when all completed buildings are full.
    page.evaluate("game.hall=2;v9AssignStaff(game.staffMembers[0].id,'workshop-test');showView('staff')")
    page.locator('#hire-general-staff').click()
    assert page.evaluate('game.staffMembers.length')==3
    assert page.evaluate('game.staffMembers[2].buildingUid') is None
    page.evaluate("showView('buildings')")
    assert page.get_by_role('button',name='Hire Smith',exact=True).count()==0
    page.set_viewport_size({'width':390,'height':844});page.evaluate("showView('staff')")
    assert page.get_by_role('heading',name='Building vacancies').is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Mobile overflow'
    # Reproduce the screenshot: full Kitchen/Workshop and vacant Warehouse/Infirmary.
    page.evaluate("""() => {
      game.buildingList.push({uid:'phone-kitchen',key:'kitchen',level:1,spent:35},{uid:'phone-infirmary',key:'infirmary',level:1,spent:65});
      v9Sync();v9AssignStaff(game.staffMembers[1].id,'phone-kitchen');showView('staff');
    }""")
    for width in [320,360,390,430,600]:
        page.set_viewport_size({'width':width,'height':900})
        for building in ['Warehouse','Infirmary']:
            select=page.get_by_label('Assign staff to '+building,exact=True)
            row=page.locator('#staff-profession .building').filter(has=select)
            summary=row.locator(':scope > div').nth(0).bounding_box()
            controls=row.locator(':scope > div').nth(1).bounding_box()
            assert summary['y']+summary['height']<=controls['y']+1, f'{building}: overlapping summary/controls at {width}px'
            field=select.bounding_box();button=row.get_by_role('button',name='Assign staff',exact=True).bounding_box()
            assert field['y']+field['height']<=button['y']+1, f'{building}: overlapping select/button'
            assert field['height']>=44 and button['height']>=44, 'Touch targets too small'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'Overflow at {width}px'
    # Enlarged reading text must also remain above the assignment controls.
    page.set_viewport_size({'width':390,'height':844})
    page.add_style_tag(content='#staff {font-size:21px}')
    select=page.get_by_label('Assign staff to Warehouse',exact=True)
    row=page.locator('#staff-profession .building').filter(has=select)
    summary=row.locator(':scope > div').nth(0).bounding_box();controls=row.locator(':scope > div').nth(1).bounding_box()
    assert summary['y']+summary['height']<=controls['y']+1
    select.select_option('2');row.get_by_role('button',name='Assign staff',exact=True).click()
    assert page.evaluate("game.staffMembers[2].buildingKey")=='warehouse'
    assert not errors,errors
    browser.close()
    print('PASS: separate recruitment/assignment, visible wages, legacy identity/skills, full Hall and slot limits, unassignment, save/reload, full-building recruitment, mobile layout; no console errors.')
