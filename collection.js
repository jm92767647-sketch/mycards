// One collection, shared by the catalogue, free view and deck statistics.
const styleRows=[['Original Legend Back','Street Style Back'],['Classic Style Back'],['Pattern Back','Fancy Back'],['Special Back Custom Deck','Special JQK Custom Deck'],['Special Number Custom Deck'],['All Special Deck']];
const brandRows=[['Oath','ARK'],['Bicycle','Wondercraft','Dan & Dave'],['Art of Play','Rider Waite','Grandmasters Casino','TCC'],['Tally-Ho','Bee','Theory11','Fontaine'],['Butterfly','Anyone Worldwide','Missing','Cartelago','Gambler’s','Black Roses','Visa']];
const brandLabels={'Oath':'Oath Playing Cards','ARK':'ARK Playing Cards','Dan & Dave':'Dan and Dave','TCC':'TCC Playing Cards','Theory11':'theory11','Butterfly':'Butterfly Playing Cards','Anyone Worldwide':'ANYONE Worldwide','Missing':'Missing New York','Gambler’s':"Gambler's Warehouse",'Black Roses':'Black Roses Playing Cards','Visa':'VISA'};
function cardBrandLabel(name){return brandLabels[name]||name;}
function collectionRows(key){
 const layout=(key==='style'?styleRows:brandRows).map(row=>[...row]),known=new Set(layout.flat());
 for(const card of CARDS){const name=card[key];if(!known.has(name)){known.add(name);if(key==='style')layout.push([name]);else layout.at(-1).push(name);}}
 return layout;
}
function groupedCards(key){if(key==='marking')return [{groups:[{name:'Marking',cards:CARDS.filter(card=>card.marked)}]}];return collectionRows(key).map(names=>({groups:names.map(name=>({name,cards:CARDS.filter(c=>c[key]===name)}))}));}
function arrangedCards(key){return groupedCards(key).flatMap(row=>row.groups.flatMap(group=>group.cards));}

function markingLabel(){const label=document.createElement('span');label.className='marking-label';label.textContent='Marking';return label;}
