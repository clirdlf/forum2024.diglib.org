import {readFile,stat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {load} from 'cheerio';
export async function auditSite(root,manifest){
 root=path.resolve(root);
 const errors=new Set(),warnings=new Set(),pages=new Map();let references=0;
 async function files(dir){let result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);result.push(...(e.isDirectory()?await files(p):[p]));}return result;}
 const entries=await files(root);
 for(const file of entries.filter(f=>f.endsWith('.html'))){const html=await readFile(file,'utf8'),$=load(html);pages.set(file,{$,html});}
 const resolve=async url=>{const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(path.resolve(root)+path.sep)&&file!==path.resolve(root))return null;try{const s=await stat(file);return s.isDirectory()?path.join(file,'index.html'):file;}catch{return null;}};
 async function check(value,base,{asset=false,fragment=false}={}){
  if(!value||/^(mailto:|tel:|data:|javascript:)/i.test(value))return;
  references++;let url;try{url=new URL(value,base);}catch{errors.add(`Invalid URL ${value} in ${base}`);return;}
  if(url.origin!=='http://archive.local'){if(asset)errors.add(`Remote rendering dependency ${value} in ${base}`);return;}
  const file=await resolve(url);if(!file){errors.add(`Missing local ${asset?'asset':'link'} ${url.pathname} in ${new URL(base).pathname}`);return;}
  if(fragment&&url.hash&&pages.has(file)){
   let id;try{id=decodeURIComponent(url.hash.slice(1));}catch{return;}
   const $=pages.get(file).$;
   if(!Array.from($('[id],[name]')).some(e=>$(e).attr('id')===id||$(e).attr('name')===id))warnings.add(`Missing fragment ${url.pathname}${url.hash}`);
  }
 }
 for(const doc of manifest.documents){const p=await resolve(new URL(doc.path,'http://archive.local'));if(!p||!pages.has(p))errors.add('Missing document '+doc.path);}
 for(const [file,{$,html}] of pages){
  const relative='/'+path.relative(root,file).split(path.sep).join('/');const base='http://archive.local'+relative.replace(/index\.html$/,'');
  if(/pojo-a11y-toolbar|plugins\/pojo-accessibility|plugins\/wp-accessibility/.test(html))errors.add('Accessibility widget in '+relative);
  if($('iframe').length)errors.add('Automatically loaded external frame in '+relative);
  if($('script').toArray().some(e=>!$(e).attr('src')))errors.add('Unexpected inline script in '+relative);
  for(const e of $('a[href]').toArray())await check($(e).attr('href'),base,{fragment:true});
  for(const e of $('img,source,script,video,audio').toArray()){
   for(const a of ['src','poster'])await check($(e).attr(a),base,{asset:true});
   for(const candidate of ($(e).attr('srcset')||'').split(','))await check(candidate.trim().split(/[ \t\n\r\f]+/)[0],base,{asset:true});
  }
  for(const e of $('link[href]').toArray())if(['stylesheet','icon','apple-touch-icon','preload','prefetch'].includes($(e).attr('rel')))await check($(e).attr('href'),base,{asset:true});
  for(const e of $('form').toArray())if(($(e).attr('action')||'').includes('wp-'))errors.add('WordPress form in '+relative);
  for(const css of [...$('style').toArray().map(e=>$(e).html()),...$('[style]').toArray().map(e=>$(e).attr('style'))])for(const m of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi))await check(m[2],base,{asset:true});
 }
 for(const file of entries.filter(f=>f.endsWith('.css'))){const css=await readFile(file,'utf8'),base='http://archive.local/'+path.relative(root,file).split(path.sep).join('/');for(const m of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi))await check(m[2],base,{asset:true});}
 return {pages:pages.size,assets:manifest.assets.length,references,errors:[...errors],warnings:[...warnings]};
}
