async page=>{
 const check=(v,m)=>{if(!v)throw new Error(m);};const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>({...document.querySelector('.universe').dataset}));const rows=[];
 await page.getByRole('button',{name:'Adjust the constellations',exact:true}).click();await page.waitForTimeout(1000);await page.screenshot({path:'output/playwright/v013-final-light.png'});
 await page.getByRole('spinbutton',{name:'Star glow value',exact:true}).fill('1.5');await page.waitForTimeout(1000);await page.getByRole('button',{name:'Restore the original light',exact:false}).click();
 await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByLabel('Bring forward',{exact:true}).selectOption('population');await page.waitForTimeout(1400);await page.screenshot({path:'output/playwright/v013-final-population.png'});
 await page.getByLabel('Bring forward',{exact:true}).selectOption('footprint');await page.waitForTimeout(1400);await page.screenshot({path:'output/playwright/v013-final-footprint.png'});
 await page.getByLabel('Bring forward',{exact:true}).selectOption('living');
 for(const delay of [350,900,1700,3500]){await page.waitForTimeout(delay);rows.push(await state());}
 const early=JSON.parse(rows[0].travellerExposure),late=JSON.parse(rows.at(-1).travellerExposure);check(early.aircraft<late.aircraft&&late.aircraft>.8,'Traveller return is staggered and completes within seconds');
 await page.getByRole('button',{name:'Close composition controls',exact:true}).click();await page.screenshot({path:'output/playwright/v013-final-world.png'});
 await page.evaluate(()=>window.terraAstra.command({type:'flyToPlace',query:'Taipei'}));await page.getByRole('button',{name:"Explore Earth's depth",exact:true}).click();await page.getByRole('radio',{name:'View along the surface',exact:true}).click();await page.waitForTimeout(3000);
 await page.screenshot({path:'output/playwright/v013-final-horizon.png'});const region=await state();check(errors.length===0,'No page errors');
 return {result:'PASS',stagedReturn:rows.map(x=>({paths:JSON.parse(x.pathwayExposure),travellers:JSON.parse(x.travellerExposure),fps:+x.renderFps,triangles:+x.renderTriangles})),region:{fps:region.renderFps,points:region.renderPoints,triangles:region.renderTriangles},errors};
}
