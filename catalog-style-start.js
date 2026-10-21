// List navigation has its own selection and scroll state; it never resets the camera.
(()=>{
 let presentation='list',catalogMode=document.body.dataset.catalogDefault||'style',catalogGroup=null;
 const pane=document.querySelector('#catalog-pane');
 const label=name=>catalogMode==='brand'?cardBrandLabel(name):name;
 const groups=()=>groupedCards(catalogMode).flatMap(row=>row.groups).filter(group=>group.cards.length);
 function syncNavigation(){document.querySelectorAll('#classification [data-sort]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sort===(presentation==='list'?catalogMode:sort))));}
 function fitCatalog(){
  const area=pane.querySelector('.catalog-products-area');if(!area||presentation!=='list')return;
  const cards=[...pane.querySelectorAll('.catalog-card')],mobile=matchMedia('(max-width:760px)').matches;
  if(mobile){for(const card of cards){const deck=CARDS.find(c=>String(c.id)===card.dataset.deck);card.style.setProperty('--deck-height',Math.max(1,(area.clientWidth-8)/units(deck))+'px');}return;}
  const rowCount=cards.length>1?2:1,maxUnits=Math.max(...cards.map(card=>units(CARDS.find(c=>String(c.id)===card.dataset.deck))));
  const height=Math.max(64,Math.min((area.clientHeight-(rowCount-1)*6)/rowCount-48,(area.clientWidth-8)/maxUnits));
  for(const card of cards)card.style.setProperty('--deck-height',height+'px');
  const products=area.querySelector('.catalog-products');products.dataset.overflow=String(products.scrollWidth>area.clientWidth+1);
 }
 function deckCard(deck){
  const card=document.createElement('article');card.className='catalog-card';card.dataset.deck=deck.id;card.style.setProperty('--deck-units',units(deck));
  const photo=document.createElement('div');photo.className='catalog-photo';const art=document.createElement('div');art.className='catalog-deck-art';
  [deck.back,...deck.fronts].forEach((src,index)=>{const img=new Image();img.src=src;img.alt=(deck.detailName||deck.name)+(index?' 앞면 '+index:' 뒷면');img.className=index?'front':'back';img.loading='lazy';img.decoding='async';art.append(img)});
  photo.append(art);const caption=document.createElement('div');caption.className='catalog-caption';const brand=document.createElement('span');brand.textContent=[cardBrandLabel(deck.brand),deck.style].filter(Boolean).join(' · ');const name=document.createElement('h3');name.textContent=deck.detailName||deck.name;caption.append(brand,name);card.append(photo,caption);return card;
 }
 function renderCatalog(){
  const entries=groups(),group=entries.find(g=>g.name===catalogGroup);pane.replaceChildren();pane.dataset.mode=catalogMode;
  if(!group){
   catalogGroup=null;const directory=document.createElement('div');directory.className='catalog-directory';const split=Math.ceil(entries.length/2);
   for(const half of [entries.slice(0,split),entries.slice(split)]){const column=document.createElement('div');column.className='catalog-column';for(const entry of half){const button=document.createElement('button');button.className='catalog-entry';button.dataset.group=entry.name;button.textContent=label(entry.name);column.append(button)}directory.append(column)}pane.append(directory);
  }else{
   const head=document.createElement('div');head.className='catalog-group-head';const back=document.createElement('button');back.id='catalog-back';back.setAttribute('aria-label','뒤로가기');back.innerHTML='<svg viewBox="0 0 32 24" fill="none" aria-hidden="true"><path d="M30 12H3M13 2 3 12l10 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
   const title=document.createElement('h2');title.textContent=label(group.name);title.tabIndex=-1;const count=document.createElement('span');count.className='catalog-group-count';count.textContent=group.cards.length;head.append(back,title,count);
   const area=document.createElement('div');area.className='catalog-products-area';area.dataset.flow=catalogMode==='style'&&group.name==='Classic Style Back'?'vertical':'rows';const products=document.createElement('div');products.className='catalog-products';
   const split=group.cards.length>1?Math.ceil(group.cards.length/2):1;
   for(let index=0;index<group.cards.length;index+=split){const row=document.createElement('div');row.className='catalog-row';for(const deck of group.cards.slice(index,index+split))row.append(deckCard(deck));products.append(row)}area.append(products);pane.append(head,area);fitCatalog();
  }
  pane.scrollTop=0;syncNavigation();
 }
 function setPresentation(next){
  if(next===presentation)return;presentation=next;document.body.dataset.presentation=next;viewport.inert=next==='list';viewport.setAttribute('aria-hidden',String(next==='list'));
  document.querySelectorAll('[data-presentation-button]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.presentationButton===next)));
  syncNavigation();if(next==='list')fitCatalog();
 }
 document.querySelectorAll('[data-presentation-button]').forEach(button=>button.onclick=()=>setPresentation(button.dataset.presentationButton));
 document.querySelectorAll('#classification [data-sort]').forEach(button=>{const original=button.onclick;button.onclick=()=>{if(presentation==='free')original();else{catalogMode=button.dataset.sort;catalogGroup=null;renderCatalog()}}});
 pane.onclick=event=>{const entry=event.target.closest('[data-group]');if(entry){catalogGroup=entry.dataset.group;renderCatalog();pane.querySelector('.catalog-group-head h2')?.focus({preventScroll:true});return;}if(event.target.closest('#catalog-back')){const previous=catalogGroup;catalogGroup=null;renderCatalog();[...pane.querySelectorAll('[data-group]')].find(button=>button.dataset.group===previous)?.focus({preventScroll:true});}};
 new ResizeObserver(fitCatalog).observe(pane);
 document.fonts.ready.then(fitCatalog);
 document.querySelector('#count').textContent=CARDS.length;
 window.CardCatalog={get activeSort(){return presentation==='list'?catalogMode:sort},get state(){return{presentation,mode:catalogMode,group:catalogGroup}},refresh(){document.querySelector('#count').textContent=CARDS.length;renderCatalog()}};
 window.addEventListener('pageshow',event=>{if(event.persisted&&presentation==='list'){catalogMode='style';catalogGroup=null;renderCatalog();}});
 renderCatalog();
})();
