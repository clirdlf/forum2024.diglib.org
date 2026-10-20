import {XMLParser} from 'fast-xml-parser';
export function readInventory(xml) {
 const parsed=new XMLParser({ignoreAttributes:false,parseTagValue:false,trimValues:false}).parse(xml);
 const items=[parsed.rss.channel.item ?? []].flat();
 const documents=items.filter(i=>['page','post'].includes(i['wp:post_type']) && i['wp:status']==='publish').map(i=>({id:String(i['wp:post_id']),title:i.title,url:i.link,path:new URL(i.link).pathname,type:i['wp:post_type'],content:i['content:encoded']||''}));
 const attachments=items.filter(i=>i['wp:post_type']==='attachment').map(i=>({url:i['wp:attachment_url'],path:new URL(i['wp:attachment_url']).pathname}));
 return {documents,attachments};
}
