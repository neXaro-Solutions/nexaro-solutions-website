/* Browser-engine smoke test for the unauthenticated Pilot UI and shell layout.
   No production credentials, business records or API writes are used. */
import {chromium,firefox,webkit} from "playwright";
import {createServer} from "node:http";
import {readFileSync,writeFileSync,unlinkSync} from "node:fs";
import {dirname,join,resolve,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {tmpdir} from "node:os";
import {execFileSync} from "node:child_process";

const repo=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const html=readFileSync(join(repo,"pilot/index.html"),"utf8");
const moduleMatch=html.match(/<script type="module">([\s\S]*?)<\/script>/);
if(!moduleMatch)throw Error("Pilot module script missing");
const scratch=join(tmpdir(),`pilot-check-${process.pid}.mjs`);
try{
 writeFileSync(scratch,moduleMatch[1]);
 execFileSync(process.execPath,["--check",scratch],{stdio:"pipe"});
 console.log("PASS Pilot JavaScript module syntax");
}finally{try{unlinkSync(scratch)}catch{}}
const browserName=(process.argv.find(x=>x.startsWith("--browser="))||"--browser=chromium").split("=")[1];
const engine={chromium,firefox,webkit}[browserName];
if(!engine)throw Error("Unsupported browser: "+browserName);
const profiles=[
 {name:"Android 320",width:320,height:568,touch:true},
 {name:"iPhone 390",width:390,height:844,touch:true},
 {name:"Android 412",width:412,height:915,touch:true},
 {name:"Tablet portrait",width:768,height:1024,touch:true},
 {name:"Tablet landscape",width:1024,height:768,touch:true},
 {name:"Laptop",width:1366,height:768,touch:false},
 {name:"Desktop wide",width:1920,height:1080,touch:false}
];
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".webp":"image/webp",".svg":"image/svg+xml"};
const server=createServer((req,res)=>{
 try{
  const u=new URL(req.url||"/","http://localhost");
  const decoded=decodeURIComponent(u.pathname);
  const rel=decoded==="/"?"pilot/index.html":decoded==="/pilot/"?"pilot/index.html":decoded.replace(/^\//,"");
  const file=resolve(repo,rel);
  if(file!==repo&&!file.startsWith(repo+sep)){res.writeHead(403);res.end();return}
  const content=readFileSync(file);
  res.writeHead(200,{"content-type":mime[file.slice(file.lastIndexOf("."))]||"application/octet-stream","cache-control":"no-store"});
  res.end(content);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base=`http://127.0.0.1:${server.address().port}/pilot/`;
const stub=`export const createClient=()=>({auth:{getSession:async()=>({data:{session:null}})},functions:{invoke:async()=>({data:null,error:null})}})`;
const failures=[];
let browser;
try{
 browser=await engine.launch({headless:true});
 for(const device of profiles){
  const options={
   viewport:{width:device.width,height:device.height},
   deviceScaleFactor:device.touch?2:1,
   hasTouch:device.touch
  };
  if(browserName!=="firefox")options.isMobile=device.touch;
  const context=await browser.newContext(options);
  const page=await context.newPage();
  try{
   // Corporate root must keep a visible, working DE/EN switch even when its hamburger is closed.
   const corporate=await context.newPage();
   await corporate.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:"domcontentloaded"});
   const switcher=corporate.locator(".top .top-inner > .nx-language-toggle, body > .nx-language-toggle");
   await switcher.waitFor({state:"visible",timeout:8000});
   const rootBounds=await corporate.evaluate(()=>{
    const r=document.querySelector(".top .top-inner > .nx-language-toggle, body > .nx-language-toggle").getBoundingClientRect();
    return {left:r.left,right:r.right,bottom:r.bottom,viewportHeight:innerHeight,position:getComputedStyle(document.querySelector(".top .top-inner > .nx-language-toggle, body > .nx-language-toggle")).position,viewport:innerWidth,scroll:document.documentElement.scrollWidth,
     payment:!!document.querySelector('a[href="./sumup-beratung.html"]'),
     crm:!!document.querySelector('a[href="./crm/"]'),
     vape:!!document.querySelector('a[href="./b2b-handel.html"]'),
     promo:!!document.querySelector('a[href^="./pilot/"]'),
     overflow:[...document.querySelectorAll("body *")].map(el=>{const rect=el.getBoundingClientRect();return {tag:el.tagName.toLowerCase(),className:String(el.className||"").slice(0,50),right:Math.round(rect.right),width:Math.round(rect.width)}}).filter(el=>el.right>innerWidth+3 && el.width>0).slice(0,9)};
   });
   if(rootBounds.left<0||rootBounds.right>rootBounds.viewport+2||rootBounds.scroll>rootBounds.viewport+2||
    (rootBounds.position==="fixed"&&(rootBounds.left>35||rootBounds.bottom>rootBounds.viewportHeight+2))||
    !rootBounds.payment||!rootBounds.crm||!rootBounds.vape||rootBounds.promo)
    throw Error("Corporate root language or service links broken: "+JSON.stringify(rootBounds));
   await switcher.click();
   await corporate.waitForFunction(()=>document.documentElement.lang==="en",{timeout:4000});
   await switcher.click();
   await corporate.waitForFunction(()=>document.documentElement.lang==="de",{timeout:4000});
   await corporate.close();
   await page.route("https://esm.sh/**",route=>route.fulfill({
    status:200,contentType:"text/javascript",
    headers:{"access-control-allow-origin":"*"},body:stub
   }));
   await page.goto(base,{waitUntil:"domcontentloaded"});
   await page.waitForFunction(()=>typeof document.getElementById("openLogin")?.onclick==="function",{timeout:10000});
   const first=await page.evaluate(()=>{
    const box=document.querySelector(".auth .box").getBoundingClientRect();
    return {
     viewport:innerWidth,
     docWidth:document.documentElement.scrollWidth,
     boxLeft:box.left,boxRight:box.right,
     landingVisible:!document.getElementById("auth").classList.contains("hidden")
    };
   });
   if(!first.landingVisible||first.docWidth>first.viewport+2||first.boxLeft< -2||first.boxRight>first.viewport+2){
    throw Error("Landing overflow or hidden: "+JSON.stringify(first));
   }
   const languagePicker=page.locator("#pilotLanguageSwitcher");
   await languagePicker.waitFor({state:"visible",timeout:5000});
   const picker=await languagePicker.evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,position:getComputedStyle(el).position,screenWidth:innerWidth,screenHeight:innerHeight};
   });
   if(picker.position!=="fixed"||picker.left<0||picker.right>picker.screenWidth+2||(picker.screenWidth-picker.right)>40||picker.top<0||picker.top>90||picker.bottom>picker.screenHeight+2)
    throw Error("Pilot language choice must stay accessible top-right: "+JSON.stringify(picker));
   await languagePicker.locator('[data-pilot-locale="en"]').click();
   await page.waitForFunction(()=>document.documentElement.lang==="en"&&document.getElementById("guestComposeTitle")?.textContent.includes("What can"),null,{timeout:4000});
   await languagePicker.locator('[data-pilot-locale="de"]').click();
   await page.waitForFunction(()=>document.documentElement.lang==="de"&&document.getElementById("guestComposeTitle")?.textContent.includes("Was soll"),null,{timeout:4000});
   if(await page.locator(".pilot-value-item").count()!==3)throw Error("Pilot advantages must be visible on the first screen");
   if(!await page.locator(".pilot-value-lead").isVisible())throw Error("Clear customer value proposition missing");
   if(await page.locator("#guestTask").count()!==1)throw Error("Landing must retain exactly one task composer");
   if(await page.locator("#app").isVisible())throw Error("Signed-out page must not expose the authenticated shell");
   await page.locator("#openLogin").click();
   if(await page.locator("#authModal").evaluate(el=>el.classList.contains("hidden")))
    throw Error("Login modal does not open");
   const dialog=await page.evaluate(()=>{
    const card=document.querySelector(".auth-modal-card").getBoundingClientRect();
    return {left:card.left,right:card.right,width:innerWidth,top:card.top,height:card.height,screenHeight:innerHeight};
   });
   if(dialog.left< -2||dialog.right>dialog.width+2)throw Error("Modal outside screen: "+JSON.stringify(dialog));
   if(device.width<=760){
    const f=await page.locator("#modalEmail").evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    if(f<16)throw Error("iOS font zoom prevention missing: "+f+"px");
   }
   await page.locator("#modalEmail").fill("pilot@example.com");
   await page.locator("#modalPassword").fill("short");
   await page.locator("#modalPassword").press("Enter");
   await page.waitForFunction(()=>document.querySelector("#modalMessage")?.textContent?.includes("mindestens"),{timeout:3000});
   await page.locator("#closeAuth").click();
   // Wait for the user-visible closed state on narrow Firefox touch emulation.
   try{
    await page.waitForFunction(()=>document.getElementById("authModal")?.classList.contains("hidden"),null,{timeout:3000});
   }catch{throw Error("Login modal fails to close after close-button click");}
   await page.evaluate(()=>{
    document.getElementById("auth").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
   });
   const shell=await page.evaluate(()=>{
    const main=document.querySelector(".main").getBoundingClientRect();
    const nav=document.querySelector(".side nav.pilot-minimal-nav").getBoundingClientRect();
    return {
     w:innerWidth,docWidth:document.documentElement.scrollWidth,
     mainLeft:main.left,mainRight:main.right,
     navLeft:nav.left,navRight:nav.right,navCenter:(nav.left+nav.right)/2,
     visible:!!main.width&&!!nav.width
    };
   });
   if(!shell.visible||shell.docWidth>shell.w+2||shell.mainLeft< -2||shell.mainRight>shell.w+2){
    throw Error("Workspace overflow: "+JSON.stringify(shell));
   }
   if(device.width<=760&&Math.abs(shell.navCenter-shell.w/2)>12)
    throw Error("Mobile dock not centered: "+JSON.stringify(shell));
   await page.locator(".pilot-nav-more>summary").click();
   const popup=await page.evaluate(()=>{
    const nav=document.querySelector(".side nav.pilot-minimal-nav").getBoundingClientRect();
    const rect=document.querySelector(".side .pilot-nav-more-content").getBoundingClientRect();
    const details=document.querySelector(".pilot-nav-more");
    return {open:details.open,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,
      width:innerWidth,height:innerHeight,menuCenter:(rect.left+rect.right)/2,dockCenter:(nav.left+nav.right)/2,
      labels:document.querySelectorAll(".pilot-more-menu-label").length};
   });
   if(!popup.open||popup.labels!==2||popup.left< -2||popup.right>popup.width+2||
      Math.abs(popup.menuCenter-popup.dockCenter)>14||popup.top<0||
      popup.bottom>popup.height+2)
    throw Error("More menu not centered, readable, or within viewport: "+JSON.stringify(popup));
   await page.evaluate(()=>{
    document.querySelector('.pilot-more-menu-label.admin-only')?.classList.remove("hidden");
    document.querySelector('.pilot-nav-more-content [data-view="admin"]')?.classList.remove("hidden");
   });
   const adminRow=await page.evaluate(()=>{
    const b=document.querySelector('.pilot-nav-more-content [data-view="admin"]');
    const t=b?.querySelector("span:last-child");
    return {width:b?.getBoundingClientRect().width,height:b?.getBoundingClientRect().height,labelWidth:t?.getBoundingClientRect().width,label:t?.textContent};
   });
   if(adminRow.label!=="Administration"||adminRow.width<150||adminRow.labelWidth<105||adminRow.height>66)
    throw Error("Administration must not collapse into vertical letters: "+JSON.stringify(adminRow));
   await page.locator(".pilot-nav-more>summary").click();

   // Mock only the visual admin elements: ensure long statuses never collapse into 4-letter columns.
   await page.evaluate(()=>{
    const app=document.getElementById("app");
    app.dataset.screen="alpha";
    document.getElementById("view").innerHTML='<div class="pilot-screen pilot-admin-screen">'+
     '<div class="grid pilot-admin-test-grid"><div class="card pilot-readiness-card">'+
     '<h2>Bereitschaft der privaten Testphase</h2><div class="pilot-readiness-total">19 <span>/ 26</span></div>'+
     '<div class="stat pilot-readiness-row"><span class="muted">GPT und Claude werden bei komplexen Aufgaben parallel geprüft und bei Bedarf zusammengeführt.</span>'+
     '<strong class="pilot-readiness-status pilot-readiness-status--open">Prüfung offen</strong></div>'+
     '<details class="pilot-readiness-passed"><summary>19 bestandene Checks anzeigen</summary></details></div></div></div>';
   });
   const qa=await page.evaluate(()=>{
    const text=document.querySelector(".pilot-readiness-row>.muted");
    const state=document.querySelector(".pilot-readiness-status");
    const status=state.getBoundingClientRect(),label=text.getBoundingClientRect();
    return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,
     statusWidth:status.width,statusRight:status.right,labelWidth:label.width,
     statusWrap:getComputedStyle(state).whiteSpace,
     summaryHeight:document.querySelector(".pilot-readiness-passed>summary").getBoundingClientRect().height};
   });
   if(qa.scroll>qa.viewport+2||qa.statusWidth<78||qa.statusRight>qa.viewport+2||qa.labelWidth<80||qa.summaryHeight<40)
    throw Error("Mobile system readiness clipped or overflowed: "+JSON.stringify(qa));
   await page.evaluate(()=>{
    const app=document.getElementById("app");app.dataset.screen="admin";
    document.getElementById("view").innerHTML='<div class="pilot-screen pilot-admin-screen pilot-admin-compact"><div class="admin-command-strip">'+
    '<div class="admin-hero-heading"><h2>Admin-Cockpit</h2></div>'+
    '<div class="admin-hero-actions"><button class="btn">Plan</button><button class="btn">Partnerprogramme</button>'+
    '<button class="btn">Tests</button><button class="btn primary">Aktualisieren</button></div></div></div>';
   });
   const admin=await page.evaluate(()=>{
    const buttons=[...document.querySelectorAll(".admin-hero-actions .btn")];
    return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,
     widths:buttons.map(b=>Math.round(b.getBoundingClientRect().width)),
     clipped:buttons.some(b=>{const r=b.getBoundingClientRect();return r.left< -2||r.right>innerWidth+2})};
   });
   if(admin.scroll>admin.viewport+2||admin.clipped||admin.widths.some(w=>w<40))
    throw Error("Admin action grid clipped: "+JSON.stringify(admin));
   console.log(`PASS ${browserName} | ${device.name} (${device.width}×${device.height}) | login + keyboard + admin + layout`);
  }catch(error){
   failures.push(`${browserName} ${device.name}: ${error.message||error}`);
   console.error("FAIL "+failures.at(-1));
  }finally{await context.close()}
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}else console.log(`PASS ${browserName}: ${profiles.length} layouts`);
