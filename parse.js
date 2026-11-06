const clean = s=>s.replace(/\uFEFF/g,'').replace(/\r/g,'').trim();
function parseTime(s){const m=s.replace('.',',').match(/(?:(\d+):)?(\d\d):(\d\d),(\d{1,3})/);if(!m)return 0;return (+m[1]||0)*3600+(+m[2])*60+(+m[3])+(+m[4].padEnd(3,'0'))/1000}
const fmt=s=>{const t=Math.max(0,Math.floor(s));return `${String(Math.floor(t/3600)).padStart(2,'0')}:${String(Math.floor(t%3600/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`};
function keywords(text){let s=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const groups=[
  [/queda|cair|fall|falling|spad|wysokosc|altura|paraquedas|parachute/, 'skydiver freefall'],
  [/cerebro|brain|mozg|neur|depress|depres/, 'human brain neuroscience'],
  [/corpo|body|cialo|organ|anatom|esquelet/, 'human anatomy medical'],
  [/inset|ant\b|mr[oó]wk|formiga|pszcz|abelha/, 'insect macro nature'],
  [/espac|space|kosmos|planet|earth|ziemi|terra/, 'space earth planet'],
  [/oceano|ocean|mar\b|sea|woda|agua/, 'ocean underwater'],
  [/cora[cç][aã]o|heart|serce|blood|sangue/, 'human heart anatomy'],
  [/dorm|sleep|sen\b|sono/, 'sleeping person night'],
  [/estrel|star|gwiazd|universe|universo/, 'stars universe galaxy'],
];const found=groups.filter(([re])=>re.test(s)).map(([,q])=>q);if(found.length)return found[0];
 const stop=new Set('a o os as e de da do das dos um uma uns umas para por em no na nos nas que com se ao aos eu voce você ele ela isso isto seria como quando onde qual quais sua seu suas seus the and for with from what would this that you your are were have has been into about does not why can will just they them their then than much many do not na to i w z na nie jest sie się jak co czy ale gdy by aby oraz przez jego jej ich od pod nad dla przed przy temu tego tym już jeszcze tylko oraz bardzo'.split(' '));
 let terms=(s.match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>w.length>3&&!stop.has(w));return [...new Set(terms)].slice(0,4).join(' ')||'science documentary';}
export function parseScript(input,chunkSeconds=12){const text=clean(input);if(!text)return[];const srtBlocks=text.split(/\n\s*\n/);let cues=[];
 for(const block of srtBlocks){const lines=block.split('\n');const line=lines.findIndex(l=>l.includes('-->'));if(line<0)continue;const t=lines[line].split('-->');if(t.length<2)continue;const body=lines.slice(line+1).join(' ').replace(/<[^>]+>/g,'').trim();if(body)cues.push({start:parseTime(t[0]),end:parseTime(t[1]),text:body});}
 if(cues.length){let scenes=[],cur=null;for(const cue of cues){if(!cur||((cue.end-cur.start)>chunkSeconds&&cur.text.length>35)){if(cur)scenes.push(cur);cur={...cue}}else{cur.text+=' '+cue.text;cur.end=cue.end}}if(cur)scenes.push(cur);return scenes.slice(0,120).map((s,i)=>({...s,id:i+1,keyword:keywords(s.text),startLabel:fmt(s.start),endLabel:fmt(s.end)}));}
 // TXT / roteiro livre: divisões por linhas ou frases agrupadas
 const sentences=text.replace(/\n+/g,' ').match(/[^.!?]+[.!?]?/g)||[text];let scenes=[];let current='';for(const sentence of sentences){if((current+' '+sentence).length>190&&current){scenes.push(current.trim());current=''}current+=' '+sentence}if(current.trim())scenes.push(current.trim());return scenes.slice(0,120).map((s,i)=>({id:i+1,text:s,start:null,end:null,keyword:keywords(s),startLabel:'',endLabel:''}));}
export function extractKeywords(text){return keywords(text)};
