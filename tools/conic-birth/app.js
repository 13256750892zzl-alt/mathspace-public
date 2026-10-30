'use strict';
(() => {
  const $ = id => document.getElementById(id), M = ConicMath;
  const names = { circle: '圆', ellipse: '椭圆', parabola: '抛物线', hyperbola: '双曲线' };
  const state = { theta: 31, alpha: 28, d: -1, phase: .18, branch: 1, plane: true, focus: false, spheres: false };
  let g, measurement, plotView;
  const fmt = (n, digits = 2) => Math.abs(n) < 5e-8 ? (0).toFixed(digits) : Math.abs(n) >= 1e5 || Math.abs(n) < .005 ? n.toExponential(2) : n.toFixed(digits);
  const fraction = (top, bottom) => `<span class="frac"><span>${top}</span><span>${fmt(bottom)}</span></span>`;
  const plot = $('plot'), ctx = plot.getContext('2d');
  let renderer, scene, camera, controls, model, mover, pointMesh, ropes, sphereCount = 0, rendering = false;
  const coneHeight = 3.8;
  const v3 = p => new THREE.Vector3(p[0], p[2], p[1]);
  const sphereGeo = typeof THREE !== 'undefined' ? new THREE.SphereGeometry(1, 36, 24) : null;
  function init3D() {
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.outputEncoding = THREE.sRGBEncoding;
      $('scene').appendChild(renderer.domElement);
      renderer.domElement.setAttribute('aria-label', '双圆锥与截平面；拖动或方向键旋转，滚轮或加减键缩放');
      renderer.domElement.tabIndex = 0;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
      camera.position.set(-6.5, 2.6, 15.2);
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enablePan = false; controls.enableDamping = false;
      controls.minDistance = 10; controls.maxDistance = 28;
      controls.minPolarAngle = .28; controls.maxPolarAngle = Math.PI - .28;
      controls.target.set(0, -.08, 0); controls.update(); controls.saveState();
      controls.addEventListener('change', draw3D);
      renderer.domElement.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key)) return;
        event.preventDefault();
        const offset = camera.position.clone().sub(controls.target), spherical = new THREE.Spherical().setFromVector3(offset);
        if (event.key === 'ArrowLeft') spherical.theta -= .08;
        if (event.key === 'ArrowRight') spherical.theta += .08;
        if (event.key === 'ArrowUp') spherical.phi = Math.max(.28, spherical.phi - .08);
        if (event.key === 'ArrowDown') spherical.phi = Math.min(Math.PI - .28, spherical.phi + .08);
        if (['+','='].includes(event.key)) spherical.radius = Math.max(10, spherical.radius * .93);
        if (event.key === '-') spherical.radius = Math.min(28, spherical.radius / .93);
        camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(controls.target)); controls.update();
      });
      const ambient = new THREE.HemisphereLight(0xe4f5ff, 0x245da6, 1.2); scene.add(ambient);
      const light = new THREE.DirectionalLight(0xf4fbff, 1.5); light.position.set(-5, 7, 9); scene.add(light);
      const rim = new THREE.PointLight(0x6bbcff, 1.3); rim.position.set(5, -1, -6); scene.add(rim);
      mover = new THREE.Group(); scene.add(mover);
      pointMesh = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffedb1 })); pointMesh.scale.setScalar(.065); mover.add(pointMesh);
      ropes = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xffedc1, dashSize: .09, gapSize: .05, transparent: true, opacity: .9 })); mover.add(ropes);
      renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); $('webgl-error').hidden = false; });
      renderer.domElement.addEventListener('webglcontextrestored', () => { $('webgl-error').hidden = true; rebuild3D(); });
      document.documentElement.dataset.webgl = 'ready';
    } catch (error) {
      renderer = null; $('webgl-error').hidden = false; document.documentElement.dataset.webgl = 'unavailable';
    }
  }
  function line(points, color, opacity = 1, dashed = false) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = dashed ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: .1, gapSize: .08 }) : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const object = new THREE.Line(geometry, material); if (dashed) object.computeLineDistances(); return object;
  }
  function ring(radius, y, color, opacity = 1) {
    return line(Array.from({ length: 129 }, (_, i) => { const t = i / 128 * Math.PI * 2; return new THREE.Vector3(radius * Math.cos(t), y, radius * Math.sin(t)); }), color, opacity);
  }
  function disposeModel() {
    if (!model) return;
    scene.remove(model);
    model.traverse(object => {
      if (object.geometry && object.geometry !== sphereGeo) object.geometry.dispose();
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
    });
  }
  function rebuild3D() {
    if (!renderer) return;
    disposeModel(); model = new THREE.Group(); scene.add(model);
    const radius = g.k * coneHeight;
    for (const sign of [-1, 1]) {
      const shell = new THREE.Mesh(new THREE.ConeGeometry(radius, coneHeight, 96, 1, true), new THREE.MeshPhongMaterial({ color: 0xb3d0eb, specular: 0xf6ffff, shininess: 100, transparent: true, opacity: .15, side: THREE.DoubleSide, depthWrite: false }));
      shell.position.y = sign * coneHeight / 2;
      if (sign === 1) shell.rotation.z = Math.PI;
      shell.renderOrder = 1; model.add(shell);
      model.add(ring(radius, sign * coneHeight, 0xe3f5ff, .86));
      for (const phi of [.2, 2.8, 3.35, 5.95]) {
        model.add(line([new THREE.Vector3(), new THREE.Vector3(radius * Math.cos(phi), sign * coneHeight, radius * Math.sin(phi))], 0xe2edff, .34));
      }
    }
    model.add(line([new THREE.Vector3(0, -coneHeight, 0), new THREE.Vector3(0, coneHeight, 0)], 0xbddeff, .38, true));
    const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.19, radius * 1.25, .13, 96), new THREE.MeshPhongMaterial({ color: 0x396a9e, transparent: true, opacity: .4, shininess: 100, depthWrite: false }));
    base.position.y = -coneHeight - .18; model.add(base);
    for (const [factor, opacity] of [[1.02,.8],[1.12,.7],[1.24,.65],[1.43,.3],[1.7,.16]]) model.add(ring(radius * factor, -coneHeight - .1, 0xc4e5ff, opacity));
    model.add(ring(radius * 1.28, -coneHeight - .25, 0x5bc4ff, .7));
    const sections = M.section(g, coneHeight);
    for (const path of sections) {
      const curve = new THREE.CatmullRomCurve3(path.map(v3));
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, path.length), .018, 5, false), new THREE.MeshBasicMaterial({ color: 0xffdb89, transparent: true, opacity: 1 }));
      tube.renderOrder = 4; model.add(tube);
    }
    const planeGroup = new THREE.Group(); planeGroup.visible = state.plane; model.add(planeGroup);
    // The finite panel is a window onto the infinite mathematical cutting plane.
    const bounded = g.type === 'circle' || g.type === 'ellipse';
    const middleU = bounded ? Math.max(-3, Math.min(3, g.center)) : 0;
    const halfU = bounded ? Math.min(5, Math.max(.9, g.a * 1.45)) : Math.min(6, coneHeight / Math.max(.45, g.sin));
    const halfV = bounded ? Math.min(2.7, Math.max(.9, g.b * 1.5)) : Math.max(1.3, Math.min(3.1, radius * .86));
    const corners = [[-halfU,-halfV],[halfU,-halfV],[halfU,halfV],[-halfU,halfV]].map(([offset,v]) => {
      const u = middleU + offset;
      return v3([-g.d * g.sin + u * g.cos, v, g.d * g.cos + u * g.sin]);
    });
    const geometry = new THREE.BufferGeometry().setFromPoints(corners); geometry.setIndex([0,1,2,0,2,3]); geometry.computeVertexNormals();
    const plane = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0xc7e6f4, transparent: true, opacity: .17, side: THREE.DoubleSide, depthWrite: false, shininess: 90 }));
    plane.renderOrder = 2; planeGroup.add(plane, line([...corners,corners[0]], 0xd8ebef, .82));
    sphereCount = 0;
    if (state.spheres) for (const sphere of g.spheres) {
      if (Math.abs(sphere.z) + sphere.radius > coneHeight + .01) continue;
      sphereCount++;
      const ball = new THREE.Mesh(sphereGeo, new THREE.MeshPhongMaterial({ color: 0xd3c297, specular: 0xfff2c3, transparent: true, opacity: .25, shininess: 95, depthWrite: false }));
      ball.position.y = sphere.z; ball.scale.setScalar(sphere.radius); ball.renderOrder = 3; model.add(ball);
      model.add(ring(Math.abs(sphere.contactZ) * g.k, sphere.contactZ, 0xffdda0, .62));
      const contour = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 100 }, (_, i) => { const phi = i / 100 * 2 * Math.PI; return new THREE.Vector3(Math.cos(phi) * sphere.radius, sphere.z + Math.sin(phi) * sphere.radius, 0); })), new THREE.LineBasicMaterial({ color: 0xffe6a9, transparent: true, opacity: .6 }));
      model.add(contour);
    }
    if (state.focus) for (const focus of g.foci) {
      const p = M.toWorld(g, focus, 0); if (Math.abs(p[2]) > coneHeight) continue;
      const dot = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffecad })); dot.scale.setScalar(.055); dot.position.copy(v3(p)); model.add(dot);
    }
    updateMovingPoint(); draw3D();
  }
  function updateMovingPoint() {
    if (!renderer) return;
    const p = M.point(g, state.phase, state.branch), w = M.toWorld(g, ...p);
    mover.visible = Math.abs(w[2]) <= coneHeight;
    pointMesh.position.copy(v3(w));
    const vertices = [];
    if (state.focus) for (const f of g.foci) {
      const focus = M.toWorld(g, f, 0);
      if (Math.abs(focus[2]) <= coneHeight) vertices.push(v3(w), v3(focus));
    }
    if (state.focus && g.type === 'parabola') {
      vertices.push(v3(w), v3(M.toWorld(g, -g.p, p[1])));
    }
    ropes.geometry.dispose(); ropes.geometry = new THREE.BufferGeometry().setFromPoints(vertices); ropes.computeLineDistances();
  }
  function draw3D() {
    if (!renderer || rendering) return;
    rendering = true; renderer.render(scene, camera); drawAnnotations(); rendering = false;
  }
  function drawAnnotations() {
    if (!renderer || !g) return;
    const lab = document.querySelector('.laboratory'), box = $('scene').getBoundingClientRect(), area = lab.getBoundingClientRect();
    $('annotations').setAttribute('viewBox', `0 0 ${area.width} ${area.height}`);
    const labels = [], occupied = [];
    function label(p, text, dx, dy, small = '') {
      const q = v3(p).project(camera), x = box.left - area.left + (q.x + 1) / 2 * box.width, y = box.top - area.top + (1 - q.y) / 2 * box.height;
      if (q.z > 1 || y < box.top - area.top + 15 || y > Math.min(area.height - 35, box.bottom - area.top - 10)) return;
      const mobile = innerWidth <= 520;
      const minX = mobile ? 16 : area.width * .405, maxX = area.width - (mobile ? 100 : 118);
      const tx = Math.max(minX, Math.min(maxX, x + dx));
      const lower = mobile ? 150 : 130, upper = area.height - (mobile ? 230 : 100);
      const desiredY = Math.max(lower, Math.min(upper, y + dy));
      const ty = [0,42,-42,84,-84,126,-126].map(offset=>desiredY+offset).find(candidate=>candidate>=lower&&candidate<=upper&&!occupied.some(rect=>tx<rect.x+136&&tx+136>rect.x&&candidate-25<rect.y+40&&candidate+15>rect.y));
      if (ty === undefined) return;
      occupied.push({x:tx,y:ty-25});
      labels.push(`<path class="annotation-line" d="M${x},${y} L${tx + (dx < 0 ? 78 : 0)},${ty - 4} L${tx + (dx < 0 ? 0 : 76)},${ty - 4}"/><circle class="annotation-dot" cx="${x}" cy="${y}" r="2"/><text class="annotation-text" x="${tx}" y="${ty - 10}">${text}</text>${small ? `<text class="annotation-text annotation-small" x="${tx}" y="${ty + 9}">${small}</text>` : ''}`);
    }
    label([0,0,1.5], '圆锥的轴', -116, -7);
    if (state.plane) label([-g.d * g.sin, 0, g.d * g.cos], '截平面', -127, 70, `θ = ${fmt(g.theta, 1)}°`);
    if (state.spheres) {
      let i = 0;
      for (const s of g.spheres) if (Math.abs(s.z) + s.radius <= coneHeight + .01) {
        label([0,0,s.z], i++ === 0 ? '丹德林球' : '另一个丹德林球', -123, -20, '与圆锥、截面相切');
      }
    }
    if (state.focus && innerWidth > 520) {
      for (let i = 0; i < g.foci.length; i++) {
        const p = M.toWorld(g, g.foci[i], 0);
        if (Math.abs(p[2]) <= coneHeight) label(p, g.foci.length === 1 ? '焦点 F' : `焦点 F${i === 0 ? '₁' : '₂'}`, 18, 15);
      }
    }
    $('annotation-content').innerHTML = labels.join('');
  }
  function plotPoints() {
    const out = [];
    for (const branch of g.type === 'hyperbola' ? [-1,1] : [1]) {
      const points = [];
      for (let i = 0; i <= 320; i++) points.push({ p: M.point(g, i / 320, branch), phase: i / 320, branch });
      out.push(points);
    }
    return out;
  }
  function drawPlot() {
    if (!g || !ctx) return;
    const w = plot.clientWidth, h = plot.clientHeight, dpr = Math.min(devicePixelRatio, 2);
    if (!w || !h) return;
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (plot.width !== pw || plot.height !== ph) { plot.width = pw; plot.height = ph; }
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
    let extentX, extentY, originX = 0;
    if (g.type === 'parabola') { extentX = 4 * g.p; extentY = 3.5 * g.p; originX = extentX * .8; }
    else if (g.type === 'hyperbola') { extentX = Math.max(g.a * 2.2, g.c * 1.28); extentY = Math.max(g.b * 2, g.a * 1.1); }
    else { extentX = g.a * 1.25; extentY = g.b * 1.25; }
    const scale = Math.min((w - 25) / (2 * extentX), (h - 26) / (2 * extentY));
    const cx = w / 2 - originX * scale, cy = h / 2;
    const at = p => [cx + p[0] * scale, cy - p[1] * scale];
    plotView = { scale, cx, cy, at, paths: plotPoints() };
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#c7e0ff55'; ctx.beginPath(); ctx.moveTo(8,cy); ctx.lineTo(w-7,cy); ctx.moveTo(cx,7); ctx.lineTo(cx,h-7); ctx.stroke();
    ctx.fillStyle = '#dfedff'; ctx.font = 'italic 12px Cambria,serif'; ctx.fillText('x',w-13,cy-5); ctx.fillText('y',Math.max(2,Math.min(w-12,cx+5)),13);
    if (g.type === 'hyperbola') {
      ctx.strokeStyle = '#d7e9fd55'; ctx.setLineDash([3,4]); ctx.beginPath();
      for (const sign of [-1,1]) { const p1=at([-extentX,sign * -extentX * g.b/g.a]),p2=at([extentX,sign * extentX * g.b/g.a]);ctx.moveTo(...p1);ctx.lineTo(...p2); } ctx.stroke(); ctx.setLineDash([]);
    }
    if (g.type === 'parabola' && state.focus) {
      const [x] = at([-g.p,0]); ctx.strokeStyle='#dbe6ff99';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,7);ctx.lineTo(x,h-7);ctx.stroke();ctx.setLineDash([]);ctx.fillText('l',x+4,22);
    }
    ctx.save(); ctx.beginPath();ctx.rect(1,1,w-2,h-2);ctx.clip();
    for (const path of plotView.paths) {
      ctx.beginPath(); path.forEach((item,i) => { const q=at(item.p);if(i===0)ctx.moveTo(...q);else ctx.lineTo(...q); });
      ctx.shadowColor='#ffd975';ctx.shadowBlur=7;ctx.strokeStyle='#ffda7a';ctx.lineWidth=2.2;ctx.stroke();ctx.shadowBlur=0;
    }
    const p=M.point(g,state.phase,state.branch), screen=at(p);
    if (state.focus) {
      ctx.strokeStyle='#eef4ffc7';ctx.lineWidth=1;ctx.setLineDash([4,3]);
      for (const f of g.foci) { ctx.beginPath();ctx.moveTo(...screen);ctx.lineTo(...at([f,0]));ctx.stroke(); }
      if (g.type==='parabola'){ctx.beginPath();ctx.moveTo(...screen);ctx.lineTo(...at([-g.p,p[1]]));ctx.stroke();}ctx.setLineDash([]);
      g.foci.forEach((f,i)=>{const q=at([f,0]);ctx.fillStyle='#fff1bc';ctx.beginPath();ctx.arc(...q,2.8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4f6ff';ctx.font='italic 11px Cambria,serif';ctx.fillText(g.type==='circle'?'O':g.foci.length===1?'F':`F${i===0?'₁':'₂'}`,q[0]+4,q[1]+14);});
    }
    ctx.fillStyle='#fff3cc';ctx.shadowColor='#ffdd88';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(...screen,3.7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.font='italic 13px Cambria,serif';ctx.fillText('P',Math.min(w-14,screen[0]+7),Math.max(15,screen[1]-(Math.abs(screen[1]-cy)<25?17:7)));ctx.restore();
    if (g.type==='ellipse' && g.a > 20) {ctx.font='9px "Microsoft YaHei"';ctx.fillStyle='#e0edff';ctx.fillText('临界附近：横纵坐标等比例缩放',7,h-8);}
  }
  function updateReadings() {
    const p=M.point(g,state.phase,state.branch);measurement=M.measurement(g,p);
    $('live-value').textContent=fmt(measurement.value);$('live-target').textContent=fmt(measurement.target);
  }
  function updateUI() {
    for(const [id,key] of [['theta','theta'],['distance','d'],['alpha','alpha']]) $(id).value=state[key];
    $('beta').value=g.beta;
    $('theta-out').textContent=fmt(g.theta,1)+'°';$('distance-out').textContent=fmt(g.d);$('alpha-out').textContent=fmt(g.alpha,1)+'°';$('beta-out').textContent=fmt(g.beta,1)+'°';
    document.querySelectorAll('[data-preset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.preset===g.type)));
    const relation=g.type==='circle'?'θ = 0 → 圆（e = 0）':g.type==='ellipse'?'0 < θ < β → 椭圆（0 < e < 1）':g.type==='parabola'?'θ = β → 抛物线（e = 1）':'θ > β → 双曲线（e > 1）';
    $('classification').textContent=relation;$('plot-title').textContent=names[g.type]+'的平面观察';$('equation-title').textContent=names[g.type]+'的标准方程';
    let equation,params,invariant,note,valueLabel,targetLabel;
    if(g.type==='circle'){
      equation=`x² + y² ≈ <span style="color:#976a23">${fmt(g.a*g.a)}</span>`;params=[['离心率 e',fmt(0)],['半径 r',fmt(g.a)],['半长轴 a',fmt(g.a)],['半焦距 c',fmt(0)]];
      invariant='|OP| = r <small>（为常数）</small>';note='截面与轴垂直（θ = 0）时，截线是圆：每一点到圆心的距离相等。';valueLabel='|OP|';targetLabel='r';
    }else if(g.type==='parabola'){
      equation=`y² ≈ <span style="color:#976a23">${fmt(4*g.p)}</span>x`;params=[['离心率 e',fmt(1)],['焦点 F',`(${fmt(g.p)}, 0)`],['准线 l',`x = −${fmt(g.p)}`],['焦准距',fmt(2*g.p)]];
      invariant='|PF| = d(P, l)';note='截面与一条母线平行（θ = β）时，得到抛物线；到焦点和准线的距离相等。';valueLabel='|PF| / d(P,l)';targetLabel='比值';
    }else{
      const hyper=g.type==='hyperbola';equation=`${fraction('x²',g.a*g.a)} ${hyper?'−':'+'} ${fraction('y²',g.b*g.b)} ≈ 1`;
      params=[['离心率 e',fmt(g.e)],[hyper?'实半轴 a':'长半轴 a',fmt(g.a)],[hyper?'虚半轴 b':'短半轴 b',fmt(g.b)],['半焦距 c',fmt(g.c)]];
      invariant=hyper?'||PF₁| − |PF₂|| = 2a':'|PF₁| + |PF₂| = 2a';
      note=hyper?'截面比母线更陡（θ > β），同时切到上下两个圆锥，得到双曲线的两支。':'截面倾斜，但未平行于母线（0 < θ < β），得到椭圆。到两焦点的距离之和保持不变。';
      valueLabel=hyper?'||PF₁|−|PF₂||':'|PF₁|+|PF₂|';targetLabel='2a';
    }
    $('equation').innerHTML=equation+'<small>以中心 / 顶点建系 · 数值取近似</small>';
    $('parameters').innerHTML=params.map(([title,value])=>`<div><dt>${title} =</dt><dd>${value}</dd></div>`).join('');
    $('invariant').innerHTML=invariant+(g.type==='ellipse'||g.type==='hyperbola'?' <small>（为常数）</small>':'');
    $('explanation').textContent=note;
    $('live-type').textContent=names[g.type];$('live-foci').textContent=g.type==='circle'?'1（重合）':g.type==='parabola'?'1':'2';
    $('live-value-label').textContent=valueLabel;$('live-target-label').textContent=targetLabel;
    $('show-plane').checked=state.plane;$('show-focus').checked=state.focus;$('show-spheres').checked=state.spheres;
    $('boundary-note').textContent=state.spheres&&sphereCount<g.spheres.length&&renderer?'另一丹德林球超出当前锥面的显示范围；抛物线临界处该球趋于无穷远。':g.type==='parabola'||g.type==='hyperbola'?'图中只显示有限锥面；开放曲线向无穷远延伸。':'d 为有向垂直距离；α + β = 90°。';
    updateReadings();
  }
  function update() {
    g=M.derive(state.theta,state.alpha,state.d);rebuild3D();updateUI();drawPlot();draw3D();
  }
  function parameterChange(id,value){
    const wasParabola=g.type==='parabola';
    if(id==='theta')state.theta=value;
    if(id==='distance')state.d=value;
    if(id==='alpha'||id==='beta'){state.alpha=id==='alpha'?value:90-value;if(wasParabola)state.theta=90-state.alpha;}
    update();
  }
  for(const id of ['theta','distance','alpha','beta'])$(id).addEventListener('input',event=>parameterChange(id,Number(event.target.value)));
  document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{
    state.theta={circle:0,ellipse:31,parabola:90-state.alpha,hyperbola:Math.min(89,90-state.alpha+13)}[button.dataset.preset];state.phase=.18;state.branch=1;update();
  }));
  for(const [id,key] of [['show-plane','plane'],['show-focus','focus'],['show-spheres','spheres']])$(id).addEventListener('change',event=>{
    state[key]=event.target.checked;update();
  });
  function nearestPoint(event){
    if(!plotView)return;const rect=plot.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;let best=null,distance=Infinity;
    for(const path of plotView.paths)for(const item of path){const q=plotView.at(item.p),d=(q[0]-x)**2+(q[1]-y)**2;if(d<distance){best=item;distance=d;}}
    if(best){state.phase=best.phase;state.branch=best.branch;updateReadings();drawPlot();updateMovingPoint();draw3D();}
  }
  let dragging=false;
  plot.addEventListener('pointerdown',event=>{if(event.button!==0)return;dragging=true;plot.setPointerCapture(event.pointerId);nearestPoint(event);});
  plot.addEventListener('pointermove',event=>{if(dragging)nearestPoint(event);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])plot.addEventListener(type,()=>{dragging=false;});
  plot.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();state.phase=(state.phase+(event.key==='ArrowRight'?.01:-.01)+1)%1;updateReadings();drawPlot();updateMovingPoint();draw3D();}});
  $('view-settings').addEventListener('click',()=>$('settings').showModal());
  $('brightness').addEventListener('input',event=>$('app').style.setProperty('--brightness',event.target.value));
  $('camera-reset').addEventListener('click',()=>{if(controls)controls.reset();});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('app').requestFullscreen();}catch{$('fullscreen').textContent='浏览器未允许全屏';}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'退出全屏':'进入全屏';});
  init3D();update();
  const resize=()=>{if(renderer){const box=$('scene');const w=box.clientWidth,h=box.clientHeight;if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);draw3D();}}drawPlot();};
  const observer=new ResizeObserver(resize);observer.observe($('scene'));observer.observe(plot);resize();
  window.APP={snapshot:()=>({state:{...state},derived:{...g},measurement:{...measurement},visibleSpheres:sphereCount,webgl:!!renderer,drawCalls:renderer?.info.render.calls??0}),camera:()=>camera?camera.position.toArray():null,plotPoint:()=>plotView?plotView.at(M.point(g,state.phase,state.branch)):null};
  document.documentElement.dataset.ready='true';
})();
