async page => {
 await page.setViewportSize({width:1280,height:800});
 await page.goto('file:///Users/shariffmbp13/Documents/Codex/Terra%20Astra/terra-astra-run-g/output/run-g-street-traversal.webm');
 await page.waitForSelector('video');
 await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
 const metadata=await page.evaluate(()=>{const v=document.querySelector('video');v.muted=true;return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};});
 const samples=[];
 for(const time of [8,45,80,110,154]){
  await page.evaluate(t=>new Promise((resolve,reject)=>{const v=document.querySelector('video');v.onseeked=()=>resolve(true);v.onerror=()=>reject(Error('video decode failed'));v.currentTime=t;}),time);
  await page.evaluate(()=>document.querySelector('video').play());await page.waitForTimeout(900);
  samples.push(await page.evaluate(()=>{const v=document.querySelector('video');v.pause();return {time:v.currentTime,error:v.error,decoded:v.webkitDecodedFrameCount};}));
  await page.screenshot({path:`output/playwright/video-playback-${time}.png`});
 }
 if(metadata.duration!==165||samples.some(s=>s.error))throw Error('Playback verification failed');
 return {metadata,samples,audio:'Intentionally silent visual QA recording',status:'PASS'};
}
