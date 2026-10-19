/* 形间 — native Three.js teaching workbench. No account, network API or framework. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),M=window.MathGeo,T=window.THREE;
 const notice=(text)=>{ $('toast').textContent=text;$('toast').hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('toast').hidden=true,4000); };
 if(!T||!T.OrbitControls||!M){$('error').hidden=false;$('error').textContent='本地几何资源未加载。请保持 index.html、math.js、app.js、styles.css 与 vendor 文件夹在同一个目录。';return;}
 const defs={
  cube:{name:'正方体',hint:'棱长 a',color:0x72cbb5,defaults:{a:2}},
  box:{name:'长方体',hint:'长 · 宽 · 高',color:0xb6a0e8,defaults:{a:2.2,b:1.6,h:1.5}},
  cylinder:{name:'圆柱',hint:'半径 r · 高 h',color:0x7bb9eb,defaults:{r:1.15,h:1.8}},
  cone:{name:'圆锥',hint:'半径 r · 高 h',color:0xf3b76c,defaults:{r:1.15,h:1.8}},
  frustum:{name:'圆台',hint:'两底半径 · 高',color:0xed9eaa,defaults:{r:1.4,rp:.7,h:1.6}},
  hemisphere:{name:'半球',hint:'球半径 R',color:0x87cdd8,defaults:{r:1.15}}
 };
 const icons={
 cube:'M8 12 22 4 37 12v20l-15 8-14-8Zm14-8v20m15-12-15 12-14-12m14 12v16',
 box:'M5 14 25 5 40 13v18l-20 9-15-8Zm20-9v18m15-10-20 10-15-9m15 9v17',
 cylinder:'M9 12c0-9 28-9 28 0v23c0 9-28 9-28 0Zm0 0c0 9 28 9 28 0M9 35c0-8 28-8 28 0',
 cone:'M23 4 7 34c0 10 32 10 32 0Zm-16 30c0-8 32-8 32 0M23 4v35',
 frustum:'M15 9c0-5 16-5 16 0l9 25c0 10-34 10-34 0Zm0 0c0 5 16 5 16 0M6 34c0-8 34-8 34 0',
 hemisphere:'M5 29a18 18 0 0 1 36 0c0 12-36 12-36 0Zm0 0c0-10 36-10 36 0M23 11c-8 6-8 15 0 27'
 };
 let uid=1;
 function piece(type,params){return {id:uid++,type,...defs[type].defaults,...params,rotation:[0,0,0]};}
 const state={mode:'compose',display:'solid',pieces:[piece('cylinder'),piece('cone')],selected:1,focus:piece('cube'),progress:0,playing:false,direction:1,speed:1,lock:false,cutRatio:.45,sectionKey:'hexagon',sectionMethod:'preset',planeShift:0,points:[{edge:0,t:.5},{edge:5,t:.5},{edge:11,t:.5}],picking:false,pickIndex:0,coords:false,origin:'A',axisX:'AB',axisY:'AD',coordUnit:'number',snapshots:[],formulas:false,classroom:false};
 let renderer,scene,camera,controls;
 try{renderer=new T.WebGLRenderer({alpha:true,antialias:true});}catch(e){$('error').hidden=false;$('error').textContent='当前浏览器无法启动 WebGL。请在支持三维图形的 Edge 或 Chrome 中打开，并检查硬件加速。';return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0x000000,0);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 $('canvas-host').appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','三维舞台：空白拖拽旋转视角，形体拖拽旋转物体');renderer.domElement.tabIndex=0;
 scene=new T.Scene();camera=new T.PerspectiveCamera(38,1,.05,300);camera.position.set(6,4.8,7);
 scene.add(new T.HemisphereLight(0xe9f3ff,0x33404e,.75));const light=new T.DirectionalLight(0xffedd8,.95);light.position.set(4,8,5);scene.add(light);const rim=new T.DirectionalLight(0xacc5ef,.35);rim.position.set(-5,3,-4);scene.add(rim);
 controls=new T.OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=1.5;controls.maxDistance=65;controls.target.set(0,1.5,0);
 const grid=new T.GridHelper(30,30,0x47566a,0x303e52);grid.material.transparent=true;grid.material.opacity=.2;grid.position.y=-.025;scene.add(grid);
 // Cut solids, their edges and section overlays share exactly one rigid pose.
 const pose=new T.Group(),root=new T.Group(),overlay=new T.Group();scene.add(pose);pose.add(root,overlay);
 function syncScenePose(){
  if(state.mode==='compose'){pose.rotation.set(0,0,0);pose.position.set(0,0,0);return;}
  pose.rotation.set(...state.focus.rotation);const center=new T.Vector3(0,M.height(state.focus)/2,0);
  pose.position.copy(center).sub(center.clone().applyEuler(pose.rotation));
 }
 let targets=[],parts=[],labels=[],coordsLabels=[],surfaceRecord=null,boxRecord=null,sectionRecord=null,edgeLines=[],geometryBuilds=0;
 function material(color){return new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),metalness:.08,roughness:.52,side:T.DoubleSide,transparent:state.display==='ghost',opacity:state.display==='ghost'?.25:1,wireframe:state.display==='wire'});}
 function clear(group){const geos=new Set(),mats=new Set();group.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));});group.clear();geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}
 function mesh(geo,color,parent=root,edge=true){const o=new T.Mesh(geo,material(color));parent.add(o);if(edge&&state.display!=='wire'){const e=new T.LineSegments(new T.EdgesGeometry(geo,30),new T.LineBasicMaterial({color:0xd8e1e3,transparent:true,opacity:.5}));o.add(e);}return o;}
 function label(text,pos,collection=labels,anchor=null){const el=document.createElement('span');el.className='vertex-label';el.textContent=text;$('label-layer').appendChild(el);collection.push({el,pos:new T.Vector3(...pos),anchor});}
 function removeLabels(collection){collection.forEach(l=>l.el.remove());collection.length=0;}
 function solid(p,parent=root){
  const g=new T.Group();parent.add(g);const color=defs[p.type].color;
  if(p.type==='cube'||p.type==='box'){const [a,b,h]=M.dimensions(p);const o=mesh(new T.BoxGeometry(a,h,b),color,g);o.position.y=h/2;}
  if(p.type==='cylinder'||p.type==='frustum'||p.type==='cone'){const h=p.h;const top=p.type==='cylinder'?p.r:p.type==='cone'?0:p.rp;const o=mesh(new T.CylinderGeometry(top,p.r,h,64),color,g);o.position.y=h/2;}
  if(p.type==='hemisphere'){mesh(new T.SphereGeometry(p.r,64,24,0,Math.PI*2,0,Math.PI/2),color,g,false);const d=mesh(new T.CircleGeometry(p.r,64),color,g,false);d.rotation.x=-Math.PI/2;}
  targets.push(g);g.userData.piece=p;return g;
 }
 function addPoint(pos,color=0xe5b782,size=.05,parent=overlay){const o=new T.Mesh(new T.SphereGeometry(size,12,8),new T.MeshBasicMaterial({color}));o.position.set(...pos);parent.add(o);return o;}
 function centeredSolid(p,y){
  const pivot=new T.Group();root.add(pivot);pivot.position.y=y+M.height(p)/2;
  const g=solid(p,pivot);g.position.y=-M.height(p)/2;
  // Composition pieces own independent poses; other modes use the shared parent.
  if(state.mode==='compose')pivot.rotation.set(...p.rotation);g.userData.pivot=pivot;
  if(state.mode==='compose'&&state.pieces.length===1&&['cube','box'].includes(p.type)){const [a,b,h]=M.dimensions(p);M.vertices(a,b,h).forEach((v,i)=>label(M.names[i],[v[0],v[1]-h/2,v[2]],labels,pivot));}
  parts.push({p,pivot,base:y});return pivot;
 }
 function disc(r,y,color=0xe5b782){const o=new T.Mesh(new T.CircleGeometry(r,64),new T.MeshBasicMaterial({color,transparent:true,opacity:.36,side:T.DoubleSide,depthWrite:false}));o.rotation.x=-Math.PI/2;o.position.y=y;overlay.add(o);return o;}
 function contactMark(C,y){
  if(!C.area)return;
  if(C.kind==='circle'){disc(C.r,y);return;}
  if(C.kind==='rect'){const o=new T.Mesh(new T.PlaneGeometry(C.a,C.b),new T.MeshBasicMaterial({color:0xe5b782,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false}));o.rotation.x=-Math.PI/2;o.position.y=y;overlay.add(o);return;}
  // Exact clipped boundary of centered disk / rectangle; sample only for display.
  const pts=[];for(let i=0;i<=128;i++){const ang=i/128*Math.PI*2,cs=Math.cos(ang),sn=Math.sin(ang);const rr=Math.min(C.r,C.a/(2*Math.max(1e-12,Math.abs(cs))),C.b/(2*Math.max(1e-12,Math.abs(sn))));pts.push(new T.Vector3(rr*cs,0,rr*sn));}
  const center=new T.Vector3(0,0,0),vs=[];for(let i=0;i<pts.length-1;i++)vs.push(...center.toArray(),...pts[i].toArray(),...pts[i+1].toArray());const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vs,3));const o=new T.Mesh(geo,new T.MeshBasicMaterial({color:0xe5b782,opacity:.35,transparent:true,side:T.DoubleSide,depthWrite:false}));o.position.y=y;overlay.add(o);
 }
 function composeBuild(){let y=0;state.pieces.forEach(p=>{centeredSolid(p,y);y+=M.height(p);});contactMarkers=[];
  for(let i=0;i<state.pieces.length-1;i++){const old=new Set(overlay.children),base=parts[i].base+M.height(parts[i].p)+.012;contactMark(M.contact(state.pieces[i],state.pieces[i+1]),base);overlay.children.filter(o=>!old.has(o)).forEach(o=>contactMarkers.push({o,base,index:i}));}
 }
 function cutBuild(){
  const p=state.focus,color=defs[p.type].color,k=state.cutRatio,H=M.height(p),h=H*k;
  if(['cube','box'].includes(p.type)){
   const g=centeredSolid(p,0);const box=g.children[0];box.traverse(o=>{if(o.isMesh){o.material.transparent=true;o.material.opacity=.18;o.material.depthWrite=false;}});
   const [a,b,c]=M.dimensions(p),vs=M.vertices(a,b,c);vs.forEach((v,i)=>label(M.names[i],v));
   M.edges.forEach(([i,j],idx)=>{const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(...vs[i]),new T.Vector3(...vs[j])]);const line=new T.Line(geo,new T.LineBasicMaterial({color:0x99bac4}));line.userData.edge=idx;overlay.add(line);edgeLines.push(line);});
   sectionRecord={a,b,h:c};return;
  }
  let low,upper;
  if(p.type==='cone'){
   const rr=p.r*(1-k);low=solid({...p,type:'frustum',rp:rr,h},root);upper=solid({...p,r:rr,h:H-h},root);disc(rr,h);disc(rr,h+.01);
  }else if(p.type==='cylinder'){low=solid({...p,h},root);upper=solid({...p,h:H-h},root);disc(p.r,h);
  }else if(p.type==='frustum'){const rr=p.r+(p.rp-p.r)*k;low=solid({...p,rp:rr,h},root);upper=solid({...p,r:rr,h:H-h},root);disc(rr,h);
  }else{
   const C=M.halfCut(p.r,k);low=new T.Group();root.add(low);mesh(new T.SphereGeometry(p.r,64,24,0,Math.PI*2,C.phi,Math.PI/2-C.phi),color,low,false);
   const base=mesh(new T.CircleGeometry(p.r,64),color,low,false);base.rotation.x=-Math.PI/2;
   const lid=mesh(new T.CircleGeometry(C.r,64),color,low,false);lid.rotation.x=-Math.PI/2;lid.position.y=C.y;
   upper=new T.Group();root.add(upper);mesh(new T.SphereGeometry(p.r,64,24,0,Math.PI*2,0,C.phi),color,upper,false);const cap=mesh(new T.CircleGeometry(C.r,64),color,upper,false);cap.rotation.x=-Math.PI/2;cap.position.y=C.y;
   disc(C.r,C.y);targets.push(low,upper);
  }
  if(p.type!=='hemisphere')upper.position.y=h;
  parts.push({p,upper,upperBase:upper.position.y});
 }
 function surfaceBuild(p){
  const N=96,K=16,positions=new Float32Array((N+1)*(K+1)*3),indices=[];
  for(let j=0;j<K;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setIndex(indices);const o=mesh(geo,defs[p.type].color,root,false);targets.push(o);o.userData.piece=p;
  surfaceRecord={p,N,K,geo,o};
 }
 function boxBuild(p){
  const [a,b,h]=M.dimensions(p),color=defs[p.type].color,g=new T.Group();root.add(g);targets.push(g);g.userData.piece=p;
  const plate=(w,H,col,parent,x,y,z)=>{const o=mesh(new T.PlaneGeometry(w,H),col,parent);o.position.set(x,y,z);return o;};
  const bottom=plate(a,b,color,g,0,.001,0);bottom.rotation.x=-Math.PI/2;
  const joint=(x,y,z)=>{const q=new T.Group();q.position.set(x,y,z);g.add(q);return q;};
  const front=joint(0,0,b/2);plate(a,h,color,front,0,h/2,0);
  const top=new T.Group();top.position.set(0,h,0);front.add(top);plate(a,b,0xa3cbbd,top,0,b/2,0);
  const back=joint(0,0,-b/2);plate(a,h,0x80b4a9,back,0,h/2,0);
  const left=joint(-a/2,0,0);plate(b,h,color,left,0,h/2,0).rotation.y=Math.PI/2;
  const right=joint(a/2,0,0);plate(b,h,color,right,0,h/2,0).rotation.y=Math.PI/2;
  boxRecord={g,front,back,left,right,top};
 }
 function buildScene(reframe=false){
  geometryBuilds++;clear(root);clear(overlay);removeLabels(labels);removeLabels(coordsLabels);removeLabels(sectionLabels);targets=[];parts=[];surfaceRecord=null;boxRecord=null;sectionRecord=null;edgeLines=[];contactMarkers=[];sectionPolygon=null;sectionPoints=[];
  syncScenePose();
  if(state.mode==='compose')composeBuild();
  else if(state.mode==='cut')cutBuild();
  else if(state.focus.type==='hemisphere')centeredSolid(state.focus,0);
  else if(['cube','box'].includes(state.focus.type))boxBuild(state.focus);
  else surfaceBuild(state.focus);
  updatePose();drawCoords();if(reframe)frame();updateMath();updateSectionControls();
 }
 let contactMarkers=[];
 function updatePose(){
  if(state.mode==='compose'){
   parts.forEach(({pivot,base,p},i)=>{pivot.position.y=base+M.height(p)/2+state.progress*i*1.35;});
   contactMarkers.forEach(({o,base,index})=>{o.visible=state.progress>.02&&!rotated();o.position.y=base+index*state.progress*1.35;});
  }
  if(state.mode==='cut'){
   if(sectionRecord)updateSection();else parts.forEach(({upper,upperBase})=>{upper.position.y=upperBase+state.progress*1.8;});
  }
  if(surfaceRecord){
   const {p,N,K,geo}=surfaceRecord,positions=geo.attributes.position.array;
   for(let j=0;j<=K;j++)for(let i=0;i<=N;i++){const v=M.surface(p,state.progress,j/K,i/N*Math.PI*2-Math.PI);positions.set(v,(j*(N+1)+i)*3);}
   geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
  }
  if(boxRecord){const e=state.progress*Math.PI/2,{front,back,left,right,top}=boxRecord;front.rotation.x=e;back.rotation.x=-e;left.rotation.z=e;right.rotation.z=-e;top.rotation.x=-Math.PI/2*(1-state.progress);}
  if(state.mode==='unfold'&&state.coords){const visible=state.progress<.001;coordGroup.visible=visible;coordsLabels.forEach(l=>l.el.hidden=!visible);}
  if(coordAnchor&&state.mode==='compose'){const now=coordAnchor.pivot.getWorldPosition(new T.Vector3());coordGroup.position.copy(now.sub(coordAnchor.position));}
  if(state.coords&&sectionRecord){try{updateCoordRows(coordData());}catch(e){/* Invalid axes are already explained in the inspector. */}}
 }
 function current(){return state.mode==='compose'?state.pieces.find(p=>p.id===state.selected)||state.pieces.at(-1):state.focus;}
 function rotated(){return state.pieces.some(p=>p.rotation.some(x=>Math.abs(x)>1e-6));}
 function frame(){
  let size=3,cy=1,cz=0;
  if(state.mode==='compose'){const H=state.pieces.reduce((v,p)=>v+M.height(p),0)+Math.max(0,state.pieces.length-1)*1.35;size=Math.max(3,H,state.pieces.reduce((v,p)=>Math.max(v,p.r?2*p.r:p.a),0));cy=H/2;}
  else {const p=state.focus;size=Math.max(3,M.height(p),p.r?p.r*2:p.a);cy=M.height(p)/2;
   if(state.mode==='cut'&&!['cube','box'].includes(p.type)){const H=M.height(p)+1.8;size=Math.max(size,H);cy=H/2;}
   if(state.mode==='unfold'){if(['cylinder','cone','frustum'].includes(p.type)){
     const bounds=new T.Box3();for(const t of [0,1])for(const u of [0,1])for(let i=0;i<=48;i++)bounds.expandByPoint(new T.Vector3(...M.surface(p,t,u,i/48*2*Math.PI-Math.PI)));
     const extent=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());size=Math.max(3,extent.x,extent.y,extent.z);cy=center.y*.25;cz=center.z;
    }else if(p.type!=='hemisphere'){const [a,b,h]=M.dimensions(p);size=Math.max(a+2*h,2*b+2*h);cy=h*.15;cz=b/2;}}
  }
  const aspect=$('canvas-host').clientWidth/Math.max(1,$('canvas-host').clientHeight),unfold=state.mode==='unfold'&&state.focus.type!=='hemisphere',d=size*(unfold?1.35:1.9)/Math.min(1,aspect);
  controls.target.set(0,cy,cz);camera.position.set(d*(unfold?.45:.7),cy+d*(unfold?.95:.48),cz+d*(unfold?.7:.85));controls.update();
 }
 let sectionPolygon=null,sectionPoints=[],lastSection=null,sectionLabels=[];
 function getPlane(){
  const [a,b,h]=M.dimensions(state.focus);
  if(state.sectionMethod==='points'){const vs=M.vertices(a,b,h);return M.planeFromPoints(state.points.map(({edge,t})=>{const [i,j]=M.edges[edge];return vs[i].map((v,k)=>v+(vs[j][k]-v)*t);}));}
  const plane=M.presetPlane(state.sectionKey,a),bounds=M.planeBounds(a,b,h,plane.n);plane.d+=state.planeShift*(bounds[1]-bounds[0]);
  // Animation sweeps around the chosen target plane; endpoints return to the target.
  plane.d+=Math.sin(state.progress*Math.PI*2)*(bounds[1]-bounds[0])*.12;
  return plane;
 }
 function updateSection(){
  try{const {a,b,h}=sectionRecord,plane=getPlane();lastSection=M.section(a,b,h,plane.n,plane.d);
   if(!sectionPolygon){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(36),3));sectionPolygon=new T.Mesh(geo,new T.MeshBasicMaterial({color:new T.Color(0xe5b782).convertSRGBToLinear(),transparent:true,opacity:.72,side:T.DoubleSide,depthWrite:false}));overlay.add(sectionPolygon);}
   const vs=[];for(let i=1;i<lastSection.points.length-1;i++)vs.push(...lastSection.points[0],...lastSection.points[i],...lastSection.points[i+1]);sectionPolygon.geometry.attributes.position.array.fill(0);sectionPolygon.geometry.attributes.position.array.set(vs);sectionPolygon.geometry.attributes.position.needsUpdate=true;sectionPolygon.geometry.setDrawRange(0,vs.length/3);sectionPolygon.geometry.computeBoundingSphere();sectionPolygon.visible=vs.length>0;
   const markers=lastSection.points.map((p,i)=>({p,text:'P'+(i+1),color:0xe5b782}));
   if(state.sectionMethod==='points'){const v=M.vertices(a,b,h);state.points.forEach(({edge,t},i)=>{const [a,b]=M.edges[edge],p=v[a].map((x,k)=>x+(v[b][k]-x)*t);markers.push({p,text:'Q'+(i+1),color:0x94d9ce});});}
   while(sectionPoints.length<markers.length){sectionPoints.push(addPoint([0,0,0]));label('',[0,0,0],sectionLabels);}
   sectionPoints.forEach((o,i)=>{const m=markers[i];o.visible=!!m;sectionLabels[i].el.hidden=!m;if(m){o.position.set(...m.p);o.material.color.setHex(m.color);sectionLabels[i].pos.set(...m.p);sectionLabels[i].el.textContent=m.text;}});
   const n=lastSection.points.length;$('section-summary').textContent=n>=3?`${n} 个截面顶点 · 面积 ${fmt(lastSection.area)}。棱上三点先定平面，再求与十二条棱的交点。`:n===0?'当前平面与形体不相交。':'平面相切或截面退化，不能称为多边形。';
  }catch(e){lastSection=null;if(sectionPolygon)sectionPolygon.visible=false;sectionPoints.forEach(o=>o.visible=false);sectionLabels.forEach(l=>l.el.hidden=true);$('section-summary').textContent=e.message;}
 }
 function stat(label,value){return `<div class="stat"><span>${label}</span><strong>${fmt(value)}</strong></div>`;}
 function fmt(n){return Number.isFinite(n)?(Math.abs(n)<1e-9?'0':n.toFixed(3).replace(/\.?0+$/,'')):'—';}
 function updateMath(){
  const p=current();if(!p){$('live-math').textContent='选择形体后，显示面积与体积。';$('math-note').textContent='';return;}
  const z=M.measures(p);let html='',note='长度为任意一致单位；面积、体积使用相应平方和立方单位。';
  if(state.mode==='compose'&&state.pieces.length>1){
   const v=state.pieces.reduce((s,p)=>s+M.measures(p).v,0),s=state.pieces.reduce((s,p)=>s+M.measures(p).surf,0),areas=state.pieces.slice(0,-1).map((p,i)=>M.contact(p,state.pieces[i+1]).area),common=areas.reduce((s,x)=>s+x,0);
   html=stat('各部分体积之和',v);if(!rotated()){html+=stat('组合表面积（合拢时）',s-2*common)+`<p class="equation">S = ΣSᵢ − 2ΣS公共<br>公共面面积：${areas.map(fmt).join('、')}</p>`;note='数值对应同轴、未旋转、无体积重叠的合拢模型。拆分后高亮真实公共面；尖顶/球顶接触面积为 0。';}
   else note='形体已独立旋转，可能不再贴合或出现重叠。暂不计算组合外表面积；各部分体积之和不等于有重叠时的并集体积。';
  }else{
   html=stat('体积 V',z.v)+stat('表面积 S',z.surf);
   if(p.type==='cone')html+=`<p class="equation">l = √(r²+h²) = ${fmt(z.l)}<br>θ = 360°r/l = ${fmt(z.theta)}°<br>S侧 = πrl · V = πr²h/3</p>`;
   if(p.type==='frustum')html+=`<p class="equation">l = √((r−r′)²+h²) = ${fmt(z.l)}<br>S侧 = π(r+r′)l<br>V = πh(r²+rr′+r′²)/3</p>`;
   if(p.type==='cylinder')html+=`<p class="equation">S侧 = 2πrh · V = πr²h<br>展开矩形：${fmt(2*Math.PI*p.r)} × ${fmt(p.h)}</p>`;
   if(state.mode==='cut'&&p.type==='cone'){const k=state.cutRatio,rr=p.r*(1-k),low=M.measures({...p,type:'frustum',rp:rr,h:p.h*k}).v;html+=`<p class="equation">截面半径 = r(1−k) = ${fmt(rr)}<br>圆台体积 = ${fmt(low)}<br>V大锥 − V小锥 = ${fmt(z.v-z.v*(1-k)**3)}</p>`;note='k 为从底面向上量的切割高度 / 大圆锥高度。';}
   if(state.mode==='cut'&&p.type==='hemisphere'){const c=M.halfCut(p.r,state.cutRatio);html+=`<p class="equation">截面高度 = ${fmt(c.y)}<br>截面半径 = √(R²−y²) = ${fmt(c.r)}<br>下部体积 = ${fmt(c.lower)}<br>上部球冠体积 = ${fmt(c.upper)}</p>`;note='高度从半球底面（球心所在平面）向上量。两部分体积之和等于原半球体积。';}
   if(state.mode==='unfold'&&p.type==='hemisphere')note='半球曲面不能无伸缩地摊平成平面。此处保留真实半球，展开动画不可用。';
   else if(state.mode==='unfold'&&['cone','frustum'].includes(p.type)){note='只展开侧面；底面不计入展开图。曲面随开度变化，解析公式保留母线长度与同层弧长，网格仅用于显示。';if(p.type==='frustum'&&p.r>p.rp+1e-8){html+=`<p class="equation">扇环外半径 = ${fmt(z.l*p.r/(p.r-p.rp))}<br>扇环内半径 = ${fmt(z.l*p.rp/(p.r-p.rp))}<br>圆心角 = ${fmt(360*(p.r-p.rp)/z.l)}°</p>`;}else if(p.type==='frustum')note='上下底半径相等，按圆柱侧面展开为矩形。';}
   if(state.mode==='cut'&&sectionRecord&&lastSection)html+=stat('截面面积',lastSection.area);
  }
  $('live-math').innerHTML=html;$('math-note').textContent=note;
 }
 function range(parent,{name,key,value,min,max,step=.01,onChange}){
  const wrap=document.createElement('div');wrap.className='param';const label=document.createElement('label'),span=document.createElement('span');span.textContent=name;const num=document.createElement('input');num.type='number';num.min=min;num.max=max;num.step=step;num.value=Number(value.toFixed(3));num.setAttribute('aria-label',name+'精确数值');label.append(span,num);const slider=document.createElement('input');slider.type='range';Object.assign(slider,{min,max,step,value});slider.setAttribute('aria-label',name);slider.dataset.key=key;
  const apply=(raw)=>{const val=Number(raw);if(!Number.isFinite(val)||raw===''){notice('请输入有效数值');num.value=slider.value;return;}const v=Math.max(min,Math.min(max,val));num.value=Number(v.toFixed(3));slider.value=v;onChange(v);};
  slider.addEventListener('input',()=>apply(slider.value));num.addEventListener('change',()=>apply(num.value));wrap.append(label,slider);parent.append(wrap);return wrap;
 }
 function renderParams(){
  const p=current();$('params').replaceChildren();$('inspector-title').textContent=p?defs[p.type].name:'等待一个形体';
  if(!p){$('params').textContent='先添加一个几何体。';return;}
  const fields=p.type==='cube'?[['a','棱长 a',.5,4]]:p.type==='box'?[['a','长 a',.5,4],['b','宽 b',.5,4],['h','高 h',.5,4]]:[['r',p.type==='hemisphere'?'球半径 R':'下底半径 r',.3,2.5],...(p.type==='frustum'?[['rp','上底半径 r′',.1,p.r]]:[]),...(p.type==='hemisphere'?[]:[['h','高 h',.5,4]])];
  fields.forEach(([key,name,min,max])=>range($('params'),{name,key,value:p[key],min,max,step:.05,onChange:v=>{p[key]=v;if(p.type==='frustum'&&p.rp>p.r)p.rp=p.r;state.playing=false;buildScene(false);syncPlayback();if(key==='r'&&p.type==='frustum')renderParams();}}));
  if(state.mode==='cut'&&!['cube','box'].includes(p.type))range($('params'),{name:'切割高度比 k',key:'cutRatio',value:state.cutRatio,min:.05,max:.95,onChange:v=>{state.cutRatio=v;state.playing=false;buildScene(false);syncPlayback();}});
 }
 function updateSectionControls(){
  const open=state.mode==='cut'&&['cube','box'].includes(state.focus.type);$('section-panel').hidden=!open;if(!open)return;
  $('section-method').value=state.sectionMethod;$('plane-control').hidden=state.sectionMethod==='points';$('point-controls').hidden=state.sectionMethod!=='points';$('btn-pick').hidden=state.sectionMethod!=='points';
  $('section-panel').querySelector('h2').textContent=state.focus.type==='box'?'长方体截面':'正方体截面';document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===state.sectionKey&&state.sectionMethod==='preset'));
 }
 function renderSectionControls(){
  $('plane-control').replaceChildren();range($('plane-control'),{name:'平面平移（总跨度比例）',key:'planeShift',value:state.planeShift,min:-.45,max:.45,step:.005,onChange:v=>{state.planeShift=v;state.playing=false;updatePose();drawCoords();updateMath();syncPlayback();}});
  $('point-controls').replaceChildren();state.points.forEach((point,i)=>{const label=document.createElement('label');label.className='select-field';label.textContent='Q'+(i+1)+' 所在棱';const select=document.createElement('select');select.setAttribute('aria-label','Q'+(i+1)+' 所在棱');M.edges.forEach(([a,b],j)=>{const o=new Option(M.names[a]+M.names[b],j);select.add(o);});select.value=point.edge;select.onchange=()=>{point.edge=Number(select.value);state.playing=false;updatePose();drawCoords();updateMath();syncPlayback();};label.append(select);$('point-controls').append(label);range($('point-controls'),{name:'Q'+(i+1)+' 棱上比例',key:'point'+i,value:point.t,min:0,max:1,step:.01,onChange:v=>{point.t=v;state.playing=false;updatePose();drawCoords();updateMath();syncPlayback();}});});updateSectionControls();
 }
 function renderPieces(){
  $('piece-list').replaceChildren();[...state.pieces].reverse().forEach(p=>{
   const div=document.createElement('div');div.className='piece-row';const choose=document.createElement('button');choose.textContent=defs[p.type].name;choose.classList.toggle('selected',p.id===state.selected);choose.onclick=()=>{state.selected=p.id;renderParams();renderPieces();updateMath();drawCoords();renderCoordChoices();};
   const down=document.createElement('button');down.textContent='↓';down.title='下移';down.setAttribute('aria-label',defs[p.type].name+'下移');down.disabled=state.pieces.indexOf(p)===0;down.onclick=()=>{const i=state.pieces.indexOf(p);[state.pieces[i-1],state.pieces[i]]=[state.pieces[i],state.pieces[i-1]];state.progress=0;state.playing=false;render();buildScene(true);};
   const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label','删除'+defs[p.type].name);remove.onclick=()=>{state.pieces=state.pieces.filter(q=>q.id!==p.id);state.selected=state.pieces.at(-1)?.id;state.progress=0;state.playing=false;render();buildScene(true);};div.append(choose,down,remove);$('piece-list').append(div);
  });$('stack-section').hidden=state.mode!=='compose';
 }
 const narration={compose:'公共面为什么需要减去两次？试着拆开，再合起来。',cut:'截面来自同一个平面。先找交点，再沿面连接，不凭视觉猜形状。',unfold:'弯曲的表面摊开后，哪些长度没有改变？用公式核对直觉。'};
 function render(){
  document.body.dataset.palette=state.mode;
  $('rightbar').scrollTop=0;if(state.mode==='compose'&&!state.pieces.some(p=>p.id===state.selected))state.selected=state.pieces.at(-1)?.id;
  syncInteraction();
  document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',b.dataset.mode===state.mode);});document.querySelectorAll('[data-display]').forEach(b=>b.classList.toggle('active',b.dataset.display===state.display));
  $('mode-kicker').textContent={compose:'01 / COMPOSITION',cut:'02 / CROSS SECTION',unfold:'03 / DEVELOPMENT'}[state.mode];$('stage-title').textContent={compose:'形体之间，有新的关系。',cut:'一个平面，打开另一种形状。',unfold:'由曲到直，读懂表面的尺度。'}[state.mode];
  $('stage-count').textContent=state.mode==='compose'?state.pieces.length+' 个形体':defs[state.focus.type].name;$('empty-state').hidden=state.mode!=='compose'||state.pieces.length>0;
  $('narration').textContent=narration[state.mode];$('progress-caption').textContent={compose:'组合 ↔ 拆分',cut:['cube','box'].includes(state.focus.type)?'观察截面平移':'合拢 ↔ 分离',unfold:'收拢 ↔ 展开'}[state.mode];
  renderPieces();renderParams();renderSectionControls();renderCoordChoices();syncPlayback();
 }
 function syncPlayback(){const blocked=state.mode==='unfold'&&state.focus.type==='hemisphere'||state.mode==='compose'&&state.pieces.length<2||state.mode==='cut'&&['cube','box'].includes(state.focus.type)&&state.sectionMethod==='points';
  $('btn-play').disabled=blocked;$('btn-action').disabled=blocked;$('progress').disabled=blocked;$('btn-play').textContent=state.playing?'Ⅱ':'▶';$('btn-play').setAttribute('aria-label',state.playing?'暂停动画':'播放动画');$('progress').value=Math.round(state.progress*100);$('progress-value').textContent=Math.round(state.progress*100)+'%';
  $('btn-action').textContent=state.mode==='compose'?(state.progress>.5?'组合':'拆分'):state.mode==='cut'?(sectionRecord?'扫过截面':state.progress>.5?'合拢':'分离'):state.progress>.5?'收拢':'展开';
 }
 function syncInteraction(){$('btn-lock').classList.toggle('active',state.lock);$('btn-lock').setAttribute('aria-pressed',state.lock);$('btn-pick').textContent=state.picking?'停止选点':'在舞台棱上选点';$('interaction-status').textContent=state.picking?'依次点击三条棱选择 Q1、Q2、Q3 · 拖动空白转视角':state.lock?'物体已锁定 · 拖动转视角 · 滚轮缩放':state.mode==='unfold'?'拖动转视角 · 滚轮缩放 · 进度控制展开':'空白处拖动转视角 · 滚轮缩放 · 拖动形体旋转';}
 const coordGroup=new T.Group();scene.add(coordGroup);let coordAnchor=null;
 const directions={AB:[1,0,0],AD:[0,0,-1],'AA₁':[0,1,0],BA:[-1,0,0],DA:[0,0,1],'A₁A':[0,-1,0],AC:[1,0,-1]};
 function coordData(){
  const p=current();if(!p)return null;let points={},origin,B;
  if(['cube','box'].includes(p.type)){const [a,b,h]=M.dimensions(p),vs=M.vertices(a,b,h);vs.forEach((v,i)=>points[M.names[i]]=v);points['底心']=[0,0,0];points['体心']=[0,h/2,0];points['AB中点']=[0,0,b/2];origin=points[state.origin]||points.A;
   const actual={...directions,AC:[a,0,-b]};B=M.basis(actual[state.axisX]||directions.AB,actual[state.axisY]||directions.AD);
  }else{points={'底心':[0,0,0],'顶点/顶心':[0,M.height(p),0],'底缘':[p.r,0,0]};origin=points[state.origin]||points['底心'];B=[[1,0,0],[0,0,-1],[0,1,0]];}
  if(state.mode==='cut'&&sectionRecord&&lastSection)lastSection.points.forEach((v,i)=>points['P'+(i+1)]=v);
  return {p,origin,B,points};
 }
 function transformOfCurrent(){const p=current();const rec=parts.find(rec=>rec.p===p&&rec.pivot);return rec?.pivot||null;}
 function coordWorld(v){const pivot=transformOfCurrent();if(pivot){const p=current();return pivot.localToWorld(new T.Vector3(v[0],v[1]-M.height(p)/2,v[2]));}return pose.localToWorld(new T.Vector3(...v));}
 function drawCoords(){
  clear(coordGroup);coordGroup.position.set(0,0,0);coordAnchor=null;removeLabels(coordsLabels);if(!state.coords){$('coords-warning').textContent='';return;}
  try{const data=coordData();if(!data)return;const {p,origin,B,points}=data;const start=coordWorld(origin),length=Math.max(1.2,M.height(p)*.8),colors=[0xefa898,0x89cabb,0xa9bfe9];
   B.forEach((v,i)=>{const end=coordWorld(origin.map((x,k)=>x+v[k]*length)),dir=end.clone().sub(start).normalize();coordGroup.add(new T.ArrowHelper(dir,start,length,colors[i],.14,.07));const lab=end.toArray();label(['x','y','z'][i],lab,coordsLabels);});
   const ball=addPoint(start.toArray(),0xf4e7d0,.065,coordGroup);label('O',start.toArray(),coordsLabels);
   updateCoordRows(data);const pivot=transformOfCurrent();if(pivot)coordAnchor={pivot,position:pivot.getWorldPosition(new T.Vector3())};
   $('coords-warning').textContent=state.mode==='unfold'&&state.progress>.001?'展开中暂时收起坐标轴。':'正交校验通过 · z 轴由 x × y 确定';coordGroup.visible=!(state.mode==='unfold'&&state.progress>.001);coordsLabels.forEach(l=>l.el.hidden=!coordGroup.visible);renderCompare();
  }catch(e){$('coords-warning').textContent=e.message;$('coord-table').replaceChildren();$('btn-snapshot').disabled=true;return;}$('btn-snapshot').disabled=false;
 }
 function updateCoordRows(data){if(!data)return;const {p,points,origin,B}=data,symbolic=state.coordUnit==='edge'&&p.type==='cube',div=symbolic?p.a:1;const rows=Object.entries(points).map(([name,v])=>{const c=M.coordinates(v,origin,B).map(x=>x/div);return `<tr><td>${name}</td><td>(${c.map(fmt).join(', ')})${symbolic?'a':''}</td></tr>`;}).join('');const html='<table><thead><tr><th>点</th><th>坐标 (x, y, z)</th></tr></thead><tbody>'+rows+'</tbody></table>';if($('coord-table').innerHTML!==html)$('coord-table').innerHTML=html;}
 function renderCoordChoices(){
  const p=current(),isBox=p&&['cube','box'].includes(p.type);const origins=isBox?['A','B','C','D','A₁','B₁','C₁','D₁','底心','体心','AB中点']:['底心','顶点/顶心'];
  if(!origins.includes(state.origin))state.origin=origins[0];$('origin').replaceChildren(...origins.map(n=>new Option(n,n)));$('origin').value=state.origin;
  ['axis-x','axis-y'].forEach((id,i)=>{const sel=$(id);sel.replaceChildren(...Object.keys(directions).map(n=>new Option(n,n)));sel.value=i?state.axisY:state.axisX;sel.disabled=!isBox;});
  $('coords-panel').hidden=!state.coords;$('btn-coords').setAttribute('aria-expanded',state.coords);$('btn-coords').querySelector('span').textContent=state.coords?'−':'＋';
  $('coord-unit').value=state.coordUnit;$('coord-unit').disabled=p?.type!=='cube';drawCoords();
 }
 function renderCompare(){
  if(!state.snapshots.length){$('coord-compare').textContent='最多保存两套建系，比较同一尺寸形体各点的坐标。';return;}
  const names=[...new Set(state.snapshots.flatMap(s=>Object.keys(s.rows)))];$('coord-compare').innerHTML=`<table><thead><tr><th>点</th>${state.snapshots.map(s=>`<th>${s.origin}<br>${s.x}/${s.y}</th>`).join('')}</tr></thead><tbody>${names.map(n=>`<tr><td>${n}</td>${state.snapshots.map(s=>`<td>(${(s.rows[n]||[]).map(fmt).join(', ')})</td>`).join('')}</tr>`).join('')}</tbody></table><p>快照使用保存时的数值与尺寸。</p>`;
 }
 const formulaRows=[
 ['cube','正方体','S侧 = 4a²','S表 = 6a²','V = a³'],['box','长方体','S侧 = 2(a+b)h','S表 = 2(ab+ah+bh)','V = abh'],['cylinder','圆柱','S侧 = 2πrh','S表 = 2πr(h+r)','V = πr²h'],['cone','圆锥','S侧 = πrl','S表 = πr(l+r)','V = πr²h/3'],['frustum','圆台','S侧 = π(r+r′)l','S表 = S侧 + πr² + πr′²','V = πh(r²+rr′+r′²)/3'],['hemisphere','半球','曲面面积 = 2πR²','含底表面积 = 3πR²','V = 2πR³/3'],[null,'直棱柱','S侧 = 底面周长 × 高','S表 = S侧 + 2S底','V = S底h（体积也适用于斜棱柱）'],[null,'棱锥 / 棱台','S侧 = 各侧面面积之和','S表 = S侧 + 底面面积之和','V锥 = S底h/3；V台 = h(S上+S下+√(S上S下))/3'],[null,'球','曲面无等距平面展开图','S表 = 4πR²','V = 4πR³/3']
 ];
 $('formula-panel').innerHTML=formulaRows.map(([type,name,...rows])=>`<div class="formula-row">${type?`<button data-formula="${type}">${name} ↗</button>`:`<h2>${name}</h2>`}<p>${rows.join('<br>')}</p></div>`).join('');
 document.querySelectorAll('[data-formula]').forEach(b=>b.onclick=()=>{const p=piece(b.dataset.formula);if(state.mode==='compose'){state.pieces=[p];state.selected=p.id;}else state.focus=p;state.progress=0;state.playing=false;render();buildScene(true);});
 function add(type){
  const p=piece(type);if(state.mode==='compose'){if(state.pieces.length>=8){notice('最多搭配 8 个形体，便于投影观察。');return;}state.pieces.push(p);state.selected=p.id;}else state.focus=p;state.progress=0;state.playing=false;state.snapshots=[];render();buildScene(true);closePanels();
 }
 $('solid-list').innerHTML=Object.entries(defs).map(([type,d])=>`<button class="solid-card" data-solid="${type}" draggable="true" aria-label="选择${d.name}"><svg viewBox="0 0 46 44" aria-hidden="true"><path d="${icons[type]}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg><span>${d.name}</span><small>${d.hint}</small></button>`).join('');
 document.querySelectorAll('[data-solid]').forEach(b=>{b.onclick=()=>add(b.dataset.solid);b.ondragstart=e=>e.dataTransfer.setData('text/solid',b.dataset.solid);});
 $('stage').ondragover=e=>e.preventDefault();$('stage').ondrop=e=>{e.preventDefault();const type=e.dataTransfer.getData('text/solid');if(defs[type])add(type);};
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;state.progress=0;state.playing=false;state.picking=false;root.rotation.set(0,0,0);render();buildScene(true);});
 document.querySelectorAll('[data-display]').forEach(b=>b.onclick=()=>{state.display=b.dataset.display;render();buildScene(false);});
 $('btn-clear').onclick=()=>{state.pieces=[];state.playing=false;state.progress=0;render();buildScene(false);};
 $('btn-play').onclick=()=>{if(state.playing){state.playing=false;}else{if(state.progress>=1)state.direction=-1;else if(state.progress<=0)state.direction=1;state.playing=true;}syncPlayback();};
 $('btn-action').onclick=()=>{state.direction=state.progress>.5?-1:1;state.playing=true;syncPlayback();};
 $('progress').oninput=()=>{state.progress=Number($('progress').value)/100;state.playing=false;updatePose();drawCoords();updateMath();syncPlayback();};$('speed').onchange=()=>state.speed=Number($('speed').value);
 $('btn-lock').onclick=()=>{state.lock=!state.lock;syncInteraction();};
 $('btn-reset').onclick=frame;$('btn-reset-object').onclick=()=>{state.pieces.forEach(p=>p.rotation=[0,0,0]);state.focus.rotation=[0,0,0];root.rotation.set(0,0,0);buildScene(false);};
 $('btn-fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen().catch(()=>notice('无法退出全屏'));else document.documentElement.requestFullscreen?.().catch(()=>notice('浏览器未允许全屏'));};
 $('btn-classroom').onclick=()=>{state.classroom=!state.classroom;document.body.classList.toggle('classroom',state.classroom);$('btn-classroom').classList.toggle('active',state.classroom);$('btn-classroom').textContent=state.classroom?'退出课堂':'课堂模式';requestAnimationFrame(resize);};
 $('btn-coords').onclick=()=>{state.coords=!state.coords;renderCoordChoices();};$('btn-formulas').onclick=()=>{state.formulas=!state.formulas;$('formula-panel').hidden=!state.formulas;$('btn-formulas').setAttribute('aria-expanded',state.formulas);$('btn-formulas').querySelector('span').textContent=state.formulas?'−':'＋';};
 $('origin').onchange=()=>{state.origin=$('origin').value;drawCoords();};$('axis-x').onchange=()=>{state.axisX=$('axis-x').value;drawCoords();};$('axis-y').onchange=()=>{state.axisY=$('axis-y').value;drawCoords();};$('coord-unit').onchange=()=>{state.coordUnit=$('coord-unit').value;drawCoords();};
 $('btn-snapshot').onclick=()=>{try{const d=coordData();if(!d)return;const identity=JSON.stringify([d.p.type,...M.dimensions(d.p),d.p.r,d.p.rp]);if(state.snapshots.length&&state.snapshots[0].identity!==identity){state.snapshots=[];notice('形体或尺寸已变化，开始新的建系对比。');}state.snapshots.push({identity,origin:state.origin,x:state.axisX,y:state.axisY,rows:Object.fromEntries(Object.entries(d.points).map(([n,p])=>[n,M.coordinates(p,d.origin,d.B)]))});if(state.snapshots.length>2)state.snapshots.shift();renderCompare();}catch(e){notice(e.message);}};
 $('btn-clear-snapshots').onclick=()=>{state.snapshots=[];renderCompare();};
 document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{state.sectionKey=b.dataset.section;state.sectionMethod='preset';state.planeShift=0;state.progress=0;state.playing=false;state.picking=false;renderSectionControls();updatePose();drawCoords();updateMath();syncPlayback();});
 $('section-method').onchange=()=>{state.sectionMethod=$('section-method').value;state.picking=false;state.playing=false;renderSectionControls();updatePose();drawCoords();updateMath();syncPlayback();};
 $('btn-pick').onclick=()=>{state.picking=!state.picking;state.pickIndex=0;state.lock=true;state.playing=false;$('btn-lock').classList.add('active');$('btn-lock').setAttribute('aria-pressed','true');$('btn-pick').textContent=state.picking?'停止选点':'在舞台棱上选点';$('interaction-status').textContent=state.picking?'依次点击三条棱，选 Q1、Q2、Q3。拖动空白仍可转视角。':'空白拖动转视角 · 滚轮缩放';};
 document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{const key=b.dataset.lesson;state.progress=0;state.playing=false;state.snapshots=[];state.planeShift=0;state.picking=false;
  if(key==='rocket'){state.mode='compose';state.pieces=[piece('cylinder'),piece('cone')];state.selected=state.pieces[0].id;}
  if(key==='cone-cut'){state.mode='cut';state.focus=piece('cone');}
  if(key==='cube-section'){state.mode='cut';state.focus=piece('cube');state.sectionKey='hexagon';state.sectionMethod='preset';}
  if(key==='cone-net'){state.mode='unfold';state.focus=piece('cone');}
  render();buildScene(true);closePanels();
 });
 let dragging=null,down=null;const ray=new T.Raycaster();ray.params.Line.threshold=.065;
 function hit(e,objects){const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1),camera);const hits=ray.intersectObjects(objects,true);if(objects===edgeLines){const score=h=>{const p=h.point.clone().project(camera);return Math.hypot(r.left+(p.x*.5+.5)*r.width-e.clientX,r.top+(-p.y*.5+.5)*r.height-e.clientY);};hits.sort((a,b)=>score(a)-score(b));}return hits[0];}
 renderer.domElement.addEventListener('pointerdown',e=>{
  down={x:e.clientX,y:e.clientY};if(e.button!==0||state.lock||state.picking||state.mode==='unfold')return;
  const h=hit(e,targets);if(!h)return;let target=h.object;while(target&&!target.userData.piece)target=target.parent;if(!target)return;
  // Composed pieces rotate individually only when separated; cut parts rotate as a single scene.
  if(state.mode==='compose'&&state.pieces.length>1&&state.progress<.4){notice('先拆分再独立拖转形体；合拢时保留公共面关系。');return;}
  dragging={id:e.pointerId,x:e.clientX,y:e.clientY,object:state.mode==='compose'?target.userData.pivot:pose,p:state.mode==='compose'?target.userData.piece:state.focus};controls.enabled=false;state.playing=false;syncPlayback();renderer.domElement.setPointerCapture(e.pointerId);e.preventDefault();
 },true);
 renderer.domElement.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==dragging.id)return;const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;dragging.x=e.clientX;dragging.y=e.clientY;dragging.object.rotation.y+=dx*.008;dragging.object.rotation.x+=dy*.008;if(dragging.p)dragging.p.rotation=dragging.object.rotation.toArray().slice(0,3);syncScenePose();updatePose();drawCoords();updateMath();});
 function release(e){if(dragging){if(renderer.domElement.hasPointerCapture(dragging.id))renderer.domElement.releasePointerCapture(dragging.id);dragging=null;controls.enabled=true;}
  if(e.type==='pointerup'&&state.picking&&down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6){const h=hit(e,edgeLines);if(h){const edge=h.object.userData.edge,[i,j]=M.edges[edge],[a,b,c]=M.dimensions(state.focus),vs=M.vertices(a,b,c),A=new T.Vector3(...vs[i]),B=new T.Vector3(...vs[j]),local=overlay.worldToLocal(h.point.clone()),AB=B.clone().sub(A),t=Math.max(0,Math.min(1,local.sub(A).dot(AB)/AB.lengthSq()));state.points[state.pickIndex]={edge,t};state.pickIndex++;if(state.pickIndex===3){state.picking=false;$('btn-pick').textContent='在舞台棱上选点';notice('三个点已选定，可调整棱上比例。');}else notice('已选 Q'+state.pickIndex+'，继续选择 Q'+(state.pickIndex+1));renderSectionControls();updatePose();drawCoords();updateMath();}}
   if(!state.picking)syncInteraction();down=null;
 }
 renderer.domElement.addEventListener('pointerup',release);renderer.domElement.addEventListener('pointercancel',release);renderer.domElement.addEventListener('lostpointercapture',()=>{dragging=null;controls.enabled=true;});renderer.domElement.addEventListener('dblclick',frame);
 function closePanels(){$('leftbar').classList.remove('open');$('rightbar').classList.remove('open');$('overlay').hidden=true;}
 $('btn-mobile-left').onclick=()=>{const open=$('leftbar').classList.contains('open');closePanels();if(!open){$('leftbar').classList.add('open');$('overlay').hidden=false;}};$('btn-mobile-right').onclick=()=>{const open=$('rightbar').classList.contains('open');closePanels();if(!open){$('rightbar').classList.add('open');$('overlay').hidden=false;}};$('overlay').onclick=closePanels;
 function exportState(){return {format:'xingjian-geometry',version:1,state:{...state,picking:false,playing:false,snapshots:[]},camera:{position:camera.position.toArray(),target:controls.target.toArray()}};}
 function validateScene(doc){
  if(doc?.format!=='xingjian-geometry'||doc.version!==1)throw Error('这不是形间场景文件，或版本不受支持。');const s=doc.state;if(!s||!['compose','cut','unfold'].includes(s.mode)||!['solid','ghost','wire'].includes(s.display))throw Error('场景模式无效');
  const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  const vector=(v)=>Array.isArray(v)&&v.length===3&&v.every(x=>finite(x,-100,100));
  const check=p=>{if(!p||!defs[p.type]||!Number.isInteger(p.id)||!vector(p.rotation))throw Error('形体数据无效');for(const k of Object.keys(defs[p.type].defaults))if(!finite(p[k],.1,10))throw Error('形体尺寸超出支持范围');if(p.type==='frustum'&&p.rp>p.r)throw Error('上底半径不能大于下底半径');};
  if(!Array.isArray(s.pieces)||s.pieces.length>8)throw Error('形体数量无效');s.pieces.forEach(check);if(new Set(s.pieces.map(p=>p.id)).size!==s.pieces.length)throw Error('形体编号重复');check(s.focus);
  if(!finite(s.progress,0,1)||!finite(s.speed,.5,2)||!finite(s.cutRatio,.05,.95)||!finite(s.planeShift,-.45,.45)||![1,-1].includes(s.direction))throw Error('参数范围无效');if(!Object.hasOwn(M.presets,s.sectionKey)||!['preset','points'].includes(s.sectionMethod))throw Error('截面设置无效');
  if(!Array.isArray(s.points)||s.points.length!==3||s.points.some(p=>!Number.isInteger(p.edge)||p.edge<0||p.edge>11||!finite(p.t,0,1)))throw Error('截面选点无效');
  if(!Object.hasOwn(directions,s.axisX)||!Object.hasOwn(directions,s.axisY)||!['number','edge'].includes(s.coordUnit)||!['A','B','C','D','A₁','B₁','C₁','D₁','底心','体心','AB中点','顶点/顶心'].includes(s.origin))throw Error('建系设置无效');for(const key of ['lock','coords','formulas','classroom'])if(typeof s[key]!=='boolean')throw Error('界面状态无效');if(!vector(doc.camera?.position)||!vector(doc.camera?.target)||M.norm(M.sub(doc.camera.position,doc.camera.target))<.01)throw Error('视角数据无效');
  const clean=Object.fromEntries(['mode','display','selected','progress','direction','speed','lock','cutRatio','sectionKey','sectionMethod','planeShift','coords','origin','axisX','axisY','coordUnit','formulas','classroom'].map(k=>[k,s[k]]));
  const cleanPiece=p=>({id:p.id,type:p.type,rotation:p.rotation.slice(),...Object.fromEntries(Object.keys(defs[p.type].defaults).map(k=>[k,p[k]]))});clean.pieces=s.pieces.map(cleanPiece);clean.focus=cleanPiece(s.focus);clean.points=s.points.map(p=>({edge:p.edge,t:p.t}));return clean;
 }
 $('btn-save').onclick=()=>{const blob=new Blob([JSON.stringify(exportState(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='形间-备课场景.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('场景已下载，包含形体、参数、截面、建系和视角。');};
 $('btn-load').onclick=()=>$('load-file').click();$('load-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>200000)throw Error('场景文件过大');const doc=JSON.parse(await file.text()),s=validateScene(doc);Object.assign(state,s,{playing:false,picking:false,snapshots:[]});uid=Math.max(...state.pieces.map(p=>p.id),state.focus.id)+1;root.rotation.set(0,0,0);document.body.classList.toggle('classroom',state.classroom);$('btn-classroom').textContent=state.classroom?'退出课堂':'课堂模式';$('btn-classroom').classList.toggle('active',state.classroom);$('btn-lock').classList.toggle('active',state.lock);$('btn-lock').setAttribute('aria-pressed',state.lock);$('formula-panel').hidden=!state.formulas;$('btn-formulas').setAttribute('aria-expanded',state.formulas);$('speed').value=state.speed;render();buildScene(false);camera.position.fromArray(doc.camera.position);controls.target.fromArray(doc.camera.target);controls.update();notice('备课场景已恢复。');}catch(e){notice('无法打开：'+e.message);}finally{$('load-file').value='';}};
 window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='Escape')closePanels();if(e.key.toLowerCase()==='f')$('btn-formulas').click();if(e.code==='Space'){e.preventDefault();if(!$('btn-play').disabled)$('btn-play').click();}});
 function resize(){const w=$('canvas-host').clientWidth,h=$('canvas-host').clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}}
 new ResizeObserver(resize).observe($('canvas-host'));
 function updateLabels(){root.updateMatrixWorld(true);overlay.updateMatrixWorld(true);coordGroup.updateMatrixWorld(true);const w=$('canvas-host').clientWidth,h=$('canvas-host').clientHeight;
  [...labels,...sectionLabels,...coordsLabels].forEach(l=>{let v=l.pos.clone();if(l.anchor)v=l.anchor.localToWorld(v);else if(coordsLabels.includes(l))v.add(coordGroup.position);else if(state.mode==='cut')v=overlay.localToWorld(v);v.project(camera);l.el.style.left=((v.x*.5+.5)*w)+'px';l.el.style.top=((-v.y*.5+.5)*h)+'px';l.el.style.display=v.z<1&&v.z>-1?'block':'none';});
 }
 let last=performance.now(),frameMs=[],mathClock=0;
 function animate(ts){requestAnimationFrame(animate);const elapsed=ts-last,dt=Math.min(.05,elapsed/1000);last=ts;if(document.visibilityState==='visible')frameMs.push(elapsed);if(frameMs.length>180)frameMs.shift();
  if(state.playing){state.progress=Math.max(0,Math.min(1,state.progress+state.direction*dt*state.speed*.22));updatePose();syncPlayback();mathClock+=dt;if(mathClock>.15){updateMath();mathClock=0;}if(state.progress===0||state.progress===1){state.playing=false;updatePose();drawCoords();updateMath();syncPlayback();}}
  controls.update();updateLabels();renderer.render(scene,camera);
 }
 window.APP={state,exportState,validateScene,metrics:()=>({geometryBuilds,geometries:renderer.info.memory.geometries,drawCalls:renderer.info.render.calls,medianFrameMs:[...frameMs].sort((a,b)=>a-b)[Math.floor(frameMs.length/2)]}),section:()=>lastSection,camera:()=>({position:camera.position.toArray(),target:controls.target.toArray()}),surface:()=>surfaceRecord?.geo,boxFaces:()=>{if(!boxRecord)return [];boxRecord.g.updateWorldMatrix(true,true);const faces=[];boxRecord.g.traverse(o=>{if(o.isMesh){const arr=o.geometry.attributes.position;faces.push(Array.from({length:arr.count},(_,i)=>o.localToWorld(new T.Vector3().fromBufferAttribute(arr,i)).toArray()));}});return faces;},projected:()=>{root.updateMatrixWorld(true);overlay.updateMatrixWorld(true);const r=renderer.domElement.getBoundingClientRect();const screen=v=>{v.project(camera);return {x:r.x+(v.x*.5+.5)*r.width,y:r.y+(-v.y*.5+.5)*r.height};};return {pieces:parts.filter(p=>p.pivot).map(p=>({id:p.p.id,...screen(p.pivot.getWorldPosition(new T.Vector3()))})),edges:edgeLines.map(line=>{const positions=line.geometry.attributes.position;return screen(overlay.localToWorld(new T.Vector3().fromBufferAttribute(positions,0).add(new T.Vector3().fromBufferAttribute(positions,1)).multiplyScalar(.5)));})};},math:M};
 window.APP.alignment=()=>{
  if(!sectionRecord)return null;scene.updateMatrixWorld(true);const rec=parts.find(p=>p.p===state.focus);let body=null;rec.pivot.traverse(o=>{if(o.isMesh&&!body)body=o;});
  const [a,b,h]=M.dimensions(state.focus),corners=M.vertices(a,b,h).map(v=>overlay.localToWorld(new T.Vector3(...v))),positions=body.geometry.attributes.position;
  const actual=Array.from({length:positions.count},(_,i)=>body.localToWorld(new T.Vector3().fromBufferAttribute(positions,i)));
  const cornerError=Math.max(...corners.map(v=>Math.min(...actual.map(w=>v.distanceTo(w)))));
  const coordinateError=Math.max(...M.vertices(a,b,h).map((v,i)=>coordWorld(v).distanceTo(corners[i])));
  const sectionSurfaceError=Math.max(0,...(lastSection?.points||[]).map(p=>{const v=body.worldToLocal(overlay.localToWorld(new T.Vector3(...p)));return Math.max(Math.min(Math.abs(Math.abs(v.x)-a/2),Math.abs(Math.abs(v.y)-h/2),Math.abs(Math.abs(v.z)-b/2)),Math.abs(v.x)-a/2,Math.abs(v.y)-h/2,Math.abs(v.z)-b/2);}));
  return {cornerError,coordinateError,sectionSurfaceError,rotation:state.focus.rotation.slice()};
 };
 render();buildScene(true);resize();requestAnimationFrame(animate);
})();

