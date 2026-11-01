"""Embed the small critical launch CSS/JS. Beta only; no service-worker changes."""
from pathlib import Path
import argparse,re
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--check',action='store_true');args=p.parse_args()
root=Path(__file__).resolve().parent;index=root/'index.html';source=index.read_text()
for kind,suffix,tag in [('style','css','style'),('script','js','script')]:
 start=f'<!-- launch-critical-{kind}:start -->';end=f'<!-- launch-critical-{kind}:end -->'
 inline=(root/f'launch-critical.{suffix}').read_text().strip()
 block=f'{start}\n<{tag}>\n{inline}\n</{tag}>\n{end}'
 source,n=re.subn(re.escape(start)+r'.*?'+re.escape(end),lambda _:block,source,flags=re.S)
 assert n==1,kind
if args.check:
 assert source==index.read_text(),'Run python3 beta/build-launch.py'
 print('PASS launch critical assets match inline sources')
else:index.write_text(source)
