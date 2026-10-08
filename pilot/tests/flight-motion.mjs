/* LUMEN V6 — real browser flight / avatar rehearsal. No network writes or user data.
   Compositor transforms are sampled; no fake images or static CSS-only assertions. */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {resolve,dirname,extname,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium,firefox,webkit} from "playwright";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const original=readFileSync(resolve(root,"pilot/index.html"),"utf8");
const injector=`window.__lumenV6={
 start:button=>startPilotFlight(button),
 land:opts=>landPilotAtNextAction(opts),
 reboard:()=>pilotAvatarReboard(null),
 phase:()=>activePilotFlight?.phase,
 stop:()=>{if(activePilotFlight)pilotDestroyFlight(activePilotFlight)}
};`;
assert(original.includes("</script></body>"));
const preview=original.replace("</script></body>",injector+"</script></body>");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".webp":"image/webp",".svg":"image/svg+xml",".png":"image/png"};
const server=createServer((req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url||"/","http://localhost").pathname);
  const file=resolve(root,pathname==="/pilot/"?"pilot/index.html":pathname.replace(/^\//,""));
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
  res.writeHead(200,{"content-type":mime[extname(file)]||"application/octet-stream","cache-control":"no-store"});
  res.end(file===resolve(root,"pilot/index.html")?preview:readFileSync(file));
 }catch(e){res.writeHead(404);res.end(String(e?.message||e))}
});
const stub='export const createClient=()=>({auth:{getSession:async()=>({data:{session:null}})},functions:{invoke:async()=>({data:null,error:null})}})';
const browserName=(process.argv.find(x=>x.startsWith("--browser="))||"--browser=chromium").split("=")[1];
const engine={chromium,firefox,webkit}[browserName];
if(!engine)throw Error("Unsupported browser engine "+browserName);
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port+"/pilot/";
let browser;
try{
 browser=await engine.launch({headless:true});
 for(const width of [390,1366]){
  const page=await browser.newPage({viewport:{width,height:850}});
  try{
   await page.route("https://esm.sh/**",route=>route.fulfill({status:200,contentType:"text/javascript",headers:{"access-control-allow-origin":"*"},body:stub}));
   await page.goto(base,{waitUntil:"domcontentloaded"});
   await page.waitForFunction(()=>typeof window.__lumenV6?.start==="function");
   const started=await page.evaluate(()=>{
    const a=document.createElement("button"),b=document.createElement("button");
    a.id="flightHarnessStart";a.style.cssText="position:fixed;left:16px;bottom:125px;width:95px;height:45px";
    b.id="flightHarnessFinish";b.style.cssText="position:fixed;right:16px;bottom:130px;width:100px;height:48px";
    document.body.append(a,b);return window.__lumenV6.start(a)
   });
   assert.equal(started,true,"Aircraft must actually take off");
   const selector="#pilotFlightLayer .pilot-plane[data-artwork=lumen-orb]";
   assert.equal(await page.locator(selector).count(),1,"One approved aircraft, not two");
   assert.equal(await page.locator("#pilotFlightLayer .pilot-aircraft").count(),0,"No obsolete SVG silhouette");
   const visual=await page.locator(selector).evaluate(el=>({background:getComputedStyle(el).backgroundImage,cssAnimation:getComputedStyle(el).animationName,width:el.offsetWidth,children:el.children.length}));
   assert.match(visual.background,/\/pilot\/lumen-orb\.svg/);
   assert.equal(visual.cssAnimation,"none","No competing legacy flight CSS animation");
   assert.equal(visual.width,76);
   assert.equal(visual.children,0,"Only the approved image moves");
   await page.waitForFunction(()=>window.__lumenV6.phase()==="cruise",null,{timeout:6000});
   const points=[];
   for(let i=0;i<6;i++){
    points.push(await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}}));
    await page.waitForTimeout(160);
   }
   const moves=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
   assert(moves.filter(x=>x>1).length>=4,"Cruise movement must be continuous across observed frames: "+JSON.stringify(moves));
   assert(Math.max(...moves)<110,"Unexpected jump in cruise: "+JSON.stringify(moves));
   const landed=await page.evaluate(()=>window.__lumenV6.land({scroll:false,minCruise:0,keepLanded:true,targetElement:document.getElementById("flightHarnessFinish")}));
   assert.equal(landed,true,"Landing must finish on action");
   assert.equal(await page.locator(selector).count(),1,"Plane must remain parked, not replaced");
   await page.waitForTimeout(880);
   const avatar=await page.evaluate(()=>{
    const el=document.querySelector("#pilotFlightLayer .pilot-worker-avatar");
    const figure=el?.querySelector(".pilot-worker-figure");
    if(!el||!figure)return null;
    const r=figure.getBoundingClientRect();
    return {width:r.width,height:r.height,phase:window.__lumenV6.phase(),walking:el.classList.contains("pilot-worker--patrol"),animation:getComputedStyle(figure).animationName}
   });
   assert(avatar,"Avatar must appear only after the landing");
   assert.equal(avatar.phase,"parked");
   assert.equal(avatar.walking,true);
   assert.equal(avatar.animation,"pilotLumenPace");
   assert(avatar.height<76&&avatar.width<76,"The human figure must remain smaller than aircraft: "+JSON.stringify(avatar));
   await page.evaluate(()=>window.__lumenV6.reboard());
   assert.equal(await page.locator("#pilotFlightLayer .pilot-worker-avatar").count(),0,"Boarding removes the worker");
   assert.equal(await page.locator(selector).count(),1,"Reboard reuses same aircraft");
   await page.waitForFunction(()=>window.__lumenV6.phase()==="cruise",null,{timeout:5500});
   await page.evaluate(()=>window.__lumenV6.stop());
   assert.equal(await page.locator("#pilotFlightLayer").evaluate(el=>el.children.length),0,"Flight cleaned up correctly");
   console.log("PASS",browserName,width,"3D sprite, cruise continuity, landing, scaled animated avatar, reboard");
  }finally{await page.close()}
 }
}finally{if(browser)await browser.close();await new Promise(done=>server.close(done))}
