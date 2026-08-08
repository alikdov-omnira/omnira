import{useEffect,useRef}from"react";
import*as THREE from"three";

export type StageNode={id:string;label:string;detail:string;status:"available"|"foundation";angle:number};

export const stageNodes:StageNode[]=[
 {id:"scanner",label:"Scanner",detail:"Reality capture",status:"foundation",angle:205},
 {id:"passport",label:"Passport",detail:"Digital room twin",status:"foundation",angle:158},
 {id:"estimate",label:"Estimate",detail:"Smart calculation",status:"available",angle:112},
 {id:"orchestrator",label:"Orchestrator",detail:"Governed direction",status:"foundation",angle:335},
 {id:"norms",label:"Norms",detail:"Built-in standards",status:"available",angle:22},
 {id:"analytics",label:"Analytics",detail:"Verified insight",status:"available",angle:68},
];

const gold=new THREE.Color(0xf0a83c),blue=new THREE.Color(0x4aa8ff);

export function OmniroStageScene({staticMode=false}:{staticMode?:boolean}){
 const mount=useRef<HTMLDivElement>(null);
 useEffect(()=>{const host=mount.current;if(!host)return;const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.set(0,0,10);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);host.appendChild(renderer.domElement);
 const root=new THREE.Group();scene.add(root);
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(2.05,4),new THREE.MeshBasicMaterial({color:gold,wireframe:true,transparent:true,opacity:.34,blending:THREE.AdditiveBlending}));root.add(core);
 const inner=new THREE.Mesh(new THREE.SphereGeometry(1.34,48,48),new THREE.MeshBasicMaterial({color:0xffb13c,transparent:true,opacity:.11,blending:THREE.AdditiveBlending}));root.add(inner);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:createGlow(),color:0xffa52f,transparent:true,opacity:.62,blending:THREE.AdditiveBlending,depthWrite:false}));halo.scale.set(6.8,6.8,1);root.add(halo);
 const rings=[2.7,3.25,3.75].map((radius,index)=>{const points=[];for(let i=0;i<180;i++){const angle=i/180*Math.PI*2;points.push(new THREE.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius*(.58+index*.035),0))}const geometry=new THREE.BufferGeometry().setFromPoints(points),line=new THREE.LineLoop(geometry,new THREE.LineBasicMaterial({color:index===1?blue:gold,transparent:true,opacity:.18}));line.rotation.z=index*.38;root.add(line);return line});
 const nodeMeshes:THREE.Mesh[]=[];stageNodes.forEach((node,index)=>{const angle=node.angle*Math.PI/180,x=Math.cos(angle)*3.45,y=Math.sin(angle)*2.28;const mesh=new THREE.Mesh(new THREE.SphereGeometry(.13,18,18),new THREE.MeshBasicMaterial({color:index%2?blue:gold}));mesh.position.set(x,y,.15);root.add(mesh);nodeMeshes.push(mesh);const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,0,0),new THREE.Vector3(x*.45,y*.2,index%2?.45:-.35),new THREE.Vector3(x,y,0));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)),new THREE.LineBasicMaterial({color:index%2?blue:gold,transparent:true,opacity:.22}));root.add(line)});
 const count=1100,positions=new Float32Array(count*3),colors=new Float32Array(count*3);for(let i=0;i<count;i++){const radius=2+Math.random()*3.9,angle=Math.random()*Math.PI*2,height=(Math.random()-.5)*1.8;positions[i*3]=Math.cos(angle)*radius;positions[i*3+1]=Math.sin(angle)*radius*.55;positions[i*3+2]=height;const color=Math.random()>.28?gold:blue;colors.set([color.r,color.g,color.b],i*3)}const particles=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({size:.025,vertexColors:true,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false}));particles.geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));particles.geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));root.add(particles);
 const resize=()=>{const width=host.clientWidth,height=host.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(host);resize();let frame=0,active=!document.hidden;const visibility=()=>{active=!document.hidden};document.addEventListener("visibilitychange",visibility);
 const animate=(time:number)=>{frame=requestAnimationFrame(animate);if(!active||staticMode)return;const t=time*.00012;core.rotation.y=t*1.7;core.rotation.x=Math.sin(t)*.12;inner.scale.setScalar(1+Math.sin(time*.0014)*.035);rings.forEach((ring,index)=>ring.rotation.z+=(index%2?-.00045:.00038));particles.rotation.z-=.00018;nodeMeshes.forEach((node,index)=>node.scale.setScalar(1+Math.sin(time*.002+index)*.18));renderer.render(scene,camera)};renderer.render(scene,camera);frame=requestAnimationFrame(animate);
 return()=>{cancelAnimationFrame(frame);document.removeEventListener("visibilitychange",visibility);observer.disconnect();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line||object instanceof THREE.Points){object.geometry.dispose();const material=object.material;if(Array.isArray(material))material.forEach(item=>item.dispose());else material.dispose()}});renderer.dispose();renderer.domElement.remove()};},[staticMode]);
 return <div className="omniro-stage-scene" ref={mount} aria-hidden="true"/>;
}

function createGlow(){const canvas=document.createElement("canvas");canvas.width=canvas.height=256;const context=canvas.getContext("2d")!,gradient=context.createRadialGradient(128,128,0,128,128,128);gradient.addColorStop(0,"rgba(255,214,130,1)");gradient.addColorStop(.12,"rgba(255,164,42,.75)");gradient.addColorStop(.42,"rgba(255,112,15,.18)");gradient.addColorStop(1,"rgba(0,0,0,0)");context.fillStyle=gradient;context.fillRect(0,0,256,256);const texture=new THREE.CanvasTexture(canvas);texture.needsUpdate=true;return texture}
