async page => {
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1440,height:900});
 await page.goto('http://localhost:5196/');
 await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);
 const canvas=page.locator('.universe canvas');
 const pose=async()=>{const t=await page.locator('.coordinates').innerText(),v=t.match(/[\d.]+/g).map(Number);return [v[0]*(t.includes('S')?-1:1),v[1]*(t.includes('W')?-1:1)];};
 const settle=()=>page.waitForTimeout(350);
 const results=[];
 for(const keys of [['w'],['a'],['s'],['d'],['w','a'],['w','d'],['s','a'],['s','d']]){
  await page.evaluate(()=>window.terraAstra.command({type:'resetView'}));await settle();await canvas.focus();
  const start=await pose(),at=Date.now();for(const key of keys)await page.keyboard.down(key);
  await page.waitForTimeout(800);for(const key of keys)await page.keyboard.up(key);
  const elapsed=Date.now()-at;await settle();const end=await pose(),delta=end.map((v,i)=>v-start[i]);
  results.push({keys:keys.join('+'),elapsed,start,end,delta,length:Math.hypot(...delta)});
 }
 const stopTests=[];
 for(const event of ['keyup','canvas-blur','window-blur','visibilitychange']){
  await page.evaluate(()=>window.terraAstra.command({type:'resetView'}));await settle();await canvas.focus();await page.keyboard.down('w');await page.waitForTimeout(200);
  if(event==='keyup')await page.keyboard.up('w');
  if(event==='canvas-blur')await page.getByRole('button',{name:'Zoom in',exact:true}).focus();
  if(event==='window-blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  if(event==='visibilitychange')await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await settle();const a=await pose();await page.waitForTimeout(400);const b=await pose();await page.keyboard.up('w');
  if(JSON.stringify(a)!==JSON.stringify(b))throw Error(event+' continues moving');stopTests.push(event);
 }
 await page.evaluate(()=>window.terraAstra.command({type:'flyTo',targetId:'singapore'}));await settle();await canvas.focus();
 const scale=[];for(const key of ['2','3','4','1','0']){await page.keyboard.press(key);await settle();scale.push([key,await page.evaluate(()=>window.terraAstra.getState().tier)]);}
 await canvas.focus();const old=await pose();await page.keyboard.press('ArrowRight');await settle();if(JSON.stringify(old)===JSON.stringify(await pose()))throw Error('ArrowRight failed');
 await page.screenshot({path:'output/playwright/keyboard-held-qa.png'});
 return {results,stopTests,scale,arrows:true,renderer:await page.locator('.universe').getAttribute('data-renderer')};
}
