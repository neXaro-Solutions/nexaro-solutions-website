/* Real private deliverables. Never fetch assets or execute generated code. */
export function artifactKind(action:any){
 const t=String(action?.title||'').toLowerCase();
 if(/recherch|vergleich|briefing|spezifikation|konzept|anforderung|prüfung|prüfen/.test(t))return 'text';
 return /logo|bild|grafik|illustration/.test(t)?'image':/präsentation|praesentation|powerpoint|slide|pitch.deck/.test(t)?'presentation':/homepage|website|webseite|landing.page/.test(t)?'website':'text';
}
export function artifactInstruction(action:any){
 const k=artifactKind(action);
 return k==='image'?'deliverable must contain ONLY a complete original professional vector logo as SVG markup, with viewBox, paths, shapes and optional text. No concept, markdown, scripts, images, external resources or event handlers.':k==='website'?'deliverable must contain ONLY a complete responsive standalone HTML homepage with inline CSS, polished layout and actual finished German copy. No markdown, scripts, forms, remote assets or invented contact details. Do not claim publication.':k==='presentation'?'deliverable must contain ONLY a JSON string of a finished presentation: {"title":"...","slides":[{"title":"...","body":"complete slide content"}]}. Create 5 to 10 focused slides with substantive finished German content, no instructions or concepts.':'Produce the actual finished text, never instructions to create it.';
}
export function validateArtifactText(kind:string,raw:string){
 const t=String(raw||'').trim().replace(/^```(?:html|svg|json)?\s*/i,'').replace(/\s*```$/,'');
 if(t.length<100||t.length>90000)throw Error('ARTIFACT_SIZE_INVALID');
 if(kind==='image'){
  if(!/^<svg\b/i.test(t)||!/<\/svg>\s*$/i.test(t)||!/[\s]viewBox=/i.test(t)||!/<(?:path|rect|circle|polygon|ellipse)\b/i.test(t)||/<(?:script|foreignObject|image|iframe|use|animate|set)\b|\bon\w+\s*=|(?:href|src)\s*=|<!|javascript:|url\s*\(/i.test(t))throw Error('SVG_ARTIFACT_INVALID');
  return t;
 }
 if(kind==='website'){
  if(!/<html\b/i.test(t)||!/<\/html>/i.test(t)||!/<body\b/i.test(t)||!/<style\b/i.test(t)||/<(?:script|iframe|object|embed|form|base|meta\b[^>]*http-equiv)\b|\bon\w+\s*=|javascript:|@import|url\s*\(\s*["']?https?:/i.test(t))throw Error('HTML_ARTIFACT_INVALID');
  return t.replace(/<head\b[^>]*>/i,m=>m+'<meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; style-src &apos;unsafe-inline&apos;; img-src data:; font-src data:; form-action &apos;none&apos;; base-uri &apos;none&apos;">');
 }
 if(kind==='presentation'){
  const d=JSON.parse(t);
  if(!Array.isArray(d.slides)||d.slides.length<5||d.slides.length>12||d.slides.some((s:any)=>typeof s.title!=='string'||s.title.length<3||s.title.length>100||typeof s.body!=='string'||s.body.length<35||s.body.length>900))throw Error('PRESENTATION_ARTIFACT_INVALID');
  return d;
 }
 return t;
}
export async function persistArtifact(sb:any,owner:string,execution:string,action:any,raw:string){
 const kind=artifactKind(action);if(kind==='text')return [];
 const data=validateArtifactText(kind,raw);let bytes:Uint8Array,ext:string,mime:string;
 if(kind==='presentation'){
  const {default:PptxGenJS}=await import('npm:pptxgenjs@4.0.1');
  const p=new PptxGenJS();p.layout='LAYOUT_WIDE';p.author='neXaro Pilot';p.subject='Fertiges Pilot-Ergebnis';p.title=String(data.title||action.title);p.lang='de-DE';
  data.slides.forEach((s:any,i:number)=>{const slide=p.addSlide();slide.background={color:'F4F7F3'};
   slide.addShape(p.ShapeType.rect,{x:0,y:0,w:0.16,h:7.5,fill:{color:'617B65'},line:{color:'617B65'}});
   slide.addText(s.title,{x:0.8,y:0.75,w:11.7,h:1.15,fontFace:'Aptos Display',fontSize:30,bold:true,color:'20352C',breakLine:false,fit:'shrink',margin:0});
   slide.addText(s.body,{x:0.85,y:2.15,w:11.55,h:4.1,fontFace:'Aptos',fontSize:21,color:'32443B',breakLine:false,fit:'shrink',margin:0.05,valign:'top'});
   slide.addText(String(i+1).padStart(2,'0'),{x:11.8,y:6.8,w:0.7,h:0.3,fontSize:10,color:'617B65',align:'right'});
  });
  bytes=new Uint8Array(await p.write({outputType:'arraybuffer'}) as ArrayBuffer);ext='pptx';mime='application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if(bytes[0]!==0x50||bytes[1]!==0x4b)throw Error('PRESENTATION_FILE_INVALID');
 }else{ext=kind==='image'?'svg':'html';mime=kind==='image'?'image/svg+xml':'text/html';bytes=new TextEncoder().encode(data)}
 const path=owner+'/pilot-artifacts/'+execution+'/ergebnis.'+ext;
 const u=await sb.storage.from('documents').upload(path,bytes,{contentType:mime,upsert:false});
 if(u.error)throw Error('ARTIFACT_STORAGE_FAILED');
 const r=await sb.storage.from('documents').download(path);
 if(r.error||!r.data||r.data.size!==bytes.byteLength)throw Error('ARTIFACT_READBACK_FAILED');
 const back=new Uint8Array(await r.data.arrayBuffer());
 if(back.some((b,i)=>b!==bytes[i]))throw Error('ARTIFACT_READBACK_MISMATCH');
 return [{kind,bucket:'documents',storage_path:path,filename:'Pilot-Ergebnis.'+ext,mime_type:mime,bytes:bytes.byteLength,verified:true,verification_scope:'file_format_and_private_storage_readback',...(kind==='presentation'?{slides:data.slides}:{}),...(kind==='website'?{published:false}:{})}];
}
