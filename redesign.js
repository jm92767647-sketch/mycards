/* 2026 refresh: always-on bar, LIST/ROAM, fanned entry, one INDEX mark. */
(()=>{
 'use strict';
 const $=s=>document.querySelector(s),body=document.body;
 const header=document.querySelector('body > header');
 const pane=$('#catalog-pane');
 const decks=(typeof CARDS!=='undefined'&&CARDS)||window.CARDS||[];

 const keepOpen=()=>{if(body.dataset.menuOpen!=='true'){body.dataset.menuOpen='true';header.inert=false;header.setAttribute('aria-hidden','false');}};
 keepOpen();new MutationObserver(keepOpen).observe(body,{attributes:true,attributeFilter:['data-menu-open']});

 const label=(sel,text)=>{const b=$(sel);if(b)b.textContent=text};
 label('[data-presentation-button="list"]','LIST');
 label('[data-presentation-button="free"]','ROAM');

 const entry=$('#collection-entry');
 const syncHome=()=>{body.dataset.entryHome=String(!!entry&&!entry.hidden)};
 if(entry){syncHome();new MutationObserver(syncHome).observe(entry,{attributes:true,attributeFilter:['hidden']});}

 const styles=[...new Set(decks.map(d=>d.style))];
 const brands=[...new Set(decks.map(d=>d.brand))];
 const marked=decks.filter(d=>d.marked);
 const art=path=>path?path.replace(/^assets\//,'previews/'):'';
 const CARDS_META={
  'By Brand':{art:'previews/hwp-00.webp',ko:'브랜드별',note:()=>`${brands.length} MAKERS`},
  'By Style':{art:'previews/hwp-18.webp',ko:'스타일별',note:()=>`${String(styles.length).padStart(2,'0')} BACKS`},
  'Marking':{art:'previews/hwp-19.webp',ko:'마킹덱',note:()=>`${String(marked.length).padStart(2,'0')} DECKS`}
 };

 function decorate(){
  if(!entry)return;
  if(!entry.querySelector('.entry-heading')){
   const head=document.createElement('div');head.className='entry-heading';head.setAttribute('aria-hidden','true');
   head.innerHTML='<span>Elect</span><em>decks.</em>';
   const rule=document.createElement('div');rule.className='entry-rule';rule.setAttribute('aria-hidden','true');
   entry.append(head,rule);
  }
  if(!entry.querySelector('[data-choice-marking]')&&$('header [data-sort="marking"]')){
   const button=document.createElement('button');
   button.type='button';button.className='collection-choice';button.dataset.choiceMarking='true';
   button.innerHTML='<span class="collection-choice-title">Marking</span>';
   button.addEventListener('click',()=>$('header [data-sort="marking"]').click());
   entry.append(button);
  }
  entry.querySelectorAll('.collection-choice').forEach((button,i)=>{
   if(button.dataset.carded)return;
   const title=button.querySelector('.collection-choice-title');
   const meta=CARDS_META[title?.textContent.trim()];
   if(!meta)return;
   button.dataset.carded='true';
   const no=document.createElement('span');no.className='entry-card-no';no.textContent=String(i+1).padStart(2,'0');
   const image=document.createElement('img');image.className='entry-card-art';image.src=meta.art;image.alt='';image.loading='lazy';image.decoding='async';
   const bodyWrap=document.createElement('span');bodyWrap.className='entry-card-body';
   const foot=document.createElement('span');foot.className='entry-card-meta';
   foot.innerHTML=`<span>${meta.ko}</span><b>${meta.note()}</b>`;
   button.prepend(no);
   bodyWrap.append(title,foot);
   button.append(bodyWrap,image);
  });
 }
 if(entry){decorate();new MutationObserver(decorate).observe(entry,{childList:true});}

 /* directory rows */
 const REPRESENTATIVE={};
 function decorateDirectory(){
  const directory=pane&&pane.querySelector('.catalog-directory');
  if(!directory)return;
  directory.querySelectorAll('.catalog-entry').forEach(button=>{
   if(button.dataset.rowed)return;
   const name=button.dataset.group;
   if(!name)return;
   const group=name==='Marking'?marked:decks.filter(d=>d.brand===name||d.style===name);
   if(!group.length)return;
   button.dataset.rowed='true';
   if(!button.querySelector('.cat-name')){
    const span=document.createElement('span');span.className='cat-name';span.textContent=button.textContent.trim();
    button.textContent='';button.append(span);
   }
   const pick=REPRESENTATIVE[name]||group[0].back;
   const image=document.createElement('img');
   image.className='cat-thumb';image.src=art(pick);image.alt='';image.loading='lazy';image.decoding='async';
   const count=document.createElement('span');count.className='cat-count';count.textContent=String(group.length).padStart(2,'0');
   const arrow=document.createElement('span');arrow.className='cat-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='→';
   button.prepend(image);button.append(count,arrow);
  });
 }
 if(pane){decorateDirectory();new MutationObserver(decorateDirectory).observe(pane,{childList:true,subtree:true});}

 /* INDEX mark opens the statistics */
 const numbers=$('#numbers'),oldButton=$('#number');
 const openButton=document.createElement('button');
 openButton.id='index-open';openButton.type='button';
 openButton.setAttribute('aria-haspopup','dialog');
 openButton.setAttribute('aria-label','컬렉션 통계');
 openButton.innerHTML='<span class="ix-dots" aria-hidden="true">'+'<i></i>'.repeat(3)+'</span>';
 header.append(openButton);
 function foldSections(){
  if(!numbers)return;
  numbers.querySelectorAll('.number-section').forEach(section=>{
   if(section.closest('details'))return;
   const heading=section.querySelector('h3');
   const list=section.querySelector('ul');
   if(!heading||!list)return;
   const fold=document.createElement('details');
   const summary=document.createElement('summary');
   summary.innerHTML=`<span>${heading.textContent} · ${String(list.children.length).padStart(2,'0')}</span><span class="ix-sign">+</span>`;
   section.replaceWith(fold);fold.append(summary,section);
  });
 }
 openButton.onclick=()=>{oldButton?.click();setTimeout(foldSections,0)};

 /* list and roam hand over behind a paper veil */
 const main=document.querySelector('main');
 const stillMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function handover(swap){
  if(stillMotion()||!main){swap();return}
  const veil=document.createElement('div');veil.className='mode-veil';document.body.append(veil);
  requestAnimationFrame(()=>{veil.dataset.on='1';main.dataset.modeLeaving='1'});
  setTimeout(()=>{
   swap();
   main.removeAttribute('data-mode-leaving');
   main.dataset.modeEntering='1';
   requestAnimationFrame(()=>veil.removeAttribute('data-on'));
   setTimeout(()=>{main.removeAttribute('data-mode-entering');veil.remove()},660);
  },280);
 }
 document.querySelectorAll('[data-presentation-button]').forEach(button=>{
  const original=button.onclick;
  if(!original)return;
  button.onclick=null;
  button.addEventListener('click',event=>{
   if(button.getAttribute('aria-pressed')==='true')return;
   handover(()=>original.call(button,event));
  });
 });
})();
