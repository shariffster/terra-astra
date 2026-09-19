export type PanelBounds={left:number;top:number;right:number;bottom:number};

/** Fit the planetary silhouette into the measured free rectangle. Coordinates
 * are CSS pixels; device pixel ratio and panel breakpoints do not enter it. */
export function compositionFraming(width:number,height:number,panel:PanelBounds,distance:number) {
 const phone=width<=700;
 const left=phone?16:Math.min(width-80,panel.right+22),right=width-(phone?22:84);
 const top=phone?72:78,bottom=phone?Math.max(110,panel.top-18):height-90;
 const availableWidth=Math.max(40,right-left),availableHeight=Math.max(40,bottom-top);
 const radius=1.09,projected=height/(2*Math.tan(21*Math.PI/180))*radius/Math.sqrt(Math.max(.001,distance*distance-radius*radius));
 const zoom=Math.min(1,Math.min(availableWidth,availableHeight)/(2*projected));
 return {x:width/2-(left+right)/2,y:height/2-(top+bottom)/2,zoom,left,right,top,bottom};
}
