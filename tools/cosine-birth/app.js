/* 三维坐标 (α, cos(α+φ), sin(α+φ))，正视投影为余弦曲线。 */
(() => {
  'use strict';
  const M=CosineMath,$=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state={alpha:126*Math.PI/180,phase:0,speed:1,playing:!reduced,view:'free'};
  const selfChecks=M.selfCheck();
  const color={ink:'#52685f',blue:'#377d70',faint:'#91a79a',light:'#81cdb3'};
  let renderer,scene,camera,orbit,helix,projection,moving,foot,guide,dirty=true,last=0,toastTimer;
  let sceneWidth=1,sceneHeight=1;
  const center=M.MAX/2,segments=960,radialScale=2.4;
  const labels=[];
  function notify(message){$('status').textContent=message;$('status').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('status').classList.remove('visible'),3000);}
  function canvasContext(canvas){
    const r=canvas.getBoundingClientRect(),dpr=Math.min(Math.max(devicePixelRatio||1,1.5),2),w=Math.max(1,r.width),h=Math.max(1,r.height);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return {ctx,w,h};
  }
  function line2(ctx,x1,y1,x2,y2,stroke,width=1,dash=[]){ctx.beginPath();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);}
  function text2(ctx,text,x,y,size=12,align='center',fill=color.ink){ctx.font=`italic ${size}px "Times New Roman",serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=fill;ctx.fillText(text,x,y);}
  function dot2(ctx,x,y,r=4){const fill=ctx.createRadialGradient(x-r*.3,y-r*.4,0,x,y,r);fill.addColorStop(0,'#9be8fb');fill.addColorStop(.45,'#279cd0');fill.addColorStop(1,'#1178af');ctx.beginPath();ctx.arc(x,y,r,0,M.TAU);ctx.fillStyle=fill;ctx.shadowColor='#288ac13b';ctx.shadowBlur=7;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#edfaff';ctx.lineWidth=1.5;ctx.stroke();}
  function arrow2(ctx,x1,y1,x2,y2){line2(ctx,x1,y1,x2,y2,color.ink,1.15);const a=Math.atan2(y2-y1,x2-x1);ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-6*Math.cos(a-.4),y2-6*Math.sin(a-.4));ctx.lineTo(x2-6*Math.cos(a+.4),y2-6*Math.sin(a+.4));ctx.closePath();ctx.fillStyle=color.ink;ctx.fill();}
  function drawCircle(s){
    const {ctx,w,h}=canvasContext($('circle')),r=Math.min(w*.3,h*.37),cx=w/2,cy=h*.51,px=cx+r*s.y,py=cy-r*s.z;
    arrow2(ctx,cx-r-24,cy,cx+r+24,cy);arrow2(ctx,cx,cy+r+17,cx,cy-r-20);
    text2(ctx,'x',cx+r+27,cy+12);text2(ctx,'y',cx+11,cy-r-18);text2(ctx,'O',cx-9,cy+12);
    const wash=ctx.createRadialGradient(cx-r*.3,cy-r*.4,0,cx,cy,r);wash.addColorStop(0,'#ffffff38');wash.addColorStop(1,'#b3d6e21c');
    ctx.fillStyle=wash;ctx.strokeStyle=color.blue;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,r,0,M.TAU);ctx.fill();ctx.stroke();
    const arcR=Math.min(23,r*.35);
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,arcR,0,-s.wrapped,true);ctx.closePath();ctx.fillStyle='#1999d31a';ctx.fill();ctx.strokeStyle='#3c8db477';ctx.lineWidth=1;ctx.stroke();
    line2(ctx,cx,cy,px,py,color.blue,1.7);line2(ctx,px,py,px,cy,color.faint,1,[3,3]);line2(ctx,px,py,cx,py,color.faint,1,[3,3]);
    line2(ctx,cx,cy,px,cy,'#4c9784',2.4);dot2(ctx,px,py,4);
    text2(ctx,M.fixed(s.y),px,cy+(s.z>=0?13:-13),11);text2(ctx,M.fixed(s.z),cx+(s.y>=0?-8:8),py,11,s.y>=0?'right':'left');
    text2(ctx,'θ₀',cx+arcR*.9,cy-arcR-5,12);
    let ty=py+(s.z>0?-15:17);ty=Math.max(14,Math.min(h-12,ty));
    const label=`P(${M.fixed(s.y)}, ${M.fixed(s.z)})`,tx=Math.max(58,Math.min(w-58,px));text2(ctx,label,tx,ty,11);
  }
  function drawGraph(s){
    const {ctx,w,h}=canvasContext($('graph')),left=25,right=w-16,cy=h*.5,amp=h*.3,span=right-left;
    arrow2(ctx,left,cy,left+span+7,cy);arrow2(ctx,left,cy+amp+10,left,cy-amp-18);
    text2(ctx,'y',left+10,cy-amp-16,12);text2(ctx,'α',right+4,cy+14,12);
    for(let k=0;k<=4;k++){const x=left+span*k/4;line2(ctx,x,cy-3,x,cy+3,color.ink);text2(ctx,k===0?'0':k===1?'π':k+'π',x,cy+amp+13,11);}
    text2(ctx,'1',left-10,cy-amp,11);text2(ctx,'−1',left-12,cy+amp,11);text2(ctx,'0',left-9,cy+8,11);
    function curve(end,stroke,width){ctx.beginPath();const n=Math.max(1,Math.ceil(end*25));for(let i=0;i<=n;i++){const a=end*i/n,x=left+span*a/M.MAX,y=cy-Math.cos(a+state.phase)*amp;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
    curve(M.MAX,'#709caf66',1.6);curve(s.alpha,color.blue,2.25);
    const x=left+span*s.alpha/M.MAX,y=cy-s.y*amp;line2(ctx,x,y,x,cy,color.faint,1,[3,3]);dot2(ctx,x,y,3.6);
    const label=`Q(${M.fixed(s.alpha)}, ${M.fixed(s.y)})`,tx=Math.max(76,Math.min(w-73,x)),ty=Math.max(11,y-14);text2(ctx,label,tx,ty,11);
  }
  function line3(points,hex,opacity=1,dashed=false){
    const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
    const tint=new THREE.Color(hex).convertSRGBToLinear();
    const material=dashed?new THREE.LineDashedMaterial({color:tint,transparent:true,opacity,dashSize:.13,gapSize:.09}):new THREE.LineBasicMaterial({color:tint,transparent:opacity<1,opacity});
    material.toneMapped=false;
    const positions=geometry.attributes.position;for(let i=0;i<positions.count;i++){positions.setY(i,positions.getY(i)*radialScale);positions.setZ(i,positions.getZ(i)*radialScale);}
    const line=new THREE.Line(geometry,material);if(dashed)line.computeLineDistances();scene.add(line);return line;
  }
  function label3(text,p,align='center',offset=[0,0],font=16){labels.push({text,p:new THREE.Vector3(...p),align,offset,font});}
  function axis3(from,to){
    const scale=new THREE.Vector3(1,radialScale,radialScale),a=new THREE.Vector3(...from).multiply(scale),b=new THREE.Vector3(...to).multiply(scale),dir=b.clone().sub(a).normalize();
    const arrow=new THREE.ArrowHelper(dir,a,b.distanceTo(a),new THREE.Color(0x91b1a7).convertSRGBToLinear(),.16,.055);arrow.line.material.toneMapped=false;arrow.cone.material.toneMapped=false;scene.add(arrow);
  }
  function makeTube(projected=false){
    class Curve extends THREE.Curve {getPoint(t,target=new THREE.Vector3()){const s=M.sample(t*M.MAX,state.phase);return target.set(s.x,s.y*radialScale,projected?0:s.z*radialScale);}}
    const geometry=new THREE.TubeGeometry(new Curve(),segments,projected?.026:.048,20,false);
    if(!projected){
      const stops=[0x3c86f4,0x9260e7,0xed6b9d].map(hex=>new THREE.Color(hex).convertSRGBToLinear()),positions=geometry.attributes.position,colors=new Float32Array(positions.count*3),tint=new THREE.Color();
      // Color follows spatial x for decoration; it does not encode function values.
      for(let i=0;i<positions.count;i++){const t=Math.max(0,Math.min(1,positions.getX(i)/M.MAX))*2,index=t<1?0:1;tint.copy(stops[index]).lerp(stops[index+1],t-index);tint.toArray(colors,i*3);}
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    }
    return geometry;
  }
  function rebuildCurves(){
    if(!renderer)return;
    for(const [mesh,projected] of [[helix,false],[projection,true]]){mesh.geometry.dispose();mesh.geometry=makeTube(projected);}
    dirty=true;
  }
  function setupScene(){
    try{
      renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:true,preserveDrawingBuffer:false});
      renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio||1,1.5),2));renderer.setClearColor(0x000000,0);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
      scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-8,8,5,-5,.1,120);
      const room=new THREE.Scene();room.add(new THREE.Mesh(new THREE.BoxGeometry(40,30,40),new THREE.MeshBasicMaterial({color:0xb6c5d8,side:THREE.BackSide})));
      for(const [x,y,z,w,h]of [[-6,9,7,18,7],[9,3,-9,8,16],[-13,-1,-4,5,18]]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xffffff}));panel.position.set(x,y,z);panel.lookAt(0,0,0);room.add(panel);}
      const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(room,.05).texture;pmrem.dispose();room.traverse(item=>{if(item.isMesh){item.geometry.dispose();item.material.dispose();}});
      scene.add(new THREE.HemisphereLight(0xeef6ff,0x647a96,.65));
      const key=new THREE.DirectionalLight(0xffffff,1.6);key.position.set(-3,9,12);scene.add(key);
      const rim=new THREE.DirectionalLight(0xd3edff,.8);rim.position.set(10,5,-9);scene.add(rim);
      orbit=new THREE.OrbitControls(camera,$('scene'));orbit.target.set(center,0,0);orbit.enableDamping=false;orbit.enablePan=false;orbit.minZoom=.55;orbit.maxZoom=3;orbit.rotateSpeed=.65;
      orbit.addEventListener('change',()=>{dirty=true;});
      const plane=new THREE.Mesh(new THREE.PlaneGeometry(M.MAX,2*radialScale),new THREE.MeshPhysicalMaterial({color:new THREE.Color(0xbca58d).convertSRGBToLinear(),roughness:.3,metalness:.05,clearcoat:1,transparent:true,opacity:.035,side:THREE.DoubleSide,depthWrite:false}));plane.position.set(center,0,0);scene.add(plane);
      const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(radialScale,radialScale,M.MAX,100,1,true),new THREE.MeshPhysicalMaterial({color:new THREE.Color(0x7f6ac8).convertSRGBToLinear(),roughness:.22,metalness:.08,clearcoat:.6,envMapIntensity:.3,transparent:true,opacity:.095,side:THREE.DoubleSide,depthWrite:false}));cylinder.rotation.z=Math.PI/2;cylinder.position.x=center;scene.add(cylinder);
      for(const x of [0,M.MAX]){const pts=[];for(let i=0;i<=100;i++){const a=i*M.TAU/100;pts.push([x,Math.cos(a),Math.sin(a)]);}line3(pts,0xb9b9e2,.4);}
      for(const [y,z] of [[1,0],[-1,0],[0,1],[0,-1]])line3([[0,y,z],[M.MAX,y,z]],0xa7b2d1,.23);
      line3([[0,-1,0],[0,1,0],[M.MAX,1,0],[M.MAX,-1,0],[0,-1,0]],0xd9c7b1,.24);
      axis3([-.16,0,0],[M.MAX+.48,0,0]);axis3([0,-1.23,0],[0,1.36,0]);axis3([0,0,-1.2],[0,0,1.36]);
      label3('y',[0,1.34,0],'right',[-6,-13],18);label3('x = α',[M.MAX+.46,0,0],'right',[3,38],19);label3('z',[0,0,1.36],'left',[8,0],17);
      for(let k=0;k<=4;k++){const x=k*Math.PI;line3([[x,-.035,0],[x,.035,0]],0x91b1a7);label3(k===0?'0':k===1?'π':k+'π',[x,0,0],'center',[0,18],17);}
      label3('1',[0,1,0],'right',[-9,0],15);label3('−1',[0,-1,0],'right',[-9,0],15);
      const ghost=[];for(let i=0;i<=segments;i++){const s=M.sample(M.MAX*i/segments);ghost.push([s.x,s.y,s.z]);}
      // The full helix stays visible, as in the video; α moves its highlighted point.
      const ghostLine=line3(ghost,0x9fcbdc,.27);ghostLine.name='ghost';
      helix=new THREE.Mesh(makeTube(),new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.24,metalness:.1,clearcoat:.4,clearcoatRoughness:.2,envMapIntensity:.22}));scene.add(helix);
      projection=new THREE.Mesh(makeTube(true),new THREE.MeshBasicMaterial({color:new THREE.Color(0xf1bd7b).convertSRGBToLinear(),transparent:true,opacity:.88,depthWrite:false,toneMapped:false}));scene.add(projection);
      moving=new THREE.Mesh(new THREE.SphereGeometry(.1,28,20),new THREE.MeshPhysicalMaterial({color:new THREE.Color(0xffdfaf).convertSRGBToLinear(),emissive:0x553515,emissiveIntensity:.5,roughness:.16,metalness:.15,clearcoat:1}));
      const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;const glowCtx=glowCanvas.getContext('2d'),glow=glowCtx.createRadialGradient(32,32,0,32,32,32);glow.addColorStop(0,'#fff5da');glow.addColorStop(.2,'#ffe2a6b3');glow.addColorStop(.5,'#ffc86a24');glow.addColorStop(1,'#ffc86a00');glowCtx.fillStyle=glow;glowCtx.fillRect(0,0,64,64);
      const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));halo.scale.set(.65,.65,1);moving.add(halo);scene.add(moving);
      foot=new THREE.Mesh(new THREE.SphereGeometry(.045,20,14),new THREE.MeshBasicMaterial({color:new THREE.Color(0xf1bd7b).convertSRGBToLinear(),toneMapped:false}));scene.add(foot);
      guide=line3([[0,0,0],[0,0,0]],0xe7be82,.8,true);
      $('scene').addEventListener('webglcontextlost',event=>{event.preventDefault();state.playing=false;renderer=null;$('render-error').hidden=false;sync();});
      $('scene').addEventListener('pointerdown',()=>{if(state.view!=='free')setView('free',true);});
      $('scene').addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','+','=','-'].includes(event.key))return;
        event.preventDefault();if(event.key==='Home'){setView('free');return;}
        if(event.key==='+'||event.key==='='||event.key==='-'){camera.zoom=Math.max(.55,Math.min(3,camera.zoom*(event.key==='-'?.9:1.1)));camera.updateProjectionMatrix();dirty=true;return;}
        setView('free',true);const offset=camera.position.clone().sub(orbit.target),spherical=new THREE.Spherical().setFromVector3(offset);
        if(event.key==='ArrowLeft')spherical.theta-=.08;if(event.key==='ArrowRight')spherical.theta+=.08;
        if(event.key==='ArrowUp')spherical.phi-=.08;if(event.key==='ArrowDown')spherical.phi+=.08;spherical.makeSafe();
        camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(spherical));orbit.update();dirty=true;
      });
      setView('free');
      $('scene').dataset.ready='true';
    }catch(error){renderer=null;$('render-error').hidden=false;$('scene').setAttribute('aria-label','三维渲染不可用，右侧平面观察仍可使用。');}
  }
  function setView(view,keepPosition=false){
    state.view=view;
    document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
    const hints={free:'拖动旋转 · 滚轮缩放',front:'正视：投影到 xy 平面，y = cos(α + φ)',side:'侧视：观察 yz 平面上的圆周运动',top:'俯视：观察 xz 平面，z = sin(α + φ)'};$('stage-hint').textContent=hints[view];
    if(renderer){
      if(!keepPosition){camera.up.set(0,1,0);camera.zoom=1;camera.position.set(center+(view==='free'?3.5:0),view==='free'?1:0,26);
        if(view==='side')camera.position.set(center+26,0,0);
        if(view==='top'){camera.position.set(center,26,0);camera.up.set(0,0,-1);}
        orbit.target.set(center,0,0);orbit.update();resize();}
      orbit.enableRotate=view==='free';dirty=true;
    }
  }
  function drawSceneLabels(){
    const {ctx,w,h}=canvasContext($('scene-labels'));
    for(const label of labels){
      // Hide labels on the collapsed axis of each orthographic view.
      if(state.view==='side'&&(label.text==='x = α'||label.text==='1'||label.text==='−1'||/π|^0$/.test(label.text)))continue;
      if((state.view==='front'||state.view==='free')&&label.text==='z')continue;if(state.view==='top'&&(label.text==='y'||label.text==='1'||label.text==='−1'))continue;
      const p=label.p.clone().multiply(new THREE.Vector3(1,radialScale,radialScale)).project(camera);if(p.z< -1||p.z>1)continue;
      const x=(p.x+1)*w/2+label.offset[0],y=(1-p.y)*h/2+label.offset[1];
      const size=label.font*(w<500?.78:1);text2(ctx,label.text,x,y,size,label.align,'#b9cdc1');
    }
  }
  function resize(){
    if(renderer){const rect=$('viewport').getBoundingClientRect();sceneWidth=Math.max(1,rect.width);sceneHeight=Math.max(1,rect.height);
      renderer.setSize(sceneWidth,sceneHeight,false);const aspect=sceneWidth/sceneHeight;
      const halfWidth=state.view==='side'?Math.max(3.6,aspect*3.6):Math.max(7.3,aspect*3.35),halfHeight=halfWidth/aspect;
      camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();}
    dirty=true;
  }
  function sync(){
    const s=M.sample(state.alpha,state.phase),degrees=state.alpha*180/Math.PI,phaseDegrees=Math.round(state.phase*180/Math.PI);
    $('alpha-value').innerHTML=M.fixed(s.alpha)+'<small>rad</small>';$('cos-value').textContent=M.fixed(s.y);$('sin-value').textContent=M.fixed(s.z);
    $('alpha-label').textContent='α = '+M.fixed(s.alpha)+' rad';$('phase-label').textContent='φ = '+M.piLabel(phaseDegrees);
    const phase=M.piLabel(phaseDegrees),equation=phaseDegrees===0?'y = cos α':'y = cos(α '+(phaseDegrees<0?'− ':'+ ')+phase.replace('−','')+')';$('equation').textContent=equation;
    $('theta-note').textContent='θ = α + φ · 圆内角 θ₀ = '+M.fixed(s.wrapped)+' rad';
    $('alpha').value=degrees;$('phase').value=phaseDegrees;
    $('alpha').style.setProperty('--fill',100*state.alpha/M.MAX+'%');$('phase').style.setProperty('--fill',(phaseDegrees+180)/3.6+'%');
    $('alpha').setAttribute('aria-valuetext',M.fixed(degrees,1)+' 度，'+M.fixed(state.alpha)+' 弧度');$('phase').setAttribute('aria-valuetext',phaseDegrees+' 度，'+phase);
    $('circle').setAttribute('aria-label',`单位圆：θ = α + φ，cos θ = ${M.fixed(s.y)}，sin θ = ${M.fixed(s.z)}。`);
    $('graph').setAttribute('aria-label',`${equation}，当前点 Q(${M.fixed(s.alpha)}, ${M.fixed(s.y)})。`);
    $('play-label').textContent=state.playing?'暂停演示':state.alpha>=M.MAX?'重新演示':'播放演示';$('play-icon').textContent=state.playing?'Ⅱ':'▶';
    $('play').setAttribute('aria-label',$('play-label').textContent);$('play').setAttribute('aria-pressed',String(state.playing));dirty=true;
  }
  function updateScene(s){
    if(!renderer)return;
    moving.position.set(s.x,s.y*radialScale,s.z*radialScale);foot.position.set(s.x,s.y*radialScale,0);
    const positions=guide.geometry.attributes.position;positions.setXYZ(0,s.x,s.y*radialScale,s.z*radialScale);positions.setXYZ(1,s.x,s.y*radialScale,0);positions.needsUpdate=true;guide.geometry.computeBoundingSphere();guide.computeLineDistances();
    renderer.render(scene,camera);drawSceneLabels();
  }
  function changePhase(degrees){state.phase=Math.max(-180,Math.min(180,degrees))*Math.PI/180;rebuildCurves();
    if(renderer){const points=[];for(let i=0;i<=segments;i++){const s=M.sample(M.MAX*i/segments,state.phase);points.push(new THREE.Vector3(s.x,s.y*radialScale,s.z*radialScale));}const ghost=scene.getObjectByName('ghost');ghost.geometry.dispose();ghost.geometry=new THREE.BufferGeometry().setFromPoints(points);}
    sync();
  }
  function togglePanel(force){const hidden=force===undefined?!$('workbench').classList.contains('panel-hidden'):force;$('workbench').classList.toggle('panel-hidden',hidden);$('panel-toggle').setAttribute('aria-expanded',String(!hidden));$('panel-toggle').querySelector('span').textContent=hidden?'显示面板':'调节面板';if(hidden)$('panel-toggle').focus();resize();}
  $('alpha').addEventListener('input',()=>{state.alpha=Number($('alpha').value)*Math.PI/180;state.playing=false;sync();});
  $('phase').addEventListener('input',()=>changePhase(Number($('phase').value)));
  document.querySelectorAll('[data-speed]').forEach(button=>button.addEventListener('click',()=>{state.speed=Number(button.dataset.speed);document.querySelectorAll('[data-speed]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
  $('play').addEventListener('click',()=>{if(!state.playing&&state.alpha>=M.MAX)state.alpha=0;state.playing=!state.playing;last=0;sync();});
  $('reset').addEventListener('click',()=>{state.alpha=0;state.playing=false;state.speed=1;changePhase(0);setView('free');document.querySelectorAll('[data-speed]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.speed==='1')));sync();});
  $('panel-toggle').addEventListener('click',()=>togglePanel());$('panel-close').addEventListener('click',()=>togglePanel(true));
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(error){notify('浏览器未允许全屏，可使用浏览器的全屏快捷键。');}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen-label').textContent=document.fullscreenElement?'退出':'全屏';resize();});
  document.addEventListener('visibilitychange',()=>{last=0;});
  document.addEventListener('keydown',event=>{if(event.code==='Space'&&event.target===$('scene')){event.preventDefault();$('play').click();}});
  window.addEventListener('resize',resize);new ResizeObserver(resize).observe($('viewport'));
  function frame(time){
    if(state.playing&&!document.hidden){if(last){state.alpha=Math.min(M.MAX,state.alpha+Math.min((time-last)/1000,.1)*state.speed*1.05);if(state.alpha>=M.MAX)state.playing=false;sync();}last=time;}else last=0;
    if(dirty){const s=M.sample(state.alpha,state.phase);updateScene(s);if(!$('workbench').classList.contains('panel-hidden')){drawCircle(s);drawGraph(s);}dirty=false;}
    requestAnimationFrame(frame);
  }
  setupScene();resize();sync();document.body.dataset.mathCheck='passed';
  if(!reduced&&'IntersectionObserver' in window){
    const reveals=document.querySelectorAll('.reveal'),observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.05});
    reveals.forEach(element=>{element.classList.add('will-reveal');observer.observe(element);element.addEventListener('focusin',()=>element.classList.add('is-visible'));});
  }
  window.CosineLab={state,selfChecks,sample:()=>M.sample(state.alpha,state.phase),getCamera:()=>camera?{position:camera.position.toArray(),zoom:camera.zoom}:null};
  requestAnimationFrame(frame);
})();
