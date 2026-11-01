const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'hero-portraits.js'),'utf8');
const context={};vm.createContext(context);vm.runInContext(source,context);const api=context.WL_BETA_PORTRAITS;
const queue=JSON.parse(fs.readFileSync(path.join(root,'art/portraits/chibi/queue.json'),'utf8')),rows=queue.filter(r=>r.status==='exported');
assert.equal(api.count,rows.length);const seen=new Set();
for(const p of rows){const h={id:'fixture',race:p.race,className:p.className,gender:p.gender},before=JSON.stringify(h),url=api.lookup(h);assert.equal(url,'art/portraits/chibi/'+p.file);assert(fs.existsSync(path.join(root,url)),url);assert.equal(JSON.stringify(h),before);seen.add(url)}
assert.equal(seen.size,rows.length);assert.equal(api.lookup({race:'Human',className:'Druid',gender:'female'}),'');assert.equal(api.lookup(null),'');
const hero={id:'retained-hero',race:'Human',className:'Warrior'};assert.equal(api.lookup(hero),api.lookup({...hero,name:'Renamed hero'}));assert.equal(api.lookup(hero),api.lookup(JSON.parse(JSON.stringify(hero))));assert.equal(api.genderFor({...hero,gender:'female'}),'female');assert.equal(api.genderFor({...hero,gender:'male',portraitGender:'female'}),'female');
assert.notEqual(api.lookup({...hero,portraitGender:'male'}),api.lookup({...hero,portraitGender:'female'}));assert.deepEqual(hero,{id:'retained-hero',race:'Human',className:'Warrior'});
const noop=()=>{},domContext={document:{querySelector:()=>null,querySelectorAll:()=>[]},MutationObserver:class{observe(){}},v9PickHead:noop,renderApplicants:noop,openRecruit:noop,renderPlayer:noop,renderHeroStats:noop,render:noop};vm.createContext(domContext);
const original=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/^function imageSrc\(hero\).*$/m)[0];vm.runInContext(original,domContext);vm.runInContext(source,domContext);
const customHero={id:'uploaded',race:'Human',className:'Warrior',image:'data:image/jpeg;base64,customfixture'};assert.equal(domContext.imageSrc(customHero),customHero.image);assert.equal(domContext.imageSrc({...customHero,race:'Orc'}),customHero.image);assert(domContext.imageSrc({id:'default',race:'Human',className:'Warrior'}).endsWith('.webp'));assert.equal(domContext.imageSrc({race:'Missing race',className:'Missing class'}),'');
console.log(`PASS ${rows.length} exact mappings and assets, stable legacy variants, gender overrides, custom-upload precedence, unsupported fallback and no save mutations`);
