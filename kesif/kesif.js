const fs=require('fs');
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
(async()=>{
  fs.mkdirSync('rapor',{recursive:true});
  const lines=fs.readFileSync('kesif/urls.txt','utf8').split('\n').map(s=>s.trim()).filter(Boolean);
  const sum=[];
  for(const l of lines){
    const [name,url]=l.split('|');
    try{
      const ac=new AbortController();const t=setTimeout(()=>ac.abort(),30000);
      const r=await fetch(url,{headers:{'user-agent':UA,'accept-language':'en','accept':'*/*'},redirect:'follow',signal:ac.signal});
      const b=await r.text();clearTimeout(t);
      fs.writeFileSync('rapor/'+name+'.txt',b.slice(0,4000000));
      sum.push(name+' '+r.status+' '+r.url+' '+b.length);
    }catch(e){sum.push(name+' ERR '+(e.cause&&e.cause.code||e.message));}
  }
  fs.writeFileSync('rapor/_ozet.txt',sum.join('\n'));console.log(sum.join('\n'));
})();
