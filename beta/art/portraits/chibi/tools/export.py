"""Export a reviewed 5x4 atlas to 128x128 WebP assets; update the resume queue.
Usage: python3 beta/art/portraits/chibi/tools/export.py START ATLAS.png
"""
import json, shutil, sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
start=int(sys.argv[1]); source=Path(sys.argv[2]); queue=json.loads((ROOT/'queue.json').read_text())
rows=queue[start-1:min(start+19,len(queue))]
if not rows or start<101: raise SystemExit('Never overwrite original batch 001')
batch=ROOT/rows[0]['batch']; batch.mkdir(parents=True,exist_ok=True)
sheet=f'sheet-{((start-1)%100)//20+1:02}.png'; target=batch/sheet
if source.resolve()!=target.resolve(): shutil.copyfile(source,target)
im=Image.open(target).convert('RGB'); width,height=im.size
archive=target.with_suffix('.webp'); im.save(archive,'WEBP',quality=95,method=6)
if abs(width/height-1.25)>.04: raise SystemExit('Expected a 5x4 atlas')
for cell,row in enumerate(rows):
 if row['batch']!=rows[0]['batch']: raise SystemExit('Sheet crosses batches')
 x,y=cell%5,cell//5
 tile=im.crop((round(x*width/5),round(y*height/4),round((x+1)*width/5),round((y+1)*height/4)))
 tile=tile.resize((128,128),Image.Resampling.LANCZOS)
 dest=ROOT/row['file']; dest.parent.mkdir(parents=True,exist_ok=True)
 tile.save(dest,'WEBP',quality=90,method=6)
 row.update(status='exported',sheet=archive.name,row=y+1,column=x+1,width=128,height=128,bytes=dest.stat().st_size)
(ROOT/'queue.json').write_text(json.dumps(queue,indent=2)+'\n')
manifest=[{**r,'file':'portraits/'+Path(r['file']).name} for r in queue if r['batch']==rows[0]['batch']]
(batch/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Exported {start}–{rows[-1]["index"]}: {len(rows)} portraits, 128x128 WebP')
