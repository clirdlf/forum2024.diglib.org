import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {readInventory} from './lib/inventory.mjs';
import {ORIGIN,canonical,prepareDocument,normalizeDocument,collectAssets,localizeCss} from './lib/localize.mjs';
const exec=promisify(execFile);
const root=process.cwd();
const cache=path.join(root,'.cache');
const assetRoot=path.join(root,'src/assets/site');
await mkdir(cache,{recursive:true});await mkdir(assetRoot,{recursive:true});await mkdir('src/_data',{recursive:true});
const exists=async p=>access(p).then(()=>true,()=>false);
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,20);
async function download(url){
 const file=path.join(cache,'downloads',hash(url));await mkdir(path.dirname(file),{recursive:true});
 if(!await exists(file))await exec('curl',['--fail','--location','--silent','--show-error','--retry','2','--max-time','60',url,'-o',file]);
 return file;
}
const inventory=readInventory(await readFile('data/dlfforum2024.WordPress.2026-10-20.xml','utf8'));
if(!await exists(path.join(cache,'uploads-ready'))){
 console.log('Extracting supplied uploads archive…');
 const {stdout}=await exec('tar',['-tzf','site50-uploads-20261020.tar.gz'],{maxBuffer:8*1024*1024});
 for(const p of stdout.split('\n').filter(Boolean))if(!p.startsWith('50/')||p.split('/').includes('..'))throw Error('Unexpected archive member: '+p);
 await mkdir(path.join(cache,'uploads'),{recursive:true});
 await exec('tar',['-xzf','site50-uploads-20261020.tar.gz','-C',path.join(cache,'uploads')],{maxBuffer:1024*1024});
 await writeFile(path.join(cache,'uploads-ready'),'Extracted from supplied archive\n');
}
const pages=[];const failures=[];const sources=new Map();
async function capture(doc){
 const html=await readFile(await download(doc.url),'utf8');
 if(!html.includes('<body'))throw Error('Response has no document body: '+doc.url);
 pages.push({...doc,html});console.log('Captured',doc.path);
 const $=prepareDocument(html);
 for(const asset of collectAssets($,doc.url))sources.set(asset,true);
 return $;
}
// Inventory is authoritative; auxiliary archive routes are discovered through real links.
const queue=[...inventory.documents];const known=new Set(queue.map(d=>d.path));
for(let i=0;i<queue.length;i+=5){
 await Promise.all(queue.slice(i,i+5).map(async doc=>{
  const $=await capture(doc);
  $('a[href]').each((_,e)=>{try{const u=new URL($(e).attr('href'),doc.url);if(u.origin===ORIGIN&&/^\/(?:category\/[^/]+\/(?:page\/\d+\/)?|news\/page\/\d+\/)$/.test(u.pathname)&&!known.has(u.pathname)){known.add(u.pathname);queue.push({url:u.href,path:u.pathname,type:'archive',title:u.pathname});}}catch{}});
 }));
}
const assetMap=new Map();const assetRecords=[];
function assetPath(url){const u=new URL(url);return u.origin===ORIGIN?decodeURI(u.pathname):'/assets/external/'+u.hostname+decodeURI(u.pathname)+(u.search?'-'+hash(u.search):'');}
const processed=new Set();
while([...sources.keys()].some(u=>!processed.has(u))){
 const batch=[...sources.keys()].filter(u=>!processed.has(u)).slice(0,8);
 await Promise.all(batch.map(async url=>{
  processed.add(url);const dest=assetPath(url);assetMap.set(url,dest);
  try{
   const upload=new URL(url).pathname.match(/^\/wp-content\/uploads\/sites\/50\/(.+)$/);
   const supplied=upload?path.join(cache,'uploads/50',decodeURIComponent(upload[1])):null;
   const fromArchive=supplied&&await exists(supplied);
   const source=fromArchive?supplied:await download(url);
   const output=path.join(assetRoot,dest);
   if(!output.startsWith(assetRoot+path.sep))throw Error('Invalid asset path');
   await mkdir(path.dirname(output),{recursive:true});await copyFile(source,output);
   assetRecords.push({url,path:dest,source:fromArchive?'supplied-uploads':'public-site'});
   if(/\.css(?:[?#]|$)/i.test(url)){
    const css=await readFile(source,'utf8');
    for(const m of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi))if(m[2]&&!/^(data:|#)/.test(m[2])){try{sources.set(canonical(m[2],url),true);}catch{}}
   }
  }catch(e){failures.push({url,error:e.message});console.log('Asset unavailable:',url);}
 }));
 console.log('Assets',processed.size,'/',sources.size);
}
for(const a of assetRecords.filter(a=>/\.css$/i.test(new URL(a.url).pathname))){const f=path.join(assetRoot,a.path);await writeFile(f,localizeCss(await readFile(f,'utf8'),a.url,assetMap));}
pages.sort((a,b)=>a.path.localeCompare(b.path));
const documents=pages.map(p=>({...normalizeDocument(p.html,p.url,assetMap),sourceTitle:p.title,type:p.type,id:p.id||null}));
await writeFile('src/_data/archive.json',JSON.stringify(documents,null,2)+'\n');
await writeFile('data/archive-manifest.json',JSON.stringify({origin:ORIGIN,capturedAt:new Date().toISOString(),inputs:['data/dlfforum2024.WordPress.2026-10-20.xml','site50-uploads-20261020.tar.gz'],documents:pages.map(({html,content,...d})=>d),assets:assetRecords,failures},null,2)+'\n');
console.log(`Imported ${documents.length} documents and ${assetRecords.length} assets; ${failures.length} unavailable assets.`);
if(failures.length)process.exitCode=1;
