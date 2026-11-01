"""Measure the painted gold rims; generate CSS framing without changing images."""
import json,re
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];BETA=ROOT.parents[2]
angles=np.linspace(0,2*np.pi,180,endpoint=False);cos=np.cos(angles);sin=np.sin(angles)
def best(mask,candidates):
 c=np.array(candidates);xx=np.rint(c[:,0,None]+c[:,2,None]*cos).astype(int);yy=np.rint(c[:,1,None]+c[:,2,None]*sin).astype(int)
 valid=(xx>=0)&(xx<128)&(yy>=0)&(yy<128)
 score=(mask[np.clip(yy,0,127),np.clip(xx,0,127)]*valid).sum(axis=1)/np.maximum(valid.sum(axis=1),1)
 score[valid.mean(axis=1)<.65]=0
 i=np.argmax(score);return c[i],float(score[i])
profiles={};details={}
for row in json.loads((ROOT/'queue.json').read_text()):
 if row['status']!='exported':continue
 im=np.array(Image.open(ROOT/row['file']).convert('RGB')).astype(float);r,g,b=im[:,:,0],im[:,:,1],im[:,:,2]
 mask=(r>140)&(g>95)&(g>r*.54)&(g<r*.96)&(b<g*.84)
 coarse=[(x,y,r) for x in range(46,83,2) for y in range(42,83,2) for r in range(50,69,2)]
 centre,score=best(mask,coarse);x,y,radius=centre
 fine=[(x+dx,y+dy,radius+dr) for dx in np.arange(-2,2.1,.5) for dy in np.arange(-2,2.1,.5) for dr in np.arange(-2,2.1,.5)]
 (x,y,radius),score=best(mask,fine)
 if score<.45:raise ValueError((row['file'],score))
 scale=64/(radius-2) # Keep the painted rim just outside the one shared CSS frame.
 key=str(row['index']);profiles[key]=[round((64-x)*scale/128*100,3),round((64-y)*scale/128*100,3),round(scale,4)]
 details[key]={'centre':[x,y],'radius':radius,'confidence':round(score,3),'css':profiles[key]}
(ROOT/'framing.json').write_text(json.dumps(details,indent=2)+'\n')
p=BETA/'hero-portraits.js';source=p.read_text();line=' const framing='+json.dumps(profiles,separators=(',',':'))+';'
if ' const framing=' in source:source=re.sub(r' const framing=.*?;',lambda _:line,source,count=1)
else:source=source.replace(" const base=",line+'\n const base=',1)
p.write_text(source)
print(f'Measured {len(profiles)} portrait rims; minimum confidence {min(x["confidence"] for x in details.values()):.3f}')
for key in ['1','18','20','50','80','100','101']:print(key,details[key])
