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
   console.log(`PASS ${browserName} | ${device.name} (${device.width}×${device.height}) | login + keyboard + layout`);
  }catch(error){
   failures.push(`${browserName} ${device.name}: ${error.message||error}`);
   console.error("FAIL "+failures.at(-1));
  }finally{await context.close()}
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}else console.log(`PASS ${browserName}: ${profiles.length} layouts`);
