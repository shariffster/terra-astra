async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1280,height:800});await page.goto('http://localhost:5198/');
 await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);await page.waitForTimeout(1600);
 const command=c=>page.evaluate(c=>window.terraAstra.command(c),c);
 const read=()=>page.evaluate(()=>({at:performance.now(),world:window.terraAstra.getState(),data:{...document.querySelector('.universe').dataset}}));
 const motion=async()=>{const b=page.getByRole('button',{name:'Resume ambient motion',exact:true});if(await b.count())await b.click();};
 const ready=async query=>{await command({type:'flyToPlace',query});await command({type:'setScale',tier:'street'});await page.waitForFunction(()=>!window.terraAstra.getState().open.detailLoading,{},{timeout:15000});await page.waitForTimeout(1200);if(await page.evaluate(()=>window.terraAstra.getState().tier)!=='street')throw Error(query+' has no street');await motion();await page.waitForTimeout(1200);};
 const canvas=page.locator('.universe canvas');const rows=[];
 for(const query of ['Kyoto','Nairobi']){
  await ready(query);await canvas.focus();const before=await read();
  await page.evaluate(()=>{window.__runGFrames=[];window.__runGTimer=setInterval(()=>{const d={...document.querySelector('.universe').dataset};window.__runGFrames.push({at:performance.now(),lat:Number(d.openLatitude),lon:Number(d.openLongitude),fps:Number(d.renderFps),calls:Number(d.renderCalls),points:Number(d.renderPoints),geometries:Number(d.renderGeometries),cache:JSON.parse(d.openEarth)});},100);});
  const at=Date.now();await page.keyboard.down('w');await page.keyboard.down('d');
  await page.waitForTimeout(10000);await page.screenshot({path:'output/playwright/traversal-'+query.toLowerCase()+'-10s.png'});
  await page.waitForTimeout(10000);await page.screenshot({path:'output/playwright/traversal-'+query.toLowerCase()+'-20s.png'});
  await page.waitForTimeout(10000);await page.keyboard.up('w');await page.keyboard.up('d');const heldMs=Date.now()-at;await page.waitForTimeout(1500);
  const samples=await page.evaluate(()=>{clearInterval(window.__runGTimer);return window.__runGFrames;});const after=await read();const diag=JSON.parse(after.data.openEarth);
  if(diag.recenters<2)throw Error(query+' fewer than two recenters: '+JSON.stringify(diag));if(samples.some(s=>s.cache.cacheSize>24||s.cache.cacheBytes>6291456||s.cache.gpuBatches>7))throw Error('Unbounded cache');if(diag.disposedWindows<2)throw Error('No disposal');
  if(after.world.resolvedTarget.label!==query||after.world.open.target.id!==after.world.targetId)throw Error('Stale target label');
  await page.screenshot({path:'output/playwright/traversal-'+query.toLowerCase()+'-end.png'});rows.push({query,heldMs,before,after,samples});await page.evaluate(rows=>{window.__runGMovementReceipt=rows;},rows);
 }
 // Equal real elapsed holds, geodesic position evaluated after release settles.
 const speed=[];
 for(const keys of [['w'],['w','d']]){
  await ready('Nairobi');await canvas.focus();const start=await read(),at=Date.now();for(const key of keys)await page.keyboard.down(key);await page.waitForTimeout(5000);for(const key of keys)await page.keyboard.up(key);const heldMs=Date.now()-at;await page.waitForTimeout(1300);speed.push({keys,heldMs,start,end:await read()});
 }
 const stops=[];
 for(const event of ['keyup','canvas-blur','window-blur','visibilitychange']){
  await canvas.focus();await page.keyboard.down('w');await page.waitForTimeout(250);
  if(event==='keyup')await page.keyboard.up('w');if(event==='canvas-blur')await page.getByRole('button',{name:'Zoom in',exact:true}).focus();if(event==='window-blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));if(event==='visibilitychange')await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(2500);const a=await read();await page.waitForTimeout(1200);const b=await read();await page.keyboard.up('w');const deltaKm=111.195*Math.hypot(Number(a.data.openLatitude)-Number(b.data.openLatitude),(Number(a.data.openLongitude)-Number(b.data.openLongitude))*Math.cos(Number(a.data.openLatitude)*Math.PI/180));if(deltaKm>.001)throw Error('Movement continued after '+event+': '+deltaKm+' km');stops.push({event,settledDeltaKm:deltaKm});
 }
 await command({type:'flyToPlace',query:'Kyoto'});await page.waitForTimeout(2500);await canvas.focus();const regionStart=await read();await page.keyboard.down('w');await page.keyboard.down('d');await page.waitForTimeout(16000);await page.keyboard.up('w');await page.keyboard.up('d');await page.waitForTimeout(1500);const regionEnd=await read();if(JSON.parse(regionEnd.data.openEarth).regionRecenters<2)throw Error('Region did not continue');await page.screenshot({path:'output/playwright/traversal-region-end.png'});
 return {rows,speed,stops,region:{start:regionStart,end:regionEnd},errors,timestamp:new Date().toISOString()};
}
