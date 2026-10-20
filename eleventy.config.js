import {load} from 'cheerio';
export default function(eleventyConfig){
 eleventyConfig.addPassthroughCopy({'src/assets/site':'/'});
 eleventyConfig.addPassthroughCopy({'src/assets/archive.js':'assets/archive.js','src/assets/archive.css':'assets/archive.css'});
 eleventyConfig.addFilter('searchIndex',docs=>JSON.stringify(docs.filter(d=>d.type!=='archive').map(d=>{const $=load(d.body);$('header,footer,nav,.elementor-location-header,.elementor-location-footer').remove();return {title:d.sourceTitle,url:d.route,text:$.text().replace(/\s+/g,' ').trim()};})).replaceAll('<','\\u003c'));
 return {dir:{input:'src',output:'_site',includes:'_includes',data:'_data'},templateFormats:['njk'],htmlTemplateEngine:'njk'};
}
