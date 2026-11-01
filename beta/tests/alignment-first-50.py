"""Check the limited trial, transparent circular crops and untouched later entries."""
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'art/portraits/chibi'
queue=json.loads((root/'queue.json').read_text());frames=json.loads((root/'framing.json').read_text())
selected=[r for r in queue[:50] if r.get('alignment')=='normalized-circle-v1']
assert [r['index'] for r in selected]==list(range(1,51))
for row in selected:
 assert (root/row['alignmentOriginal']).exists()
 with Image.open(root/row['file']) as im:
  assert im.size==(128,128) and im.format=='WEBP'
  alpha=im.convert('RGBA').getchannel('A')
  assert all(alpha.getpixel(p)==0 for p in [(0,0),(127,0),(0,127),(127,127)])
  assert alpha.getpixel((64,64))==255
 assert frames[str(row['index'])]['css']==[0,0,1]
for row in queue[300:]:assert row['file'].startswith(row['batch']+'/portraits/') and not row.get('alignment')
print('PASS exactly 50 normalized 128x128 circular icons, preserved originals, identity frame transforms, remaining 198 paths unchanged')
