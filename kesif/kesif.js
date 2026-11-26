const fs=require('fs');
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
(async()=>{
  fs.mkdirSync('rapor',{recursive:true});
  const lines=fs.readFileSync('kesif/urls.txt','utf8').split('\n').map(s=>s.trim()).filter(Boolean);
  const sum=[],on=[];
  for(const l of lines){
    const [name,url]=l.split('|');
    try{
      const ac=new AbortController();const t=setTimeout(()=>ac.abort(),25000);
      const r=await fetch(url,{headers:{'user-agent':UA,'accept-language':'en','accept':'text/html,*/*'},redirect:'follow',signal:ac.signal});
      const b=await r.text();clearTimeout(t);
      fs.writeFileSync('rapor/'+name+'.txt',b.slice(0,3000000));
      const og=[];
      for(const m of b.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)(?::secure_url)?["'][^>]*>/gi)){
        const c=m[0].match(/content=["']([^"']+)["']/i);if(c)og.push(c[1]);
      }
      const uniq=[...new Set(og)].slice(0,2).map(u=>{try{return new URL(u.replace(/&amp;/g,'&'),r.url).href}catch(e){return null}}).filter(Boolean);
      uniq.forEach((u,i)=>on.push(name+'#'+i+'|'+u));
      sum.push(name+' '+r.status+' '+r.url+' '+b.length+' og='+uniq.length);
    }catch(e){sum.push(name+' ERR '+(e.cause&&e.cause.code||e.message));}
  }
  fs.writeFileSync('kesif/onizle_auto.txt',on.join('\n'));
  fs.appendFileSync('kesif/onizle.txt','\n'+on.join('\n'));
  fs.writeFileSync('rapor/_ozet.txt',sum.join('\n'));console.log(sum.join('\n'));
})();
