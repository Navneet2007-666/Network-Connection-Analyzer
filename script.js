const T={Router:['#ff5ecb','RT'],Switch:['#22e5ff','SW'],Server:['#b18cff','SV'],Computer:['#5dffb0','PC'],Laptop:['#ffd166','LP'],Firewall:['#ff6b6b','FW']};
const PAL=['#22e5ff','#ff5ecb','#ffd166','#5dffb0','#b18cff','#ff8a4c','#5b8cff','#d4ff4d'];
const PRE={'Small Office':{n:[['Gateway','Router','192.168.1.1',450,70],['Firewall','Firewall','192.168.1.2',450,160],['Switch-1','Switch','192.168.1.3',450,260],['File-Server','Server','192.168.1.10',250,360],['PC-1','Computer','192.168.1.21',400,420],['PC-2','Computer','192.168.1.22',550,420],['Laptop-1','Laptop','192.168.1.31',680,360]],e:[[0,1],[1,2],[2,3],[2,4],[2,5],[2,6]]},
'University Campus':{n:[['Core-R1','Router','10.0.0.1',450,60],['Core-R2','Router','10.0.0.2',650,120],['Campus-FW','Firewall','10.0.0.3',250,120],['Lib-SW','Switch','10.1.0.1',150,260],['Lab-SW','Switch','10.2.0.1',450,260],['Dorm-SW','Switch','10.3.0.1',750,260],['Web-Server','Server','10.0.1.10',300,260],['Lib-PC1','Computer','10.1.0.21',80,400],['Lib-PC2','Computer','10.1.0.22',220,400],['Lab-PC1','Computer','10.2.0.21',380,420],['Lab-PC2','Computer','10.2.0.22',520,420],['Dorm-L1','Laptop','10.3.0.31',690,420],['Dorm-L2','Laptop','10.3.0.32',820,400]],e:[[0,1],[0,2],[1,5],[0,4],[2,3],[2,6],[3,7],[3,8],[4,9],[4,10],[5,11],[5,12],[1,4]]},
'Disconnected':{n:[['HQ-Router','Router','172.16.0.1',200,100],['HQ-SW','Switch','172.16.0.2',200,220],['HQ-PC','Computer','172.16.0.10',100,340],['HQ-Server','Server','172.16.0.11',300,340],['Branch-R','Router','172.17.0.1',650,100],['Branch-L','Laptop','172.17.0.10',650,260],['Lone-PC','Computer','172.18.0.5',450,430]],e:[[0,1],[1,2],[1,3],[4,5]]},
'Complex':{n:Array.from({length:14},(_,i)=>[['Core','Edge','Hub','Link'][i%4]+'-'+(i+1),['Router','Switch','Firewall','Server','Computer','Laptop'][i%6],'10.9.0.'+(i+1),450+300*Math.cos(i*6.283/14),280+210*Math.sin(i*6.283/14)]),e:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[0,7],[0,5],[2,9],[9,10],[10,11],[11,12],[3,12],[8,13],[13,1],[4,10]]}};
let S={nodes:[],edges:[]},sel=null,connect=false,H={},hist=[],fut=[],view={x:0,y:0,w:900,h:560},steps=[],si=-1,timer=null,uid=1;
const $=id=>document.getElementById(id),clone=o=>JSON.parse(JSON.stringify(o));
function toast(m){const d=document.createElement('div');d.textContent=m;$('toast').append(d);setTimeout(()=>d.remove(),2400)}
function snap(){hist.push(clone(S));if(hist.length>60)hist.shift();fut=[];ctl()}
function ctl(){$('undo').disabled=!hist.length;$('redo').disabled=!fut.length}
function adj(){const a={};S.nodes.forEach(n=>a[n.id]=[]);S.edges.forEach(([x,y])=>{a[x].push(y);a[y].push(x)});return a}
const nm=id=>(S.nodes.find(n=>n.id===id)||{}).name;
// DFS: iterative with explicit stack; returns ordered steps for visualisation
function dfsRun(start,target){const a=adj(),vis=new Set(),par={},st=[[start,null]],out=[],order=[];
 out.push({cur:null,stack:[start],vis:[],edge:null,note:'Push the start device '+nm(start)+' onto the stack.'});
 let found=false;
 while(st.length){const [u,p]=st.pop();
  if(vis.has(u)){out.push({cur:u,stack:st.map(s=>s[0]),vis:[...vis],edge:p!=null?[p,u]:null,note:nm(u)+' was already visited, so skip it.'});continue}
  vis.add(u);par[u]=p;order.push(u);
  out.push({cur:u,stack:st.map(s=>s[0]),vis:[...vis],edge:p!=null?[p,u]:null,note:'Pop and visit '+nm(u)+(p!=null?' (reached from '+nm(p)+')':'')+'.'});
  if(u===target){found=true;break}
  const nb=a[u].filter(v=>!vis.has(v));
  for(let i=nb.length-1;i>=0;i--)st.push([nb[i],u]);
  out.push({cur:u,stack:st.map(s=>s[0]),vis:[...vis],edge:null,note:nb.length?'Push unvisited neighbors of '+nm(u)+': '+nb.map(nm).join(', ')+'.':nm(u)+' has no unvisited neighbors; backtrack.'})}
 let path=[];if(found){for(let x=target;x!=null;x=par[x])path.unshift(x)}
 return{steps:out,order,found,path,vis}}
function comps(){const seen=new Set(),res=[];S.nodes.forEach(n=>{if(!seen.has(n.id)){const r=dfsRun(n.id);r.vis.forEach(v=>seen.add(v));res.push(r.order)}});return res}
function pathEdges(p){const s=new Set();for(let i=0;i<p.length-1;i++)s.add(p[i]+'|'+p[i+1]+'|'+p[i+1]+'|'+p[i]);return p.slice(0,-1).map((x,i)=>[x,p[i+1]])}
const ek=(a,b)=>a<b?a+'|'+b:b+'|'+a;
function draw(svg,interactive){const ns=svg.namespaceURI;let h='<defs><filter id="g"><feGaussianBlur stdDeviation="3"/></filter></defs>';
 const hot=new Set((H.edges||[]).map(e=>ek(e[0],e[1]))),vis=new Set(H.vis||[]);
 S.edges.forEach(([a,b])=>{const A=S.nodes.find(n=>n.id===a),B=S.nodes.find(n=>n.id===b);if(!A||!B)return;const on=hot.has(ek(a,b));
  h+=`<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${on?'#facc15':'rgba(200,160,255,.5)'}" stroke-width="${on?4:2}" ${interactive?`data-e="${a},${b}" style="cursor:pointer"`:''}/>`});
 S.nodes.forEach(n=>{const [col,ab]=T[n.type];const cc=H.comp&&H.comp[n.id],ring=cc||(vis.has(n.id)?'#34d399':null),isSel=interactive&&sel===n.id,cur=H.cur===n.id,fp=(H.path||[]).includes(n.id);
  const deg=adj()[n.id].length;
  h+=`<g class="node" ${interactive?`data-n="${n.id}"`:''} transform="translate(${n.x},${n.y})">`+
  (cur?`<circle r="34" fill="#facc15" opacity=".35" filter="url(#g)"/>`:'')+
  `<circle class="r" r="24" style="filter:drop-shadow(0 0 7px ${col})" fill="${col}" fill-opacity=".22" stroke="${isSel?'#fff':fp?'#facc15':ring||col}" stroke-width="${isSel||ring||fp?4:2}"/>`+
  `<text y="5" text-anchor="middle" fill="${col}" font-weight="700" font-size="13">${ab}</text>`+
  `<circle cx="18" cy="-18" r="5" fill="${deg?'#34d399':'#f87171'}"/>`+
  `<text y="42" text-anchor="middle" fill="currentColor" style="fill:var(--tx)" font-size="12">${n.name.replace(/</g,'&lt;')}</text></g>`});
 svg.innerHTML=h}
function render(){const v=`${view.x} ${view.y} ${view.w} ${view.h}`;$('cv').setAttribute('viewBox',v);draw($('cv'),true);draw($('cv2'),false);stats();list();selects();
 $('hint').textContent=S.nodes.length?(connect?'Connect mode: click one device, then another to link them.':'Drag devices to move. Click a device to edit it. Click a link and press Delete selected to remove it.'):'';
 if(!S.nodes.length)$('cv').insertAdjacentHTML('beforeend','<text x="450" y="270" text-anchor="middle" style="fill:var(--mu)" font-size="16">Empty network. Add a device or load a sample network.</text>');
 $('adjx').textContent=S.nodes.length?Object.entries(adj()).map(([k,v])=>nm(+k)+' → ['+v.map(nm).join(', ')+']').join('\n'):'(add devices to see the adjacency list)';
 cout()}
function stats(){const c=comps(),n=S.nodes.length,e=S.edges.length,ok=n>0&&c.length===1;
 const it=[['Devices',n],['Connections',e],['Components',c.length],['Status',n?(ok?'<span class="ok">Connected</span>':'<span class="bad">Disconnected</span>'):'<span class="mu">Empty</span>'],['Avg. degree',n?(2*e/n).toFixed(2):'0.00']];
 $('stats').innerHTML=it.map(x=>`<div class="card stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('')}
function cout(){const c=comps(),n=S.nodes.length;if(!n){$('cout').innerHTML='<span class="mu">Add devices to analyze connectivity.</span>';return}
 const ok=c.length===1;$('cout').innerHTML=`<p><b class="${ok?'ok':'bad'}">${ok?'Network is connected':'Network is disconnected'}</b></p><p class="mu">${ok?'Every device can reach every other device.':'Some devices cannot reach each other. The network has '+c.length+' separate groups.'}</p>`+
 c.map((g,i)=>`<div><span class="chip" style="border-color:${PAL[i%8]};color:${PAL[i%8]}">Component ${i+1}${g.length===1?' (isolated)':''}</span>${g.map(nm).join(', ')}</div>`).join('')}
function list(){const q=$('q').value.toLowerCase(),f=$('ff').value;const L=S.nodes.filter(n=>(f==='All'||n.type===f)&&(n.name.toLowerCase().includes(q)||n.ip.includes(q)));
 $('dl').innerHTML=L.length?L.map(n=>`<div class="li ${sel===n.id?'sel':''}" data-id="${n.id}"><span>${n.name}</span><span class="mu">${n.ip}</span></div>`).join(''):'<div class="mu" style="padding:8px">No devices match.</div>'}
function selects(){const o=S.nodes.map(n=>`<option value="${n.id}">${n.name} (${n.ip})</option>`).join('')||'<option value="">No devices</option>';
 ['rs','rd','ss'].forEach(id=>{const e=$(id),v=e.value;e.innerHTML=o;if(v&&S.nodes.some(n=>n.id==v))e.value=v});if(S.nodes.length>1&&$('rs').value===$('rd').value&&!$('rd').dataset.t){$('rd').selectedIndex=1}}
function form(){const n=S.nodes.find(x=>x.id===sel);$('ftitle').textContent=n?'Edit device':'Add device';$('fsub').textContent=n?'Update device':'Add device';
 $('fn').value=n?n.name:'';$('ft').value=n?n.type:'Router';$('fi').value=n?n.ip:'';$('fd').value=n?n.desc:'';$('ferr').textContent=''}
function select(id){sel=id;form();render()}
const ipOk=s=>/^(\d{1,3}\.){3}\d{1,3}$/.test(s)&&s.split('.').every(x=>+x<=255);
$('fsub').onclick=()=>{const name=$('fn').value.trim(),ip=$('fi').value.trim(),type=$('ft').value,desc=$('fd').value.trim(),cur=S.nodes.find(n=>n.id===sel);let er='';
 if(!name)er='Enter a device name.';else if(S.nodes.some(n=>n.name.toLowerCase()===name.toLowerCase()&&n!==cur))er='A device named "'+name+'" already exists.';
 else if(!ipOk(ip))er='Enter a valid IPv4 address, like 192.168.1.10.';else if(S.nodes.some(n=>n.ip===ip&&n!==cur))er='That IP address is already in use.';
 if(er){$('ferr').textContent=er;return}snap();
 if(cur){Object.assign(cur,{name,type,ip,desc});toast('Updated '+name)}else{const k=S.nodes.length;S.nodes.push({id:uid++,name,type,ip,desc,x:view.x+view.w/2+(k%5)*30-60,y:view.y+view.h/2+(k%4)*30-45});sel=null;toast('Added '+name)}
 H={};form();render()};
$('fcancel').onclick=()=>select(null);
$('del').onclick=()=>{if(sel){snap();const n=nm(sel);S.nodes=S.nodes.filter(x=>x.id!==sel);S.edges=S.edges.filter(e=>!e.includes(sel));sel=null;H={};form();render();toast('Deleted '+n)}else if(selE){snap();S.edges=S.edges.filter(e=>ek(e[0],e[1])!==selE);selE=null;H={};render();toast('Connection deleted')}else toast('Select a device or a link first.')};
let selE=null,pend=null,drag=null,pan=null,moved=false;
function pt(ev,svg){const p=svg.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
const cv=$('cv');
cv.onpointerdown=ev=>{const n=ev.target.closest('[data-n]'),e=ev.target.closest('[data-e]');moved=false;
 if(n){const id=+n.dataset.n;if(connect){if(pend==null){pend=id;sel=id;toast('Now click the second device');render()}else{linkUp(pend,id);pend=null}return}
  const p=pt(ev,cv),N=S.nodes.find(x=>x.id===id);drag={id,dx:N.x-p.x,dy:N.y-p.y};snap();cv.setPointerCapture(ev.pointerId);select(id)}
 else if(e){const [a,b]=e.dataset.e.split(',').map(Number);selE=ek(a,b);sel=null;H={edges:[[a,b]]};form();render();toast('Link selected: '+nm(a)+' – '+nm(b))}
 else{pan={x:ev.clientX,y:ev.clientY,vx:view.x,vy:view.y};cv.setPointerCapture(ev.pointerId);selE=null;if(sel!=null){sel=null;form()}}};
cv.onpointermove=ev=>{if(drag){moved=true;const p=pt(ev,cv),N=S.nodes.find(x=>x.id===drag.id);N.x=p.x+drag.dx;N.y=p.y+drag.dy;render()}
 else if(pan){const r=cv.getBoundingClientRect();view.x=pan.vx-(ev.clientX-pan.x)*view.w/r.width;view.y=pan.vy-(ev.clientY-pan.y)*view.h/r.height;cv.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`)}};
cv.onpointerup=()=>{if(drag&&!moved)hist.pop();drag=null;pan=null;ctl()};
cv.onwheel=ev=>{ev.preventDefault();zoom(ev.deltaY<0?.85:1.18)};
function zoom(f){const cx=view.x+view.w/2,cy=view.y+view.h/2;view.w*=f;view.h*=f;view.x=cx-view.w/2;view.y=cy-view.h/2;render()}
$('zi').onclick=()=>zoom(.8);$('zo').onclick=()=>zoom(1.25);
function fit(){if(!S.nodes.length){view={x:0,y:0,w:900,h:560};render();return}const xs=S.nodes.map(n=>n.x),ys=S.nodes.map(n=>n.y),x0=Math.min(...xs)-70,x1=Math.max(...xs)+70,y0=Math.min(...ys)-70,y1=Math.max(...ys)+80;
 let w=x1-x0,h=y1-y0;const r=900/560;if(w/h<r){const nw=h*r;view.x=x0-(nw-w)/2;view.w=nw;view.y=y0;view.h=h}else{const nh=w/r;view.y=y0-(nh-h)/2;view.h=nh;view.x=x0;view.w=w}render()}
$('fit').onclick=fit;
function linkUp(a,b){if(a===b){toast('A device cannot connect to itself.');return}if(S.edges.some(e=>ek(e[0],e[1])===ek(a,b))){toast('Those devices are already connected.');return}snap();S.edges.push([a,b]);H={};render();toast('Connected '+nm(a)+' and '+nm(b))}
$('conn').onclick=()=>{connect=!connect;pend=null;$('conn').textContent='Connect mode: '+(connect?'on':'off');$('conn').classList.toggle('pri',connect);render()};
$('dl').onclick=e=>{const l=e.target.closest('.li');if(l)select(+l.dataset.id)};
$('q').oninput=list;$('ff').onchange=list;
function undo(){if(!hist.length)return;fut.push(clone(S));S=hist.pop();sel=null;H={};form();render();ctl()}
function redo(){if(!fut.length)return;hist.push(clone(S));S=fut.pop();H={};render();ctl()}
$('undo').onclick=undo;$('redo').onclick=redo;
function load(d,msg){snap();S={nodes:d.nodes.map(n=>({desc:'',...n})),edges:d.edges};uid=Math.max(0,...S.nodes.map(n=>n.id))+1;sel=null;selE=null;H={};stop();steps=[];form();fit();toast(msg)}
function preset(k){const p=PRE[k];load({nodes:p.n.map((r,i)=>({id:i+1,name:r[0],type:r[1],ip:r[2],x:r[3],y:r[4]})),edges:p.e.map(e=>[e[0]+1,e[1]+1])},'Loaded '+k)}
$('pre').innerHTML=Object.keys(PRE).map(k=>`<button class="btn" data-p="${k}">${k}</button>`).join('');
$('pre').onclick=e=>{if(e.target.dataset.p)preset(e.target.dataset.p)};
$('ft').innerHTML=Object.keys(T).map(t=>`<option>${t}</option>`).join('');
$('ff').innerHTML='<option>All</option>'+Object.keys(T).map(t=>`<option>${t}</option>`).join('');
$('save').onclick=()=>{try{localStorage.setItem('nca',JSON.stringify(S));toast('Network saved in this browser')}catch(e){toast('Saving is blocked in this browser.')}};
$('exp').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='network.json';a.click();toast('Exported network.json — if no download starts, copy it from Save instead')};
$('imp').onclick=()=>$('file').click();
$('file').onchange=ev=>{const f=ev.target.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!Array.isArray(d.nodes)||!Array.isArray(d.edges))throw 0;const ids=new Set(d.nodes.map(n=>n.id));if(ids.size!==d.nodes.length)throw 0;if(!d.nodes.every(n=>T[n.type]&&n.name&&typeof n.x=='number'))throw 0;if(!d.edges.every(e=>ids.has(e[0])&&ids.has(e[1])&&e[0]!==e[1]))throw 0;load(d,'Imported '+d.nodes.length+' devices')}catch(e){toast('Invalid file: expected nodes and edges with valid ids and device types.')}});ev.target.value=''};
$('reset').onclick=()=>$('modal').classList.add('on');$('mno').onclick=()=>$('modal').classList.remove('on');
$('myes').onclick=()=>{$('modal').classList.remove('on');snap();S={nodes:[],edges:[]};sel=null;H={};stop();steps=[];form();render();toast('Network cleared')};
$('theme').onclick=()=>{const r=document.documentElement;const dark=getComputedStyle(r).getPropertyValue('--bg').trim()==='#0b0618';r.dataset.theme=dark?'light':'dark'};
$('nav').onclick=e=>{const v=e.target.dataset.v;if(!v)return;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b===e.target));document.querySelectorAll('.view').forEach(s=>s.classList.toggle('on',s.id===v));render()};
// Analysis
$('rgo').onclick=()=>{const a=+$('rs').value,b=+$('rd').value;if(!a||!b){$('rout').innerHTML='<span class="bad">Add at least two devices first.</span>';return}
 if(a===b){$('rout').innerHTML='<span class="bad">Choose two different devices.</span>';return}
 const r=dfsRun(a,b);H={path:r.path,edges:pathEdges(r.path),vis:[]};
 $('rout').innerHTML=r.found?`<p class="ok"><b>${nm(b)} is reachable from ${nm(a)}.</b></p><p>Path found: ${r.path.map(nm).join(' → ')}</p><p class="mu">DFS visit order: ${r.order.map(nm).join(', ')}</p><p class="mu">DFS finds a path, not always the shortest one.</p>`:
 `<p class="bad"><b>${nm(b)} is not reachable from ${nm(a)}.</b></p><p class="mu">DFS explored every device it could reach (${r.order.map(nm).join(', ')}) and never found the destination.</p>`;render()};
$('rclr').onclick=()=>{H={};$('rout').innerHTML='';render()};
$('cgo').onclick=()=>{const c=comps(),m={};c.forEach((g,i)=>g.forEach(id=>m[id]=PAL[i%8]));H={comp:m};render();toast(c.length+' component'+(c.length===1?'':'s')+' colored')};
function stop(){clearInterval(timer);timer=null;$('splay').textContent='Play'}
function showStep(){if(si<0){H={};$('sout').textContent='Pick a start device and press Start.';render();return}const s=steps[si];
 H={vis:s.vis,cur:s.cur,edges:s.edge?[s.edge]:[]};
 $('sout').innerHTML=`<p><b>Step ${si+1} of ${steps.length}</b>: ${s.note}</p><p>Stack (top on right): <b>[${s.stack.map(nm).join(', ')}]</b></p><p>Traversal order: ${s.vis.map(nm).join(' → ')||'—'}</p>`+(si===steps.length-1?'<p class="ok">Traversal complete.</p>':'');render()}
$('sgo').onclick=()=>{const s=+$('ss').value;if(!s){toast('Add a device first.');return}stop();steps=dfsRun(s).steps;si=0;showStep()};
$('snext').onclick=()=>{if(!steps.length)return toast('Press Start first.');if(si<steps.length-1){si++;showStep()}else stop()};
$('sprev').onclick=()=>{if(steps.length&&si>0){si--;showStep()}};
$('sreset').onclick=()=>{stop();steps=[];si=-1;showStep()};
$('splay').onclick=()=>{if(!steps.length)return toast('Press Start first.');if(timer)return stop();if(si>=steps.length-1)si=-1;$('splay').textContent='Pause';timer=setInterval(()=>{if(si<steps.length-1){si++;showStep()}else stop()},900)};
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='Delete'||e.key==='Backspace')$('del').click();if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo()}});
try{const s=localStorage.getItem('nca');if(s){const d=JSON.parse(s);if(d.nodes&&d.nodes.length){S=d;uid=Math.max(0,...S.nodes.map(n=>n.id))+1}}}catch(e){}
if(!S.nodes.length)preset('Small Office');hist=[];fut=[];ctl();form();fit();
