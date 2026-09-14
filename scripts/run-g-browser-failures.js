async page => {
 await page.unrouteAll({behavior:'ignoreErrors'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});
 const command=c=>page.evaluate(c=>window.terraAstra.command(c),c),read=()=>page.evaluate(()=>({world:window.terraAstra.getState(),data:{...document.querySelector('.universe').dataset}}));
 const reset=async()=>{await page.goto('http://localhost:5198/');await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);await page.waitForTimeout(1600);};
 const results=[];await reset();
 await page.route('**/api/terra/places?**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"QA resolver unavailable"}'}));
 await command({type:'flyToPlace',query:'Kyoto'});const before=await read();const unknown=await command({type:'flyToPlace',query:'Qzxv-not-a-real-place'});const after=await read();if(unknown.ok||before.world.targetId!==after.world.targetId||after.world.busy)throw Error('Resolver failure moved or trapped world');results.push({scenario:'resolver unavailable / unknown',result:unknown,after});
 const ambiguous=await command({type:'flyToPlace',query:'The Gulf'});if(ambiguous.ok||ambiguous.resolution?.status!=='ambiguous')throw Error('Ambiguity guessed');results.push({scenario:'ambiguous Gulf',result:ambiguous});
 await page.getByRole('button',{name:'Explore the world',exact:true}).click();await page.getByLabel('Find a place on Earth').fill('The Gulf');await page.getByRole('button',{name:'Go to place',exact:true}).click();await page.waitForTimeout(300);await page.screenshot({path:'output/playwright/failure-ambiguous-gulf.png'});await page.keyboard.press('Escape');
 await page.route('**/api/terra/roads?**',route=>route.fulfill({status:503,body:'QA detail unavailable'}));
 await command({type:'flyToPlace',query:'Nairobi'});await command({type:'setScale',tier:'street'});await page.waitForTimeout(1700);const failed=await read();if(failed.world.open.detailLoading||failed.world.tier!=='city')throw Error('Detail failure did not fall back to city');results.push({scenario:'detail unavailable / offline-ish',after:failed});await page.screenshot({path:'output/playwright/failure-detail-fallback.png'});
 await page.unroute('**/api/terra/roads?**');
 let requests=0;
 await page.route('**/api/terra/roads?**',async route=>{requests++;await page.waitForTimeout(13000);await route.fulfill({status:503,body:'QA slow source'}).catch(()=>{});});
 const at=Date.now();await command({type:'flyToPlace',query:'Cape Town'});await command({type:'setScale',tier:'street'});
 await page.waitForFunction(()=>!window.terraAstra.getState().open.detailLoading,{},{timeout:13500});const timeout=await read();if(timeout.world.busy||timeout.world.tier!=='city')throw Error('Slow source trapped world');results.push({scenario:'slow request / client window timeout',elapsedMs:Date.now()-at,requests,after:timeout});await page.screenshot({path:'output/playwright/failure-slow-timeout.png'});
 // Pending roads from the first target must not replace the final target.
 await command({type:'flyToPlace',query:'Tokyo'});await command({type:'setScale',tier:'city'});await page.waitForTimeout(100);await command({type:'flyToPlace',query:'Patagonia'});await page.waitForTimeout(500);const switchAt=await read();await page.waitForTimeout(10500);const switchEnd=await read();if(switchEnd.world.resolvedTarget.label!=='Patagonia'||switchEnd.world.open.target.id!==switchEnd.world.targetId)throw Error('Stale target response');results.push({scenario:'target changed mid-load',start:switchAt,end:switchEnd});
 await page.unroute('**/api/terra/roads?**');
 await page.route('**/data/open-earth/places.json',route=>route.abort('internetdisconnected'));await reset();await command({type:'flyTo',targetId:'singapore'});const catalogFail=await command({type:'flyToPlace',query:'Kyoto'});const catalogueEnd=await read();if(catalogFail.ok||catalogueEnd.world.targetId!=='singapore')throw Error('Catalogue failure broke authored path');results.push({scenario:'catalogue and resolver offline; authored world survives',result:catalogFail,after:catalogueEnd});await page.screenshot({path:'output/playwright/failure-catalogue-authored-survives.png'});
 await page.unroute('**/data/open-earth/places.json');await page.unroute('**/api/terra/places?**');await reset();
 return {results,errors,reducedMotion:true,timestamp:new Date().toISOString()};
}
