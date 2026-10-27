/* Race-inspired names for newly generated characters; existing saves keep their names. */
(function(){
  const pool=(first,roots,endings)=>({first:first.split('|'),roots:roots.split('|'),endings:endings.split('|')});
  const cultures={
    Human:pool('Alden|Elara|Gareth|Mira|Rowan|Celia|Edric|Tessa|Lucan|Sabine|Brennan|Maren','Ash|West|Fair|Whit|Briar|Hart|Oak|Raven','ford|brook|well|wood|field|wick|vale|crest'),
    Dwarf:pool('Brom|Dagna|Thorin|Hilda|Korrin|Brynja|Dorin|Moira|Garrum|Helga|Barund|Freya','Iron|Stone|Bronze|Ale|Deep|Anvil|Flint|Storm','beard|hammer|forge|fist|mantle|heart|brew|shield'),
    'Night Elf':pool('Alathir|Shalara|Theronis|Illyra|Faelar|Myrella|Dathren|Lunara|Nythar|Seralyn|Arendir|Velarya','Moon|Star|Night|Leaf|Dusk|Shadow|Silver|Willow','whisper|bough|song|glen|watcher|leaf|shade|bloom'),
    Gnome:pool('Fizzle|Tilli|Bimble|Nixi|Tobin|Melli|Zindle|Pippa|Wizzle|Fenna|Gimlet|Nimsy','Spark|Gear|Sprocket|Brass|Copper|Whistle|Cog|Spring','whistle|wrench|toggle|sprocket|spindle|fuse|widget|bolt'),
    Draenei:pool('Arkan|Yreli|Velenar|Saara|Koraan|Ishara|Daruul|Nemaara|Oruun|Ilyana|Tamaal|Zaari','Dawn|Light|Crystal|Star|Hope|Vigil|Azure|Oath','warden|seeker|bearer|singer|keeper|walker|weaver|shield'),
    Worgen:pool('Alistair|Gwendolyn|Cedric|Evelyn|Godfrey|Rosalind|Oswin|Harriet|Bram|Lenora|Silas|Agatha','Black|Grey|Raven|Thorn|Hollow|Crow|Wolfe|Grim','wood|croft|hurst|grave|moor|wick|borne|shaw'),
    Pandaren:pool('Jin|Mei|Bo|Lian|Shen|Yun|Tao|Lin|Ren|Xiu|Po|An','Bamboo|Cloud|Jade|Mist|Lotus|Gentle|Amber|Plum','paw|brew|leaf|song|step|blossom|reed|bough'),
    Dracthyr:pool('Vyrath|Seryxia|Kareth|Zeralyx|Drazhen|Alystra|Vorith|Merithra|Tharyx|Syrel|Kaeryn|Velthas','Ember|Obsidian|Azure|Cinder|Sky|Crimson|Storm|Onyx','wing|scale|talon|flame|crest|flight|heart|claw'),
    Orc:pool("Goruk|Draka|Throgar|Mazra|Karg|Greshka|Rokhan|Urga|Durok|Nazra|Mogran|Shagra",'Iron|Blood|Stone|Wolf|Battle|Ash|War|Thunder','fist|axe|tusk|fang|scar|howl|breaker|cleaver'),
    Undead:pool('Edmund|Lenore|Corvin|Morgana|Osric|Isolde|Severin|Agnes|Varric|Nerissa|Luther|Mara','Grave|Wither|Hollow|Black|Dusk|Pale|Mourn|Thorn','croft|vale|wood|field|well|borne|brook|hurst'),
    Tauren:pool('Hamuul|Mahu|Tahu|Nara|Bovan|Aponi|Tovan|Una|Ramu|Tala|Koru|Mela','River|Dawn|Stone|Earth|Plain|Sky|Sun|Cloud','hoof|horn|totem|mane|walker|song|wind|runner'),
    Troll:pool("Zan'ro|Jin'ara|Vol'jinra|Sen'ka|Rok'zan|Kaz'ala|Tor'jin|Zul'ani|Daz'ro|Vel'ka|Zin'tal|Mar'jin",'Dusk|Spear|Hex|Shadow|Jungle|Spirit|Bone|Venom','tusk|hunter|dancer|stalker|speaker|fang|weaver|ward'),
    'Blood Elf':pool('Aethas|Liandra|Vaelion|Seralyth|Therion|Calindra|Lorandis|Aelyra|Valeth|Faelara|Kaelith|Soryn','Sun|Dawn|Bright|Ember|Gold|Crimson|Flame|Amber','strider|weaver|whisper|song|blade|spire|ward|glow'),
    Goblin:pool('Gazrik|Rixxa|Zibbit|Kezzi|Noggle|Vixxi|Grizzle|Moxie|Zazzik|Tazzi|Razzle|Sproxa','Gold|Copper|Blast|Fuse|Rocket|Coin|Quick|Profit','grip|spark|wrench|bolt|fizzle|pocket|grin|snatch'),
    'Void Elf':pool('Vaerith|Nysera|Telanis|Syrella|Aethren|Veloria|Darith|Mythria|Lethar|Iridia|Kaerith|Selyra','Void|Dusk|Star|Rift|Night|Umbral|Shade|Astral','whisper|weaver|veil|walker|gaze|song|watch|ward'),
    'Lightforged Draenei':pool('Turalan|Ysaara|Daraan|Ilyra|Boraal|Naari|Voraan|Ashaara|Koraal|Zera|Thaal|Orelia','Light|Dawn|Radiant|Golden|Oath|Sun|Vigil|Argent','shield|warden|bearer|keeper|blade|seeker|heart|singer'),
    'Dark Iron Dwarf':pool('Bargrom|Dagny|Thaurik|Helra|Gorgrim|Brunna|Mordun|Kelda|Dravik|Ragna|Grumdar|Veska','Cinder|Coal|Black|Dark|Ember|Ash|Iron|Smoulder','forge|anvil|beard|hammer|brand|fist|mantle|shield'),
    'Kul Tiran':pool('Bramwell|Jainael|Harlan|Maris|Oswald|Elsbeth|Conrad|Merryn|Tobias|Adelia|Hewitt|Selma','Salt|Tide|Harbour|Storm|Anchor|Grey|Wave|Brine','wake|moor|wick|ford|borne|wood|crest|well'),
    Mechagnome:pool('Bink|Tessa|Wizzle|Nimma|Cogwin|Pimzi|Gizmo|Trixi|Bodwin|Mimsy|Wexel|Fizzla','Gear|Copper|Piston|Chrome|Servo|Cog|Volt|Brass','socket|spindle|link|bolt|wrench|spring|fuse|toggle'),
    Earthen:pool('Dorn|Brinthe|Korrun|Adra|Baldor|Orna|Garn|Veyra|Thuld|Iona|Morn|Edda','Granite|Basalt|Slate|Quartz|Flint|Marble|Onyx|Stone','heart|vein|mantle|brow|hand|ward|forge|core'),
    Nightborne:pool('Thalren|Lyssara|Oculethar|Aralyn|Silandor|Valesse|Telrion|Shalira|Elyndor|Mysselle|Vaelis|Nythira','Arc|Star|Dusk|Night|Moon|Violet|Silk|Twilight','wine|weaver|spire|veil|song|whisper|ward|bloom'),
    'Highmountain Tauren':pool('Huran|Mayla|Tovan|Lasu|Rokar|Nali|Oru|Tama|Joru|Sela|Hamu|Muna','High|Sky|Eagle|Stone|Snow|River|Cloud|Mountain','horn|antler|totem|hoof|mane|watcher|runner|walker'),
    'Mag’har Orc':pool('Gorath|Geya|Durotanek|Dranaka|Kargan|Mazara|Thrag|Urana|Gromuk|Shagara|Korg|Nazuka','Iron|Wolf|Thunder|Stone|Frost|Warsong|Bone|Black','fang|fist|howl|axe|tusk|scar|breaker|cleaver'),
    'Zandalari Troll':pool("Zul'kar|Tala'ji|Rast'jin|Zena'la|Kro'zan|Yaz'ala|Tor'zal|Jani'ra|Zan'tal|Vol'ara|Kaz'jin|Sen'ala",'Golden|Sun|Loa|Dawn|Jade|Sky|Temple|King','tusk|speaker|ward|crest|fang|watcher|seeker|spear'),
    Vulpera:pool('Kirok|Nisha|Meeru|Vexa|Ruko|Sana|Kovu|Yira|Jiro|Mika|Tavi|Risha','Dune|Sand|Dust|Sun|Quick|Amber|Desert|Copper','tail|paw|runner|step|whisker|trail|scout|ear'),
    Haranir:pool('Orun|Hara|Veyun|Nali|Keth|Aru|Thalen|Ysera|Doru|Sani|Rhel|Mira','Root|Moss|Deep|Fern|Dusk|Thorn|Grove|Bark','weaver|song|walker|tender|whisper|bough|shade|ward'),
    Skyborne:pool('Aerin|Sylia|Vael|Zephyra|Orin|Liora|Cael|Yara|Therin|Aella|Soren|Vela','Sky|Cloud|Gale|Wind|Dawn|Storm|Azure|Sun','wing|song|runner|crest|feather|weaver|watch|ward')
  };
  // Accept common imported spellings without changing the saved race label.
  const aliases={"Mag'har Orc":'Mag’har Orc'};
  const choose=values=>values[Math.min(values.length-1,Math.max(0,Math.floor(Math.random()*values.length)))];
  function roman(n){let result='';for(const [value,symbol] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(n>=value){result+=symbol;n-=value}return result}
  function generate(race,usedNames=[]){
    const data=cultures[aliases[race]||race]||cultures.Human,used=new Set([...usedNames].map(n=>String(n).trim().toLowerCase()));
    const available=name=>!used.has(name.toLowerCase());
    for(let attempt=0;attempt<24;attempt++){
      const name=`${choose(data.first)} ${choose(data.roots)}${choose(data.endings)}`;
      if(available(name))return name;
    }
    // Bounded fallback also works with a fixed RNG and crowded name pools.
    for(const first of data.first)for(const root of data.roots)for(const ending of data.endings){const name=`${first} ${root}${ending}`;if(available(name))return name}
    const base=`${data.first[0]} ${data.roots[0]}${data.endings[0]}`;
    for(let n=2;n<=used.size+2;n++){const name=`${base} ${roman(n)}`;if(available(name))return name}
  }
  window.generateRaceName=generate;
  window.RACE_NAME_CULTURES=Object.freeze(Object.fromEntries(Object.entries(cultures).map(([race,data])=>[race,Object.freeze({first:Object.freeze(data.first),roots:Object.freeze(data.roots),endings:Object.freeze(data.endings)})])));
})();
