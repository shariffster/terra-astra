async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});await page.goto('http://localhost:5196/');
 await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);
 const command=async c=>{const r=await page.evaluate(c=>window.terraAstra.command(c),c);if(!r.ok)throw Error(JSON.stringify(r));await page.waitForTimeout(250);};
 const shot=name=>page.screenshot({path:'output/playwright/'+name+'.png'});
 await shot('after-planet');
 const states=[];
 for(const targetId of ['singapore','new-york','palm-jumeirah','makkah']){
  await command({type:'flyTo',targetId});
  for(const tier of ['region','city','street']){await command({type:'setScale',tier});await shot('qa-'+targetId+'-'+tier);states.push(await page.evaluate(()=>window.terraAstra.getState()));}
 }
 await command({type:'flyTo',targetId:'singapore'});await command({type:'setScale',tier:'region'});await shot('after-malacca');
 await command({type:'flyTo',targetId:'challenger-deep'});await shot('after-challenger');
 await page.getByRole('button',{name:"Explore Earth's depth",exact:true}).click();await page.getByRole('radio',{name:'View a cutaway',exact:true}).click();await page.waitForTimeout(300);await shot('after-cutaway');
 await page.getByRole('switch',{name:'Show spatial depth',exact:true}).click();await shot('qa-depth-off');await page.getByRole('switch',{name:'Show spatial depth',exact:true}).click();
 // Inspect unequal global concentration using real pointer drags.
 for(const [name,latitude,longitude] of [['atlantic',32,-35],['pacific',15,-155],['med-suez',31,27],['panama',10,-80],['quiet-south-pacific',-30,-125]]){
  await command({type:'resetView'});let dx=(95-longitude)/.18,dy=(latitude-19)/.18;
  while(Math.abs(dx)>.1||Math.abs(dy)>.1){const x=Math.max(-400,Math.min(400,dx)),y=Math.max(-250,Math.min(250,dy));await page.mouse.move(740,450);await page.mouse.down();await page.mouse.move(740+x,450+y,{steps:8});await page.mouse.up();dx-=x;dy-=y;}
  await page.waitForTimeout(300);await shot('qa-'+name);
 }
 for(const [width,height] of [[390,844],[375,667]]){
  await page.setViewportSize({width,height});await command({type:'resetView'});await shot('after-mobile-'+width);
  await command({type:'flyTo',targetId:'singapore'});await command({type:'setScale',tier:'region'});await shot('qa-mobile-'+width+'-region');
  await command({type:'setScale',tier:'street'});await shot('qa-mobile-'+width+'-street');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow at '+width);
 }
 await page.setViewportSize({width:1440,height:900});await command({type:'resetView'});
 await page.getByRole('button',{name:'Ask Astra',exact:true}).click();await shot('qa-ask-astra');
 return {states,errors,mobileWidths:[390,375],screenshotCount:29,final:await page.evaluate(()=>({...document.querySelector('.universe').dataset}))};
}
