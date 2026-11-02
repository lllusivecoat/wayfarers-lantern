"""Verify promoted entrypoint paths, save compatibility, and offline release bytes."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlparse
import base64,hashlib,json,re
ROOT=Path(__file__).resolve().parent.parent
source=(ROOT/'index.html').read_text()
class Assets(HTMLParser):
 def __init__(self):super().__init__();self.base='https://example.com/game/';self.paths=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='base':self.base=urljoin(self.base,d['href'])
  target=d.get('src') if tag in ['script','img'] else d.get('href') if tag=='link' and d.get('rel') in ['stylesheet','icon','manifest','apple-touch-icon'] else None
  if target:
   u=urlparse(urljoin(self.base,target))
   if u.netloc=='example.com':self.paths.append(u.path.removeprefix('/game/'))
assets=Assets();assets.feed(source)
files=json.loads(re.search(r'const FILES=(.*);',(ROOT/'sw.js').read_text())[1]);cached={f['path'] for f in files}
for path in assets.paths:
 assert (ROOT/path).is_file(),path
 assert path in cached,path
for f in files:
 assert f['integrity']=='sha256-'+base64.b64encode(hashlib.sha256((ROOT/f['path']).read_bytes()).digest()).decode(),f['path']
assert "const SAVE_KEY='wayfarers_lantern_offline_v1'" in source
assert 'beta_backup' in source and 'refused to save an emptied guild' in source
assert 'location.replace' in (ROOT/'beta/index.html').read_text()
assert len((ROOT/'beta/index.html').read_bytes())<1024
assert len((ROOT/'index.html').read_bytes())<600000
assert "new URL('./',document.currentScript.src)" in (ROOT/'offline.js').read_text()
assert "scope:appRoot.href" in (ROOT/'offline.js').read_text()
print(f'PASS {len(assets.paths)} local entrypoint assets cached; {len(files)} release hashes verified; shared save guards, root worker scope and beta redirect retained')
