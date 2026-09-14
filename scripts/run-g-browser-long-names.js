async page=>{
 const rows=[];
 await page.setViewportSize({width:375,height:667});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://localhost:5198/');await page.waitForFunction(()=>window.terraAstra&&!window.terraAstra.getState().busy);await page.waitForTimeout(1500);
 for(const [query,slug] of [['Rio de Janeiro','rio'],['Strait of Malacca','malacca']]){await page.evaluate(query=>window.terraAstra.command({type:'flyToPlace',query}),query);await page.waitForTimeout(1700);await page.screenshot({path:'output/playwright/mobile-375-'+slug+'.png'});const boxes=await page.evaluate(()=>[...document.querySelectorAll('.journey-location,.journey-bar>.journey-button')].map(x=>({text:x.innerText,rect:x.getBoundingClientRect().toJSON()})));if(boxes.some(x=>x.rect.right>352.5)||boxes[0].rect.right>boxes[1].rect.left)throw Error('Clipped or overlapping journey controls: '+query);rows.push({query,boxes});}
 return rows;
}
