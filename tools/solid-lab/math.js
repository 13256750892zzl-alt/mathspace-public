/* Deterministic geometry: usable in browsers and Node, independent of rendering. */
(function(root) {
  'use strict';
  const PI=Math.PI, EPS=1e-9;
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>Math.hypot(...a);
  const unit=a=>{const l=norm(a);if(l<EPS)throw Error('轴方向不能为零');return a.map(x=>x/l);};
  const names=['A','B','C','D','A₁','B₁','C₁','D₁'];
  const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  function vertices(a,b=a,h=a) { return [[-a/2,0,b/2],[a/2,0,b/2],[a/2,0,-b/2],[-a/2,0,-b/2],[-a/2,h,b/2],[a/2,h,b/2],[a/2,h,-b/2],[-a/2,h,-b/2]]; }
  function dimensions(p){return p.type==='cube'?[p.a,p.a,p.a]:[p.a,p.b,p.h];}
  function height(p){return p.type==='cube'?p.a:p.type==='hemisphere'?p.r:p.h;}
  function measures(p){
    const {r,h,rp,a,b}=p; let v=0,side=0,surf=0,l=null,theta=null;
    if(p.type==='cube'){v=a**3;side=4*a*a;surf=6*a*a;}
    if(p.type==='box'){v=a*b*h;side=2*(a+b)*h;surf=2*(a*b+a*h+b*h);}
    if(p.type==='cylinder'){v=PI*r*r*h;side=2*PI*r*h;surf=side+2*PI*r*r;}
    if(p.type==='cone'){l=Math.hypot(r,h);v=PI*r*r*h/3;side=PI*r*l;surf=side+PI*r*r;theta=360*r/l;}
    if(p.type==='frustum'){l=Math.hypot(r-rp,h);v=PI*h*(r*r+rp*rp+r*rp)/3;side=PI*(r+rp)*l;surf=side+PI*(r*r+rp*rp);}
    if(p.type==='hemisphere'){v=2*PI*r**3/3;side=2*PI*r*r;surf=3*PI*r*r;}
    return {v,side,surf,l,theta};
  }
  function face(p,top){
    if(p.type==='cube')return {kind:'rect',a:p.a,b:p.a};
    if(p.type==='box')return {kind:'rect',a:p.a,b:p.b};
    if(top&&['cone','hemisphere'].includes(p.type))return {kind:'point'};
    return {kind:'circle',r:top&&p.type==='frustum'?p.rp:p.r};
  }
  // Area of a centered circle intersecting an axis-aligned centered rectangle.
  function circleRect(r,a,b){
    const x=Math.min(a/2,r),y=Math.min(b/2,r);
    const x0=Math.min(x,Math.sqrt(Math.max(0,r*r-y*y)));
    const F=t=>.5*(t*Math.sqrt(Math.max(0,r*r-t*t))+r*r*Math.asin(Math.max(-1,Math.min(1,t/r))));
    return 4*(y*x0+F(x)-F(x0));
  }
  function contact(p,q){
    const A=face(p,true),B=face(q,false);
    if(A.kind==='point'||B.kind==='point')return {area:0,kind:'point'};
    if(A.kind==='rect'&&B.kind==='rect')return {area:Math.min(A.a,B.a)*Math.min(A.b,B.b),kind:'rect',a:Math.min(A.a,B.a),b:Math.min(A.b,B.b)};
    if(A.kind==='circle'&&B.kind==='circle')return {area:PI*Math.min(A.r,B.r)**2,kind:'circle',r:Math.min(A.r,B.r)};
    const C=A.kind==='circle'?A:B,R=A.kind==='rect'?A:B;
    return {area:circleRect(C.r,R.a,R.b),kind:'mixed',r:C.r,a:R.a,b:R.b};
  }
  function halfCut(R,ratio){
    const y=R*ratio,cap=R-y;
    const upper=PI*cap*cap*(R-cap/3);
    return {y,r:Math.sqrt(Math.max(0,R*R-y*y)),phi:Math.acos(y/R),upper,lower:2*PI*R**3/3-upper};
  }
  function planeFromPoints(points){
    const n=cross(sub(points[1],points[0]),sub(points[2],points[0]));
    if(norm(n)<EPS)throw Error('三点重合或共线，不能确定唯一平面');
    const N=unit(n);return {n:N,d:dot(N,points[0])};
  }
  function section(a,b,h,n,d){
    const vs=vertices(a,b,h),pts=[];
    const tol=EPS*Math.max(1,a,b,h),nn=unit(n),dd=d/norm(n);
    const add=p=>{if(!pts.some(q=>norm(sub(p,q))<tol))pts.push(p);};
    edges.forEach(([i,j])=>{
      const A=vs[i],B=vs[j],fa=dot(nn,A)-dd,fb=dot(nn,B)-dd;
      if(Math.abs(fa)<tol)add(A.slice());if(Math.abs(fb)<tol)add(B.slice());
      if(fa*fb<0&&Math.abs(fa)>tol&&Math.abs(fb)>tol){const t=fa/(fa-fb);add(A.map((x,k)=>x+t*(B[k]-x)));}
    });
    if(pts.length<3)return {points:pts,area:0};
    const center=pts[0].map((_,i)=>pts.reduce((s,p)=>s+p[i],0)/pts.length);
    const u=unit(sub(pts[0],center)),v=cross(nn,u);
    pts.sort((a,b)=>Math.atan2(dot(sub(a,center),v),dot(sub(a,center),u))-Math.atan2(dot(sub(b,center),v),dot(sub(b,center),u)));
    let area=0;for(let i=1;i<pts.length-1;i++)area+=norm(cross(sub(pts[i],pts[0]),sub(pts[i+1],pts[0])))/2;
    return {points:pts,area};
  }
  const presets={triangle:{n:[1,1,1],offset:-.4},quad:{n:[0,1,0],offset:.5},pentagon:{n:[1,1,2],offset:.2},hexagon:{n:[1,1,1],offset:.5}};
  function presetPlane(key,a){const p=presets[key];return {n:p.n,d:p.offset*a};}
  // Bounds of n·P over a centered-in-x/z box with its base at y=0.
  function planeBounds(a,b,h,n){const values=vertices(a,b,h).map(p=>dot(n,p));return [Math.min(...values),Math.max(...values)];}
  function basis(x,y){const ex=unit(x),ey=unit(y);if(Math.abs(dot(ex,ey))>1e-8)throw Error('所选 x、y 方向不垂直，请改选正交方向');return [ex,ey,cross(ex,ey)];}
  function coordinates(p,o,B){const v=sub(p,o);return B.map(e=>dot(v,e));}
  function surface(p,t,u,theta){
    // u is normalized radial/slant position, theta in [-π,π]. Endpoints are exact.
    if(p.type==='cylinder'||p.type==='frustum'&&Math.abs(p.r-p.rp)<EPS){
      const q=1-t,ang=theta*q;
      const x=q<EPS?p.r*theta:p.r*Math.sin(ang)/q;
      const z=q<EPS?0:-2*p.r*Math.sin(ang/2)**2/q+p.r*q;
      const y=p.h*u,c=Math.cos(t*PI/2),s=Math.sin(t*PI/2);
      return [x,y*c+z*s,-y*s+z*c];
    }
    const delta=p.type==='cone'?p.r:p.r-p.rp;
    const l=Math.hypot(delta,p.h),ratio=delta/l;
    const alpha=Math.asin(ratio)+(PI/2-Math.asin(ratio))*t;
    const outer=p.type==='cone'?l:l*p.r/delta,inner=p.type==='cone'?0:l*p.rp/delta;
    const U=inner+(outer-inner)*u,beta=theta*ratio/Math.sin(alpha);
    const shift=p.type==='frustum'?(outer+inner)/2*Math.sin(alpha)*t:0;
    return [U*Math.sin(alpha)*Math.sin(beta),(outer-U)*Math.cos(alpha),U*Math.sin(alpha)*Math.cos(beta)-shift];
  }
  const api={EPS,dot,sub,cross,norm,unit,names,edges,vertices,dimensions,height,measures,face,circleRect,contact,halfCut,planeFromPoints,section,presets,presetPlane,planeBounds,basis,coordinates,surface};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MathGeo=api;
})(typeof window!=='undefined'?window:globalThis);
