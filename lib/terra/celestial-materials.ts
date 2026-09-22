import * as THREE from 'three';

/** Continuous celestial materials share Earth's renderer and clock. The nebula
 * retains the authored cloud structure, advected by two evolving flow fields. */
export type CelestialFrame={width:number;height:number;time:number;sun:{x:number;y:number;r:number};moon:{x:number;y:number;r:number};moonDepth?:number;moonPhase?:number;earth:{x:number;y:number;r:number};nebulaOffset:{x:number;y:number};light:{nebula:number;sun:number;moon:number}};
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const common=`
uniform float time,level,pixelRatio,foreground;
uniform vec2 resolution;
uniform vec3 earth,lightDirection;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float n=0.0,a=.5;for(int i=0;i<4;i++){n+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+3.7;a*=.5;}return n;}
float occlusion(){vec2 pixel=vec2(gl_FragCoord.x/pixelRatio,resolution.y-gl_FragCoord.y/pixelRatio);return earth.z>0.0?smoothstep(earth.z-1.0,earth.z+3.0,length(pixel-earth.xy)):1.0;}
`;
const nebula=`${common}
uniform sampler2D cloud;
void main(){
 float visible=occlusion();if(visible<=0.0)discard;
 vec2 uv=vUv;
 // The two cloud depths shear in different directions. A broad eddy curls the
 // exposed fold, while darker foreground vapour crosses the luminous layer.
 vec2 q=uv-vec2(.75,.76);
 vec2 eddy=vec2(-q.y,q.x)*exp(-dot(q,q)*8.0);
 vec2 flow=vec2(fbm(uv*4.0+vec2(time*.035,-time*.024)),fbm(uv*4.0+vec2(6.1-time*.031,time*.022)))-.47;
 vec2 warped=uv+flow*.12+eddy*sin(time*.10)*.14;
 vec3 front=texture2D(cloud,warped).rgb;
 vec3 back=texture2D(cloud,uv-flow*.09-eddy*sin(time*.083+.9)*.09+vec2(.018,-.012)).rgb;
 float vapour=fbm(uv*9.0+flow*2.4+vec2(time*.028,-time*.019));
 float shadow=smoothstep(.38,.69,vapour);
 vec3 color=(front*.92+back*.37)*(1.0-shadow*.48);
 float edge=smoothstep(0.0,.06,uv.x)*smoothstep(0.0,.06,uv.y)*smoothstep(0.0,.06,1.0-uv.x)*smoothstep(0.0,.06,1.0-uv.y);
 gl_FragColor=vec4(color,level*.82*edge*visible);
}`;
const solar=`${common}
float prominence(vec2 p,float bearing,float height,float spread,float seed){
 float c=cos(bearing),s=sin(bearing);vec2 q=mat2(c,-s,s,c)*p;
 q.y+=.045*sin(q.x*6.0-time*.18+seed)*smoothstep(.9,1.4,q.x);
 float rise=height*(.90+.16*sin(time*.16+seed));
 vec2 arc=(q-vec2(.91,0.0))/vec2(rise,spread);
 float a=atan(arc.y,arc.x);float ring=length(arc)+.085*sin(a*3.0+time*.13+seed);
 float width=.105+.026*sin(a*3.0+seed);
 float bright=exp(-pow((ring-1.0)/width,2.0));
 float haze=exp(-pow((ring-1.0)*3.8,2.0))*.26;
 float travel=.67+.33*sin(a*3.0-time*.72+seed);
 return (bright*travel+haze)*smoothstep(.91,1.04,q.x);
}
void main(){
 vec2 p=(vUv-.5)*8.0;float r=length(p);
 float z=sqrt(max(0.0,1.0-r*r));
 vec2 surface=vec2(atan(p.x,max(.12,z)),p.y)*7.5+vec2(time*.095,0.0);
 float cells=fbm(surface+vec2(fbm(surface*.7-time*.026),fbm(surface*.6+time*.019)));
 float grain=noise(surface*3.0);
 float activityMask=1.0-.19*exp(-dot(p-vec2(-.31,.27),p-vec2(-.31,.27))/.019);
 float limb=1.0-smoothstep(.982,1.018,r);
 vec3 core=mix(vec3(.87,.43,.10),vec3(.99,.96,.82),pow(z,.38));
 core*=activityMask*(.77+.29*cells+.018*grain);
 // Large asymmetric magnetic arches have visible roots and returning curves.
 // They replace the radial comb of identical, narrow rays.
 float arches=prominence(p,-.5,.61,.30,1.0)*.46+prominence(p,.95,.36,.23,4.0)*.15+prominence(p,2.8,.25,.16,7.0)*.16;
 float reach=max(0.0,r-1.0);
 float gas=fbm(p*3.2+vec2(time*.027,-time*.021));
 float corona=exp(-reach*5.0)*(.13+.14*gas)+exp(-reach*2.1)*.045;
 float exterior=smoothstep(.985,1.02,r);
 vec3 color=core*limb+vec3(1.0,.62,.22)*(corona+arches)*exterior;
 // Do not add the halo across the face: it used to clip the surface to white.
 color+=vec3(1.0,.66,.31)*.025*exp(-r*r*.34)*exterior;
 color*=1.0-smoothstep(3.0,4.0,r);
 gl_FragColor=vec4(min(color*max(1.0,level/.7),vec3(.99)),min(1.0,level/.7)*occlusion());
}`;
const lunar=`${common}
float crater(vec2 p,vec2 centre,float radius){
 vec2 q=(p-centre)/radius;float r=length(q);
 float bowl=-.17*(1.0-smoothstep(.65,1.0,r));
 float lip=exp(-pow((r-.96)*11.0,2.0));
 return bowl+lip*(.10+.09*dot(normalize(q+vec2(.001)),vec2(lightDirection.x,-lightDirection.y)));
}
void main(){
 vec2 p=(vUv-.5)*2.12;float r2=dot(p,p);if(r2>1.0)discard;
 float z=sqrt(1.0-r2);vec3 normal=vec3(p.x,-p.y,z);
 float lambert=max(0.0,dot(normal,lightDirection));
 vec2 q=p+(vec2(fbm(p*5.0),fbm(p*5.0+7.0))-.45)*.18;
 float maria=1.0-.38*exp(-dot(q+vec2(.38,-.24),q+vec2(.38,-.24))/.12)-.29*exp(-dot(q+vec2(-.30,-.34),q+vec2(-.30,-.34))/.075)-.22*exp(-dot(q+vec2(.18,.30),q+vec2(.18,.30))/.08);
 float relief=.79+.24*fbm(p*13.0)+crater(p,vec2(-.47,-.20),.18)+crater(p,vec2(-.14,.52),.14)+crater(p,vec2(.35,-.37),.21)+crater(p,vec2(.51,.25),.11)+crater(p,vec2(-.61,.38),.10);
 float lit=(.018+.98*pow(lambert,.67))*maria*relief;
 float edge=1.0-smoothstep(.98,1.0,sqrt(r2));
 gl_FragColor=vec4(vec3(.96,.95,.90)*lit*max(1.0,level/.8),min(1.0,level/.8)*edge*mix(occlusion(),1.0,foreground));
}`;

export function createCelestialMaterials(renderer:THREE.WebGLRenderer,cloud:THREE.Texture){
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,1,0,-1,.1,10);camera.position.z=1;
 const meshes=[nebula,solar,lunar].map((fragmentShader,kind)=>{
  const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader,uniforms:{time:{value:0},level:{value:0},foreground:{value:0},pixelRatio:{value:1},resolution:{value:new THREE.Vector2()},earth:{value:new THREE.Vector3()},lightDirection:{value:new THREE.Vector3()},cloud:{value:cloud}},transparent:true,depthTest:false,depthWrite:false,blending:kind===2?THREE.NormalBlending:THREE.AdditiveBlending});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);mesh.frustumCulled=false;mesh.renderOrder=kind;scene.add(mesh);return mesh;
 });
 return {
  render(frame:CelestialFrame){
   const {width:w,height:h,sun,moon,earth,light}=frame,phone=w<=700;
   camera.right=w;camera.bottom=-h;camera.updateProjectionMatrix();
   const dx=sun.x-moon.x,dy=sun.y-moon.y,length=Math.hypot(dx,dy)||1;
   let draws=0;
   meshes.forEach((mesh,kind)=>{
    const u=mesh.material.uniforms,level=kind===0?light.nebula:kind===1?light.sun:light.moon;mesh.visible=level>.001;if(mesh.visible)draws++;
    const phase=frame.moonPhase??-.32,side=Math.sqrt(1-phase*phase);
    u.time.value=frame.time;u.level.value=level;u.foreground.value=THREE.MathUtils.smoothstep(frame.moonDepth??-1,-.08,.08);u.pixelRatio.value=renderer.getPixelRatio();u.resolution.value.set(w,h);u.earth.value.set(earth.x,earth.y,earth.r);u.lightDirection.value.set(dx/length*side,dy/length*side,phase);
    if(kind===0){const width=w*(phone?1.8:1.12),height=width*.6;mesh.scale.set(width,height,1);mesh.position.set(w-width*.5+frame.nebulaOffset.x,-(h*(phone?.13:-.075)+height*.5+frame.nebulaOffset.y),0);}
    else{const body=kind===1?sun:moon,size=body.r*(kind===1?8:2.12);mesh.scale.set(size,size,1);mesh.position.set(body.x,-body.y,0);}
   });
   const clear=renderer.autoClear,reset=renderer.info.autoReset;renderer.autoClear=false;renderer.info.autoReset=false;
   try{renderer.render(scene,camera);}finally{renderer.autoClear=clear;renderer.info.autoReset=reset;}
   return draws;
  },
  dispose(){for(const mesh of meshes){mesh.geometry.dispose();mesh.material.dispose();}scene.clear();},
 };
}
