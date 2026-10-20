/* Frozen archive interactions; no WordPress or external services are required. */
const all=(selector,root=document)=>[...root.querySelectorAll(selector)];
function activateOnKey(el,fn){el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn(e);}});}
function initializeMenus(){
 all('.elementor-widget-nav-menu').forEach((widget,index)=>{
  const toggle=widget.querySelector('.elementor-menu-toggle');
  const mobile=widget.querySelector('nav.elementor-nav-menu--dropdown');
  if(toggle&&mobile){
   mobile.id ||= `archive-menu-${index}`;toggle.setAttribute('aria-controls',mobile.id);
   function setOpen(open){if(open){mobile.style.width=`${Math.max(200,window.innerWidth-40)}px`;mobile.style.left=`${20-widget.getBoundingClientRect().left}px`;}mobile.hidden=!open;mobile.setAttribute('aria-hidden',String(!open));mobile.classList.toggle('archive-mobile-open',open);toggle.classList.toggle('elementor-active',open);toggle.setAttribute('aria-expanded',String(open));all('a',mobile).forEach(a=>a.tabIndex=open?0:-1);}
   setOpen(false);const toggleOpen=()=>setOpen(toggle.getAttribute('aria-expanded')!=='true');
   toggle.addEventListener('click',toggleOpen);activateOnKey(toggle,toggleOpen);
   widget.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){setOpen(false);toggle.focus();}});
  }
  all('.menu-item-has-children',widget).forEach((item,i)=>{
   const link=item.querySelector(':scope > a');const submenu=item.querySelector(':scope > .sub-menu');if(!link||!submenu)return;
   submenu.id ||= `archive-submenu-${index}-${i}`;link.setAttribute('aria-controls',submenu.id);link.setAttribute('aria-expanded','false');link.setAttribute('aria-haspopup','true');
   const setOpen=open=>{item.classList.toggle('archive-open',open);link.setAttribute('aria-expanded',String(open));};
   item.addEventListener('mouseenter',()=>{if(window.innerWidth>767)setOpen(true);});item.addEventListener('mouseleave',()=>{if(!item.contains(document.activeElement))setOpen(false);});
   item.addEventListener('focusout',e=>{if(!item.contains(e.relatedTarget))setOpen(false);});
   link.addEventListener('click',e=>{if(e.target.closest('.sub-arrow')||(!item.classList.contains('archive-open')&&window.innerWidth<=767)){e.preventDefault();setOpen(!item.classList.contains('archive-open'));}});
   link.addEventListener('keydown',e=>{if(['ArrowDown',' '].includes(e.key)){e.preventDefault();setOpen(true);submenu.querySelector('a')?.focus();}});
   item.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setOpen(false);link.focus();}});
  });
 });
}
function initializeCarousels(){
 all('.elementor-image-carousel-wrapper,.elementor-main-swiper').forEach(carousel=>{
  const track=carousel.querySelector(':scope > .swiper-wrapper');if(!track)return;
  const slides=all(':scope > .swiper-slide',track);if(!slides.length)return;
  const widget=carousel.closest('[data-archive-slides]');const desired=Number(widget?.dataset.archiveSlides)||1;
  carousel.style.setProperty('--archive-visible',desired);carousel.classList.add('archive-carousel');
  let index=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,hover=false;
  const count=()=>matchMedia('(max-width:767px)').matches?1:Math.min(desired,slides.length);
  const render=()=>{const visible=count();slides.forEach((s,i)=>{const active=(i-index+slides.length)%slides.length<visible;s.hidden=!active;s.style.order=String((i-index+slides.length)%slides.length);s.setAttribute('aria-hidden',String(!active));});};
  const move=step=>{index=(index+step+slides.length)%slides.length;render();};
  const controls=document.createElement('div');controls.className='archive-carousel-controls';
  for(const [name,text,action] of [['Previous slide','←',()=>move(-1)],['Pause slideshow','Pause',()=>{paused=!paused;pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');}],['Next slide','→',()=>move(1)]]){
   const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',name);b.addEventListener('click',action);controls.append(b);
  }
  const pause=controls.children[1];if(paused){pause.textContent='Play';pause.setAttribute('aria-label','Play slideshow');}
  carousel.append(controls);carousel.addEventListener('mouseenter',()=>hover=true);carousel.addEventListener('mouseleave',()=>hover=false);
  carousel.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}});
  let touchX=0;carousel.addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});carousel.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>45)move(delta<0?1:-1);},{passive:true});
  const delay=Number(widget?.dataset.archiveDelay??5000);if(delay>0)setInterval(()=>{if(!paused&&!hover&&!carousel.contains(document.activeElement)&&!document.hidden)move(1);},Math.max(2000,delay));
  window.addEventListener('resize',render);render();
 });
}
function initializeDisclosures(){
 all('.elementor-toggle .elementor-tab-title,.elementor-accordion .elementor-tab-title').forEach(title=>{
  const content=document.getElementById(title.getAttribute('aria-controls'));if(!content)return;
  title.tabIndex=0;all('a',title).forEach(a=>a.tabIndex=-1);
  const setOpen=open=>{title.classList.toggle('elementor-active',open);content.classList.toggle('elementor-active',open);content.hidden=!open;content.style.display=open?'block':'none';title.setAttribute('aria-expanded',String(open));};
  const toggle=()=>setOpen(title.getAttribute('aria-expanded')!=='true');setOpen(title.classList.contains('elementor-active'));title.addEventListener('click',toggle);activateOnKey(title,toggle);
 });
 all('.elementor-tabs').forEach(tabs=>{
  const titles=all('.elementor-tab-title',tabs);const panels=all('.elementor-tab-content',tabs);
  const select=id=>{titles.forEach(t=>{const active=t.dataset.tab===id;t.classList.toggle('elementor-active',active);t.setAttribute('aria-selected',String(active));t.setAttribute('aria-expanded',String(active));t.tabIndex=active?0:-1;});panels.forEach(p=>{const active=p.dataset.tab===id;p.hidden=!active;p.style.display=active?'block':'none';p.classList.toggle('elementor-active',active);});};
  titles.forEach(t=>{t.addEventListener('click',()=>select(t.dataset.tab));t.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const visible=titles.filter(t=>t.getClientRects().length);let next=e.key==='Home'?0:e.key==='End'?visible.length-1:(visible.indexOf(t)+(e.key==='ArrowRight'?1:-1)+visible.length)%visible.length;select(visible[next].dataset.tab);visible[next].focus();}if(['Enter',' '].includes(e.key)){e.preventDefault();select(t.dataset.tab);}});});
  select(titles[0]?.dataset.tab);
 });
}
function initializeTableOfContents(){
 all('.elementor-toc').forEach(toc=>{
  const body=toc.querySelector('.elementor-toc__body');if(!body)return;
  body.replaceChildren();const list=document.createElement('ul');all('main h2,main h3,#content h2,#content h3').filter(h=>!toc.contains(h)).forEach((h,i)=>{h.id ||= `section-${i}`;const li=document.createElement('li'),a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent;li.append(a);list.append(li);});body.append(list);
 });
}
async function initializeSearch(){
 const form=document.getElementById('archive-search');if(!form)return;
 const input=form.elements.q,status=document.getElementById('search-status'),results=document.getElementById('search-results');
 let index;try{index=await fetch('/search-index.json').then(r=>r.json());}catch{status.textContent='Search could not load. Please reload this page.';return;}
 const search=()=>{const query=input.value.trim();const terms=query.toLocaleLowerCase().split(/\s+/).filter(Boolean);results.replaceChildren();if(!terms.length){status.textContent='Enter a word or phrase to search the archive.';return;}const found=index.filter(d=>terms.every(t=>(d.title+' '+d.text).toLocaleLowerCase().includes(t)));status.textContent=`${found.length} ${found.length===1?'result':'results'} for “${query}”`;found.forEach(d=>{const li=document.createElement('li'),a=document.createElement('a'),p=document.createElement('p');a.href=d.url;a.textContent=d.title;const pos=Math.max(0,d.text.toLocaleLowerCase().indexOf(terms[0])-70);p.textContent=(pos?'…':'')+d.text.slice(pos,pos+240)+'…';li.append(a,p);results.append(li);});};
 input.value=new URLSearchParams(location.search).get('q')||new URLSearchParams(location.search).get('s')||'';search();form.addEventListener('submit',e=>{e.preventDefault();history.replaceState(null,'','?q='+encodeURIComponent(input.value));search();});
}
initializeMenus();initializeCarousels();initializeDisclosures();initializeTableOfContents();initializeSearch();
