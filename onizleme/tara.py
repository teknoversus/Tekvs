import re,urllib.request
out=open('out/links.txt','a')
for page in open('onizleme/sayfalar.txt').read().split():
    out.write('=== '+page+'\n')
    try:
        h=urllib.request.urlopen(urllib.request.Request(page,headers={'User-Agent':'Mozilla/5.0'}),timeout=40).read().decode('utf-8','ignore')
    except Exception as e:
        out.write('FAIL %s\n'%e); continue
    t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S)
    t=re.sub(r'<[^>]+>',' ',t); t=re.sub(r'\s+',' ',t)
    out.write('editor-review:%d\n'%h.count('editor-review'))
    for kw in ['Rakamlarla','yan yana','Arka plan','Haberde geçen','Konuyla ilgili']:
        i=t.find(kw)
        if i>=0: out.write('['+kw+'] '+t[i:i+260]+'\n')
