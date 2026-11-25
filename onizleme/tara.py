import re,sys,urllib.request
out=open('out/links.txt','a')
for page in open('onizleme/sayfalar.txt').read().split():
    out.write('=== '+page+'\n')
    try:
        req=urllib.request.Request(page,headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'})
        h=urllib.request.urlopen(req,timeout=40).read().decode('utf-8','ignore')
    except Exception as e:
        out.write('FAIL %s\n'%e); continue
    h=h.replace('\\u002F','/').replace('\\/','/')
    found=set(re.findall(r'(?:https?:)?//[^"\'\s()<>]+?\.(?:jpe?g|png|webp|avif)',h,re.I))
    found|=set(re.findall(r'[\w./-]*/product/\d+/zip/[^"\'\s()<>]+',h))
    found|=set(re.findall(r'[\w./-]*images?/[\w./-]+?\.(?:jpe?g|png|webp|avif)',h,re.I))
    for u in sorted(found):
        if not re.search(r'icon|logo|_nuxt|sprite|flag|qrcode|wechat',u,re.I): out.write(u+'\n')
    for m in re.findall(r'og:image"[^>]*',h)[:2]: out.write(m+'\n')
