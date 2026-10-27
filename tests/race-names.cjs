/* Run: node tests/race-names.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
let seed=19;
const rng=Object.create(Math);
rng.random=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
const context={window:{},Math:rng};
vm.runInNewContext(fs.readFileSync(path.join(root,'names.js'),'utf8'),context);
const {generateRaceName:generate,RACE_NAME_CULTURES:cultures}=context.window;
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const races=vm.runInNewContext(source.match(/const races=(\[[^;]+\]);/)[1]);
assert.equal(races.length,Object.keys(cultures).length);
const used=new Set();
for(const race of races){
  const data=cultures[race];assert.ok(data,`No culture for ${race}`);
  for(let i=0;i<250;i++){
    const name=generate(race,used);
    const [first,last]=name.split(' ');
    assert.ok(data.first.includes(first),`Wrong given name: ${race} ${name}`);
    assert.ok(data.roots.some(r=>data.endings.some(e=>r+e===last)),`Wrong surname: ${race} ${name}`);
    assert.ok(!used.has(name),`Duplicate: ${name}`);used.add(name);
  }
}
// A constant RNG cannot hang when it keeps selecting an occupied name.
rng.random=()=>0;
const first=generate('Orc');
assert.notEqual(generate('Orc',[first.toUpperCase()]),first);
assert.equal(generate("Mag'har Orc"),generate('Mag’har Orc'));
assert.equal(generate('Unknown custom race'),generate('Human'));
const data=cultures.Human,full=[];
for(const first of data.first)for(const root of data.roots)for(const end of data.endings)full.push(`${first} ${root}${end}`);
const exhausted=generate('Human',full);assert.ok(!full.includes(exhausted));
assert.equal(exhausted,'Alden Ashford II');
console.log(`PASS: ${used.size} unique race-appropriate names across ${races.length} races; collisions, aliases, unknown races and exhausted pools.`);
