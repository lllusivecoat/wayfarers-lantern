"""Validate the 151–300 alignment batch and fixed-size gallery links."""
import hashlib,json,re
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]/'art/portraits/chibi'
queue=json.loads((root/'queue.json').read_text())
frames=json.loads((root/'framing.json').read_text())
manifest=json.loads((root/'aligned-151-300/manifest.json').read_text())
assert [r['index'] for r in queue if r.get('alignment')]==list(range(1,301))
assert [r['index'] for r in manifest]==list(range(151,301))
for record in manifest:
 row=queue[record['index']-1]
 assert row['file']==record['file']
 assert row['file'].startswith('aligned-151-300/portraits/')
 assert row['alignment']=='normalized-circle-v1'
 original=root/row['alignmentOriginal']
 assert hashlib.sha256(original.read_bytes()).hexdigest()==record['originalSha256']
 assert frames[str(row['index'])]['css']==[0,0,1]
 with Image.open(root/row['file']) as im:
  assert im.size==(128,128) and im.format=='WEBP'
  alpha=im.convert('RGBA').getchannel('A')
  assert all(alpha.getpixel(p)==0 for p in [(0,0),(127,0),(0,127),(127,127)])
  assert alpha.getpixel((64,64))==255
 crop=row['alignmentCrop'];cx,cy=crop['centre'];radius=crop['radius']
 if crop['atlas']:
  assert (root/crop['atlas']).is_file()
  with Image.open(root/crop['atlas']) as atlas:
   cellw,cellh=atlas.width/5,atlas.height/4
   x=(row['column']-1)*cellw+cx/128*cellw;y=(row['row']-1)*cellh+cy/128*cellh
   assert 0<=x-radius/128*cellw<x+radius/128*cellw<=atlas.width
   assert 0<=y-radius/128*cellh<y+radius/128*cellh<=atlas.height
 else:
  assert 0<=cx-radius<cx+radius<=128
  assert 0<=cy-radius<cy+radius<=128
for row in queue[300:]:
 assert not row.get('alignment') and row['file'].startswith(row['batch']+'/portraits/')
for page in [root/'preview.html',*(root/b/'preview.html' for b in sorted({r['batch'] for r in queue})),root/'aligned-151-300/preview.html']:
 html=page.read_text()
 assert 'data-size="32"' not in html and 'data-size="58"' not in html
 assert '← Back to game' in html
 for src in re.findall(r'<img[^>]+src="([^"]+)"',html):
  assert (page.parent/src).is_file(),(page,src)
print('PASS 150 aligned circular 128px WebPs, preserved-original hashes, atlas/cover crops, 198 later entries untouched and 128px-only galleries with valid links')
