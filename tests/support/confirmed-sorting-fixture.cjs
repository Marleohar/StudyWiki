const {library}=require('./task003a-harness.cjs');
function confirmedSortingData(){const data=library();const names=['Besk','Salt','Syrlig','Söt','Extra2','Extra10','Sjunde'];data.nodes=names.map((title,i)=>({id:'c'+i,title,icon:'criteria',unknown:{keep:i}}));data.edges=[];
for(let mask=0;mask<16;mask++){for(const suffix of ['10','2']){const id='m'+mask+'-'+suffix;data.nodes.push({id,title:'Objekt'+suffix+' '+mask,icon:'x',free_text:{sv:'sv',en:'en'},isImmigrant:mask===7,unknown:{keep:[false,null]}});for(let bit=0;bit<4;bit++)if(mask&(1<<bit))data.edges.push({a:id,b:'c'+bit,unknown:{retain:[mask,bit]}})}}
data.edges.push({a:'c0',b:'m1-2',unknown:'duplicate active'},{a:'m0-2',b:'c0',paused:true,unknown:{paused:'kept'}},{a:'m1-2',b:'c0',paused:true});return data}
const expectedHeadings=['Besk, Salt, Syrlig, Söt','Besk, Salt, Syrlig','Besk, Salt, Söt','Besk, Syrlig, Söt','Salt, Syrlig, Söt','Besk, Salt','Besk, Syrlig','Besk, Söt','Salt, Syrlig','Salt, Söt','Syrlig, Söt','Besk','Salt','Syrlig','Söt','Övriga objekt'];
module.exports={confirmedSortingData,expectedHeadings};
