/** Busca agregada serverless. Fontes: Wikimedia Commons e Internet Archive;
 * Pixabay e YouTube são opcionais com chave privada. Nenhuma chave é exposta ao navegador. */
const AGENT='MediaHunterAI/1.0 (educational personal media research; contact: media-hunter@example.org)';
const timeoutFetch=async(url)=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);try{const r=await fetch(url,{headers:{'User-Agent':AGENT,'Accept':'application/json'},signal:controller.signal});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.json()}finally{clearTimeout(timer)}};
const safe=(s)=>String(s??'').replace(/<[^>]+>/g,'').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').trim();
const HTTPS=(u)=>typeof u==='string'&&u.startsWith('https://')?u:'';
async function commons(q,kind){
  const u=new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({action:'query',generator:'search',gsrsearch:`filetype:${kind==='video'?'video':'bitmap'} ${q}`,gsrnamespace:'6',gsrlimit:'12',prop:'imageinfo',iiprop:'url|size|mime|extmetadata',iiurlwidth:'540',format:'json',origin:'*'}).forEach(([k,v])=>u.searchParams.set(k,v));
  const json=await timeoutFetch(u);
  return Object.values(json?.query?.pages||{}).flatMap(p=>{const a=p.imageinfo?.[0];if(!a)return[];const mime=a.mime||'';if(kind==='video'&&!mime.startsWith('video/'))return[];if(kind==='image'&&!mime.startsWith('image/'))return[];
    const license=safe(a.extmetadata?.LicenseShortName?.value||'Verificar na fonte');
    const author=safe(a.extmetadata?.Artist?.value||'');
    return [{id:`commons-${p.pageid}`,title:p.title.replace(/^File:/,''),source:'Wikimedia Commons',kind,thumb:HTTPS(a.thumburl||a.url),mediaUrl:HTTPS(a.url),pageUrl:HTTPS(a.descriptionurl)||`https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replaceAll(' ','_'))}`,license,author,downloadable:true}];
  });
}
async function archive(q,kind){
  const u=new URL('https://archive.org/advancedsearch.php');
  // Buscamos itens públicos; a licença individual deve ser conferida.
  u.searchParams.set('q',`(${q.split(/\s+/).slice(0,5).map(x=>`title:${x.replace(/[^\p{L}\p{N}-]/gu,'')}`).filter(x=>x!=='title:').join(' OR ')}) AND mediatype:${kind==='video'?'movies':'image'}`);
  u.searchParams.set('fl[]','identifier');u.searchParams.append('fl[]','title');u.searchParams.append('fl[]','mediatype');u.searchParams.set('rows','10');u.searchParams.set('output','json');
  const j=await timeoutFetch(u);
  return (j.response?.docs||[]).map(d=>({id:`archive-${d.identifier}`,title:safe(d.title||d.identifier),source:'Internet Archive',kind,thumb:`https://archive.org/services/img/${encodeURIComponent(d.identifier)}`,mediaUrl:'',pageUrl:`https://archive.org/details/${encodeURIComponent(d.identifier)}`,license:'Verificar no item',author:'',downloadable:false}));
}
async function pixabay(q,kind){
  const key=process.env.PIXABAY_API_KEY;if(!key)return[];
  const u=new URL(kind==='video'?'https://pixabay.com/api/videos/':'https://pixabay.com/api/');
  u.searchParams.set('key',key);u.searchParams.set('q',q.slice(0,100));u.searchParams.set('per_page','12');u.searchParams.set('safesearch','true');
  const j=await timeoutFetch(u);
  return (j.hits||[]).map(p=>({id:`pixabay-${kind}-${p.id}`,title:safe(p.tags||`Pixabay ${p.id}`),source:'Pixabay',kind,thumb:HTTPS(kind==='video'?(p.videos?.tiny?.thumbnail||p.videos?.small?.thumbnail):p.webformatURL),mediaUrl:HTTPS(kind==='video'?(p.videos?.medium?.url||p.videos?.small?.url):p.largeImageURL||p.webformatURL),pageUrl:HTTPS(p.pageURL),license:'Pixabay Content License',author:safe(p.user),downloadable:true}));
}
async function youtube(q){
  const key=process.env.YOUTUBE_API_KEY;if(!key)return[];
  const u=new URL('https://www.googleapis.com/youtube/v3/search');
  Object.entries({part:'snippet',q,type:'video',maxResults:'8',key,safeSearch:'moderate'}).forEach(([k,v])=>u.searchParams.set(k,v));
  const j=await timeoutFetch(u);
  return (j.items||[]).flatMap(p=>{const id=p.id?.videoId;if(!id)return[];return [{id:`youtube-${id}`,title:safe(p.snippet?.title),source:'YouTube',kind:'video',thumb:HTTPS(p.snippet?.thumbnails?.medium?.url),mediaUrl:'',pageUrl:`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,license:'Direitos definidos pelo autor',author:safe(p.snippet?.channelTitle),downloadable:false}]} );
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=3600');
  if(req.method!=='GET')return res.status(405).json({error:'Método não suportado'});
  const q=String(req.query?.q||'').trim().slice(0,100);
  const kind=['image','video','both'].includes(req.query?.kind)?req.query.kind:'both';
  if(q.length<2)return res.status(400).json({error:'Digite pelo menos 2 caracteres.'});
  const tasks=[];
  if(kind!=='video'){tasks.push(['Commons · imagens',()=>commons(q,'image')]);tasks.push(['Archive · imagens',()=>archive(q,'image')]);tasks.push(['Pixabay · imagens',()=>pixabay(q,'image')]);}
  if(kind!=='image'){tasks.push(['Commons · vídeos',()=>commons(q,'video')]);tasks.push(['Archive · vídeos',()=>archive(q,'video')]);tasks.push(['Pixabay · vídeos',()=>pixabay(q,'video')]);tasks.push(['YouTube',()=>youtube(q)]);}
  const out=await Promise.all(tasks.map(async([name,fn])=>{try{return {name,items:await fn()}}catch(e){return {name,items:[],error:String(e.message||e)}}}));
  const unique=[...new Map(out.flatMap(t=>t.items).map(i=>[i.id,i])).values()];
  res.status(200).json({items:unique,errors:out.filter(x=>x.error).map(x=>`${x.name}: ${x.error}`),sources:{pixabay:!!process.env.PIXABAY_API_KEY,youtube:!!process.env.YOUTUBE_API_KEY}});
}
