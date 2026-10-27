"""Actual touch-scroll chaining at list edges. Serve localhost:8000 first."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
    page.set_default_timeout(15000);errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    page.wait_for_function("typeof staffMigrate==='function'")
    page.evaluate("""() => {
      game.applicants=[];for(let i=0;i<15;i++){const a=makeApplicant();a.detail='A traveller seeking work with the guild. '.repeat(8);game.applicants.push(a)}
      game.hall=7;game.buildingList=buildingDefs.map((b,i)=>({key:b.key,uid:'scroll-'+i,level:1,spent:b.cost}));v9Sync();render();showView('hall');
      const spacer=document.createElement('div');spacer.style.height='900px';document.body.appendChild(spacer);
    }""")
    cdp=page.context.new_cdp_session(page)
    def swipe(x,y,delta):
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
        for step in range(1,13):
            cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y+delta*step/12}]})
            page.wait_for_timeout(20)
        # End a drag with the finger stationary so momentum from the preceding
        # gesture cannot race a programmatic scroll-to-edge in the next check.
        page.wait_for_timeout(160)
        cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y+delta}]})
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        page.wait_for_timeout(600)
    for selector in ['#applicant-list','#building-list']:
        page.evaluate("""selector=>{const e=document.querySelector(selector);window.scrollTo(0,window.scrollY+e.getBoundingClientRect().top-130);e.scrollTop=0}""",selector)
        page.wait_for_timeout(200)
        box=page.locator(selector).bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
        before=page.evaluate('window.scrollY');swipe(x,y,-140)
        assert page.locator(selector).evaluate('e=>e.scrollTop')>25,selector+' inner touch scroll failed'
        assert abs(page.evaluate('window.scrollY')-before)<8,selector+' unexpectedly moved page mid-list'
        page.locator(selector).evaluate('e=>e.scrollTop=e.scrollHeight-e.clientHeight')
        page.wait_for_timeout(200);before=page.evaluate('window.scrollY')
        swipe(x,y,-140)
        assert page.evaluate('window.scrollY')>before+25,selector+' traps downward page scrolling at bottom'
        page.evaluate("""selector=>{const e=document.querySelector(selector);window.scrollTo(0,window.scrollY+e.getBoundingClientRect().top-130);e.scrollTop=0}""",selector)
        page.wait_for_timeout(200);before=page.evaluate('window.scrollY')
        swipe(x,y,140)
        assert page.evaluate('window.scrollY')<before-25,selector+' traps upward page scrolling at top'
        print('PASS: '+selector+' inner scrolling and page handoff in both directions')
    # A short list without an internal scroll range must never swallow a page swipe.
    page.evaluate("game.applicants=game.applicants.slice(0,1);game.applicants[0].detail='A guild applicant.';renderApplicants();const e=document.getElementById('applicant-list');window.scrollTo(0,window.scrollY+e.getBoundingClientRect().top-130)")
    page.wait_for_timeout(200);box=page.locator('#applicant-list').bounding_box();before=page.evaluate('window.scrollY')
    swipe(box['x']+box['width']/2,box['y']+box['height']/2,-100)
    assert page.evaluate('window.scrollY')>before+25,'Short applicant list traps page scroll'
    print('PASS: page scrolling over a short recruitment list')
    # Recruitment dialogs must still scroll internally and keep the background fixed.
    page.evaluate("game.applicants[0].backstory='A lengthy travel history. '.repeat(300);openRecruit(game.applicants[0].id)")
    page.wait_for_function("document.documentElement.classList.contains('v9-modal-open')")
    modal=page.locator('#recruit-modal')
    box=modal.bounding_box();before=page.evaluate('window.scrollY')
    swipe(box['x']+box['width']/2,box['y']+min(300,box['height']/2),-140)
    assert modal.evaluate('e=>e.scrollTop')>25,'Dialog internal touch scroll failed'
    assert abs(page.evaluate('window.scrollY')-before)<8,'Dialog leaked scrolling to page'
    page.evaluate('closeRecruit()')
    assert not errors,errors
    browser.close()
    print('PASS: modal touch scrolling and background lock; no page errors')
