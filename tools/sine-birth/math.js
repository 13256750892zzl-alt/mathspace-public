(function(root){
  'use strict';
  const TAU=2*Math.PI,MAX=2*TAU;
  function sample(alpha,phase=0){
    if(!Number.isFinite(alpha)||!Number.isFinite(phase))throw new TypeError('Angles must be finite.');
    const theta=alpha+phase;
    return {alpha,phase,theta,wrapped:((theta%TAU)+TAU)%TAU,x:alpha,y:Math.sin(theta),z:Math.cos(theta)};
  }
  function gcd(a,b){while(b){const t=b;b=a%b;a=t;}return a;}
  function piLabel(degrees){
    if(!degrees)return '0';
    const sign=degrees<0?'−':'',n=Math.abs(Math.round(degrees)),g=gcd(n,180),p=n/g,q=180/g;
    return sign+(p===1?'':p)+'π'+(q===1?'':'/'+q);
  }
  function fixed(value,digits=2){return (Math.abs(value)<.5*10**(-digits)?0:value).toFixed(digits).replace('-','−');}
  function selfCheck(){
    let count=0;const check=(ok)=>{if(!ok)throw new Error('Mathematics self-check failed');count++;};
    for(const a of [0,Math.PI/2,Math.PI,3*Math.PI/2,TAU,MAX])for(const p of [-Math.PI,-Math.PI/2,0,Math.PI/2,Math.PI]){
      const s=sample(a,p);check(Math.abs(s.y*s.y+s.z*s.z-1)<1e-12);check(s.x===a);check(Math.abs(s.y-Math.sin(a+p))<1e-12);check(s.wrapped>=0&&s.wrapped<TAU);
    }
    check(piLabel(-165)==='−11π/12');check(piLabel(0)==='0');check(piLabel(180)==='π');check(piLabel(720)==='4π');check(fixed(-1e-9)==='0.00');
    return count;
  }
  const api={TAU,MAX,sample,piLabel,fixed,selfCheck};root.SineMath=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
