async page => {
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});await page.goto('http://localhost:5198/');await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);
 await page.evaluate(()=>window.terraAstra.command({type:'flyToPlace',query:'Kyoto'}));
 await page.route('**/api/terra/places?**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"places":[]}'}));
 const unknown=await page.evaluate(()=>window.terraAstra.command({type:'flyToPlace',query:'Qzxv-unmapped-unknown'}));const world=await page.evaluate(()=>window.terraAstra.getState());
 if(unknown.ok||unknown.resolution.status!=='unknown'||world.resolvedTarget.label!=='Kyoto'||world.busy)throw Error('Unknown place changed the world');
 await page.unroute('**/api/terra/places?**');
 await page.evaluate(()=>window.terraAstra.command({type:'setScale',tier:'street'}));await page.waitForFunction(()=>!window.terraAstra.getState().open.detailLoading,{},{timeout:15000});
 const lost=await page.evaluate(()=>{const ext=document.querySelector('.universe canvas').getContext('webgl2')?.getExtension('WEBGL_lose_context');ext?.loseContext();return !!ext;});if(!lost)throw Error('Cannot exercise context loss');await page.waitForTimeout(600);await page.screenshot({path:'output/playwright/failure-open-context-loss.png'});
 const message=await page.locator('body').innerText();if(!message.includes('Restart'))throw Error('Missing restart recovery');
 await page.reload();await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);
 return {unknown,worldBeforeGraphicsLoss:world,graphicsLossFrom:'generic Kyoto Street',restartOffered:true,recoveredRenderer:await page.locator('.universe').getAttribute('data-renderer'),status:'PASS'};
}
