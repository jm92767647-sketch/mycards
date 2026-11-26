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
  'By Brand':{art:'previews/hwp-00.webp',back:'assets/hwp-04.webp',ko:'브랜드별',tail:' · 바이시클부터 ARK까지',note:()=>`${brands.length} MAKERS`},
  'By Style':{art:'previews/hwp-19.webp',back:'assets/butterfly-spring-borderless-back.webp',ko:'스타일별',tail:' · 오리지널부터 커스텀까지',note:()=>`${String(styles.length).padStart(2,'0')} BACKS`}
 };

 function decorate(){
  if(!entry)return;
  if(!entry.querySelector('.entry-heading')){
   const head=document.createElement('div');head.className='entry-heading';head.setAttribute('aria-hidden','true');
   head.innerHTML='<span>Elect</span><em>decks.</em>';
   const rule=document.createElement('div');rule.className='entry-rule';rule.setAttribute('aria-hidden','true');
   entry.append(head,rule);
  }
  entry.querySelectorAll('.collection-choice').forEach((button,i)=>{
   if(button.dataset.carded)return;
   const title=button.querySelector('.collection-choice-title');
   const meta=CARDS_META[title?.textContent.trim()];
   if(!meta)return;
   button.dataset.carded='true';
   const deck=(src,cls)=>{const img=document.createElement('img');img.className=cls;img.src=src;img.alt='';img.loading='lazy';img.decoding='async';return img};
   const no=document.createElement('span');no.className='entry-card-no';no.textContent=String(i+1).padStart(2,'0');
   const bodyWrap=document.createElement('span');bodyWrap.className='entry-card-body';
   const ko=document.createElement('span');ko.className='entry-card-ko';ko.innerHTML=`${meta.ko}<i class="ko-tail">${meta.tail}</i>`;
   const count=document.createElement('span');count.className='entry-card-count';count.textContent=meta.note();
   button.prepend(no);
   bodyWrap.append(title,ko);
   button.append(bodyWrap,count,deck(meta.back,'entry-card-art back'),deck(meta.art,'entry-card-art'));
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
   const count=document.createElement('span');count.className='cat-count';count.textContent=String(group.length).padStart(2,'0');
   const arrow=document.createElement('span');arrow.className='cat-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='→';
   button.append(count,arrow);
  });
 }
 if(pane){decorateDirectory();new MutationObserver(decorateDirectory).observe(pane,{childList:true,subtree:true});}

 /* INDEX mark opens the statistics */
 const openButton=document.createElement('button');
 openButton.id='index-open';openButton.type='button';
 openButton.setAttribute('aria-haspopup','dialog');
 openButton.setAttribute('aria-label','컬렉션 통계');
 openButton.innerHTML='<span class="ix-dots" aria-hidden="true">'+'<i></i>'.repeat(3)+'</span>';
 header.append(openButton);

 const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const bars=entries=>{
  const max=Math.max(...entries.map(([,n])=>n),1);
  return entries.map(([lab,n])=>`<div class="ix-bar"><span>${esc(lab)}</span><u style="--w:${Math.round(n/max*100)}%"></u><b>${String(n).padStart(2,'0')}</b></div>`).join('');
 };
 const fold=(title,count,entries)=>`<details><summary><span>${title} · ${String(count).padStart(2,'0')}</span><span class="ix-sum-right">COUNT<span class="ix-sign">+</span></span></summary><div class="ix-bars">${bars(entries)}</div></details>`;
 const tally=(keys,test)=>keys.map(k=>[k,decks.filter(d=>test(d,k)).length]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));

 const dialog=document.createElement('dialog');
 dialog.id='index-dialog';dialog.setAttribute('aria-labelledby','index-title');
 document.body.append(dialog);
 function build(){
  const brandEntries=tally(brands,(d,k)=>d.brand===k);
  const styleEntries=tally(styles,(d,k)=>d.style===k);
  dialog.innerHTML=`<button type="button" class="ix-close" aria-label="닫기">✕</button><div class="ix-wrap">
   <div class="ix-head">
    <div><div class="ix-eyebrow">CARD COLLECTION × NUMBERS</div><h2 id="index-title">Index <em>&amp; Numbers</em></h2></div>
    <div class="ix-stats">
     <div><b>${decks.length}</b><span>DECKS</span></div>
     <div><b>${brands.length}</b><span>BRANDS</span></div>
     <div><b>${String(styles.length).padStart(2,'0')}</b><span>BACKS</span></div>
     <div><b>${String(marked.length).padStart(2,'0')}</b><span>MARKED</span></div>
    </div>
   </div>
   <div class="ix-folds">
    ${fold('브랜드별',brandEntries.length,brandEntries)}
    ${fold('스타일별',styleEntries.length,styleEntries)}
   </div>
  </div>`;
  dialog.querySelector('.ix-close').onclick=()=>dialog.close();
 }
 openButton.onclick=()=>{build();dialog.showModal()};
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
 });

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
