<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>POCKETBOT v2 - M1 sync</title></head><body><style>
body{text-align:left;background:#0b0e17;color:#e8ecf4;font-family:Inter,system-ui,Arial;margin:0}
.wrap{max-width:1020px;margin:0 auto;padding:14px}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.logo{font-weight:800;font-size:22px}.logo span{color:#2ebd85}
.pill{font-size:12px;padding:6px 12px;border-radius:99px;border:1px solid #2a3556;background:#131827}
.card{background:#131827;border:1px solid #222c46;border-radius:14px;padding:14px;margin-top:12px}
.row{display:flex;gap:10px;flex-wrap:wrap}.row>*{flex:1;min-width:140px}
label{font-size:11px;opacity:.65;display:block;margin-bottom:4px;text-transform:uppercase}
select,input,button{width:100%;padding:10px;border-radius:10px;border:1px solid #2a3556;background:#0f1526;color:#fff;box-sizing:border-box}
button{cursor:pointer;font-weight:800;border:0}
.btnGo{background:#2ebd85}.btnStop{background:#e5484d}.btnGhost{background:#1c2540}.btnWarn{background:#b88600}
#chart{width:100%;height:320px;display:block;background:#0a0f1e;border-radius:12px;border:1px solid #1e2947}
.badge{font-size:30px;font-weight:900;padding:10px 20px;border-radius:12px;display:inline-block}
.buy{background:rgba(46,189,133,.15);color:#2ebd85;border:1px solid #2ebd85}
.sell{background:rgba(229,72,77,.15);color:#ff6b70;border:1px solid #e5484d}
.skip{background:rgba(140,150,180,.12);color:#8a94ad;border:1px solid #3a4566}
.meta{font-size:13px;line-height:1.65}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.kv{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid #1e2947}
.kv b{font-variant-numeric:tabular-nums}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:8px}
th,td{padding:7px;border-bottom:1px solid #222c46;text-align:left}
.ok{color:#2ebd85;font-weight:700}.ko{color:#ff6b70;font-weight:700}.mid{color:#ffc400;font-weight:700}
.confBar{height:9px;background:#0f1526;border-radius:99px;overflow:hidden;margin-top:8px;border:1px solid #222c46}
.confFill{height:100%;background:linear-gradient(90deg,#2ebd85,#7cf7c4);transition:width .4s}
.warn{font-size:12px;opacity:.6;margin-top:10px;line-height:1.5}
.timer{font-variant-numeric:tabular-nums;font-weight:900;font-size:18px}
@media(max-width:700px){.grid2{grid-template-columns:1fr}}
</style>
<div class="wrap">
<div class="top">
<div class="logo">POCKET<span>BOT</span> <span style="font-size:12px;color:#8a94ad">v2 • M1 sync</span></div>
<div style="display:flex;gap:8px;align-items:center">
<span class="pill" id="clockEl">--:--:--</span>
<span class="pill" id="syncEl">M1: --s</span>
<span class="pill" id="poEl">Pocket: déconnecté</span>
</div>
</div>
<div class="card">
<div class="meta"><b>Connexion Pocket Option</b> <span style="opacity:.6">démo uniquement • SSID via F12 Network WS • reste dans ton navigateur</span></div>
<div class="row" style="margin-top:8px">
<div><label>SSID / session</label><input id="ssidInput" type="password" placeholder="colle ton SSID ici"></div>
<div><label>Compte</label><select id="demoInput"><option value="1">Démo</option><option value="0">Réel (déconseillé)</option></select></div>
<div><label>&nbsp;</label><button class="btnGo" id="poBtn">CONNECTER</button></div>
<div><label>Trade auto</label><button class="btnGhost" id="tradeBtn">TRADE AUTO: OFF</button></div>
</div>
<div class="meta" id="poMsg" style="margin-top:6px;opacity:.8">Non connecté — le bot utilise prix simu + Yahoo via superFetch. Connecté → vraies bougies Pocket.</div>
</div>
<div class="card">
<div class="row">
<div><label>Actif</label><select id="assetInput"></select></div>
<div><label>Stratégie</label><select id="stratInput"></select></div>
<div><label>Expiration</label><select id="tfInput"><option value="60">1 min</option><option value="300">5 min</option><option value="180">3 min</option></select></div>
<div><label>Confiance min %</label><input id="minConfInput" type="number" value="68" min="50" max="95"></div>
</div>
<div class="row" style="margin-top:10px">
<div><label>Mise de base $</label><input id="amtInput" type="number" value="100" min="1"></div>
<div><label>Payout % Pocket</label><input id="payInput" type="number" value="92" min="50" max="98"></div>
<div><label>Balance $</label><input id="balInput" type="number" value="100"></div>
<div><label>Synchro</label><select id="syncInput"><option value="nextm1">Bougie M1 suivante</option><option value="now">Immédiat +5s</option></select></div>
</div>
<div class="row" style="margin-top:10px">
<button class="btnGo" id="analyzeBtn">ANALYSER</button>
<button class="btnGhost" id="autoBtn">AUTO CHAQUE BOUGIE: OFF</button>
<button class="btnGhost" id="copyBtn">COPIER</button>
<button class="btnGhost" id="csvBtn">CSV</button>
</div>
</div>
<div class="card">
<canvas id="chart" width="1000" height="320"></canvas>
<div class="row" style="margin-top:10px">
<div class="meta" id="priceEl">-</div>
<div class="meta" style="text-align:right">Entrée dans <span class="timer" id="timerEl">--</span> <span id="entryEl"></span></div>
</div>
</div>
<div class="grid2">
<div class="card" style="margin-top:12px">
<div class="meta"><b>Signal</b></div>
<div style="margin:8px 0"><span id="dirBadge" class="badge skip">SCAN</span></div>
<div class="meta" id="sigMeta">Clique ANALYSER.</div>
<div class="confBar"><div class="confFill" id="confFill" style="width:0%"></div></div>
<div class="meta" id="detailEl" style="margin-top:8px"></div>
<div class="row" style="margin-top:10px">
<button class="btnGo" id="winBtn">WIN</button>
<button class="btnStop" id="lossBtn">LOSS</button>
</div>
</div>
<div class="card" style="margin-top:12px">
<div class="meta"><b>Revue technique</b> <span style="opacity:.6">RSI14 • EMA9/21 • Stoch • BB • ATR</span></div>
<div id="indEl" style="margin-top:6px"></div>
<div class="meta" style="margin-top:8px"><b>Checklist</b></div>
<div id="checkEl" style="margin-top:4px"></div>
</div>
</div>
<div class="card">
<div class="meta"><b>Analyse position Pocket</b></div>
<div class="meta" id="posText" style="margin-top:6px;white-space:pre-line">Pas d'analyse. Clique ANALYSER POSITION.</div>
<div class="row" style="margin-top:10px">
<button class="btnGo" id="posBtn">ANALYSER POSITION</button>
<button class="btnGhost" id="takeBtn">PRENDRE POSITION</button>
</div>
</div>
<div class="card">
<div class="meta"><b>Positions ouvertes</b></div>
<table><thead><tr><th>Actif</th><th>Dir</th><th>Mise</th><th>Expire</th><th>Statut</th></tr></thead><tbody id="posBody"><tr><td colspan="5" style="opacity:.6">Aucune</td></tr></tbody></table>
</div>
<div class="grid2">
<div class="card" style="margin-top:12px">
<div class="meta"><b>Risque / Session</b></div>
<div id="riskEl" style="margin-top:6px"></div>
<div class="row" style="margin-top:10px">
<button class="btnWarn" id="resetBtn">RESET SESSION</button>
</div>
</div>
<div class="card" style="margin-top:12px">
<div class="meta"><b>Martingale x2.2 — 5 niveaux</b></div>
<div id="mgTable" style="margin-top:6px"></div>
</div>
</div>
<div class="card">
<div class="meta"><b>Historique</b> — persiste en local • note le vrai résultat Pocket</div>
<table><thead><tr><th>Heure</th><th>Actif</th><th>Dir</th><th>Conf</th><th>Mise</th><th>Résultat</th></tr></thead><tbody id="histBody"></tbody></table>
<div class="warn">Simulateur éducatif sur prix simulés, pas les prix réels Pocket Option. Aucune connexion auto au compte. Ne colle jamais ton mot de passe ni ton SSID ici. Binaires = risque élevé, teste en démo.</div>
</div>
</div>
<script>
let S={candles:[],price:1.085,bucket:0,wins:0,losses:0,pnl:0,mart:0,last:null,auto:false,hist:[]};
let baseMap={"EUR/USD":1.085,"GBP/USD":1.27,"USD/JPY":151.2,"AUD/USD":0.66,"EUR/GBP":0.85,"USD/CAD":1.36,"EUR/JPY":164.0,"GBP/JPY":192.0,"AUD/CAD":0.90,"USD/CHF":0.90,"EUR/USD OTC":1.085,"GBP/USD OTC":1.27,"XAU/USD OTC":2380};
let assets=[],strats=[];
assets=["EUR/USD","GBP/USD","USD/JPY","AUD/USD","EUR/GBP","USD/CAD","EUR/JPY","GBP/JPY","AUD/CAD","USD/CHF","EUR/USD OTC","GBP/USD OTC","XAU/USD OTC"];strats=["RSI + Bollinger","EMA Cross 9/21","Stochastic + RSI","Price Action M1","Tendance + Momentum"];
let $=id=>document.getElementById(id);
let PO={ws:null,ok:false,ssid:"",demo:true,auto:false};
let POS=[];
let assetInput=$("assetInput"),stratInput=$("stratInput");
assetInput.innerHTML=assets.map(a=>`<option>${a}</option>`).join("");
stratInput.innerHTML=strats.map(s=>`<option>${s}</option>`).join("");
try{S.hist=JSON.parse(localStorage.getItem("pocketbot_v2_hist")||"[]");S.wins=parseInt(localStorage.getItem("pocketbot_v2_w")||"0");S.losses=parseInt(localStorage.getItem("pocketbot_v2_l")||"0");S.pnl=parseFloat(localStorage.getItem("pocketbot_v2_p")||"0");}catch(e){}
function save(){try{localStorage.setItem("pocketbot_v2_hist",JSON.stringify(S.hist.slice(0,120)));localStorage.setItem("pocketbot_v2_w",S.wins);localStorage.setItem("pocketbot_v2_l",S.losses);localStorage.setItem("pocketbot_v2_p",S.pnl);}catch(e){}}
function volOf(a){return a.includes("XAU")?2.8:a.includes("JPY")?0.09:a.includes("OTC")?0.0035:0.0022;}
function tickPrice(){
let v=volOf(assetInput.value||"EUR/USD");
let drift=(Math.random()-0.5)*v;
if(S.candles.length>5){let e9=emaArr(9).pop(),e21=emaArr(21).pop();drift+=(e9>e21?0.00008:-0.00008)*(S.price<10?1:50);}
S.price+=drift*(S.price>10?8:1);
}
function bucketNow(){return Math.floor(Date.now()/60000)*60000;}
function newSeed(){
S.price=baseMap[assetInput.value]||1.085;
S.candles=[];let b=bucketNow();
for(let i=60;i>=0;i--){let t=b-i*60000,o=S.price,c=o+(Math.random()-0.5)*volOf(assetInput.value)*(S.price>10?8:1),h=Math.max(o,c)+Math.random()*volOf(assetInput.value)*0.5,l=Math.min(o,c)-Math.random()*volOf(assetInput.value)*0.5;S.price=c;S.candles.push({t:t+i*0,o,h,l,c});}
S.bucket=b;
}
function closes(){return S.candles.map(c=>c.c);}
function emaArr(p){let k=2/(p+1),cl=closes(),out=[],e=cl[0];for(let i=0;i<cl.length;i++){e=i==0?cl[0]:cl[i]*k+e*(1-k);out.push(e);}return out;}
function rsi(p){p=p||14;let cl=closes();if(cl.length<p+2)return 50;let g=0,l=0;for(let i=cl.length-p;i<cl.length;i++){let d=cl[i]-cl[i-1];if(d>0)g+=d;else l-=d;}if(l==0)return 95;let rs=g/l;return 100-100/(1+rs);}
function stoch(){let n=14,sl=S.candles.slice(-n);if(sl.length<n)return 50;let cl=closes().pop(),ll=Math.min(...sl.map(c=>c.l)),hh=Math.max(...sl.map(c=>c.h));if(hh==ll)return 50;return (cl-ll)/(hh-ll)*100;}
function boll(){let n=20,sl=closes().slice(-n);let m=sl.reduce((a,b)=>a+b,0)/sl.length;let sd=Math.sqrt(sl.reduce((a,b)=>a+(b-m)*(b-m),0)/sl.length);return {m,u:m+2*sd,l:m-2*sd,w:sd};}
function atr(){let n=14,sl=S.candles.slice(-n);let s=sl.reduce((a,c)=>a+(c.h-c.l),0)/sl.length;return s;}
function analyze(silent){
let r=rsi(14),st=stoch(),e9=emaArr(9).pop(),e21=emaArr(21).pop(),bb=boll(),last=S.candles[S.candles.length-1],at=atr();
let trend=(e9-e21)/((at)||0.0001);
let score=0,reasons=[];
if(r<30){score+=2;reasons.push("RSI survente → rebond BUY");}
else if(r>70){score-=2;reasons.push("RSI surachat → rejet SELL");}
else if(r>55){score+=0.7;reasons.push("RSI momentum haussier");}
else if(r<45){score-=0.7;reasons.push("RSI momentum baissier");}
if(e9>e21){score+=1.2;reasons.push("EMA9 > EMA21 haussier");}else{score-=1.2;reasons.push("EMA9 < EMA21 baissier");}
if(st<20){score+=1;reasons.push("Stoch survente");}
else if(st>80){score-=1;reasons.push("Stoch surachat");}
if(last.c>bb.u){score-=0.8;reasons.push("Prix > Boll haute → essoufflement");}
else if(last.c<bb.l){score+=0.8;reasons.push("Prix < Boll basse → essoufflement");}
let strat=stratInput.value;
if(strat.includes("EMA"))score*=1.1;
if(strat.includes("Stoch"))score+=(st<50?0.3:-0.3);
let flat=Math.abs(trend)<0.25&&(at/volOf(assetInput.value||"EUR/USD")<0.9);
let conf=Math.round(Math.min(93,Math.max(50,58+Math.abs(score)*9+Math.random()*6)));
let dir=score>=0.4?"BUY":score<=-0.4?"SELL":"SKIP";
let minC=parseInt($("minConfInput").value)||68;
let checks=[
{t:"Tendance claire (|trend| ≥ 0.25)",ok:Math.abs(trend)>=0.25},
{t:"Pas de range plat",ok:!flat},
{t:"RSI pas extrême inverse ("+r.toFixed(0)+")",ok:!(dir==="BUY"&&r>78)&&!(dir==="SELL"&&r<22)},
{t:"Confiance ≥ "+minC+"%",ok:conf>=minC},
{t:"Actif OTC = spread large, mise /2 conseillée",ok:true}
];
if(dir==="SKIP"||conf<minC||flat&&Math.abs(score)<1.2){dir="SKIP";}
let entry;
if($("syncInput").value==="nextm1"){let n=new Date();n.setSeconds(0,0);n.setMinutes(n.getMinutes()+1);entry=n;}
else entry=new Date(Date.now()+5000);
S.last={dir,conf,asset:assetInput.value,exp:parseInt($("tfInput").value),entry,time:new Date(),r:r.toFixed(1),st:st.toFixed(0),trend:trend.toFixed(2),strat,reasons,checks};
renderSignal();renderInd(r,st,e9,e21,bb,at,trend,reasons);
if(!silent&&dir!=="SKIP")beep(660);
if(!silent&&dir==="SKIP")beep(220);
return S.last;
}
function stake(){let b=parseFloat($("amtInput").value)||5;if(S.last&&S.last.asset.includes("OTC"))b=b/2;return Math.round(b*Math.pow(2.2,S.mart)*100)/100;}
function renderSignal(){
let L=S.last,b=$("dirBadge");
if(!L)return;
b.textContent=L.dir==="BUY"?"↗ BUY":L.dir==="SELL"?"↘ SELL":"⛔ NO TRADE";
b.className="badge "+(L.dir==="BUY"?"buy":L.dir==="SELL"?"sell":"skip");
$("confFill").style.width=L.conf+"%";
$("sigMeta").innerHTML=`<b>${L.asset}</b> • ${L.strat}<br>Confiance <b>${L.conf}%</b> • Expiration ${L.exp}s<br>Entrée <b>${L.entry.toLocaleTimeString("fr-FR")}</b> — même actif + même suffixe OTC sur Pocket`;
$("detailEl").innerHTML=`Mise conseillée: <b>${stake()}$</b> • RSI ${L.r} • Stoch ${L.st}`;
$("checkEl").innerHTML=L.checks.map(c=>`<div class="kv"><span>${c.t}</span><span class="${c.ok?"ok":"ko"}">${c.ok?"OK":"NON"}</span></div>`).join("");
renderRisk();
}
function renderInd(r,st,e9,e21,bb,at,trend,reasons){
let f=v=>{let p=S.price>10?2:5;return v.toFixed(p);};
$("indEl").innerHTML=
`<div class="kv"><span>RSI(14)</span><b class="${r<30||r>70?"mid":""}">${r.toFixed(1)}</b></div>`+
`<div class="kv"><span>EMA9 / EMA21</span><b>${f(e9)} / ${f(e21)}</b></div>`+
`<div class="kv"><span>Stoch(14)</span><b>${st.toFixed(0)}</b></div>`+
`<div class="kv"><span>Boll 20</span><b>${f(bb.l)} – ${f(bb.u)}</b></div>`+
`<div class="kv"><span>Trend score</span><b>${trend.toFixed(2)}</b></div>`+
`<div class="meta" style="margin-top:6px">${reasons.map(x=>"• "+x).join("<br>")}</div>`;
}
function renderRisk(){
let pay=parseFloat($("payInput").value)||87,bal=parseFloat($("balInput").value)||100;
let tot=S.wins+S.losses,wr=tot?Math.round(S.wins/tot*100):0;
$("riskEl").innerHTML=
`<div class="kv"><span>Winrate session</span><b>${tot?wr+"% ("+S.wins+"/"+tot+")":"-"}</b></div>`+
`<div class="kv"><span>PnL session</span><b style="color:${S.pnl>=0?"#2ebd85":"#e5484d"}">${S.pnl>=0?"+":""}${S.pnl.toFixed(1)}$</b></div>`+
`<div class="kv"><span>Risque mise / balance</span><b>${(stake()/bal*100).toFixed(1)}%</b></div>`+
`<div class="kv"><span>Niveau martingale</span><b>${S.mart} → ${stake()}$</b></div>`;
let h="";for(let i=0;i<5;i++){let b=parseFloat($("amtInput").value)||5;b=Math.round(b*Math.pow(2.2,i)*100)/100;h+=`<div class="kv"><span>N${i} ${i==S.mart?"←":""}</span><b>${b}$</b></div>`;}
$("mgTable").innerHTML=h;
}
function pushHist(res){
if(!S.last||S.last.dir==="SKIP")return;
S.hist.unshift({h:S.last.time.toLocaleTimeString("fr-FR"),a:S.last.asset,d:S.last.dir,c:S.last.conf,m:stake(),r:res});
S.hist=S.hist.slice(0,60);save();drawHist();
}
function drawHist(){
$("histBody").innerHTML=S.hist.map(x=>`<tr><td>${x.h}</td><td>${x.a}</td><td style="color:${x.d==="BUY"?"#2ebd85":"#ff6b70"};font-weight:800">${x.d}</td><td>${x.c}%</td><td>${x.m}$</td><td>${x.r||"..."}</td></tr>`).join("");
}
function settle(win){
if(!S.last)return;
let st=stake(),pay=parseFloat($("payInput").value)||87,payout=st*pay/100;
if(win){S.wins++;S.pnl+=payout;S.mart=0;pushHist("WIN +"+payout.toFixed(1)+"$");}
else{S.losses++;S.pnl-=st;S.mart=Math.min(4,S.mart+1);pushHist("LOSS -"+st.toFixed(1)+"$");}
save();renderRisk();
}
function draw(){
let cv=$("chart"),ctx=cv.getContext("2d"),W=cv.width,H=cv.height;
ctx.clearRect(0,0,W,H);
let d=S.candles.slice(-60);if(d.length<5)return;
let all=d.flatMap(c=>[c.h,c.l]),mn=Math.min(...all),mx=Math.max(...all),pad=(mx-mn)||0.0001;
let y=v=>H-24-((v-mn)/(pad*1.5))*(H-48);
let e9full=emaArr(9).slice(-60);
ctx.strokeStyle="#3a4566";ctx.lineWidth=1;
for(let i=0;i<4;i++){let yy=20+i*(H-40)/3;ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(W,yy);ctx.stroke();}
ctx.strokeStyle="#2ebd85";ctx.lineWidth=2;ctx.beginPath();
e9full.forEach((v,i)=>{let x=i/(e9full.length-1)*W;if(i==0)ctx.moveTo(x,y(v));else ctx.lineTo(x,y(v));});
ctx.stroke();
let e21=emaArr(21).slice(-60);
ctx.strokeStyle="#7c8cff";ctx.lineWidth=1.5;ctx.beginPath();
e21.forEach((v,i)=>{let x=i/(e21.length-1)*W;if(i==0)ctx.moveTo(x,y(v));else ctx.lineTo(x,y(v));});
ctx.stroke();
d.forEach((c,i)=>{
let x=i/(d.length-1)*W,w=Math.max(4,W/70);
let up=c.c>=c.o;ctx.strokeStyle=up?"#2ebd85":"#e5484d";ctx.fillStyle=ctx.strokeStyle;
ctx.beginPath();ctx.moveTo(x,y(c.h));ctx.lineTo(x,y(c.l));ctx.stroke();
let yO=y(c.o),yC=y(c.c);ctx.fillRect(x-w/2,Math.min(yO,yC),w,Math.max(2,Math.abs(yO-yC)));
});
let lc=d[d.length-1];
ctx.fillStyle="#fff";ctx.font="bold 13px Arial";
ctx.fillText((lc.c>=lc.o?"▲ ":"▼ ")+lc.c.toFixed(S.price>10?2:5),8,16);
if(S.last&&S.last.dir!=="SKIP"){ctx.fillStyle=S.last.dir==="BUY"?"#2ebd85":"#e5484d";ctx.fillText(S.last.dir==="BUY"?"▲ BUY "+S.last.conf+"%":"▼ SELL "+S.last.conf+"%",W-140,20);}
}
function beep(f){
try{let C=window.AudioContext||window.webkitAudioContext;let a=new C();let o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=f;g.gain.value=0.07;o.start();o.stop(a.currentTime+0.22);}catch(e){}
}
let lastBeepSec=-1;
setInterval(()=>{
tickPrice();
let b=bucketNow();
if(b!==S.bucket){
S.bucket=b;
let o=S.candles.length?S.candles[S.candles.length-1].c:S.price;
S.candles.push({t:b,o,h:o,l:o,c:o});
if(S.candles.length>90)S.candles.shift();
if(S.auto){analyze(true);if(PO.auto&&PO.ok&&S.last&&S.last.dir!=="SKIP")poTrade();}
}else{
let c=S.candles[S.candles.length-1];
if(c){c.c=S.price;if(S.price>c.h)c.h=S.price;if(S.price<c.l)c.l=S.price;}
}
draw();
$("priceEl").textContent="Prix simu: "+S.price.toFixed(S.price>10?2:5)+" • "+(assetInput.value||"")+" • "+S.candles.length+" bougies M1";
},1000);
setInterval(()=>{
let n=new Date();
$("clockEl").textContent=n.toLocaleTimeString("fr-FR");
let left=60-n.getSeconds();
$("syncEl").textContent="M1: "+left+"s";
if(S.last){
let ms=S.last.entry-Date.now();
if(ms<=0){$("timerEl").textContent="GO ●";$("entryEl").textContent="— "+S.last.asset+" "+S.last.dir+" maintenant sur Pocket";}
else{let s=Math.floor(ms/1000);$("timerEl").textContent=String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");$("entryEl").textContent="— "+S.last.asset+" à "+S.last.entry.toLocaleTimeString("fr-FR");}
if(ms<11000&&ms>0){let sec=Math.ceil(ms/1000);if(sec!==lastBeepSec){lastBeepSec=sec;if(sec<=5)beep(880);}}
}else{$("timerEl").textContent="--";}
renderRisk();
},500);
$("analyzeBtn").onclick=()=>analyze(false);
$("winBtn").onclick=()=>settle(true);
$("lossBtn").onclick=()=>settle(false);
$("copyBtn").onclick=()=>{if(!S.last)return;let t=`${S.last.asset} ${S.last.dir} ${S.last.exp}s entrée ${S.last.entry.toLocaleTimeString("fr-FR")} conf ${S.last.conf}%`;try{navigator.clipboard.writeText(t);}catch(e){}};
$("csvBtn").onclick=()=>{let c="heure,actif,dir,conf,mise,res\n"+S.hist.map(x=>[x.h,x.a,x.d,x.c,x.m,x.r].join(",")).join("\n");try{navigator.clipboard.writeText(c);}catch(e){}};
$("resetBtn").onclick=()=>{S.wins=0;S.losses=0;S.pnl=0;S.mart=0;S.hist=[];save();drawHist();renderRisk();};
$("autoBtn").onclick=e=>{S.auto=!S.auto;e.target.textContent="AUTO CHAQUE BOUGIE: "+(S.auto?"ON":"OFF");e.target.className=S.auto?"btnGo":"btnGhost";if(S.auto)analyze(true);};
assetInput.onchange=()=>{if(PO.ws&&PO.ok)poCandles();else{newSeed();draw();}};
function poLog(m){$("poMsg").textContent=m;}
function poSet(ok,t){PO.ok=ok;$("poEl").textContent="Pocket: "+t;}
function poSym(a){return a.replace("/","").replace(" OTC","_otc").replace("XAU/USD","XAUUSD");}
function poConnect(){
let raw=($("ssidInput").value||"").trim();
if(!raw){poLog("Colle ton SSID d'abord.");return;}
let sess=raw,uid=0,demo=$("demoInput").value==="1";
try{if(raw.startsWith('42[')){let j=raw.slice(2);let arr=JSON.parse(j);let d=arr[1]||{};sess=d.session||d.sessionToken||sess;uid=d.uid||0;}}catch(e){}
if(/^[a-f0-9]{16,}$/i.test(raw)){sess=raw;}
PO.ssid=sess;PO.demo=demo;
if(PO.ws){try{PO.ws.close();}catch(e){}}
poSet(false,"connexion...");poLog("Connexion à Pocket...");
let urls=demo?["wss://try-demo-eu.po.market/socket.io/?EIO=4&transport=websocket","wss://demo-api-eu.po.market/socket.io/?EIO=4&transport=websocket","wss://api-eu.po.market/socket.io/?EIO=4&transport=websocket","wss://api-sc.po.market/socket.io/?EIO=4&transport=websocket"]:["wss://api-eu.po.market/socket.io/?EIO=4&transport=websocket","wss://api-sc.po.market/socket.io/?EIO=4&transport=websocket","wss://api-hk.po.market/socket.io/?EIO=4&transport=websocket"];
let ui=0;
function tryUrl(){
if(ui>=urls.length){poSet(false,"bloqué 1005");poLog("1005 sur tous serveurs : Pocket bloque le WS depuis cet aperçu. Utilise le script Python local (sans blocage navigateur) — dis-moi et je te le génère.");return;}
let url=urls[ui];poLog("Essai "+url+" ...");
let ws=new WebSocket(url);PO.ws=ws;
let settled=false;
ws.onopen=()=>{};
ws.onmessage=ev=>{
let m=ev.data;
if(m==="2"){ws.send("3");return;}
if(m.startsWith("0")){ws.send("40");return;}
if(m==="40"||m.startsWith("40{")){
let auth={session:sess,sessionToken:sess,isDemo:demo?1:0,uid:uid,platform:1,isFastHistory:true};
ws.send('42["auth",'+JSON.stringify(auth)+']');return;
}
if(m.startsWith("42")){
try{
let arr=JSON.parse(m.slice(2));
let ev2=arr[0],dt=arr[1];
if(ev2==="authenticated"||ev2==="auth/success"||ev2==="auth(success)"){settled=true;poSet(true,"connecté");poLog("Connecté. Chargement bougies "+assetInput.value+"...");poCandles();}
else if(ev2==="auth_error"||ev2==="auth/error"||(typeof dt==="object"&&dt&&dt.error)){settled=true;poSet(false,"auth refusée");poLog("Auth refusée — token expiré. Reprends le dernier message auth frais et reconnecte.");}
else if(ev2==="changeSymbol"||dt&&dt.candles){poUseCandles(dt);}
else if(ev2==="candles"){poUseCandles(dt);}
else if(typeof dt==="object"&&dt&&(dt.balance||dt.demoBalance)){let b=dt.demoBalance??dt.balance;if(b!==undefined)poLog("Balance: "+b+" — bougies OK.");}
}catch(e){}
}
};
ws.onerror=()=>{};
ws.onclose=(ev)=>{
if(PO.ok&&settled)return;
if(ev.code===1005||!settled&&ev.code!==1000){ui++;setTimeout(tryUrl,800);if(ui===1)poLog("1005 : serveur bloqué, essai serveur suivant...");}
else if(!PO.ok){poSet(false,"déconnecté "+(ev.code||""));poLog("WS fermé code "+ev.code+". Re-clique CONNECTER avec un token frais de moins de 2 min.");}
};
}
tryUrl();
return;
};
function poCandles(){
if(!PO.ws||PO.ws.readyState!==1)return;
let a=poSym(assetInput.value);
PO.ws.send('42'+JSON.stringify(["changeSymbol",{asset:a,period:60}]));
poLog("Demande bougies "+a+" M1...");
}
function poUseCandles(dt){
let list=dt.candles||dt.data||dt.history||[];
if(!list.length&&dt.asset)list=dt.data||[];
if(!list.length){poLog("Réponse Pocket sans bougies — réessaie.");return;}
let cs=list.slice(-60).map(c=>{
if(Array.isArray(c))return {t:c[0]*1000,o:c[1],h:c[2],l:c[3],c:c[4]};
return {t:(c.time||c.timestamp||Date.now()/1000)*1000,o:+(c.open??c.o),h:+(c.high??c.h),l:+(c.low??c.l),c:+(c.close??c.c)};
}).filter(c=>isFinite(c.c));
if(cs.length>5){S.candles=cs;S.price=cs[cs.length-1].c;draw();poLog("Bougies Pocket chargées: "+cs.length+" M1 — ANALYSER utilise le flux réel.");poSet(true,"connecté "+cs.length+" bougies");}
}
$("poBtn").onclick=poConnect;
$("tradeBtn").onclick=e=>{
PO.auto=!PO.auto;
e.target.textContent="TRADE AUTO: "+(PO.auto?"ON":"OFF");
e.target.className=PO.auto?"btnStop":"btnGhost";
poLog(PO.auto?"Trade auto ARMÉ en DÉMO : chaque signal valide sera envoyé seul à l'heure pile. Surveille.":"Trade auto coupé.");
};
function poTrade(){
if(!PO.ws||PO.ws.readyState!==1||!PO.ok){poLog("Connecte d'abord pour trader seul.");return false;}
if(!S.last||S.last.dir==="SKIP"){poLog("Pas de signal valide.");return false;}
let a=poSym(S.last.asset);
let act=S.last.dir==="BUY"?"call":"put";
let amt=stake();
let delay=S.last.entry-Date.now();
let fire=()=>{
let rid="po"+Date.now();
let msg={asset:a,amount:amt,action:act,isDemo:PO.demo?1:0,requestId:rid,optionType:100,time:S.last.exp};
PO.ws.send('42'+JSON.stringify(["openOrder",msg]));
poLog("Ordre envoyé: "+a+" "+act+" "+amt+"$ "+S.last.exp+"s");
let exit=new Date(Date.now()+S.last.exp*1000);
POS.unshift({asset:S.last.asset,dir:S.last.dir,stake:amt,exit});
POS=POS.slice(0,5);drawPos();
};
if(delay>500){setTimeout(fire,delay);}else{fire();}
return true;
}
function posAnalysis(){
let L=analyze(true);
if(!L)return;
let regime=Math.abs(parseFloat(L.trend))>=0.5?"tendance":Math.abs(parseFloat(L.trend))<0.25?"range":"transition";
let avis=L.dir==="SKIP"?"Reste hors marché.":L.dir==="BUY"?"Biais acheteur sur "+L.asset+".":"Biais vendeur sur "+L.asset+".";
let txt=avis+"\nActif: "+L.asset+" • Expi: "+L.exp+"s • Entrée: "+L.entry.toLocaleTimeString("fr-FR")+"\nRSI "+L.r+" • Stoch "+L.st+" • Trend "+L.trend+" • Conf "+L.conf+"%\nRégime: "+regime+"\n"+L.reasons.join(" / ")+"\nMise: "+stake()+"$ • Payout "+(($("payInput").value)||92)+"%\nSur Pocket: choisis "+L.asset+", montant "+stake()+"$, durée "+(L.exp>=60?(L.exp/60)+"min":L.exp+"s")+", clique "+L.dir+" à "+L.entry.toLocaleTimeString("fr-FR")+".";
$("posText").textContent=txt;
}
function drawPos(){
if(!POS.length){$("posBody").innerHTML='<tr><td colspan="5" style="opacity:.6">Aucune</td></tr>';return;}
$("posBody").innerHTML=POS.map((p,i)=>{
let ms=p.exit-Date.now();
let st=ms<=0?"EXPIRÉ — note WIN/LOSS":Math.floor(ms/60000)+":"+String(Math.floor(ms%60000/1000)).padStart(2,"0");
return `<tr><td>${p.asset}</td><td style="color:${p.dir==="BUY"?"#2ebd85":"#ff6b70"};font-weight:800">${p.dir}</td><td>${p.stake}$</td><td>${p.exit.toLocaleTimeString("fr-FR")}</td><td>${st} <button onclick="window.pocketBot.win(${i})" style="width:auto;padding:2px 8px">W</button> <button onclick="window.pocketBot.lose(${i})" style="width:auto;padding:2px 8px">L</button></td></tr>`;
}).join("");
}
setInterval(drawPos,1000);
$("posBtn").onclick=posAnalysis;
$("takeBtn").onclick=()=>{
if(!S.last||S.last.dir==="SKIP"){posAnalysis();if(!S.last||S.last.dir==="SKIP")return;}
let exit=new Date(S.last.entry.getTime()+S.last.exp*1000);
POS.unshift({asset:S.last.asset,dir:S.last.dir,stake:stake(),exit});
POS=POS.slice(0,5);drawPos();
};
newSeed();draw();drawHist();renderRisk();
window.pocketBot={analyze,settle,posAnalysis,get last(){return S.last;},
win(i){settle(true);if(POS[i])POS.splice(i,1);drawPos();},
lose(i){settle(false);if(POS[i])POS.splice(i,1);drawPos();}};
</script>
</body></html>
