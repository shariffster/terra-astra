async page => {
 await page.keyboard.up('Space');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const check=(v,m)=>{if(!v)throw new Error(m);};const rows=[];
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});await page.goto('http://localhost:5214/');
 await page.evaluate(()=>{localStorage.removeItem('terra-astra:composition:v1');localStorage.removeItem('terra-astra:saved-compositions:v1');});await page.reload();
 await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy,{},{timeout:45000});
 await page.getByRole('button',{name:'Adjust the constellations',exact:true}).waitFor({state:'visible'});await page.waitForTimeout(400);
 check(await page.locator('.universe').getAttribute('data-distant-stars')==='4420','Seeded distant sky exists');
 await page.getByRole('button',{name:'Adjust the constellations',exact:true}).click();await page.waitForTimeout(300);
 const sceneShot=(settings={})=>page.screenshot({...settings,clip:{x:420,y:85,width:900,height:655}});const canvas=page.locator('.universe canvas'),baseline=await sceneShot({path:'output/playwright/v014-compare-baseline.png'});
 await page.getByRole('button',{name:'Rich',exact:true}).click();await page.waitForTimeout(350);const rich=await sceneShot({path:'output/playwright/v014-compare-rich.png'});check(!baseline.equals(rich),'Rich preset visibly changes the globe');
 check(await page.getByRole('spinbutton',{name:'Star glow value',exact:true}).inputValue()==='1.24','Rich values apply');
 check(await page.getByRole('switch',{name:'Ambient motion',exact:true}).getAttribute('aria-checked')==='false','Presets retain reduced motion');
 const compare=page.getByRole('button',{name:'Hold to compare light',exact:true});await compare.focus();await page.keyboard.down('Space');await page.waitForTimeout(150);
 check(await page.getByRole('button',{name:'Showing earlier light',exact:true}).getAttribute('aria-pressed')==='true','Keyboard hold engages comparison');
 const held=await sceneShot({path:'output/playwright/v014-compare-held.png'});check(baseline.equals(held),'Comparison restores exact earlier rendered pixels at same camera');
 const storedDuring=await page.evaluate(()=>JSON.parse(localStorage.getItem('terra-astra:composition:v1')));check(storedDuring.light.glow===1.24,'Comparison does not overwrite saved last view');
 await page.keyboard.up('Space');await page.waitForTimeout(150);const restored=await sceneShot();check(rich.equals(restored),'Release restores exact current rendered pixels');rows.push('Preset visible difference; exact-pixel hold/release; camera fixed; persistence untouched');
 await page.getByRole('button',{name:'Saved',exact:true}).click();await page.getByLabel('Composition name',{exact:true}).fill('Rich night QA');await page.getByRole('button',{name:'Save composition',exact:true}).click();check((await page.locator('#composition-panel').innerText()).includes('Named save matches'),'Named save indicator');
 await page.getByRole('button',{name:'Light',exact:true}).click();await page.getByRole('button',{name:'Quiet',exact:true}).click();check((await page.locator('#composition-panel').innerText()).includes('Unsaved composition'),'Modified state indicator');
 await page.getByRole('button',{name:'Balanced',exact:true}).click();const sky=page.getByRole('spinbutton',{name:'Distant starlight value',exact:true});await sky.fill('0');await page.getByRole('heading',{name:'Light, to your liking.'}).click();await page.waitForTimeout(200);const black=await sceneShot();await sky.fill('1.2');await page.getByRole('heading',{name:'Light, to your liking.'}).click();await page.waitForTimeout(200);const stars=await sceneShot();check(!black.equals(stars),'Sky slider changes rendered pixels');
 await page.getByRole('button',{name:'Balanced',exact:true}).click();await page.waitForTimeout(200);await page.screenshot({path:'output/playwright/v014-light.png'});
 await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByLabel('Bring forward',{exact:true}).selectOption('population');await page.waitForTimeout(200);await page.screenshot({path:'output/playwright/v014-population.png'});await page.getByLabel('Bring forward',{exact:true}).selectOption('living');
 await page.keyboard.press('Escape');await canvas.focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(200);await page.screenshot({path:'output/playwright/v014-centred.png'});rows.push('Saved/modified indicator; sky zero/intensity; geographic focus; recentered exploration');
 for(const [width,height] of [[768,1024],[390,844],[375,667]]){
  await page.setViewportSize({width,height});await page.getByRole('button',{name:'Adjust the constellations',exact:true}).click();await page.waitForTimeout(250);
  const box=await page.locator('#composition-panel').boundingBox();check(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Panel fits '+width);
  const rect=await page.getByRole('button',{name:'Hold to compare light',exact:true}).boundingBox();check(rect.y>=box.y&&rect.y+rect.height<=box.y+box.height,'Compare visible '+width);
  await page.screenshot({path:`output/playwright/v014-controls-${width}.png`});await page.keyboard.press('Escape');
 }
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Adjust the constellations',exact:true}).click();await page.waitForTimeout(800);
 const motion=page.getByRole('switch',{name:'Ambient motion',exact:true});if(await motion.getAttribute('aria-checked')==='false')await motion.click();await page.waitForTimeout(300);
 const movingBefore=await sceneShot();await page.waitForTimeout(350);check(!movingBefore.equals(await sceneShot()),'Particles keep moving while the composition camera holds');
 const a=await page.locator('.journey-location').innerText();await page.waitForTimeout(4400);const b=await page.locator('.journey-location').innerText();check(a===b,'Composition panel holds orbit for comparison');
 await page.getByRole('button',{name:'Hold to compare light',exact:true}).focus();await page.keyboard.down('Space');await page.keyboard.press('Escape');await page.keyboard.up('Space');check(await page.locator('#composition-panel').count()===0,'Escape cancels hold and closes');
 await page.getByRole('button',{name:'Adjust the constellations',exact:true}).click();check(await page.getByRole('button',{name:'Hold to compare light',exact:true}).getAttribute('aria-pressed')==='false','Comparison does not stick after reopening');
 await page.getByRole('button',{name:'Balanced',exact:true}).click();await page.keyboard.press('Escape');rows.push('Tablet/phone fit; normal-motion camera hold; Escape recovery');
 check(errors.length===0,'Page errors: '+errors.join(';'));return {result:'PASS',rows,errors};
}
