async page => {
 const report=[];
 const command=c=>page.evaluate(c=>window.terraAstra.command(c),c);
 const paused=async()=>{const b=page.getByRole('button',{name:'Pause ambient motion',exact:true});if(await b.count())await b.click();};
 const measure=async(name)=>{
  await page.getByRole('button',{name:'Resume ambient motion',exact:true}).click();await page.waitForTimeout(1000);
  const timing=await page.evaluate(()=>new Promise(resolve=>{const frames=[];let start,last;function sample(now){if(!start)start=now;if(last)frames.push(now-last);last=now;if(now-start<3000)requestAnimationFrame(sample);else {frames.sort((a,b)=>a-b);resolve({frames:frames.length,elapsed:now-start,fps:frames.length*1000/(now-start),p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],data:{...document.querySelector('.universe').dataset}});}}requestAnimationFrame(sample);}));
  const row={name,...timing};await paused();return row;
 };
 for(const [version,url] of [['before','https://terra-astra-peoples-choice-v010.riffster.chatgpt.site/'],['after','http://localhost:5196/']]){
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});await page.goto(url);await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);
  if(version==='before'&&!await page.getByRole('link',{name:'Build history, version 0.10.8',exact:true}).count())throw Error('Baseline is no longer v0.10.8; do not mislabel a newer Lab release.');
  const states=[];
  states.push(await measure('planet'));
  await command({type:'flyTo',targetId:'singapore'});await command({type:'setScale',tier:'region'});states.push(await measure('malacca-region'));
  await command({type:'flyTo',targetId:'challenger-deep'});states.push(await measure('challenger-horizon'));
  await page.getByRole('button',{name:"Explore Earth's depth",exact:true}).click();await page.getByRole('radio',{name:'View a cutaway',exact:true}).click();states.push(await measure('challenger-cutaway'));
  await command({type:'resetView'});await page.setViewportSize({width:390,height:844});states.push(await measure('mobile-390-planet'));
  await page.setViewportSize({width:375,height:667});await command({type:'flyTo',targetId:'singapore'});await command({type:'setScale',tier:'region'});states.push(await measure('mobile-375-region'));
  await page.setViewportSize({width:1440,height:900});await command({type:'resetView'});await page.getByRole('button',{name:'Hear the living Earth',exact:true}).click();states.push(await measure('planet-sound-on'));
  report.push({version,url,states});
 }
 return report;
}
