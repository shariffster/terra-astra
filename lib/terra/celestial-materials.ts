import * as THREE from 'three';

/** Continuous celestial materials share Earth's renderer and clock. The nebula
 * retains the authored cloud structure, advected by two evolving flow fields. */
export type CelestialFrame={width:number;height:number;time:number;sun:{x:number;y:number;r:number};moon:{x:number;y:number;r:number};earth:{x:number;y:number;r:number};nebulaOffset:{x:number;y:number};light:{nebula:number;sun:number;moon:number}};
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const common=`
uniform float time,level,pixelRatio;
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
 vec2 uv=vUv;
 // Coherent shear and smaller rolling folds; the image itself is resampled,
 // rather than simply faded or translated as one rigid wallpaper.
 vec2 flow=vec2(fbm(uv*5.0+vec2(time*.025,-time*.018)),fbm(uv*5.0+vec2(6.1-time*.023,time*.017)))-.46;
 vec2 fine=vec2(sin(uv.y*22.0+time*.11),cos(uv.x*19.0-time*.13));
 vec2 warped=uv+flow*.055+fine*.004;
 vec3 front=texture2D(cloud,warped).rgb;
 vec3 back=texture2D(cloud,uv-flow*.033+vec2(.006*sin(time*.047),.004*cos(time*.053))).rgb;
 float folds=.90+.18*fbm(uv*16.0+flow*3.0+vec2(time*.035,0));
 vec3 color=(front*.82+back*.18)*folds;
 float edge=smoothstep(0.0,.03,uv.x)*smoothstep(0.0,.03,uv.y)*smoothstep(0.0,.03,1.0-uv.x)*smoothstep(0.0,.03,1.0-uv.y);
 gl_FragColor=vec4(color,level*.68*edge*occlusion());
}`;
const solar=`${common}
void main(){
 vec2 p=(vUv-.5)*8.0;float r=length(p),angle=atan(p.y,p.x);
 float z=sqrt(max(0.0,1.0-r*r));
 vec2 surface=p*8.0+vec2(time*.12,-time*.085);
 float granules=fbm(surface+vec2(fbm(surface*.5+time*.025),fbm(surface*.5-time*.031)));
 float limb=1.0-smoothstep(.97,1.025,r);
 vec3 core=mix(vec3(1.0,.48,.12),vec3(1.0,.98,.85),pow(z,.45));
 core*=.87+.22*granules;
 // Uneven strands grow from active regions and curve through the corona.
 float reach=max(0.0,r-1.0);
 vec2 circular=vec2(cos(angle),sin(angle));
 float activity=fbm(circular*4.0+vec2(reach*.65-time*.047,time*.036));
 float stream=pow(max(0.0,.5+.5*sin(angle*19.0+fbm(circular*7.0)*8.0-reach*(2.3+activity*3.0)+time*.21)),6.0);
 float corona=exp(-reach*3.5)*(.42+.42*activity)+exp(-reach*1.8)*stream*pow(activity,2.0)*1.2;
 // Two asymmetric prominences, blurred into the corona rather than hard rings.
 vec2 a=mat2(.92,-.39,.39,.92)*p-vec2(1.04,.08);
 float archA=exp(-pow((length(a/vec2(.34,.19))-1.0)*9.0,2.0))*(.6+.4*sin(time*.15+angle*2.0));
 vec2 b=mat2(-.72,-.69,.69,-.72)*p-vec2(1.02,0.0);
 float archB=exp(-pow((length(b/vec2(.21,.13))-1.0)*10.0,2.0));
 float exterior=smoothstep(.98,1.025,r);
 float halo=.22*exp(-r*r*.42);
 vec3 color=core*limb+vec3(1.0,.66,.28)*(corona+archA*.16+archB*.075)*exterior+vec3(1.0,.64,.28)*halo;
 color*=1.0-smoothstep(3.0,4.0,r);
 gl_FragColor=vec4(color,min(1.0,level*1.5)*occlusion());
}`;
const lunar=`${common}
void main(){
 vec2 p=(vUv-.5)*2.12;float r2=dot(p,p);if(r2>1.0)discard;
 float z=sqrt(1.0-r2);vec3 normal=vec3(p.x,-p.y,z);
 float lambert=max(0.0,dot(normal,lightDirection));
 float maria=1.0-.27*exp(-dot(p+vec2(.22,-.23),p+vec2(.22,-.23))/.12)-.18*exp(-dot(p+vec2(-.35,.32),p+vec2(-.35,.32))/.08);
 float relief=.83+.22*fbm(p*17.0)+.045*noise(p*90.0);
 vec2 cell=floor(p*19.0),f=fract(p*19.0)-.5;float crater=length(f-vec2(hash(cell)-.5,hash(cell+4.0)-.5)*.35);
 relief-=.09*(1.0-smoothstep(.06,.17,crater));
 relief+=.055*exp(-pow((crater-.19)*32.0,2.0));
 float lit=(.025+.91*pow(lambert,.72))*maria*relief;
 float edge=1.0-smoothstep(.98,1.0,sqrt(r2));
 gl_FragColor=vec4(vec3(.91,.91,.87)*lit,level*edge*occlusion());
}`;

export function createCelestialMaterials(renderer:THREE.WebGLRenderer,cloud:THREE.Texture){
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,1,0,-1,.1,10);camera.position.z=1;
 const meshes=[nebula,solar,lunar].map((fragmentShader,kind)=>{
  const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader,uniforms:{time:{value:0},level:{value:0},pixelRatio:{value:1},resolution:{value:new THREE.Vector2()},earth:{value:new THREE.Vector3()},lightDirection:{value:new THREE.Vector3()},cloud:{value:cloud}},transparent:true,depthTest:false,depthWrite:false,blending:kind===2?THREE.NormalBlending:THREE.AdditiveBlending});
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
    u.time.value=frame.time;u.level.value=level;u.pixelRatio.value=renderer.getPixelRatio();u.resolution.value.set(w,h);u.earth.value.set(earth.x,earth.y,earth.r);u.lightDirection.value.set(dx/length*.9165,dy/length*.9165,-.4);
    if(kind===0){const width=w*(phone?1.5:1.05),height=width*.6;mesh.scale.set(width,height,1);mesh.position.set(w-width*.5+frame.nebulaOffset.x,-(Math.max(30,h*(phone?.16:.06))+height*.5+frame.nebulaOffset.y),0);}
    else{const body=kind===1?sun:moon,size=body.r*(kind===1?8:2.12);mesh.scale.set(size,size,1);mesh.position.set(body.x,-body.y,0);}
   });
   const clear=renderer.autoClear,reset=renderer.info.autoReset;renderer.autoClear=false;renderer.info.autoReset=false;
   try{renderer.render(scene,camera);}finally{renderer.autoClear=clear;renderer.info.autoReset=reset;}
   return draws;
  },
  dispose(){for(const mesh of meshes){mesh.geometry.dispose();mesh.material.dispose();}scene.clear();},
 };
}
