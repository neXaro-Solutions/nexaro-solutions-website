/* Product regression: no accounts, paid research or real bookings. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import vm from 'node:vm';
import ts from 'typescript';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const frontend=readFileSync(resolve(root,'pilot/index.html'),'utf8');
const backend=readFileSync(resolve(root,'supabase/functions/pilot-intelligence/index.ts'),'utf8');
const compiled=ts.transpileModule(backend.replace(/^import .*;\r?\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const ctx={Deno:{serve(){},env:{get(){return ''}}},Response,Request,Headers,console};
vm.createContext(ctx);vm.runInContext(compiled,ctx);
const flight='Ich brauche einen günstigen Flug am 20.11.2026 von Berlin nach Paris, Rückflug am 22.11.2026, 2 Personen';
const contract=ctx.buildExecutionContract(ctx.intentOf(flight),flight);
assert.equal(contract.scope,'flight_booking');
assert.equal(contract.deliverables.at(-1).kind,'external_proof');
assert.match(contract.done_rule,/KEINE Buchung/);
assert.equal(ctx.buildExecutionContract(ctx.intentOf('Erstelle ein Logo'),'Erstelle ein Logo').scope,'visual_asset');
console.log('PASS flight result contract requires booking proof; design scope preserved');
const probe=`window.__orbit={render,finished:pilotFinishedResult,travel:pilotTravelBrief,scene(o={}){user={id:'test-user',email:'test@example.com'};org={organization_id:'test-org'};goals=o.goals||[];actions=o.actions||[];results=o.results||[];executions=[];pilotAutoSession=null;pilotBackgroundJob=o.job||null;pilotComposerDraft=o.draft||'';current='home';document.getElementById('auth').classList.add('hidden');APP.classList.remove('hidden');render()},rerender(){render()},flight(){startPilotFlight(document.getElementById('createGoal'))},park(){const f=activePilotFlight;f.animation?.cancel();f.phase='parked';f.plane.style.transform='translate3d(80px,180px,0)';pilotAvatarDisembark(f)},stop(){if(activePilotFlight)pilotDestroyFlight(activePilotFlight)}};`;
const html=frontend.replace('</script></body>',probe+'</script></body>');
const stub=`export const createClient=()=>({auth:{getSession:async()=>({data:{session:null}})},functions:{invoke:async()=>({data:null,error:null})}})`;
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
try{
for(const width of [320,390,768,1366]){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.route('https://esm.sh/**',r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:stub}));
 await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__orbit);
 await page.evaluate(()=>__orbit.scene());
 const gate=await page.evaluate(()=>{const r={status:'final',quality_status:'ready',approval_status:'not_required',content:'Fertiger Inhalt. '.repeat(10),title:'Logo erstellen',structured_content:{}};return {concept:__orbit.finished(r),image:__orbit.finished({...r,structured_content:{deliverables:[{verified:true,kind:'image',storage_path:'user/pilot-artifacts/test.svg'}]}}),draft:__orbit.finished({...r,status:'draft'}),brief:__orbit.finished({...r,title:'Logo-Konzept entwickeln'})}});assert.deepEqual(gate,{concept:false,image:true,draft:false,brief:false});
 await page.locator('#goalText').fill(flight);
 await page.waitForFunction(()=>document.querySelector('#pilotTravelIntake').textContent.includes('Berlin → Paris'));
 const brief=await page.evaluate(t=>__orbit.travel(t),flight);
 assert.equal(brief.from,'Berlin');assert.equal(brief.to,'Paris');assert.equal(brief.persons,'2');assert.equal(brief.outbound,'20.11.2026');
 assert.match(await page.locator('#pilotTravelIntake').innerText(),/noch nicht angebunden/);
 await page.evaluate(()=>__orbit.rerender());assert.equal(await page.locator('#goalText').inputValue(),flight,'Draft survives status refresh');
 const dims=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(dims.scroll<=dims.w+2,JSON.stringify(dims));
 await page.evaluate(()=>__orbit.scene({goals:[{id:'g',title:'Berlin nach Paris',description:'Flug von Berlin nach Paris, 20.11.2026, 22.11.2026, 2 Personen',status:'active',created_at:'2026-10-08'}],actions:[{id:'a',goal_id:'g',status:'completed',title:'Flugangebote recherchieren'}]}));
 assert.match(await page.locator('#view').innerText(),/Zielabschluss noch offen/);
 assert.doesNotMatch(await page.locator('#view').innerText(),/KI-Kosten|Kostenlimit|USD|E2E|Guthaben/);
 assert.equal(await page.locator('.pilot-journey li').last().getAttribute('aria-current'),null,'Prepared plan is not a completed goal');
 await page.evaluate(()=>__orbit.scene({goals:[{id:'g',title:'Geprüftes Ergebnis',status:'achieved',created_at:'2026-10-08'}]}));
 assert.match(await page.locator('#view').innerText(),/Ziel nachweislich erreicht/);
 assert.equal(await page.locator('.pilot-journey li').last().getAttribute('aria-current'),'step');
 await page.evaluate(()=>__orbit.scene({goals:[{id:'g',title:'Testauftrag',status:'active',created_at:'2026-10-08'}],job:{goal_id:'g',status:'running',stage:'drafting',steps_completed:1,max_steps:6,cost_spent_usd:0.1,max_cost_usd:0.25}}));
 assert.match(await page.locator('#view').innerText(),/Pilot arbeitet an deinem Auftrag/);
 assert.doesNotMatch(await page.locator('#view').innerText(),/USD|KI-Kosten/);
 await page.evaluate(()=>__orbit.flight());
 assert.equal(await page.locator('#pilotFlightLayer .pilot-aircraft').count(),1);
 assert.equal(await page.locator('#pilotFlightLayer .pilot-worker-avatar').count(),0);
 assert.equal(await page.locator('#pilotFlightLayer .pilot-plane').evaluate(el=>el.getBoundingClientRect().width>0),true);
 await page.evaluate(()=>__orbit.park());assert.equal(await page.locator('#pilotFlightLayer .pilot-worker-avatar').count(),1);
 await page.evaluate(()=>__orbit.stop());assert.equal(await page.locator('#pilotFlightLayer').innerHTML(),'');
 if(width===390){await page.evaluate(()=>__orbit.scene({draft:'Flug von Berlin nach Paris am 20.11.2026, Rückflug am 22.11.2026, 2 Personen'}));await page.screenshot({path:'/tmp/pilot-orbit-mobile.png',fullPage:true})}
 if(width===1366){await page.evaluate(()=>__orbit.scene());await page.screenshot({path:'/tmp/pilot-orbit-desktop.png',fullPage:true})}
 await page.close();console.log(`PASS ${width}px: travel intake, retained draft, honest completion, no costs, flight lifecycle`);
}
}finally{await browser.close();await new Promise(r=>server.close(r))}
