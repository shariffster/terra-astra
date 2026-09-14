async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const field=page.getByRole('textbox',{name:'Your question',exact:true});
 const before=await page.locator('.coordinates').innerText();await field.fill('wasd qertg 1234');await page.waitForTimeout(300);
 if(before!==await page.locator('.coordinates').innerText())throw Error('Typing moved camera');await field.fill('');
 await page.getByRole('button',{name:'Close Ask Astra',exact:true}).click();
 await page.getByRole('button',{name:'Resume ambient motion',exact:true}).click();
 await page.waitForTimeout(3000);const planetPulses=await page.locator('.universe').getAttribute('data-cable-pulse-journeys');await page.screenshot({path:'output/playwright/qa-pulses-planet.png'});
 await page.evaluate(()=>window.terraAstra.command({type:'flyTo',targetId:'singapore'}));await page.evaluate(()=>window.terraAstra.command({type:'setScale',tier:'region'}));
 await page.waitForTimeout(3500);const regionPulses=await page.locator('.universe').getAttribute('data-cable-pulse-journeys');await page.screenshot({path:'output/playwright/qa-pulses-malacca.png'});
 await page.evaluate(()=>window.terraAstra.command({type:'flyTo',targetId:'challenger-deep'}));await page.waitForTimeout(2500);await page.screenshot({path:'output/playwright/qa-current-motion.png'});
 await page.getByRole('button',{name:'Pause ambient motion',exact:true}).click();
 return {planetPulses,regionPulses,editableIgnored:true,errors};
}
