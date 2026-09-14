async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.unrouteAll({behavior:'ignoreErrors'});await page.emulateMedia({reducedMotion:'reduce'});
 const rows=[];const command=c=>page.evaluate(c=>window.terraAstra.command(c),c);
 const read=()=>page.evaluate(()=>({world:window.terraAstra.getState(),data:{...document.querySelector('.universe').dataset},overflow:document.documentElement.scrollWidth>innerWidth}));
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 for(const [width,height] of [[390,844],[375,667]]){
  await page.setViewportSize({width,height});await page.goto('http://localhost:5198/');await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);await page.waitForTimeout(1600);
  await page.getByRole('button',{name:'Explore the world',exact:true}).click();await page.getByLabel('Find a place on Earth').fill('Kyoto');await page.screenshot({path:'output/playwright/mobile-'+width+'-search.png'});await page.getByRole('button',{name:'Go to place',exact:true}).click();await page.waitForFunction(()=>window.terraAstra.getState().resolvedTarget?.label==='Kyoto'&&!window.terraAstra.getState().busy);await page.waitForTimeout(1600);await page.screenshot({path:'output/playwright/mobile-'+width+'-region.png'});
  const states=[await read()];await page.locator('.open-provenance summary').click();await page.screenshot({path:'output/playwright/mobile-'+width+'-provenance.png'});await page.locator('.open-provenance summary').click();
  await page.getByRole('button',{name:'city',exact:true}).click();await page.waitForFunction(()=>!window.terraAstra.getState().busy&&!window.terraAstra.getState().open.detailLoading,{},{timeout:15000});await page.waitForTimeout(800);await page.screenshot({path:'output/playwright/mobile-'+width+'-city.png'});states.push(await read());
  await page.getByRole('button',{name:'street',exact:true}).click();await page.waitForFunction(()=>!window.terraAstra.getState().busy);await page.waitForTimeout(700);await page.screenshot({path:'output/playwright/mobile-'+width+'-street.png'});states.push(await read());
  const beforeDrag=await read();const x=width*.55,y=height*.49;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let n=1;n<=12;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-80*n/12,y:y+55*n/12,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(1200);const afterDrag=await read();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:1},{x:x+30,y,id:2}]});for(let n=1;n<=10;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-30-n*3,y,id:1},{x:x+30+n*3,y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(900);const pinch=await read();
  for(const name of ['Zoom out','Zoom out','Zoom in','Zoom out','Zoom in','Zoom in']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(180);}const zoom=await read();
  await page.getByRole('button',{name:'Ask Astra',exact:true}).click();const field=page.getByRole('textbox',{name:'Your question',exact:true});await field.fill('Take me to Nairobi');await page.screenshot({path:'output/playwright/mobile-'+width+'-ask.png'});await page.getByRole('button',{name:'Send question',exact:true}).click();await page.waitForFunction(()=>window.terraAstra.getState().resolvedTarget?.label==='Nairobi'&&!window.terraAstra.getState().busy);await page.waitForTimeout(1300);await page.screenshot({path:'output/playwright/mobile-'+width+'-nairobi.png'});
  const sound=page.locator('[data-sound-control]');const locked=await sound.getAttribute('data-sound-status');await sound.click();await page.waitForTimeout(400);const soundOn=await sound.getAttribute('data-sound-status');await sound.click();const soundOff=await sound.getAttribute('data-sound-status');
  const final=await read();if(states.some(s=>s.overflow)||final.overflow)throw Error('Overflow at '+width);if(final.world.resolvedTarget.label!=='Nairobi')throw Error('Typed navigation failed');
  rows.push({width,height,states,touch:{before:beforeDrag,after:afterDrag,pinch},zoom,final,sound:{locked,on:soundOn,off:soundOff}});
 }
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();
 return {rows,errors,physicalDevice:false,timestamp:new Date().toISOString()};
}
