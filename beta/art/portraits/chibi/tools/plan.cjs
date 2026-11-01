/* Build a stable queue from the beta's actual race/class rules. */
const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync(process.argv[2]||'beta/index.html','utf8').replace(/\/\/[^\n]*/g,'');
const ctx={};vm.createContext(ctx);
const names=['races','specs','classes','RACE_CLASS_COMBOS','outreachOpenClasses','outreachRaceClassOptions','foreverRaceClassAdditions'];
for(const name of names){const match=source.match(new RegExp('const '+name+'\\s*=[\\s\\S]*?;'));if(!match)throw Error('Missing '+name);vm.runInContext(match[0],ctx)}
const fn=source.match(/function outreachClassesForRace\(race\)\{[^\n]+/)[0];vm.runInContext(fn,ctx);
const rows=vm.runInContext("races.flatMap(race=>outreachClassesForRace(race).flatMap(className=>['male','female'].map(gender=>({race,className,gender}))))",ctx);
const root='beta/art/portraits/chibi',first=JSON.parse(fs.readFileSync(root+'/batch-001/manifest.json'));
const key=x=>[x.race,x.className,x.gender].join('|'),done=new Set(first.map(key));
const queue=[...first.map(({race,className,gender})=>({race,className,gender})),...rows.filter(x=>!done.has(key(x)))].map((x,i)=>{const index=i+1,batch='batch-'+String(Math.ceil(index/100)).padStart(3,'0');const slug=[x.race,x.className,x.gender].join('-').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-');return {...x,index,batch,file:batch+'/portraits/'+String(index).padStart(3,'0')+'-'+slug+'.webp',status:index<=100?'exported':'pending'}});
const old=fs.existsSync(root+'/queue.json')?JSON.parse(fs.readFileSync(root+'/queue.json')):[];const previous=new Map(old.map(x=>[key(x),x]));
for(let i=0;i<queue.length;i++){const prior=previous.get(key(queue[i]));if(prior){if(prior.index!==queue[i].index)throw Error('Queue ordering changed; migrate explicitly');queue[i]={...queue[i],...prior}}}
fs.writeFileSync(root+'/queue.json',JSON.stringify(queue,null,2)+'\n');
console.log(JSON.stringify({total:queue.length,batches:Math.ceil(queue.length/100),remaining:queue.length-100,next:queue[100]}));
