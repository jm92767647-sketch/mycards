const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const styleRows=[['Original Legend Back','Street Style Back'],['Classic Style Back'],['Pattern Back','Fancy Back'],['Special Back Custom Deck','Special JQK Custom Deck'],['Special Number Custom Deck'],['All Special Deck']];
const brandRows=[['Oath','ARK'],['Bicycle','Wondercraft','Dan & Dave'],['Art of Play','Rider Waite','Grandmasters Casino','TCC'],['Tally-Ho','Bee','Theory11','Fontaine'],['Butterfly','Anyone Worldwide','Cartelago','Gambler’s','Black Roses','Visa']];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const stops=[0,.32,.48,1],viewport=$('#viewport'),scene=$('#scene');
let sort='style',rows=[],items=[],W=0,H=0,lockedId=9,frame=0,numberByCount=false,gesture=null,lastTap=0,resizeTimer,detentUntil=0,opening=true;
const camera={t:.32,x:0,y:0},target={...camera},pointers=new Map();
const units=c=>.714+c.fronts.length*.516;
function prepare(){return(sort==='style'?styleRows:brandRows).map(names=>({groups:names.map(name=>({name,cards:CARDS.filter(c=>c[sort]===name)}))}));}
function geometry(t){
 const narrow=W<=760,compact=narrow||H/rows.length<105,label=compact?0:48,head=compact?0:24;
 const fit=(gap,section)=>Math.min(...rows.map(row=>{const cards=row.groups.flatMap(g=>g.cards);return (W-32-(cards.length-1)*gap-(row.groups.length-1)*section)/cards.reduce((n,c)=>n+units(c),0)}));
 const sectionGap=clamp(W*.05,24,96),fullFit=fit(8,sectionGap);
 const overview=Math.max(3,Math.min(fullFit,(H-28)/rows.length-label-head-10));
 const three=Math.max(3,Math.min(fullFit,H/3-label-head-14));
 const two=Math.max(three,Math.min(fullFit,H/2-label-head-20));
 const maxUnit=Math.max(...CARDS.map(units)),close=Math.min(H*.66,(W-32)/maxUnit,470);
 const isolatedGap=Math.max(12,W/2-close*.714/2+16);
 const keys=narrow?[
 {t:0,h:overview,pitch:overview+16,gap:8,section:sectionGap},
 {t:.32,h:mix(overview,close,.35),pitch:mix(overview,close,.35)+36,gap:12,section:sectionGap},
 {t:.48,h:mix(overview,close,.58),pitch:mix(overview,close,.58)+60,gap:16,section:sectionGap},
 {t:.78,h:mix(overview,close,.9),pitch:mix(overview,close,.9)+100,gap:22,section:sectionGap},
 {t:1,h:close,pitch:H/2+close/2+60,gap:isolatedGap,section:sectionGap}
 ]:[{t:0,h:overview,pitch:overview+label+head+12,gap:8,section:sectionGap},{t:.32,h:three,pitch:H/3,gap:8,section:sectionGap},{t:.48,h:two,pitch:H/2,gap:8,section:sectionGap},{t:.86,h:close,pitch:Math.max(close+100,H*.68),gap:32,section:sectionGap},{t:1,h:close,pitch:H/2+close/2+60,gap:isolatedGap,section:sectionGap}];
 const hi=keys.findIndex(k=>k.t>=t);let g=keys[0];if(hi>0){const a=keys[hi-1],b=keys[hi],u=(t-a.t)/(b.t-a.t);g={h:mix(a.h,b.h,u),pitch:mix(a.pitch,b.pitch,u),gap:mix(a.gap,b.gap,u),section:mix(a.section,b.section,u)}}
 if(!narrow&&t>.48&&t<1){const extra=Math.sin(Math.PI*(t-.48)/.52)*Math.min(120,H*.16);g.pitch=Math.min(H/2+close/2+60,g.pitch+extra)}
 return{...g,narrow};
}
function positions(g){const out=new Map();rows.forEach((row,r)=>{const cards=row.groups.flatMap(group=>group.cards),total=cards.reduce((n,c)=>n+units(c)*g.h,0)+(cards.length-1)*g.gap+(row.groups.length-1)*g.section;let x=W/2-total/2;row.groups.forEach((group,gi)=>{group.cards.forEach(c=>{const w=units(c)*g.h;out.set(c.id,{x:x+w/2,y:H/2+(r-(rows.length-1)/2)*g.pitch,w});x+=w+g.gap});if(gi<row.groups.length-1)x+=g.section})});return out;}
function focus(c){const g=geometry(c.t),ps=positions(g),p=ps.get(lockedId);if(!p)return;const item=items.find(i=>i.c.id===lockedId);
 const offset=count=>{const start=clamp(item.row-Math.floor((count-1)/2),0,rows.length-count);return -(start+(count-1)/2-(rows.length-1)/2)*g.pitch};
 const keys=W<=760?[{t:0,x:0,y:0},{t:.18,x:W/2-p.x,y:H/2-24-p.y},{t:1,x:W/2-p.x,y:H/2-24-p.y}]:[{t:0,x:0,y:0},{t:.32,x:0,y:offset(3)},{t:.48,x:0,y:offset(2)},{t:.86,x:W/2-p.x,y:H/2-24-p.y},{t:1,x:W/2-p.x,y:H/2-24-p.y}];
 const hi=keys.findIndex(k=>k.t>=c.t);if(hi===0){c.x=c.y=0;return}const a=keys[hi-1],b=keys[hi],u=(c.t-a.t)/(b.t-a.t);c.x=mix(a.x,b.x,u);c.y=mix(a.y,b.y,u);
}
function bound(c){const g=geometry(c.t),ps=[...positions(g).values()],edge=24;const left=Math.min(...ps.map(p=>p.x-p.w/2)),right=Math.max(...ps.map(p=>p.x+p.w/2));c.x=right-left<W?0:clamp(c.x,W-right-edge,-left+edge);const ys=ps.map(p=>p.y);c.y=clamp(c.y,-Math.max(...ys)+H/2-24,-Math.min(...ys)+H/2);}
function wake(){if(!frame)frame=requestAnimationFrame(draw);}
function draw(){frame=0;let moving=false;for(const k of ['t','x','y']){if(Math.abs(camera[k]-target[k])>(k==='t'?.0001:.1))moving=true;camera[k]+=(target[k]-camera[k])*(matchMedia('(prefers-reduced-motion:reduce)').matches?1:.24)}if(!moving)Object.assign(camera,target);
 const g=geometry(camera.t),ps=positions(g),names=(!g.narrow&&H>=500)||(g.narrow?camera.t>=.44:camera.t>=.77),info=g.narrow?camera.t>=.68:camera.t>=.8;
 scene.dataset.zoom=camera.t.toFixed(4);scene.dataset.center=String(lockedId??'');scene.dataset.sort=sort;
 for(const i of items){const p=ps.get(i.c.id),x=p.x+camera.x,y=p.y+camera.y-g.h/2,visible=x+p.w/2>0&&x-p.w/2<W&&y+g.h>0&&y<H;i.el.hidden=!visible;if(!visible)continue;
 i.el.style.cssText=`left:${x-p.w/2}px;top:${y}px;width:${p.w}px;height:${g.h}px;--art-height:${g.h}px`;
 for(const img of i.el.querySelectorAll('img')){const quality=g.h>170?'detail':'preview';if(img.dataset.quality!==quality){img.src=quality==='detail'?img.dataset.detail:img.dataset.detail.replace('assets/','previews/');img.dataset.quality=quality}}
 i.caption.hidden=!names;i.caption.style.cssText=`top:${g.h+9}px;font-size:${camera.t>.95?14:clamp(8+camera.t*4,8,12)}px`;
 i.tag.hidden=!names||info||g.narrow;i.tag.textContent=i.heading;i.info.hidden=!info;i.info.textContent=i.c.brand+' · '+i.c.style;
 i.el.setAttribute('aria-current',String(i.c.id===lockedId));
 }
 if(moving)wake();
}
function build(){W=viewport.clientWidth;H=viewport.clientHeight;if(opening){if(W<=760){lockedId=1;target.t=1}opening=false}rows=prepare();items=[];scene.replaceChildren();rows.forEach((row,r)=>row.groups.forEach(group=>group.cards.forEach((c,k)=>{const el=document.createElement('article');el.className='explore-card';el.dataset.id=c.id;el.tabIndex=0;el.setAttribute('aria-label',c.name);const tag=document.createElement('span');tag.className='explore-tag';const art=document.createElement('div');art.className='card-art';[c.back,...c.fronts].forEach((src,n)=>{const img=new Image();img.src=src.replace('assets/','previews/');img.dataset.detail=src;img.alt=c.name+(n?' 앞면 '+n:' 뒷면');img.className=n?'front':'back';img.draggable=false;img.decoding='async';art.append(img)});const caption=document.createElement('div');caption.className='explore-caption';const name=document.createElement('span');name.className='explore-label';name.textContent=c.name;const info=document.createElement('span');info.className='card-info';caption.append(name,info);el.append(tag,art,caption);scene.append(el);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();lockedId=c.id;setZoom(1,false)}};items.push({c,el,tag,caption,info,row:r,heading:k===0?group.name:''})})));
 focus(target);bound(target);Object.assign(camera,target);$$('button[data-sort]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sort===sort)));wake();}
function setZoom(t,detent=true){if(lockedId===null){const ps=positions(geometry(target.t));lockedId=[...items].sort((a,b)=>{const p=ps.get(a.c.id),q=ps.get(b.c.id);return Math.hypot(p.x+target.x-W/2,p.y+target.y-H/2)-Math.hypot(q.x+target.x-W/2,q.y+target.y-H/2)})[0].c.id}let next=clamp(t,0,1);if(detent){const crossed=stops.slice(1,-1).filter(s=>(target.t<s&&next>s)||(target.t>s&&next<s));if(crossed.length)next=next>target.t?crossed[0]:crossed.at(-1)}target.t=next;focus(target);bound(target);wake();}
viewport.addEventListener('wheel',e=>{e.preventDefault();const mobile=W<=760;if(!mobile&&performance.now()<detentUntil)return;const before=target.t,step=clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?H:1),-160,160)*(mobile?.001:.0007);setZoom(target.t-step*(mobile&&target.t>.78?.7:1),!mobile);if(!mobile&&before!==target.t&&stops.slice(1,-1).includes(target.t))detentUntil=performance.now()+220},{passive:false});
viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture={x:e.clientX,y:e.clientY,ox:target.x,oy:target.y,t:target.t,moved:false,id:Number(e.target.closest('.explore-card')?.dataset.id)||null};if(pointers.size===2){const [a,b]=[...pointers.values()];gesture.distance=Math.hypot(a.x-b.x,a.y-b.y)}viewport.classList.add('dragging')});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const[a,b]=[...pointers.values()];if(gesture.distance)setZoom(gesture.t+Math.log(Math.hypot(a.x-b.x,a.y-b.y)/gesture.distance)*(W<=760?.75:.45),false);gesture.moved=true}else{const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>5)gesture.moved=true;if(gesture.moved){lockedId=null;target.x=gesture.ox+dx;target.y=gesture.oy+dy;bound(target);wake()}}});
function release(e){if(gesture&&!gesture.moved&&gesture.id){lockedId=gesture.id;focus(target);if(Date.now()-lastTap<330)setZoom(1,false);lastTap=Date.now();wake()}pointers.delete(e.pointerId);gesture=null;viewport.classList.remove('dragging')}
viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);gesture=null;viewport.classList.remove('dragging')});
$$('button[data-sort]').forEach(b=>b.onclick=()=>{sort=b.dataset.sort;build()});
document.addEventListener('keydown',e=>{if($('#numbers').open||e.ctrlKey||e.metaKey||e.altKey)return;if(['+','=','-','Escape','Home'].includes(e.key)){e.preventDefault();setZoom(e.key==='-'?target.t-.07:e.key==='Escape'||e.key==='Home'?0:target.t+.07)}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const current=items.find(i=>i.c.id===lockedId)||items[0],ps=positions(geometry(target.t)),p=ps.get(current.c.id),vertical=['ArrowUp','ArrowDown'].includes(e.key),dir=['ArrowLeft','ArrowUp'].includes(e.key)?-1:1;const cs=items.filter(i=>vertical?(i.row-current.row)*dir>0:i.row===current.row&&(ps.get(i.c.id).x-p.x)*dir>0);cs.sort((a,b)=>vertical?Math.abs(a.row-current.row)*W+Math.abs(ps.get(a.c.id).x-p.x)-Math.abs(b.row-current.row)*W-Math.abs(ps.get(b.c.id).x-p.x):Math.abs(ps.get(a.c.id).x-p.x)-Math.abs(ps.get(b.c.id).x-p.x));if(cs[0]){lockedId=cs[0].c.id;focus(target);bound(target);wake()}}});
function numberContent(){const content=$('#number-content');content.replaceChildren();$('#number-total').textContent=CARDS.length+' DECKS';$('#number-sort').textContent=numberByCount?'위치 순':'개수 순';$('#number-sort').setAttribute('aria-pressed',String(numberByCount));for(const [key,title,order]of [['brand','브랜드별',brandRows.flat()],['style','스타일별',styleRows.flat()]]){const entries=order.map(name=>[name,CARDS.filter(c=>c[key]===name).length]);if(numberByCount)entries.sort((a,b)=>b[1]-a[1]);const section=document.createElement('section');section.className='number-section';const h=document.createElement('h3');h.textContent=title;if(key==='style'){const note=document.createElement('span');note.className='style-note';note.textContent='(커스텀 덱 기준 = JQK 디자인이 기본과 다름)';h.append(note)}const ul=document.createElement('ul');for(const [name,n]of entries){const li=document.createElement('li'),span=document.createElement('span');span.textContent=name;li.append(span);if(n>1){const strong=document.createElement('strong');strong.textContent=n;li.append(strong)}ul.append(li)}section.append(h,ul);content.append(section)}}
$('#number').onclick=()=>{numberByCount=false;numberContent();$('#numbers').showModal()};$('#number-sort').onclick=()=>{numberByCount=!numberByCount;numberContent()};$('#close-numbers').onclick=()=>$('#numbers').close();$('#numbers').addEventListener('click',e=>{if(e.target===$('#numbers')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#numbers').close()}});
new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(build,80)}).observe(viewport);document.fonts.ready.then(build);build();
window.CardExplorer={zoom:t=>setZoom(t,false),select(id){if(!CARDS.some(c=>c.id===id))return;lockedId=id;focus(target);bound(target);wake()},get state(){return{...target,W,H,sort,lockedId,geometry:geometry(target.t),rows:rows.map(r=>r.groups.flatMap(g=>g.cards.map(c=>c.id)))}}};

