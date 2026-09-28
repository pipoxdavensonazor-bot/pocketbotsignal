try { require("dotenv").config(); } catch (e) {}
let http = require("http");
let fs = require("fs");
let CFG = {
  session: process.env.PO_SESSION || "",
  authRaw: process.env.PO_AUTH_RAW || "",
  uid: process.env.PO_UID || "0",
  demo: (process.env.PO_DEMO || "1") === "1",
  asset: process.env.ASSET || "EURUSD_otc",
  stake: parseFloat(process.env.STAKE || "5"),
  riskPct: parseFloat(process.env.RISK_PCT || "1"),
  exp: parseInt(process.env.EXP || "60"),
  minConf: parseInt(process.env.MINCONF || "68"),
  minPayout: parseFloat(process.env.MIN_PAYOUT || "80"),
  maxMart: parseInt(process.env.MAXMART || "0"),
  stopLoss: parseFloat(process.env.STOPLOSS || "20"),
  takeProfit: parseFloat(process.env.TAKEPROFIT || "40"),
  maxTrades: parseInt(process.env.MAXTRADES || "30"),
  payout: parseFloat(process.env.PAYOUT || "87"),
  dryRun: (process.env.DRY_RUN || "1") === "1",
  tgToken: process.env.TG_TOKEN || "",
  tgChat: process.env.TG_CHAT || "",
  port: parseInt(process.env.PORT || "10000")
};
let URLS = [
  "https://try-demo-eu.po.market",
  "https://demo-api-eu.po.market",
  "https://api-eu.po.market",
  "https://api-sc.po.market",
  "https://api-hk.po.market"
];
let S = { candles: [], times: [], mart: 0, pnl: 0, wins: 0, losses: 0, busy: false, trades: 0, day: "", bal: null, startBal: null, paused: "", lastErr: "", payout: CFG.payout, open: new Map(), lastMinute: "" };
let SFails = 0, socket = null, stopAll = false, curIdx = 0;
function log(m) { console.log(new Date().toISOString() + " [GW] " + m); }
function logErr(m) { console.error(new Date().toISOString() + " [GW-ERR] " + m); }
function tg(m) {
  if (!CFG.tgToken || !CFG.tgChat) return;
  try {
    let body = JSON.stringify({ chat_id: CFG.tgChat, text: "[POCKETBOT] " + m });
    fetch("https://api.telegram.org/bot" + CFG.tgToken + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: body }).catch(e => logErr("telegram " + e.message));
  } catch (e) { logErr("telegram " + e.message); }
}
function today() { return new Date().toISOString().slice(0, 10); }
function loadState() {
  try {
    let s = JSON.parse(fs.readFileSync("state.json", "utf8"));
    if (s.day === today()) { S.pnl = s.pnl || 0; S.mart = s.mart || 0; S.trades = s.trades || 0; S.wins = s.wins || 0; S.losses = s.losses || 0; S.day = s.day; }
  } catch (e) {}
  if (S.day !== today()) { S.day = today(); S.pnl = 0; S.mart = 0; S.trades = 0; S.wins = 0; S.losses = 0; S.paused = ""; saveState(); }
}
function saveState() {
  try { fs.writeFileSync("state.json", JSON.stringify({ day: S.day, pnl: S.pnl, mart: S.mart, trades: S.trades, wins: S.wins, losses: S.losses })); } catch (e) {}
}
function ema(v, p) { let k = 2 / (p + 1), e = v[0], o = []; for (let x of v) { e = x * k + e * (1 - k); o.push(e); } return o; }
function rsi(v, p) {
  p = p || 14; if (v.length < p + 1) return 50;
  let g = 0, l = 0;
  for (let i = v.length - p; i < v.length; i++) { let d = v[i] - v[i - 1]; if (d > 0) g += d; else l -= d; }
  if (l === 0) return 95; return 100 - 100 / (1 + g / l);
}
function stoch(v, p) {
  p = p || 14; if (v.length < p) return 50;
  let w = v.slice(-p), lo = Math.min(...w), hi = Math.max(...w);
  if (hi === lo) return 50; return (v[v.length - 1] - lo) / (hi - lo) * 100;
}
function stakeAmt() {
  let base = CFG.stake;
  if (S.bal && S.bal > 0) base = Math.max(1, Math.round(S.bal * CFG.riskPct / 100 * 100) / 100);
  if (S.mart > 0 && CFG.maxMart > 0) base = base * Math.pow(2.2, S.mart);
  return Math.round(base * 100) / 100;
}
function decide(cl) {
  let r = rsi(cl), st = stoch(cl), e9 = ema(cl, 9).pop(), e21 = ema(cl, 21).pop();
  let n = 20, sl = cl.slice(-n), m = sl.reduce((a, b) => a + b, 0) / sl.length;
  let sd = Math.sqrt(sl.reduce((a, b) => a + (b - m) * (b - m), 0) / sl.length);
  let last = cl[cl.length - 1], score = 0, why = [];
  if (r < 30) { score += 2; why.push("RSI survente"); }
  else if (r > 70) { score -= 2; why.push("RSI surachat"); }
  else if (r > 55) { score += 0.7; why.push("RSI haussier"); }
  else if (r < 45) { score -= 0.7; why.push("RSI baissier"); }
  if (e9 > e21) { score += 1.2; why.push("EMA9>EMA21"); } else { score -= 1.2; why.push("EMA9<EMA21"); }
  if (st < 20) { score += 1; why.push("Stoch survente"); } else if (st > 80) { score -= 1; why.push("Stoch surachat"); }
  if (sd > 0) {
    if (last > m + 2 * sd) { score -= 0.8; why.push("sur Boll haute"); }
    else if (last < m - 2 * sd) { score += 0.8; why.push("sous Boll basse"); }
  }
  let dir = score >= 0.4 ? "BUY" : score <= -0.4 ? "SELL" : "SKIP";
  let conf = Math.round(Math.min(93, Math.max(50, 58 + Math.abs(score) * 9)));
  return { dir, conf, r: r.toFixed(1), st: st.toFixed(0), why, score };
}
function sendAuth() {
  if (CFG.authRaw) {
    try {
      let raw = CFG.authRaw.trim();
      if (raw.startsWith("42")) raw = raw.slice(2);
      let arr = JSON.parse(raw);
      socket.emit(arr[0], arr[1]);
      log("Auth brute envoyee depuis PO_AUTH_RAW");
      return;
    } catch (e) { logErr("PO_AUTH_RAW invalide: " + e.message); }
  }
  socket.emit("auth", { session: CFG.session, isDemo: CFG.demo ? 1 : 0, uid: parseInt(CFG.uid), platform: 2 });
}
function connect(i) {
  if (stopAll) return;
  i = i || 0; curIdx = i;
  if (i >= URLS.length) {
    SFails++;
    let wait = Math.min(300000, 15000 * SFails);
    log("Tous serveurs KO, nouvel essai dans " + Math.round(wait / 1000) + "s");
    setTimeout(() => connect(0), wait);
    return;
  }
  let base = URLS[i];
  log("Connexion " + base);
  let io;
  try { io = require("socket.io-client").io; } catch (e) { logErr("socket.io-client manquant: npm install"); setTimeout(() => connect(i + 1), 5000); return; }
  if (socket) { try { socket.close(); } catch (e) {} socket = null; }
  socket = io(base, { path: "/socket.io/", transports: ["websocket"], timeout: 15000, reconnection: false, forceNew: true, extraHeaders: { Origin: "https://pocketoption.com", Referer: "https://pocketoption.com/", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" } });
  socket.on("connect", () => { sendAuth(); });
  socket.on("connect_error", e => { logErr("connect_error " + base + " " + (e && e.message)); setTimeout(() => connect(i + 1), 3000); });
  socket.io.on("error", e => { logErr("transport error " + base + " " + (e && e.message)); });
  socket.io.engine && socket.io.engine.on("close", r => { logErr("engine close " + base + " " + r); });
  socket.onAny((ev, ...args) => { onEvent(ev, args[0]); });
  socket.on("disconnect", reason => {
    log("Deconnecte: " + reason);
    if (stopAll) return;
    if (S.paused === "auth") return;
    setTimeout(() => connect(0), 5000);
  });
}
function onEvent(e, d) {
  switch (e) {
    case "auth/success":
    case "authenticated":
    case "user_ready":
      SFails = 0;
      log("Connecte (" + e + "). Souscription " + CFG.asset);
      tg("Connecte (" + (CFG.demo ? "demo" : "REEL") + ") actif " + CFG.asset);
      socket.emit("changeSymbol", { asset: CFG.asset, period: 60 });
      socket.emit("getBalance");
      socket.emit("loadHistoryPeriod", { asset: CFG.asset, period: 60, count: 120 });
      return;
    case "auth_error":
    case "auth/error":
      logErr("Auth refusee: " + JSON.stringify(d).slice(0, 300));
      tg("Auth refusee. STOP. Mets un token frais puis redemarre.");
      S.paused = "auth"; saveState();
      stopAll = true;
      try { socket.close(); } catch (err) {}
      return;
    case "balance":
    case "getBalance":
    case "balances":
      onBalance(d);
      return;
    case "candles":
    case "history":
    case "loadHistoryPeriod":
      if (d && (d.candles || d.data || Array.isArray(d))) onHistory(d.candles || d.data || d);
      return;
    case "updateStream":
    case "update-stream":
    case "tick":
    case "price":
      onTick(d);
      return;
    case "successopenOrder":
    case "openOrder":
      onOpenAck(d);
      return;
    case "successcloseOrder":
    case "order_closed":
      onClosed(d);
      return;
    case "payout":
    case "assetPayout":
      if (d && d.payout !== undefined) { S.payout = parseFloat(d.payout); }
      else if (d && d[CFG.asset] !== undefined) { S.payout = parseFloat(d[CFG.asset]); }
      return;
    case "error":
      onOrderError(d);
      return;
    default:
      if (d && typeof d === "object" && (d.balance !== undefined || d.demoBalance !== undefined)) { onBalance(d); return; }
      if (d && typeof d === "object" && (d.candles || (Array.isArray(d) && d.length > 20))) { onHistory(d.candles || d); return; }
      return;
  }
}
function onBalance(d) {
  let b = d && (d.demoBalance !== undefined ? d.demoBalance : (d.balanceDemo !== undefined ? d.balanceDemo : (d.balance !== undefined ? d.balance : (d.amount !== undefined ? d.amount : NaN))));
  if (d && d.asset === CFG.asset && d.payout !== undefined) S.payout = parseFloat(d.payout);
  b = parseFloat(b);
  if (!isFinite(b)) return;
  if (S.startBal === null) { S.startBal = b; log("Balance initiale " + b); }
  S.bal = b;
}
function normCandles(list) {
  return list.slice(-200).map(c => {
    if (Array.isArray(c)) return { t: c[0], c: parseFloat(c[4] !== undefined ? c[4] : c[1]) };
    return { t: c.time || c.from || c.at, c: parseFloat(c.close !== undefined ? c.close : c.c) };
  }).filter(x => isFinite(x.c));
}
function onHistory(list) {
  if (!Array.isArray(list)) return;
  let n = normCandles(list);
  if (n.length < 25) return;
  S.candles = n.map(x => x.c);
  S.times = n.map(x => x.t);
  log("Historique: " + n.length + " bougies");
}
function onTick(d) {
  let price = parseFloat(d && (d.close !== undefined ? d.close : (d.price !== undefined ? d.price : (d.c !== undefined ? d.c : NaN))));
  if (!isFinite(price)) return;
  let nowMin = new Date().toISOString().slice(0, 16);
  if (S.candles.length === 0) { S.candles.push(price); S.lastMinute = nowMin; return; }
  if (nowMin !== S.lastMinute) {
    S.candles.push(price);
    if (S.candles.length > 200) S.candles.shift();
    S.lastMinute = nowMin;
    setTimeout(() => maybeTrade(), 2000);
  } else {
    S.candles[S.candles.length - 1] = price;
  }
}
setInterval(() => {
  let nowMin = new Date().toISOString().slice(0, 16);
  if (nowMin !== S.lastMinute && S.candles.length >= 25) {
    S.lastMinute = nowMin;
    maybeTrade();
  }
}, 5000);
function maybeTrade() {
  if (stopAll || S.busy || S.paused) return;
  if (S.day !== today()) { S.day = today(); S.pnl = 0; S.mart = 0; S.trades = 0; S.wins = 0; S.losses = 0; S.paused = ""; saveState(); log("Nouveau jour: compteurs remis a zero"); }
  if (S.candles.length < 25) return;
  let closed = S.candles.slice(0, -1).slice(-60);
  if (closed.length < 25) return;
  let s = decide(closed);
  log(s.dir + " conf " + s.conf + "% RSI " + s.r + " Stoch " + s.st + " | " + s.why.join("/"));
  if (s.dir === "SKIP" || s.conf < CFG.minConf) return;
  let amt = stakeAmt();
  if (S.trades >= CFG.maxTrades) { log("Max trades/jour atteint."); S.paused = "maxtrades"; saveState(); return; }
  if (S.pnl - amt < -CFG.stopLoss) { log("Stop-loss: ordre refuse (pnl " + S.pnl.toFixed(1) + " - mise " + amt + ")"); S.paused = "stoploss"; saveState(); tg("Stop-loss atteint. Pause."); return; }
  if (S.pnl >= CFG.takeProfit) { log("Take-profit atteint. Pause du jour."); S.paused = "takeprofit"; saveState(); tg("Take-profit atteint. Pause."); return; }
  if (S.payout < CFG.minPayout) { log("Payout " + S.payout + " < MIN_PAYOUT " + CFG.minPayout + ". Ordre refuse."); return; }
  const sig = { dir: s.dir, conf: s.conf, amt: amt, entry: S.candles[S.candles.length - 1] };
  S.busy = true; S.trades++; saveState();
  log("Entree " + sig.dir + " mise " + sig.amt + "$ (trade " + S.trades + ")");
  tg(sig.dir + " " + CFG.asset + " conf " + sig.conf + "% mise " + sig.amt + "$");
  let rid = "gw" + Date.now();
  if (CFG.dryRun) {
    let est = Math.round(sig.amt * S.payout) / 100;
    log("DRY_RUN simule " + sig.dir + " " + sig.amt + "$ gain potentiel +" + est + "$");
    S.open.set(rid, { dir: sig.dir, amt: sig.amt, entry: sig.entry, exp: CFG.exp });
    setTimeout(() => dryClose(rid), (CFG.exp + 2) * 1000);
  } else {
    S.open.set(rid, { dir: sig.dir, amt: sig.amt, entry: sig.entry, exp: CFG.exp, timer: setTimeout(() => { if (S.open.has(rid)) { logErr("Timeout cloture " + rid + ", busy libere"); S.open.delete(rid); S.busy = false; } }, (CFG.exp + 30) * 1000) });
    try { socket.emit("openOrder", { asset: CFG.asset, amount: sig.amt, action: sig.dir === "BUY" ? "call" : "put", isDemo: CFG.demo ? 1 : 0, requestId: rid, optionType: 100, time: CFG.exp }); } catch (e) { logErr("openOrder " + e.message); S.open.delete(rid); S.busy = false; }
  }
}
function dryClose(rid) {
  let o = S.open.get(rid);
  if (!o) return;
  S.open.delete(rid);
  let exit = S.candles[S.candles.length - 1];
  let win = o.dir === "BUY" ? exit > o.entry : exit < o.entry;
  let profit = win ? Math.round(o.amt * S.payout) / 100 : -o.amt;
  applyResult(profit, win, "dry");
}
function onOpenAck(d) {
  log("Ordre accepte: " + JSON.stringify(d).slice(0, 200));
  let rid = d && (d.requestId || d.request_id || (d.order && d.order.requestId));
  if (rid && S.open.has(rid)) { let o = S.open.get(rid); o.id = d.id || d.orderId || (d.order && d.order.id); }
}
function onClosed(d) {
  log("RAW close: " + JSON.stringify(d).slice(0, 400));
  let src = d && d.order ? Object.assign({}, d.order, d) : d;
  let profit = NaN, win = false;
  if (src && src.profit !== undefined && src.profit !== null && src.profit !== "") profit = parseFloat(src.profit);
  if (!isFinite(profit)) {
    if (src && (src.win !== undefined || src.isWin !== undefined || src.result !== undefined)) {
      win = !!(src.win || src.isWin || src.result === "win" || src.result === "won");
      let amt = parseFloat(src.amount || src.amt || 0) || 0;
      profit = win ? Math.round(amt * S.payout) / 100 : -amt;
    } else return;
  } else {
    win = profit > 0;
    if (profit === 0) {
      let amt = parseFloat(src.amount || src.amt || src.stake || 0) || 0;
      if (amt > 0) { win = false; profit = -amt; }
    }
  }
  let rid = src && (src.requestId || src.request_id);
  if (rid && S.open.has(rid)) { let o = S.open.get(rid); if (o.timer) clearTimeout(o.timer); S.open.delete(rid); }
  else if (S.open.size > 0) { let k = [...S.open.keys()][0]; let o = S.open.get(k); if (o && o.timer) clearTimeout(o.timer); S.open.delete(k); }
  applyResult(profit, win, "live");
}
function applyResult(profit, win, src) {
  if (win) { S.wins++; S.pnl = Math.round((S.pnl + profit) * 100) / 100; S.mart = 0; }
  else { S.losses++; S.pnl = Math.round((S.pnl + profit) * 100) / 100; S.mart = CFG.maxMart > 0 ? Math.min(CFG.maxMart, S.mart + 1) : 0; }
  S.busy = false; saveState();
  log("Cloture [" + src + "] " + (win ? "WIN +" : "LOSS ") + profit + " | PnL " + S.pnl.toFixed(1) + " | mart " + S.mart);
  tg((win ? "WIN +" : "LOSS ") + profit + " | PnL " + S.pnl.toFixed(1));
  try { socket.emit("getBalance"); } catch (e) {}
}
function onOrderError(d) {
  let s = String((d && d.message) || d).slice(0, 200);
  if (/not_enough|insufficient|balance/i.test(s)) {
    logErr("Solde insuffisant: " + s);
    tg("Solde insuffisant. Pause 5 min.");
    S.paused = "ordre"; setTimeout(() => { if (S.paused === "ordre") S.paused = ""; }, 300000);
  } else if (/limit|max/i.test(s)) {
    logErr("Limite: " + s);
    S.paused = "ordre"; setTimeout(() => { if (S.paused === "ordre") S.paused = ""; }, 300000);
  } else {
    logErr("Erreur: " + s);
  }
}
setInterval(() => { try { if (socket && socket.connected) socket.emit("getBalance"); } catch (e) {} }, 120000);
loadState();
http.createServer((req, res) => {
  let token = process.env.STATUS_TOKEN || "";
  if (req.url === "/health") { res.writeHead(200); res.end("ok"); return; }
  if (token) {
    let u = new URL(req.url, "http://x");
    if (u.searchParams.get("token") !== token) { res.writeHead(401); res.end("unauthorized"); return; }
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ pnl: S.pnl, wins: S.wins, losses: S.losses, mart: S.mart, trades: S.trades, bal: S.bal, payout: S.payout, candles: S.candles.length, paused: S.paused, dryRun: CFG.dryRun, open: S.open.size }));
}).listen(CFG.port, "0.0.0.0", () => log("gateway v3 on " + CFG.port + " dryRun=" + CFG.dryRun + " asset=" + CFG.asset + " maxMart=" + CFG.maxMart));
if (!CFG.session && !CFG.authRaw) {
  log("PO_SESSION ou PO_AUTH_RAW manquant. En attente config (pas de crash).");
} else if (CFG.uid === "0" && !CFG.authRaw) {
  log("PO_UID manquant. En attente config.");
} else {
  connect(0);
}
module.exports = { decide, stakeAmt };
