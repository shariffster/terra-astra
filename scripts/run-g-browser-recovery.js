async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('http://localhost:5198/');
 await page.waitForFunction(()=>window.terraAstra&&window.terraAstra.getState().genesis.busy);
 const sound=page.locator('[data-sound-control]');
 await page.waitForTimeout(800);
 const core=await page.evaluate(()=>window.terraAstra.getState().genesis);await page.screenshot({path:'output/playwright/run-g-genesis-core.png'});
 await page.waitForFunction(()=>window.terraAstra.getState().genesis.phase==='complete',{},{timeout:18000});
 await sound.click();await page.waitForTimeout(100);const soundOn=await sound.getAttribute('data-sound-status');
 const settlement=await page.locator('.universe').getAttribute('data-awakening-seconds');await page.screenshot({path:'output/playwright/run-g-genesis-settlement.png'});
 await page.waitForFunction(()=>document.querySelector('.universe').dataset.awakening==='complete',{},{timeout:24000});
 const complete=await page.evaluate(()=>({...document.querySelector('.universe').dataset}));await page.screenshot({path:'output/playwright/run-g-awakening-complete.png'});
 await page.getByRole('button',{name:'Pause ambient motion',exact:true}).click();await page.waitForTimeout(200);const soundPaused=await sound.getAttribute('data-sound-status');
 const lost=await page.evaluate(()=>{const gl=document.querySelector('.universe canvas').getContext('webgl2');const extension=gl?.getExtension('WEBGL_lose_context');if(!extension)return false;extension.loseContext();return true;});
 if(!lost)throw Error('Context loss could not be exercised');await page.waitForTimeout(500);await page.screenshot({path:'output/playwright/run-g-context-loss.png'});
 const unavailable=await sound.count()?await sound.getAttribute('data-sound-status'):'control hidden after renderer loss';
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);await page.screenshot({path:'output/playwright/run-g-context-recovered.png'});
 return {core,settlement,complete,soundOn,soundPaused,unavailable,recovered:await page.locator('.universe').getAttribute('data-renderer'),soundAfterReload:await page.locator('[data-sound-control]').getAttribute('data-sound-status'),errors};
}
