async page => {
 await page.unrouteAll({behavior:'ignoreErrors'});await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});await page.goto('http://localhost:5198/');await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);await page.waitForTimeout(1600);
 const command=c=>page.evaluate(c=>window.terraAstra.command(c),c),rows=[];
 const measure=async name=>{
  const resume=page.getByRole('button',{name:'Resume ambient motion',exact:true});if(await resume.count())await resume.click();await page.waitForTimeout(1200);
  const result=await page.evaluate(()=>new Promise(resolve=>{const times=[];let start,last;const frame=now=>{if(!start)start=now;if(last)times.push(now-last);last=now;if(now-start<3500)requestAnimationFrame(frame);else{times.sort((a,b)=>a-b);resolve({frames:times.length,elapsedMs:now-start,fps:times.length*1000/(now-start),p50Ms:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)],data:{...document.querySelector('.universe').dataset}});}};requestAnimationFrame(frame);}));rows.push({name,...result});
 };
 await measure('planet-sound-off');
 await command({type:'flyToPlace',query:'Kyoto'});await page.waitForTimeout(1500);await measure('kyoto-region');
 await command({type:'setScale',tier:'city'});await page.waitForFunction(()=>!window.terraAstra.getState().open.detailLoading,{},{timeout:15000});await measure('kyoto-city');
 await command({type:'setScale',tier:'street'});await measure('kyoto-street');
 await page.locator('[data-sound-control]').click();await measure('kyoto-street-sound-on');await page.locator('[data-sound-control]').click();
 for(const [width,height] of [[390,844],[375,667]]){await page.setViewportSize({width,height});await command({type:'setScale',tier:'region'});await measure('mobile-'+width+'-region');await command({type:'setScale',tier:'city'});await measure('mobile-'+width+'-city');await command({type:'setScale',tier:'street'});await measure('mobile-'+width+'-street');}
 await page.setViewportSize({width:1440,height:900});const switches=[];for(const query of ['Nairobi','Tokyo','Kyoto','Cape Town','Reykjavík','Nairobi','Kyoto','Cape Town','Nairobi','Kyoto']){const at=Date.now();await command({type:'flyToPlace',query});await command({type:'setScale',tier:'city'});await page.waitForTimeout(80);switches.push({query,elapsedMs:Date.now()-at,data:await page.locator('.universe').evaluate(x=>({...x.dataset}))});}
 await page.waitForFunction(()=>!window.terraAstra.getState().open.detailLoading,{},{timeout:15000});await measure('after-ten-journeys');
 return {rows,switches,physicalDevice:false,timestamp:new Date().toISOString()};
}
