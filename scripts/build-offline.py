"""Generate a complete, integrity-checked offline release. Run before every deployment."""
from pathlib import Path
import base64
import hashlib
import json
import sys

ROOT=Path(__file__).resolve().parent.parent
ASSETS=['index.html','names.js','balance.js','staff-aptitudes.js','gear-system.js','staff-system.js','kitchen-system.js','memorial-system.js','offline.js','offline.css','manifest.webmanifest','icons/lantern-192.png','icons/lantern-512.png']
files=[{'path':name,'integrity':'sha256-'+base64.b64encode(hashlib.sha256((ROOT/name).read_bytes()).digest()).decode()} for name in ASSETS]
template=(ROOT/'scripts/sw-template.js').read_text()
serialized=json.dumps(files,separators=(',',':'))
release=hashlib.sha256((serialized+template).encode()).hexdigest()[:20]
worker=template.replace('__RELEASE__',json.dumps(release)).replace('__FILES__',serialized)
if '--check' in sys.argv:
    if not (ROOT/'sw.js').exists() or (ROOT/'sw.js').read_text()!=worker:
        raise SystemExit('Offline release is stale. Run python3 scripts/build-offline.py before deployment.')
    print('Offline release verified:',release)
else:
    (ROOT/'sw.js').write_text(worker)
    print('Offline release:',release,'—',len(files),'verified files')
