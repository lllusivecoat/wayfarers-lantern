"""Normalize an inclusive portrait range from existing artwork; preserve originals."""
import argparse,hashlib,json,re
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];BETA=ROOT.parents[2]
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('start',type=int);parser.add_argument('end',type=int);args=parser.parse_args()
if not 1<=args.start<=args.end<=498:parser.error('Choose an inclusive range from 1 to 498')
queue=json.loads((ROOT/'queue.json').read_text());framing=json.loads((ROOT/'framing.json').read_text())
selected=[row for row in queue if args.start<=row['index']<=args.end]
if len(selected)!=args.end-args.start+1 or any(row['status']!='exported' for row in selected):raise ValueError('Every selected portrait must be exported first')
folder=ROOT/f'aligned-{args.start:03}-{args.end:03}';(folder/'portraits').mkdir(parents=True,exist_ok=True)
overrides=json.loads((ROOT/'alignment-overrides.json').read_text()) if (ROOT/'alignment-overrides.json').exists() else {}
manifest=[]
for row in selected:
 source=row.get('alignmentOriginal',row['file']);original=Image.open(ROOT/source).convert('RGBA')
 # Preserve the measured original geometry so this command is repeatable.
 geometry=row.get('alignmentSourceGeometry') or {k:framing[str(row['index'])][k] for k in ['centre','radius']}
 geometry=overrides.get(str(row['index']),{}).get('geometry',geometry)
 cx,cy=geometry['centre'];radius=geometry['radius']-2;scale=4;side=128*scale
 atlas=ROOT/row['batch']/row['sheet'] if row.get('sheet') else None
 atlas=atlas if atlas and atlas.is_file() else None
 if atlas:
  original=Image.open(atlas).convert('RGBA');sx=original.width/5/128;sy=original.height/4/128
  ox=(row['column']-1)*original.width/5;oy=(row['row']-1)*original.height/4
  # A few source circles meet the outer atlas edge. Keep the cover crop
  # inside available artwork rather than introducing a flat padding strip.
  radius=min(radius,cx+ox/sx,cy+oy/sy,(original.width-ox)/sx-cx,(original.height-oy)/sy-cy)
 else:
  sx=sy=1;ox=oy=0
  # Where a legacy file already clipped the source circle, cover the frame
  # with available artwork instead of adding a flat strip of invented padding.
  radius=min(radius,cx,cy,128-cx,128-cy)
 crop={'centre':[cx,cy],'radius':radius,'atlas':str(atlas.relative_to(ROOT)) if atlas else None}
 dest=folder/'portraits'/Path(source).name
 if not (dest.exists() and row.get('alignmentCrop')==crop and row['file']==str(dest.relative_to(ROOT))):
  tile=original.transform((side,side),Image.Transform.AFFINE,(radius/64/scale*sx,0,ox+(cx-radius)*sx,0,radius/64/scale*sy,oy+(cy-radius)*sy),Image.Resampling.BICUBIC,fillcolor=(32,27,19,255))
  mask=Image.new('L',(side,side));ImageDraw.Draw(mask).ellipse((0,0,side-1,side-1),fill=255);tile.putalpha(mask)
  tile=tile.resize((128,128),Image.Resampling.LANCZOS);tile.save(dest,'WEBP',quality=95,method=6)
 row.update(file=str(dest.relative_to(ROOT)),alignment='normalized-circle-v1',alignmentOriginal=source,alignmentSourceGeometry=geometry,alignmentCrop=crop,bytes=dest.stat().st_size)
 framing[str(row['index'])]={'centre':[64,64],'radius':64,'confidence':1,'css':[0,0,1],'normalized':True}
 manifest.append({'index':row['index'],'race':row['race'],'className':row['className'],'gender':row['gender'],'original':source,'file':row['file'],'width':128,'height':128,'sourceGeometry':geometry,'crop':crop,'bytes':dest.stat().st_size,'originalSha256':hashlib.sha256((ROOT/source).read_bytes()).hexdigest()})
(ROOT/'queue.json').write_text(json.dumps(queue,indent=2)+'\n');(ROOT/'framing.json').write_text(json.dumps(framing,indent=2)+'\n')
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(folder/'README.md').write_text(f'# Aligned portraits {args.start:03}–{args.end:03}\n\n{len(selected)} normalized 128×128 WebP icons made from existing artwork. No image-generation calls. Originals remain in their batch folders. Circular masks and centred crops replace the original padding and painted rim; the game draws one shared border. Retained source atlases supply the full circle where available. Legacy cropped files use a centred cover crop, avoiding blank strips without generating missing artwork. Rebuild with `python3 beta/art/portraits/chibi/tools/align.py {args.start} {args.end}` then `python3 beta/art/portraits/chibi/tools/catalog.py`.\n')
p=BETA/'hero-portraits.js';s=p.read_text();profiles={k:v['css'] for k,v in framing.items()};s=re.sub(r' const framing=.*?;',lambda _: ' const framing='+json.dumps(profiles,separators=(',',':'))+';',s,count=1)
s=s.replace(r'art\/portraits\/chibi\/batch-\d+\/portraits\/(\d+)-',r'art\/portraits\/chibi\/(?:batch-\d+|aligned-\d+-\d+)\/portraits\/(\d+)-');p.write_text(s)
print(f'Normalized portraits {args.start:03}–{args.end:03}; originals and entries outside this range preserved')
