const fs=require('fs');
const src=fs.readFileSync('tarama/tarama2.js','utf8').split('(async () => {')[0];
eval(src);
(async()=>{
  const t0=Date.now(), DEAD=t0+17*60*1000; fs.mkdirSync('rapor',{recursive:true});
  const pages=JSON.parse(fs.readFileSync('tarama/sayfalar.json')).pages;
  const crawled=new Set(pages.map(p=>p.url)); const ks=new Set(), imgs=new Set(), ext=new Set();
  for(const p of pages){for(const l of p.links||[]){try{const h=new URL(l).host; if(/^(www\.)?teknoversus\.com\.tr$/.test(h)){ if(!crawled.has(l)) ks.add(l);} else ext.add(l);}catch{}} for(const i of p.imgs||[]) imgs.add(i);}
  const all=[...ks]; const typ=u=>(u.replace(/^https:\/\/[^\/]+/,'').match(/^\/([^\/?#]+)/)||[])[1]||'';
  const samp=(a,n)=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[r[i],r[j]]=[r[j],r[i]];}return r.slice(0,n);};
  const must=all.filter(u=>!['urun','karsilastir','rehber'].includes(typ(u)));
  const inList=[...must,...samp(all.filter(u=>typ(u)==='urun'),130),...samp(all.filter(u=>typ(u)==='karsilastir'),130),...samp(all.filter(u=>typ(u)==='rehber'),130)];
  const extList=samp([...ext].filter(l=>!/amazon\.com\.tr|twitter\.com|facebook\.com|wa\.me|instagram\.com/.test(l)),60);
  console.log('ic',inList.length,'img',imgs.size,'dis',extList.length);
  const out={inRes:[],imgRes:[],extRes:[],notInTotal:all.length};
  const save=()=>fs.writeFileSync('rapor/linkler.json',JSON.stringify(out));
  const run=async(list,key,fn)=>{let i=0;await Promise.all(Array.from({length:25},async()=>{while(i<list.length&&Date.now()<DEAD){const x=list[i++];out[key].push(await fn(x));if(out[key].length%100===0){save();console.log(key,out[key].length,((Date.now()-t0)/1000)|0);}}}));save();};
  await run([...imgs],'imgRes',async l=>{const r=await req(l,{timeout:12000,tries:2});return {url:l,status:r.status,ctype:r.ctype,err:r.err};});
  await run(inList,'inRes',async l=>{const r=await req(l,{timeout:12000,tries:2});return {url:l,status:r.status,final:r.final,err:r.err};});
  await run(extList,'extRes',async l=>{const r=await req(l,{timeout:8000,tries:1});return {url:l,status:r.status,err:r.err};});
  out.misc={};for(const p of ['/ads.txt','/robots.txt','/sitemap.xml','/favicon.ico','/manifest.json','/haberler.xml']){const r=await req('https://teknoversus.com.tr'+p,{text:true});out.misc[p]={status:r.status,head:(r.body||'').slice(0,300)};}
  save();console.log('bitti',((Date.now()-t0)/1000)|0);
})();
