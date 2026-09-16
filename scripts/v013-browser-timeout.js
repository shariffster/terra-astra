async page => {
 const check=(v,m)=>{if(!v)throw new Error(m);};await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});
 await page.unroute('**/data/human-*.bin');const held=[];await page.route('**/data/human-*.bin',route=>{held.push(route);});
 const start=Date.now();await page.reload();await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy,{},{timeout:15000});const ms=Date.now()-start;
 check((await page.evaluate(()=>window.terraAstra.getState())).humanFields==='unavailable'&&ms<14000,'Slow optional data has bounded wait');for(const route of held)await route.abort().catch(()=>{});await page.unroute('**/data/human-*.bin');
 await page.route('**/data/human-population.bin',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:'bad-data'}));await page.reload();await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy,{},{timeout:15000});check((await page.evaluate(()=>window.terraAstra.getState())).humanFields==='unavailable','Malformed optional binary preserves Earth');await page.unroute('**/data/human-population.bin');
 await page.reload();await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy,{},{timeout:15000});check((await page.evaluate(()=>window.terraAstra.getState())).humanFields==='ready','Clean reload recovers');
 return {result:'PASS',optionalTimeoutMs:ms,corruptBinary:'Earth survives',recovered:true};
}
