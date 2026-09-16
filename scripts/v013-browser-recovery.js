async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const check=(v,m)=>{if(!v)throw new Error(m);};
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});
 await page.route('**/data/human-*.bin',route=>route.abort());await page.reload();await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy,{},{timeout:45000});
 const priorGlow=await page.evaluate(()=>JSON.parse(localStorage.getItem('terra-astra:composition:v1')).light.glow);const before=await page.evaluate(()=>window.terraAstra.getState());check(before.humanFields==='unavailable','Optional dataset failure exposed honestly');
 await page.getByRole('button',{name:'Choose Earth layers',exact:true}).click();check(await page.locator('#composition-focus option[value=population]').isDisabled(),'Unavailable lens is disabled');
 await page.getByRole('button',{name:'Saved',exact:true}).click();await page.getByLabel('Import composition file',{exact:true}).setInputFiles('scripts/fixtures/composition-valid.json');
 await page.getByRole('status').filter({hasText:'Your view is unchanged'}).waitFor({timeout:4000});
 const after=await page.evaluate(()=>window.terraAstra.getState());check(JSON.stringify(before.layers)===JSON.stringify(after.layers)&&JSON.stringify(before.presentation)===JSON.stringify(after.presentation),'Rejected import keeps layer and lens state unchanged');
 await page.getByRole('button',{name:'Light',exact:true}).click();check(await page.getByRole('spinbutton',{name:'Star glow value',exact:true}).inputValue()===String(priorGlow),'Rejected import keeps light unchanged');
 await page.screenshot({path:'output/playwright/v013-field-failure.png'});await page.unroute('**/data/human-*.bin');await page.reload();await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy,{},{timeout:45000});
 check((await page.evaluate(()=>window.terraAstra.getState())).humanFields==='ready','Reload recovers optional fields');
 await page.getByRole('button',{name:'Adjust the constellations',exact:true}).click();await page.getByRole('button',{name:'Restore the original light',exact:false}).click();
 await page.waitForTimeout(1000);const shot=async()=>(await page.locator('.universe canvas').screenshot()).toString('base64');
 const a=await shot();await page.waitForTimeout(700);const b=await shot();check(a===b,'Reduced motion is visually still');
 await page.getByRole('spinbutton',{name:'Star glow value',exact:true}).fill('2');await page.waitForTimeout(300);const c=await shot();check(c!==b,'Live light control changes rendered pixels while paused');
 await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByLabel('Bring forward',{exact:true}).selectOption('population');await page.getByRole('spinbutton',{name:'Population light value',exact:true}).fill('0');await page.waitForTimeout(300);const d=await shot();await page.getByRole('spinbutton',{name:'Population light value',exact:true}).fill('1.5');await page.waitForTimeout(300);check(await shot()!==d,'Geographic intensity changes rendered pixels');
 await page.getByRole('button',{name:'Light',exact:true}).click();await page.getByRole('button',{name:'Restore the original light',exact:false}).click();await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByLabel('Bring forward',{exact:true}).selectOption('living');
 await page.waitForTimeout(1000);const mobile=[];
 for(const [width,height] of [[390,844],[375,667],[768,1024]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(350);await page.getByRole('button',{name:'Light',exact:true}).click();
  const bounds=await page.locator('#composition-panel').boundingBox();const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  check(!overflow&&bounds.x>=0&&bounds.x+bounds.width<=width+1&&bounds.y>=0&&bounds.y+bounds.height<=height+1,'Panel fits '+width);
  await page.getByRole('spinbutton',{name:'Land star warmth value',exact:true}).fill('70');await page.getByRole('spinbutton',{name:'Star glow value',exact:true}).fill('1.2');
  await page.screenshot({path:`output/playwright/v013-controls-${width}.png`});mobile.push({width,height,panel:bounds,overflow});
 }
 check(errors.length===0,'No page exceptions: '+errors.join('; '));return {result:'PASS',checks:['Optional source failure preserves Earth','Unavailable import is non-mutating','Reload recovers source fields','Reduced motion is pixel-still','Light and field controls change rendered pixels'],mobile,errors};
}
