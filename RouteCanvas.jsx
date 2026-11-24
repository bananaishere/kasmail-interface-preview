import { useEffect, useRef } from 'react';

const vertices = [
  [66,196],[150,115],[151,191],[162,260],[254,75],[250,133],[248,212],[260,284],
  [345,99],[356,173],[345,250],[445,58],[445,118],[454,194],[442,278],
  [540,89],[547,155],[548,240],[638,124],
];
const edges = [
  [0,1],[0,2],[0,3],[1,4],[1,5],[2,5],[2,6],[3,6],[3,7],
  [4,8],[5,8],[5,9],[6,9],[6,10],[7,10],
  [8,11],[8,12],[9,12],[9,13],[9,14],[10,13],[10,14],
  [11,15],[12,15],[12,16],[13,16],[13,17],[14,17],[15,18],[16,18],[17,18],
];
const routes = [
  [0,1,5,9,14,17,18],
  [0,3,6,9,12,15,18],
  [0,1,5,9,12,16,18],
  [0,3,6,9,13,17,18],
].map(ids => {
  const points = ids.map(id => vertices[id]);
  const lengths = points.slice(1).map(([x,y],i) => Math.hypot(x-points[i][0], y-points[i][1]));
  return { ids, points, lengths, length: lengths.reduce((sum,value)=>sum+value,0) };
});

export const routeDuration = 2250;
const cycleDuration = routeDuration + 750;

function line(ctx, points) {
  ctx.beginPath();
  points.forEach(([x,y], index) => index ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.stroke();
}
function position(route, progress) {
  const { points, lengths, length } = route;
  let distance = progress * length;
  for(let i=0;i<lengths.length;i++) {
    if(distance<lengths[i]){
      const t=distance/lengths[i];
      const point=points[i].map((start,axis)=>start+(points[i+1][axis]-start)*t);
      return { reached:i, point };
    }
    distance-=lengths[i];
  }
  return { reached:points.length-1, point:points.at(-1) };
}
function cube(ctx, x, y, size, selected) {
  const top = [x,y-size], left = [x-size,y-size/2], middle = [x,y], right = [x+size,y-size/2];
  const lowLeft = [x-size,y+size/2], lowMiddle = [x,y+size], lowRight = [x+size,y+size/2];
  function face(points, color) {
    ctx.fillStyle=color;
    ctx.beginPath();
    points.forEach(([px,py], i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle=selected?'#8ae9cc':'#527e8b';
  ctx.lineWidth=selected?1.25:.75;
  face([top,right,middle,left], selected?'#58bca9':'#2d5865');
  face([left,middle,lowMiddle,lowLeft], selected?'#246e67':'#1b3745');
  face([middle,right,lowRight,lowMiddle], selected?'#348b7c':'#244955');
}

function tile(ctx, x, y, selected, focus, type) {
  if (!type) {
    cube(ctx,x,y,selected?13:9,selected);
    return;
  }
  const size=type==='node'?46:42;
  ctx.save();
  ctx.translate(x,y);
  if(focus) {
    ctx.strokeStyle='#a3f3d43c';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.arc(0,0,33,0,Math.PI*2);
    ctx.stroke();
  }
  ctx.fillStyle=focus?'#285e60':'#1b3d47';
  ctx.strokeStyle=focus?'#a1f1d5':'#7bc9b8';
  ctx.shadowColor='#55e5b460';
  ctx.shadowBlur=focus?25:12;
  ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.roundRect(-size/2,-size/2,size,size,10);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur=0;
  if(type==='inbox'){
    line(ctx,[[-10,-7],[-7,-10],[7,-10],[10,-7],[10,8],[-10,8],[-10,-7]]);
    line(ctx,[[-10,1],[-4,1],[-2,4],[2,4],[4,1],[10,1]]);
  } else if(type==='mail') {
    ctx.strokeRect(-10,-7,20,14);
    line(ctx,[[-10,-7],[0,1],[10,-7]]);
  } else {
    cube(ctx,0,0,10,true);
  }
  ctx.restore();
}

export function RouteCanvas({ pulse }) {
  const canvas=useRef(null);
  const timeline=useRef({ pulse: -1, started: 0 });
  useEffect(()=>{
    const el=canvas.current;
    const ctx=el.getContext('2d');
    if(!ctx) return;
    let frame;
    let width,height,dpr;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resize=()=>{
      ({width,height}=el.getBoundingClientRect());
      dpr=Math.min(window.devicePixelRatio,2);
      el.width=Math.max(1,Math.round(width*dpr));
      el.height=Math.max(1,Math.round(height*dpr));
    };
    if(timeline.current.pulse!==pulse) timeline.current={pulse,started:performance.now()};
    const start=timeline.current.started;
    const observer=new ResizeObserver(()=>{
      resize();
      cancelAnimationFrame(frame);
      draw(performance.now());
    });
    function draw(time) {
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,width,height);
      const scale=Math.min(width/700,height/340);
      ctx.translate((width-700*scale)/2,(height-340*scale)/2);
      ctx.scale(scale,scale);
      const glow=ctx.createRadialGradient(355,178,18,355,178,320);
      glow.addColorStop(0,'#2e7d722e');
      glow.addColorStop(1,'#2e7d7200');
      ctx.fillStyle=glow;
      ctx.fillRect(0,0,700,340);
      for(let x=17;x<690;x+=17) for(let y=17;y<330;y+=17) {
        ctx.fillStyle='#7aabbd32';
        ctx.fillRect(x,y,1,1);
      }
      ctx.lineWidth=1;
      ctx.strokeStyle='#547f8fa8';
      edges.forEach(([a,b])=>line(ctx,[vertices[a],vertices[b]]));
      const elapsed=Math.max(0,time-start);
      const cycle=pulse?pulse-1:Math.floor(elapsed/cycleDuration);
      const route=routes[cycle%routes.length];
      const progress=reduced?1:Math.min(1,(pulse?elapsed:elapsed%cycleDuration)/routeDuration);
      const {reached,point}=position(route,progress);
      ctx.lineJoin='round';
      ctx.lineCap='round';
      ctx.strokeStyle='#38787980';
      ctx.lineWidth=2;
      line(ctx,route.points);
      const routeColor=ctx.createLinearGradient(60,0,660,0);
      routeColor.addColorStop(0,'#80a8c8');
      routeColor.addColorStop(.55,'#74d6be');
      routeColor.addColorStop(1,'#baf1d3');
      ctx.strokeStyle=routeColor;
      ctx.lineWidth=2.1;
      ctx.shadowColor='#47d4b377';
      ctx.shadowBlur=15;
      line(ctx,[...route.points.slice(0,reached+1),point]);
      ctx.shadowBlur=0;
      const visited=route.ids.slice(0,reached+1);
      const focused=visited.includes(18)?18:visited.includes(9)?9:0;
      vertices.forEach(([x,y],i)=>tile(ctx,x,y,visited.includes(i),i===focused,i===0?'mail':i===9?'node':i===18?'inbox':null));
      const [x,y]=point;
      ctx.save();
      ctx.translate(x,y);
      ctx.shadowColor='#84ffd9';
      ctx.shadowBlur=17;
      ctx.fillStyle='#b5ffe0';
      ctx.strokeStyle='#174249';
      ctx.beginPath();
      ctx.roundRect(-9,-6,18,12,3);
      ctx.fill();
      ctx.lineWidth=1.1;
      line(ctx,[[-8,-5],[0,1],[8,-5]]);
      ctx.restore();
      ctx.font='600 14px system-ui';
      ctx.textAlign='center';
      ctx.fillStyle='#a3c1c4';
      ctx.fillText('Remetente',66,239);
      ctx.fillText('Nó escolhido',356,216);
      ctx.fillText('Entrada',638,168);
      if(!reduced && (!pulse||progress<1)) frame=requestAnimationFrame(draw);
    }
    resize();
    observer.observe(el);
    draw(performance.now());
    return()=>{observer.disconnect();cancelAnimationFrame(frame);};
  },[pulse]);
  return <canvas aria-label="Diagrama do trajeto de um envelope cifrado do remetente à caixa de entrada" role="img" ref={canvas}/>;
}
