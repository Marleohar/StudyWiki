const {library}=require('./task003a-harness.cjs');
function sortingData(){const data=library();data.nodes=[
{id:'m10',title:'Goblin10',icon:'x',free_text:{sv:'sv',en:'en'},isImmigrant:true,unknown:{keep:[false,null]}},
{id:'m2',title:'goblin2',icon:'x'},{id:'p-only',title:'HitDice2',icon:'x'},{id:'q-only',title:'HitDice10',icon:'x'},
{id:'none10',title:'10',icon:'x'},{id:'none2',title:'2',icon:'x'},
{id:'p',title:'Pacifies Pitta',icon:'criteria'},{id:'q',title:'Aggravates Kapha',icon:'criteria'},{id:'r',title:'Other',icon:'criteria'}];
data.edges=[{a:'m10',b:'p',unknown:{retain:[1]}},{a:'q',b:'m10'},{a:'m2',b:'p'},{a:'m2',b:'q'},
{a:'p-only',b:'p'},{a:'p',b:'p-only',unknown:'duplicate active'}, {a:'q-only',b:'q'}, {a:'p-only',b:'q',paused:true,unknown:{retain:true}}, {a:'none2',b:'p',paused:true}];return data}
module.exports={sortingData};
