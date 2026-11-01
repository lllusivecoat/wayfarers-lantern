"""Normalize portraits 001–050 from existing artwork; never overwrite originals."""
import json,re
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];BETA=ROOT.parents[2]
queue=json.loads((ROOT/'queue.json').read_text());framing=json.loads((ROOT/'framing.json').read_text())
folder=ROOT/'aligned-001-050';(folder/'portraits').mkdir(parents=True,exist_ok=True)
manifest=[]
for row in queue[:50]:
 source=row.get('alignmentOriginal',row['file']);original=Image.open(ROOT/source).convert('RGBA')
 # Preserve the measured original geometry so this command is repeatable.
 geometry=row.get('alignmentSourceGeometry') or {k:framing[str(row['index'])][k] for k in ['centre','radius']}
 cx,cy=geometry['centre'];radius=geometry['radius']-2;scale=4;side=128*scale
 tile=original.transform((side,side),Image.Transform.AFFINE,(radius/64/scale,0,cx-radius,0,radius/64/scale,cy-radius),Image.Resampling.BICUBIC,fillcolor=(32,27,19,255))
 mask=Image.new('L',(side,side));ImageDraw.Draw(mask).ellipse((0,0,side-1,side-1),fill=255);tile.putalpha(mask)
 tile=tile.resize((128,128),Image.Resampling.LANCZOS);dest=folder/'portraits'/Path(source).name;tile.save(dest,'WEBP',quality=95,method=6)
 row.update(file=str(dest.relative_to(ROOT)),alignment='normalized-circle-v1',alignmentOriginal=source,alignmentSourceGeometry=geometry,bytes=dest.stat().st_size)
 framing[str(row['index'])]={'centre':[64,64],'radius':64,'confidence':1,'css':[0,0,1],'normalized':True}
 manifest.append({'index':row['index'],'race':row['race'],'className':row['className'],'gender':row['gender'],'original':source,'file':row['file'],'width':128,'height':128,'sourceGeometry':geometry,'bytes':dest.stat().st_size})
(ROOT/'queue.json').write_text(json.dumps(queue,indent=2)+'\n');(ROOT/'framing.json').write_text(json.dumps(framing,indent=2)+'\n')
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(folder/'README.md').write_text('# Alignment trial: portraits 001–050\n\n50 normalized 128×128 WebP icons made from the existing artwork. No image-generation calls. Originals remain in batch-001. Circular masks and centred crops replace the original padding and painted rim; the game draws one shared border. Portraits 051–498 are unchanged. Missing artwork outside the original crop is not regenerated.\n')
p=BETA/'hero-portraits.js';s=p.read_text();profiles={k:v['css'] for k,v in framing.items()};s=re.sub(r' const framing=.*?;',lambda _: ' const framing='+json.dumps(profiles,separators=(',',':'))+';',s,count=1)
s=s.replace(r'art\/portraits\/chibi\/batch-\d+\/portraits\/(\d+)-',r'art\/portraits\/chibi\/(?:batch-\d+|aligned-\d+-\d+)\/portraits\/(\d+)-');p.write_text(s)
print('Normalized 50 existing portraits; originals and portraits 051–498 preserved')
