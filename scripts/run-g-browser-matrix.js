async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});await page.goto('http://localhost:5198/');
 await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);await page.waitForTimeout(1600);
 const command=c=>page.evaluate(c=>window.terraAstra.command(c),c);
 const state=()=>page.evaluate(()=>({world:window.terraAstra.getState(),data:{...document.querySelector('.universe').dataset}}));
 const rows=[];
 const names=['Reykjavík','Nairobi','Kyoto','Rio de Janeiro','Cape Town','Mexico City','Tokyo','Istanbul','Northern Italy','Patagonia','The Alps','Mount Fuji','Strait of Malacca','The Gulf','Gibraltar','Iceland','Bali','Lake Victoria','Rovaniemi','Tromsø'];
 for(const [index,query] of names.entries()){
  const at=Date.now();let resolution=await command({type:'flyToPlace',query});let ambiguity;
  if(!resolution.ok&&resolution.resolution?.candidates?.length){ambiguity=resolution.resolution.candidates.map(p=>({id:p.id,label:p.label,kind:p.kind}));const pick=resolution.resolution.candidates.find(x=>/Persian/.test(x.label))??resolution.resolution.candidates[0];resolution=await command({type:'flyToPlace',query,choice:pick.id});}
  if(!resolution.ok)throw Error(query+': '+JSON.stringify(resolution));
  const arrivalMs=Date.now()-at;
  await page.waitForTimeout(2200);const region=await state();
  const slug=String(index+1).padStart(2,'0')+'-'+query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-');
  await page.screenshot({path:'output/playwright/matrix-'+slug+'-region.png'});
  const urban=['city','settlement'].includes(region.world.resolvedTarget.kind);let city=null,street=null;
  if(urban){
   const cityAt=Date.now();await command({type:'setScale',tier:'city'});
   await page.waitForFunction(()=>window.terraAstra.getState().open&&!window.terraAstra.getState().open.detailLoading,{},{timeout:15000});await page.waitForTimeout(1000);
   city={...await state(),loadMs:Date.now()-cityAt};
   if(['Kyoto','Nairobi','Tokyo','Reykjavík','Rovaniemi'].includes(query))await page.screenshot({path:'output/playwright/matrix-'+slug+'-city.png'});
   await command({type:'setScale',tier:'street'});await page.waitForTimeout(600);street=await state();
   if(['Kyoto','Nairobi','Tokyo','Reykjavík','Rovaniemi'].includes(query))await page.screenshot({path:'output/playwright/matrix-'+slug+'-street.png'});
  }else{
   city={result:await command({type:'setScale',tier:'city'})};street={result:await command({type:'setScale',tier:'street'})};
  }
  rows.push({query,ambiguity,arrivalMs,region,city,street});
 }
 return {rows,errors,viewport:{width:1440,height:900},motion:'reduced',timestamp:new Date().toISOString()};
}
