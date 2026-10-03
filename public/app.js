const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
let locations = [];
let goal = 'food';
let minutes = 15;

function scrolly(){
  const section = $('.hero-scrolly');
  const rect = section.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, -rect.top / (section.offsetHeight - innerHeight)));
  const copies = ['.copy-1','.copy-2','.copy-3','.copy-4'].map(s=>$(s));
  const ranges = [[0,.18],[.18,.42],[.42,.68],[.68,1]];
  copies.forEach((el,i)=>{
    const [a,b] = ranges[i];
    let p = (progress-a)/(b-a); p = Math.max(0,Math.min(1,p));
    const opacity = Math.sin(p*Math.PI);
    el.style.opacity = opacity;
    el.style.transform = `translateY(${(1-opacity)*35}px)`;
  });
  const scene = $('.cgi-scene');
  scene.style.transform = `scale(${1 + progress*.08})`;
  $('.phone-frame').style.transform = `rotate(${7-progress*15}deg) translateY(${progress*-30}px)`;
  $('.scroll-cue').style.opacity = Math.max(0,1-progress*6);
}
addEventListener('scroll', scrolly, {passive:true}); addEventListener('resize', scrolly); scrolly();

function fallbackEngine(item){
  const occupancy = item.capacity ? Math.round(item.users*100/item.capacity) : 0;
  let wait = occupancy >= 100 ? 16 : occupancy >= 81 ? 13 : occupancy >= 61 ? 9 : occupancy >= 31 ? 5 : 2;
  wait += Math.floor(item.users/6) * (item.category === 'print' ? 2 : 1);
  let status = occupancy >= 100 ? 'OVERLOADED' : occupancy >= 81 ? 'VERY BUSY' : occupancy >= 61 ? 'BUSY' : occupancy >= 31 ? 'MODERATE' : 'LOW CROWD';
  return {...item, occupancy, waitMinutes:wait, flowScore:Math.max(0,Math.min(100,100-occupancy-wait*2)), status, statusCode: occupancy>=100?'critical':occupancy>=81?'high':occupancy>=61?'busy':occupancy>=31?'moderate':'low', priorityScore:Math.min(100,item.reports+item.confirmations+item.urgency*5)};
}

async function loadLocations(){
  try{
    const r = await fetch('/api/locations');
    const data = await r.json();
    locations = data.locations.map(x=>x.engineError ? fallbackEngine(x) : x);
    $('#engine-status').textContent = data.engine ? 'C ENGINE ONLINE' : 'C ENGINE UNAVAILABLE';
    $('#engine-status').parentElement.style.background = data.engine ? 'rgba(207,232,220,.55)' : 'rgba(255,217,199,.55)';
  }catch(e){
    locations = demoData().map(fallbackEngine);
    $('#engine-status').textContent = 'DEMO MODE';
  }
  render();
}
function demoData(){ return [
 {id:'canteen',name:'Main Canteen',category:'food',icon:'🍜',area:'Block A · Ground Floor',users:34,capacity:42,reports:29,confirmations:36,urgency:4,accent:'peach'},
 {id:'cafe',name:'Campus Café',category:'food',icon:'☕',area:'Block B · Courtyard',users:8,capacity:26,reports:11,confirmations:8,urgency:2,accent:'lavender'},
 {id:'printing-a',name:'Print Hub A',category:'print',icon:'🖨️',area:'Library · Level 1',users:13,capacity:10,reports:18,confirmations:25,urgency:4,accent:'butter'},
 {id:'printing-b',name:'Print Hub B',category:'print',icon:'📄',area:'Admin Block · Lobby',users:3,capacity:10,reports:7,confirmations:5,urgency:2,accent:'mint'},
 {id:'library',name:'Library Commons',category:'study',icon:'📚',area:'Library · Ground Floor',users:62,capacity:120,reports:12,confirmations:18,urgency:2,accent:'sky'},
 {id:'sports',name:'Sports Complex',category:'sports',icon:'🏀',area:'South Court',users:22,capacity:70,reports:6,confirmations:9,urgency:1,accent:'rose'}
];}
function render(){
  const relevant = locations.filter(x=>x.category===goal);
  const pool = relevant.length ? relevant : locations;
  const viable = pool.map(x=>({...x, recommended: x.waitMinutes <= minutes})).sort((a,b)=>b.flowScore-a.flowScore);
  const best = viable[0];
  renderRecommendation(best);
  $('#locationGrid').innerHTML = pool.map(x=>card(x,best?.id)).join('');
  $$('.confirm').forEach(btn=>btn.addEventListener('click',()=>confirmSignal(btn.dataset.id)));
}
function card(x,bestId){
  const pct = Math.min(100,Math.max(0,x.occupancy));
  const bg = ({peach:'var(--peach)',lavender:'var(--lav)',butter:'var(--butter)',mint:'var(--mint)',sky:'var(--sky)',rose:'var(--rose)'})[x.accent] || 'var(--lav)';
  return `<article class="location-card glass ${x.id===bestId?'recommended':''}" style="--card-bg:${bg}">
    <div class="card-head"><span class="location-icon">${x.icon}</span><span class="status">${x.status}</span></div>
    <h3>${x.name}</h3><div class="area">${x.area}</div>
    <div class="metrics"><div class="metric"><span>Current load</span><strong>${x.occupancy}%</strong></div><div class="metric"><span>Est. wait</span><strong>${x.waitMinutes} min</strong></div><div class="metric"><span>Flow score</span><strong>${x.flowScore}</strong></div><div class="metric"><span>Signals</span><strong>${x.confirmations}</strong></div></div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    <button class="confirm" data-id="${x.id}">I’ve seen this too · +1 signal</button>
  </article>`;
}
function renderRecommendation(best){
  const box = $('#recommendation');
  if(!best){ box.className='recommendation glass'; return; }
  const saving = Math.max(0, Math.max(...locations.filter(x=>x.category===goal).map(x=>x.waitMinutes),best.waitMinutes) - best.waitMinutes);
  box.className='recommendation glass show';
  box.innerHTML = `<div><div class="rec-tag">⚡ C ENGINE RECOMMENDATION</div><h3>Go to ${best.name}.</h3><p>${best.status} · ${best.waitMinutes} min estimated wait · flow score ${best.flowScore}/100.</p></div><div class="save-badge"><strong>${saving || 0} min</strong><span>potential saving</span></div>`;
}
async function confirmSignal(id){
  const btn = document.querySelector(`.confirm[data-id="${id}"]`); if(btn){btn.disabled=true;btn.textContent='Signal added ✓';}
  try{await fetch(`/api/confirm/${id}`,{method:'POST'}); await loadLocations();}catch(e){locations=locations.map(x=>x.id===id?{...x,confirmations:x.confirmations+1}:x);render();}
}
$('#timeRange').addEventListener('input',e=>{minutes=+e.target.value;$('#timeValue').textContent=minutes;});
$$('.goal').forEach(btn=>btn.addEventListener('click',()=>{$$('.goal').forEach(x=>x.classList.remove('active'));btn.classList.add('active');goal=btn.dataset.goal;render();}));
loadLocations();

let simulatedMinutes = 162;
setInterval(()=>{ simulatedMinutes += Math.random()>.55 ? 1 : 0; $('#timeSaved').textContent = simulatedMinutes; }, 4000);
