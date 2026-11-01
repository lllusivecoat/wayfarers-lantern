"""Rebuild beta catalogue and review pages from exported queue entries only."""
import json,re,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; BETA=ROOT.parents[2]
queue=json.loads((ROOT/'queue.json').read_text()); done=[r for r in queue if r['status']=='exported']
p=BETA/'hero-portraits.js'; source=p.read_text()
entries=[[r['race'],r['className'],r['gender'],r['file']] for r in done]
source=re.sub(r' const entries=\[.*?\];', lambda _: ' const entries='+json.dumps(entries,separators=(',',':'))+';',source,count=1)
source=source.replace("const base='art/portraits/chibi/batch-001/portraits/';","const base='art/portraits/chibi/';")
source=source.replace('/* Beta-only first 100 chibi portraits.', '/* Beta-only chibi portraits.')
source=source.replace("link.href='art/portraits/chibi/batch-001/preview.html'", "link.href='art/portraits/chibi/preview.html'")
source=re.sub(r"link.textContent='View (?:first 100|[0-9]+) portraits'",f"link.textContent='View {len(done)} portraits'",source)
p.write_text(source)
def preview(rows,prefix,title):
 back=('../../../../index.html' if prefix else '../../../index.html')
 cards=''.join('<figure><img loading="lazy" width="128" height="128" src="'+html.escape(prefix+r['file'])+'" alt="'+html.escape(r['race']+' '+r['className']+' '+r['gender'])+'"><figcaption>'+str(r['index'])+' · '+html.escape(r['race']+' '+r['className']+' '+r['gender'])+'</figcaption></figure>' for r in rows)
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>body{margin:24px;background:#201b13;color:#f4ead6;font:16px/1.5 system-ui}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px}figure{margin:0;padding:12px;text-align:center;background:#30271b;border-radius:10px}img{width:128px;height:128px;object-fit:cover;border-radius:50%}figcaption{font-size:12px;margin-top:8px}a.gallery-back{display:inline-flex;align-items:center;min-height:48px;padding:8px 16px;border:1px solid #d9bd86;border-radius:8px;color:#f4ead6;text-decoration:none}nav.gallery-nav{position:sticky;top:0;z-index:1;background:#201b13;padding:8px 0}button{padding:12px 18px;margin:0 8px 20px 0;cursor:pointer;min-height:44px}</style><nav class="gallery-nav"><a class="gallery-back" href="'+back+'">← Back to game</a></nav><h1>'+title+'</h1><p>128×128 portraits. Original custom uploads take priority.</p><main>'+cards+'</main><script>document.querySelector(".gallery-back").onclick=e=>{if(document.referrer&&history.length>1){const from=new URL(document.referrer);if(from.origin===location.origin&&/\\/beta\\/(?:index\\.html)?$/.test(from.pathname)){e.preventDefault();history.back()}}}</script></html>\n'
(ROOT/'preview.html').write_text(preview(done,'',f'Beta portrait gallery · {len(done)} portraits'))
for batch in dict.fromkeys(r['batch'] for r in done):
 rows=[r for r in done if r['batch']==batch];directory=ROOT/batch
 (directory/'preview.html').write_text(preview(rows,'../',batch+' · '+str(len(rows))+' portraits'))
 if rows[0]['index']>100:(directory/'README.md').write_text(f'# {batch} — portraits {rows[0]["index"]}–{rows[-1]["index"]}\n\n{len(rows)} exported 128×128 WebP portraits. Five columns × four rows per retained source atlas. See manifest.json for row-major identities and preview.html to review at 128 pixels.\n')
for folder in dict.fromkeys(r['file'].split('/')[0] for r in done if r.get('alignment')):
 rows=[r for r in done if r['file'].startswith(folder+'/')]
 if folder!='aligned-001-050':(ROOT/folder/'preview.html').write_text(preview(rows,'../',folder+' · '+str(len(rows))+' portraits'))
print(f'Catalogue and galleries: {len(done)} portraits')
