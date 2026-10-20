import {load} from 'cheerio';
export const ORIGIN='https://forum2024.diglib.org';
export const NEWSLETTER='https://share.hsforms.com/1MhcafbpARxGCIS1OQD6rKgc21y3';
export function canonical(value,base=ORIGIN) {const u=new URL(value,base);u.hash='';u.search='';return u.href;}
export function localizeUrl(value,baseUrl,assetMap=new Map()) {
 if(!value || /^(#|data:|mailto:|tel:|javascript:)/i.test(value)) return value;
 let u;try{u=new URL(value,baseUrl);}catch{return value;}
 const asset=assetMap.get(canonical(u.href));
 if(asset)return asset+u.hash;
 return u.origin===ORIGIN ? u.pathname+u.search+u.hash : value;
}
export function localizeCss(css,baseUrl,assetMap) {
 return css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi,(_,q,url)=>`url("${localizeUrl(url,baseUrl,assetMap)}")`);
}
export function prepareDocument(html) {
 const $=load(html);
 // External services are opened deliberately, never embedded automatically.
 $('.elementor-widget-video').each((_,el)=>{
  let settings={};try{settings=JSON.parse($(el).attr('data-settings')||'{}');}catch{}
  const url=settings.youtube_url||settings.vimeo_url||settings.dailymotion_url||settings.hosted_url?.url;
  if(url){const box=$(el).find('.elementor-widget-container');box.empty().append($('<a class="archive-service elementor-button">').attr('href',url).text('Watch the recording ↗'));}
 });
 $('iframe').each((_,el)=>{const u=$(el).attr('src');if(u)$(el).replaceWith($('<a class="archive-service">').attr('href',u).text('Open external content ↗'));else $(el).remove();});
 $('script').each((_,el)=>{if(/hbspt\.forms\.create/.test($(el).html()||''))$(el).replaceWith($('<p>').append($('<a class="archive-service">').attr('href',NEWSLETTER).text('Sign up for the DLF Forum Newsletter ↗')));});
 $('[data-cfemail]').each((_,el)=>{const h=$(el).attr('data-cfemail');if(h&&h.length>2){const key=parseInt(h.slice(0,2),16);const email=h.slice(2).match(/../g).map(c=>String.fromCharCode(parseInt(c,16)^key)).join('');const enclosing=$(el).closest('a[href*="/cdn-cgi/l/email-protection"]');if(enclosing.length)enclosing.attr('href','mailto:'+email).text(email);else $(el).replaceWith($('<a>').attr('href','mailto:'+email).text(email));}});
 $('#pojo-a11y-toolbar, #pojo-a11y-skip-content, script, noscript, link[rel="pingback"], link[rel="alternate"], link[rel="https://api.w.org/"], link[rel="EditURI"], meta[name="generator"]').remove();
 $('link').each((_,el)=>{const href=$(el).attr('href')||'';if(/pojo-accessibility|wp-accessibility|ivory-search|wp-json|xmlrpc/.test(href))$(el).remove();});
 $('style').each((_,el)=>{if(/pojo-a11y/.test($(el).html()||''))$(el).remove();});
 $('a[href*="/cdn-cgi/l/email-protection#"]').each((_,el)=>{
  const h=($(el).attr('href')||'').split('#')[1];if(!h||!/^[0-9a-f]+$/i.test(h))return;
  const key=parseInt(h.slice(0,2),16);const email=h.slice(2).match(/../g)?.map(c=>String.fromCharCode(parseInt(c,16)^key)).join('');if(email)$(el).attr('href','mailto:'+email);
 });
 $('.e-con.e-parent').addClass('e-lazyloaded');
 const content=$('[data-elementor-type="wp-page"],[data-elementor-type="single-post"],main').first();
 if(!$('#content').length&&content.length)content.attr({id:'content',tabindex:'-1'});
 if(content.length)content.find('h2,h3,h4,h5').each((i,h)=>{const id='elementor-toc__heading-anchor-'+i;if(!$('#'+id).length)$(h).prepend($('<span>').attr({id,'aria-hidden':'true'}));});
 $('form').each((_,el)=>{
  const action=$(el).attr('action')||'';
  if($(el).find('input[name="s"]').length){$(el).attr({action:'/search/',method:'get'});$(el).find('input[name="s"]').attr('name','q');}
  else {const target=action.startsWith('http')&&!action.includes('forum2024.diglib.org')?action:NEWSLETTER;$(el).replaceWith($('<p>').append($('<a class="archive-service">').attr('href',target).text('Open form on the external service ↗')));}
 });
 $('.elementor-counter-number[data-to-value]').each((_,el)=>{const value=$(el).attr('data-to-value'),delimiter=$(el).attr('data-delimiter');$(el).text(delimiter?value.replace(/\B(?=(\d{3})+(?!\d))/g,delimiter):value);});
 $('[onload], [onclick], [onerror]').removeAttr('onload').removeAttr('onclick').removeAttr('onerror');
 // Captured markup retains layout settings, but these should never be remote fetches.
 $('[data-settings]').each((_,el)=>{
  let settings={};try{settings=JSON.parse($(el).attr('data-settings'));}catch{}
  if($(el).is('.elementor-widget-image-carousel,.elementor-widget-testimonial-carousel')){
   $(el).attr('data-archive-slides',settings.slides_to_show||settings.slides_per_view||1);
   $(el).attr('data-archive-delay',settings.autoplay==='no'?0:(settings.autoplay_speed||5000));
  }
  $(el).removeAttr('data-settings');
 });
 return $;
}
export function normalizeDocument(html,pageUrl,assetMap=new Map()) {
 const $=prepareDocument(html);
 $('*').each((_,el)=>{
  for(const attr of ['src','href','poster','data-src','data-background-image']){const v=$(el).attr(attr);if(v)$(el).attr(attr,localizeUrl(v,pageUrl,assetMap));}
  for(const attr of ['srcset','data-srcset']){const v=$(el).attr(attr);if(v)$(el).attr(attr,v.split(',').map(c=>{const [u,...d]=c.trim().split(/[ \t\n\r\f]+/);return [localizeUrl(u,pageUrl,assetMap),...d].join(' ');}).join(', '));}
  if($(el).attr('style'))$(el).attr('style',localizeCss($(el).attr('style'),pageUrl,assetMap));
 });
 $('style').each((_,el)=>$(el).html(localizeCss($(el).html(),pageUrl,assetMap)));
 return {title:$('title').text(),route:new URL(pageUrl).pathname,bodyClasses:$('body').attr('class')||'',head:$('head').html(),body:$('body').html()};
}
export function collectAssets($,baseUrl) {
 const refs=new Set();
 const add=v=>{try{if(v&&!/^(data:|#|mailto:|tel:)/.test(v)) refs.add(canonical(v,baseUrl));}catch{}};
 $('link[rel="stylesheet"], link[rel="icon"], link[rel="apple-touch-icon"]').each((_,e)=>add($(e).attr('href')));
 $('img,source,video,audio').each((_,e)=>{add($(e).attr('src'));add($(e).attr('poster'));for(const c of ($(e).attr('srcset')||'').split(','))add(c.trim().split(/[ \t\n\r\f]+/)[0]);});
 $('a[href]').each((_,e)=>{const u=$(e).attr('href');if(/\.(pdf|docx?|xlsx?|pptx?|zip|png|jpe?g|gif|svg|webp|mp[34])(?:[?#]|$)/i.test(u))add(u);});
 const css=[$('style').map((_,e)=>$(e).html()).get().join('\n'),$('[style]').map((_,e)=>$(e).attr('style')).get().join('\n')].join('\n');
 for(const m of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi))add(m[2]);
 return refs;
}
