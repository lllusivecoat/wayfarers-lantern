"""Local Chromium image budget audit; simulated networking, gzip text, no external fonts/SW."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import gzip,json,time,statistics
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
 def do_GET(self):
  path=urlparse(self.path).path
  f=ROOT/path.lstrip('/')
  if f.is_dir():f=f/'index.html'
  if f.is_file() and f.suffix in ['.html','.js','.css','.json']:
   data=gzip.compress(f.read_bytes());self.send_response(200);self.send_header('Content-Type',self.guess_type(str(f)));self.send_header('Content-Encoding','gzip');self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','public,max-age=600');self.end_headers();self.wfile.write(data)
  else:super().do_GET()
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)));Thread(target=s.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{s.server_port}'
results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for profile,throughput,latency,runs in [('4G',5_000_000/8,80,3),('slow4G',1_600_000/8,150,1)]:
   for images in [True,False]:
    for run in range(runs):
     ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
     # Route interception disables Chromium HTTP cache; use URL blocking through CDP instead.
     page=ctx.new_page();cdp=ctx.new_cdp_session(page);cdp.send('Network.enable');cdp.send('Network.setBlockedURLs',{'urls':['*fonts.googleapis.com*','*fonts.gstatic.com*']+([] if images else ['*.webp','*.png','*.jpg','*.jpeg'])});cdp.send('Network.emulateNetworkConditions',{'offline':False,'latency':latency,'downloadThroughput':throughput,'uploadThroughput':throughput})
     records={};phase=['hall'];cdp.on('Network.responseReceived',lambda ev:records.update({ev['requestId']:{'url':ev['response']['url'],'type':ev['type'],'cache':ev['response'].get('fromDiskCache',False),'bytes':0,'phase':phase[0]}}));cdp.on('Network.loadingFinished',lambda ev:records.get(ev['requestId'],{}).update(bytes=ev['encodedDataLength']))
     page.add_init_script("new PerformanceObserver(l=>{window.auditLCP=l.getEntries().at(-1).startTime}).observe({type:'largest-contentful-paint',buffered:true})")
     start=time.monotonic();page.goto(base+'/beta/',wait_until='load',timeout=90000);page.wait_for_function("document.readyState==='complete' && !!document.querySelector('.pv-top')");load_ms=(time.monotonic()-start)*1000;page.wait_for_timeout(1200)
     nav=page.evaluate("({dcl:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,load:performance.getEntriesByType('navigation')[0].loadEventEnd,lcp:window.auditLCP||0})")
     hall=list(records.values());phase[0]='quests';page.evaluate("showView('quests')");page.wait_for_timeout(2200)
     if images and run==0 and profile=='4G':
      phase[0]='world';page.evaluate("showView('world')");page.wait_for_timeout(2200)
     row={'profile':profile,'images':images,'run':run,'ready_ms':round(load_ms),'navigation':nav,'hall_bytes':round(sum(r['bytes'] for r in hall)),'hall_images':[r for r in hall if r['type']=='Image'],'image_requests':[r for r in records.values() if r['type']=='Image'],'all_bytes':round(sum(r['bytes'] for r in records.values()))}
     if run==0:
      phase[0]='warm';records.clear();start=time.monotonic();page.reload(wait_until='load',timeout=90000);page.wait_for_function("!!document.querySelector('.pv-top') && document.readyState==='complete'");row['warm_ready_ms']=round((time.monotonic()-start)*1000);page.wait_for_timeout(500);row['warm_bytes']=round(sum(r['bytes'] for r in records.values()));row['warm_images']=[r for r in records.values() if r['type']=='Image']
     results.append(row);print(json.dumps({k:row[k] for k in ['profile','images','run','ready_ms','hall_bytes']}),flush=True);ctx.close()
  browser.close()
 out=Path('/tmp/wayfarers-preview/image-load-audit.json');out.write_text(json.dumps(results,indent=2));print('AUDIT',out,flush=True)
finally:s.shutdown()
