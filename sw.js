// 한국에서 살아남기 서비스워커: 오프라인 실행 + 빠른 로딩
const VER='ks-v2';
const CORE=['./','index.html','zh/','zh/index.html','en/','en/index.html','favicon.svg','manifest.webmanifest','zh/manifest.webmanifest','en/manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VER).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  // 랭킹 서버(구글 앱스 스크립트)는 항상 네트워크로
  if(/script\.google(usercontent)?\.com$/.test(url.hostname))return;
  const sameOrigin=url.origin===self.location.origin;
  const isFont=/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(!sameOrigin&&!isFont)return;
  // 페이지: 네트워크 우선(업데이트 즉시 반영), 오프라인이면 캐시
  if(req.mode==='navigate'||(sameOrigin&&/\.html?$|\/$/.test(url.pathname))){
    e.respondWith(fetch(req).then(res=>{const cp=res.clone();caches.open(VER).then(c=>c.put(req,cp));return res}).catch(()=>caches.match(req).then(r=>r||caches.match('./'))));
    return;
  }
  // 나머지(아이콘 · 폰트 등): 캐시 먼저, 뒤에서 갱신
  e.respondWith(caches.match(req).then(hit=>{
    const net=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(VER).then(c=>c.put(req,cp))}return res}).catch(()=>hit);
    return hit||net;
  }));
});
