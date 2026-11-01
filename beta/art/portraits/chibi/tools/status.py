import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
q=json.loads((root/'queue.json').read_text())
for batch in dict.fromkeys(r['batch'] for r in q):
 rows=[r for r in q if r['batch']==batch]
 print(f'{batch}: {sum(r["status"]=="exported" for r in rows)}/{len(rows)} exported')
pending=next((r for r in q if r['status']!='exported'),None)
print('NEXT: '+(f'{pending["index"]} {pending["race"]} {pending["className"]} {pending["gender"]}' if pending else 'COMPLETE'))
