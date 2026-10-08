/* Push-only worker: no cache of sessions, private results or application HTML. */
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let p={};try{p=event.data?.json()||{}}catch{}
 const title=String(p.title||'Pilot').slice(0,100);
 const body=String(p.body||'Dein Auftrag benötigt Aufmerksamkeit.').slice(0,220);
 let target='/pilot/';
 try{const u=new URL(p.url,self.location.origin);if(u.origin===self.location.origin&&u.pathname.startsWith('/pilot/'))target=u.pathname+u.search}catch{}
 event.waitUntil(self.registration.showNotification(title,{body,tag:String(p.tag||'pilot').slice(0,100),icon:'/pilot/icon.svg',badge:'/pilot/icon.svg',data:{url:target}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const target=new URL(event.notification.data?.url||'/pilot/',self.location.origin).href;
  const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const tab of tabs)if(tab.url.startsWith(self.location.origin+'/pilot/')){await tab.navigate(target);return tab.focus()}
  return self.clients.openWindow(target);
 })());
});
