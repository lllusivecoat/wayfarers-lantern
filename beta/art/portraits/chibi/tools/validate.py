"""Check identity, dimensions, file mappings and completed batch manifests."""
import json,re
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];BETA=ROOT.parents[2]
queue=json.loads((ROOT/'queue.json').read_text());keys=set();done=[]
for row in queue:
 key=(row['race'],row['className'],row['gender'])
 assert key not in keys, key
 keys.add(key)
 assert row['gender'] in ('male','female')
 if row['status']!='exported':continue
 done.append(row);path=ROOT/row['file']
 with Image.open(path) as im:
  assert im.size==(128,128),(path,im.size)
  assert im.format=='WEBP',(path,im.format)
for race,cls,gender in keys: assert (race,cls,'female' if gender=='male' else 'male') in keys
source=(BETA/'hero-portraits.js').read_text();entries=json.loads(re.search(r' const entries=(\[.*?\]);',source).group(1))
assert entries==[[r['race'],r['className'],r['gender'],r['file']] for r in done]
for batch in dict.fromkeys(r['batch'] for r in done if r['index']>100):
 m=json.loads((ROOT/batch/'manifest.json').read_text())
 assert len(m)==len([r for r in queue if r['batch']==batch])
 for row in m:
  if row['status']=='exported': assert (ROOT/batch/row['file']).exists()
assert 'custom(h)||lookup(h)' in source
print(f'PASS {len(done)} unique portraits, 128x128 WebP, catalogue paths, gender pairs, manifests, custom upload precedence')
