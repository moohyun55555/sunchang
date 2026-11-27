// 2D 미니게임 다섯 가지: 레고 블록 쌓기, 리듬 댄스, 떡볶이 재료 받기, 로봇 길 찾기, 드럼 비트 따라 치기
// 각 게임은 stage(div)에 그림을 그리고, 끝나면 api.end(점수)를 불러요. 돌려주는 함수는 정리(cleanup)용이에요.
const FONT = '"SunchangJua", sans-serif'; // 게임 글씨는 모두 fonts/jua.woff2 하나로 그려요
function makeCanvas(stage, W, H) {
  const cv = document.createElement("canvas"), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr;
  cv.className = "mg-canvas";
  cv.style.aspectRatio = `${W} / ${H}`;
  stage.appendChild(cv);
  const x = cv.getContext("2d");
  x.scale(dpr, dpr);
  return { cv, x };
}
function loop(fn) {
  let id = 0, last = performance.now(), alive = true;
  const f = (now) => { if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; fn(dt, now / 1000); id = requestAnimationFrame(f); };
  id = requestAnimationFrame(f);
  return () => { alive = false; cancelAnimationFrame(id); };
}
function onKeys(map) {
  const h = (e) => { const fn = map[e.code]; if (fn && !e.repeat) { e.preventDefault(); fn(e); } };
  addEventListener("keydown", h);
  return () => removeEventListener("keydown", h);
}
function rr(x, X, Y, W, H, r) { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, W, H, r); else x.rect(X, Y, W, H); }
function textC(x, s, X, Y, size, color = "#1e2a4a", stroke) {
  x.font = `${size}px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle";
  if (stroke) { x.lineWidth = 6; x.strokeStyle = stroke; x.strokeText(s, X, Y); }
  x.fillStyle = color; x.fillText(s, X, Y);
}

// ---------- 1. 레고 블록 쌓기 ----------
function stack(stage, api) {
  const W = 360, H = 480, BH = 28, COLS = ["#ff4747", "#2fb2ff", "#ffd91a", "#3fd16f", "#ff9a1a", "#9b7bff"];
  const { cv, x } = makeCanvas(stage, W, H);
  const tower = [{ x: 80, w: 200 }];
  let cur = { x: 0, w: 200, dir: 1 }, speed = 150, cam = 0, over = false, msg = "", msgT = 0, chunks = [];
  const blockY = (i) => H - 40 - (i + 1) * BH;
  function drop() {
    if (over) return;
    const top = tower[tower.length - 1];
    const l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w);
    if (r - l <= 2) {
      over = true; chunks.push({ x: cur.x, y: blockY(tower.length), w: cur.w, vy: 0, c: COLS[tower.length % 6] });
      msg = "와르르! 탑이 끝났어요"; msgT = 2; api.Snd.no();
      setTimeout(() => api.end(tower.length - 1), 1300);
      return;
    }
    let nl = l, nw = r - l;
    if (Math.abs(cur.x - top.x) < 6) { nl = top.x; nw = top.w; msg = "퍼펙트!"; msgT = 0.8; api.Snd.star(); }
    else {
      api.Snd.pop();
      const cutX = cur.x < top.x ? cur.x : r, cutW = cur.w - nw;
      if (cutW > 0) chunks.push({ x: cutX, y: blockY(tower.length), w: cutW, vy: 0, c: COLS[tower.length % 6] });
    }
    tower.push({ x: nl, w: nw });
    speed = Math.min(420, speed * 1.07);
    const dir = tower.length % 2 ? 1 : -1;
    cur = { x: dir > 0 ? -nw * 0.5 : W - nw * 0.5, w: nw, dir };
  }
  const stopKeys = onKeys({ Space: drop, Enter: drop, KeyF: drop, ArrowDown: drop });
  cv.addEventListener("pointerdown", (e) => { e.preventDefault(); drop(); });
  function brick(X, Y, w, c) {
    x.fillStyle = c; rr(x, X, Y, w, BH - 2, 4); x.fill();
    x.fillStyle = "rgba(255,255,255,.35)";
    for (let s = X + 10; s < X + w - 6; s += 20) { x.beginPath(); x.arc(s, Y - 2, 5, Math.PI, 0); x.fill(); }
    x.fillStyle = "rgba(0,0,0,.12)"; x.fillRect(X, Y + BH - 8, w, 6);
  }
  const stop = loop((dt) => {
    if (!over) { cur.x += cur.dir * speed * dt; if (cur.x + cur.w > W + cur.w * 0.4) cur.dir = -1; if (cur.x < -cur.w * 0.4) cur.dir = 1; }
    cam += (Math.max(0, (tower.length - 9) * BH) - cam) * Math.min(1, dt * 6);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#a6defc"); g.addColorStop(1, "#fff6e3");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.save(); x.translate(0, cam);
    x.fillStyle = "#4fb443"; x.fillRect(0, H - 40, W, 400);
    tower.forEach((b, i) => brick(b.x, blockY(i), b.w, COLS[i % 6]));
    if (!over) brick(cur.x, blockY(tower.length), cur.w, COLS[tower.length % 6]);
    for (const c of chunks) { c.vy += 900 * dt; c.y += c.vy * dt; brick(c.x, c.y, c.w, c.c); }
    x.restore();
    textC(x, `${tower.length - 1}층`, W / 2, 36, 34, "#ffffff", "#1e2a4a");
    if (msgT > 0) { msgT -= dt; textC(x, msg, W / 2, 84, 28, "#ffd91a", "#1e2a4a"); }
  });
  return () => { stop(); stopKeys(); };
}

// ---------- 2. 리듬 댄스 ----------
function rhythm(stage, api) {
  const W = 360, H = 460, HIT = 390, LANES = [52, 136, 220, 304], COLS = ["#ff4747", "#2fb2ff", "#3fd16f", "#ffb000"], ARROW = ["←", "↓", "↑", "→"];
  const { x } = makeCanvas(stage, W, H);
  const pads = document.createElement("div"); pads.className = "mg-pads";
  ARROW.forEach((a, i) => { const b = document.createElement("button"); b.type = "button"; b.textContent = a; b.style.background = COLS[i]; b.addEventListener("pointerdown", (e) => { e.preventDefault(); press(i); }); pads.appendChild(b); });
  stage.appendChild(pads);
  const Snd = api.Snd, beat = 60 / 112, travel = 1.5;
  const chart = [[0, 0], [1, 3], [2, 1], [3, 2], [4, 0], [4.5, 0], [5, 3], [6, 1], [7, 2], [8, 0], [9, 1], [10, 2], [11, 3], [12, 0], [12.5, 3], [13, 0], [14, 1], [14.5, 2], [15, 3], [16, 1], [17, 2], [18, 1], [19, 2], [20, 0], [21, 3], [22, 0], [23, 3], [24, 1], [24.5, 2], [25, 1], [26, 0], [27, 3], [28, 1], [29, 2], [30, 0], [31, 3]];
  const t0 = Snd.now() + 2.2;
  const notes = chart.map(([b, lane]) => ({ t: t0 + b * beat, lane, judged: false, res: "" }));
  const endT = notes[notes.length - 1].t + 1.4;
  if (Snd.ctx) {
    const bass = [130.8, 130.8, 174.6, 196];
    for (let b = -4; b < 34; b++) {
      const t = t0 + b * beat;
      Snd.drum(0, t); Snd.drum(2, t + beat / 2);
      if (b % 2 === 1) Snd.drum(1, t);
      if (b >= 0 && b % 2 === 0) Snd.tone(bass[(b / 2) % 4], bass[(b / 2) % 4], beat * 1.6, "triangle", 0.14, t);
    }
  }
  let perfect = 0, good = 0, combo = 0, fb = "", fbT = 0, fall = 0, ended = false;
  function press(lane) {
    const now = Snd.now();
    let best = null, bd = 0.2;
    for (const n of notes) if (!n.judged && n.lane === lane && Math.abs(n.t - now) < bd) { bd = Math.abs(n.t - now); best = n; }
    if (!best) { fb = "헛방!"; fbT = 0.4; return; }
    best.judged = true;
    if (bd < 0.075) { perfect++; combo++; best.res = "p"; fb = "퍼펙트!"; } else { good++; combo++; best.res = "g"; fb = "좋아요!"; }
    fbT = 0.5;
    Snd.tone(660 + lane * 110, 660 + lane * 110, 0.08, "square", 0.04);
  }
  const stopKeys = onKeys({ ArrowLeft: () => press(0), ArrowDown: () => press(1), ArrowUp: () => press(2), ArrowRight: () => press(3), KeyD: () => press(0), KeyF: () => press(1), KeyJ: () => press(2), KeyK: () => press(3) });
  const stop = loop((dt, tt) => {
    const now = Snd.now();
    for (const n of notes) if (!n.judged && now - n.t > 0.2) { n.judged = true; n.res = "m"; combo = 0; fb = "놓쳤어요"; fbT = 0.5; fall = 1; }
    x.fillStyle = "#1e2a4a"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) { x.fillStyle = "rgba(255,255,255,.06)"; x.fillRect(LANES[i] - 34, 0, 68, H); }
    x.fillStyle = "rgba(255,255,255,.25)"; x.fillRect(0, HIT - 3, W, 6);
    for (let i = 0; i < 4; i++) { x.strokeStyle = COLS[i]; x.lineWidth = 4; rr(x, LANES[i] - 28, HIT - 28, 56, 56, 12); x.stroke(); textC(x, ARROW[i], LANES[i], HIT, 30, COLS[i]); }
    for (const n of notes) {
      if (n.judged && n.res !== "m") continue;
      const y = HIT - ((n.t - now) / travel) * HIT;
      if (y < -40 || y > H + 40) continue;
      x.fillStyle = n.res === "m" ? "#64748b" : COLS[n.lane]; rr(x, LANES[n.lane] - 26, y - 26, 52, 52, 12); x.fill();
      textC(x, ARROW[n.lane], LANES[n.lane], y + 1, 30, "#ffffff");
    }
    // dancing robot (falls over on a miss)
    fall = Math.max(0, fall - dt * 1.5);
    const rx = W - 46, ry = 78, sway = Math.sin(tt * 7.3) * 0.25;
    x.save(); x.translate(rx, ry + 30); x.rotate(fall > 0 ? fall * 1.4 : sway);
    x.fillStyle = "#c9d3e0"; x.fillRect(-14, -50, 28, 26); x.fillStyle = "#5b6b82"; x.fillRect(-18, -24, 36, 30);
    x.fillStyle = "#ff4747"; x.fillRect(-2, -62, 4, 12); x.fillStyle = "#1e2a4a"; x.fillRect(-8, -42, 5, 5); x.fillRect(3, -42, 5, 5);
    x.fillStyle = "#5b6b82"; x.fillRect(-26, -22 + Math.sin(tt * 14) * 6, 8, 22); x.fillRect(18, -22 - Math.sin(tt * 14) * 6, 8, 22); x.fillRect(-14, 6, 10, 22); x.fillRect(4, 6, 10, 22);
    x.restore();
    if (fall > 0.5) textC(x, "삐빅! 꽈당!", rx - 30, 22, 18, "#ffd91a");
    textC(x, `콤보 ${combo}`, 70, 30, 24, "#ffffff");
    if (now < t0) textC(x, now < t0 - 1.4 ? "준비…" : now < t0 - 0.7 ? "하나, 둘…" : "시작!", W / 2, 200, 42, "#ffd91a", "#000");
    if (fbT > 0) { fbT -= dt; textC(x, fb, W / 2, 300, 36, fb === "퍼펙트!" ? "#ffd91a" : "#ffffff", "#000"); }
    if (!ended && now > endT) { ended = true; const pct = Math.round(((perfect + good * 0.6) / notes.length) * 100); setTimeout(() => api.end(pct), 300); }
  });
  return () => { stop(); stopKeys(); };
}

// ---------- 3. 떡볶이 재료 받기 ----------
function cook(stage, api) {
  const W = 360, H = 480, { cv, x } = makeCanvas(stage, W, H);
  // [그림, 받았을 때 문구, 그림 아래 이름표] 이름표가 있어서 그림 글꼴이 없는 기기에서도 무엇인지 알 수 있어요
  const GOOD = [["🍡", "떡", "떡"], ["🍢", "어묵", "어묵"], ["🥚", "계란", "계란"], ["🌶️", "고추장", "고추장"], ["🧀", "치즈", "치즈"]];
  const BAD = [["🧦", "양말 떡볶이?! 으웩!", "양말"], ["👟", "운동화는 안 씹혀요!", "운동화"], ["📱", "휴대폰은 맛없어요!", "휴대폰"], ["🧽", "수세미는 반칙!", "수세미"]];
  let pot = W / 2, target = W / 2, left = false, right = false, items = [], spawn = 0, time = 30, score = 0, pops = [], ended = false;
  const stopKeys = onKeys({ ArrowLeft: () => (left = true), ArrowRight: () => (right = true), KeyA: () => (left = true), KeyD: () => (right = true) });
  const up = (e) => { if (e.code === "ArrowLeft" || e.code === "KeyA") left = false; if (e.code === "ArrowRight" || e.code === "KeyD") right = false; };
  addEventListener("keyup", up);
  const move = (e) => { const r = cv.getBoundingClientRect(); target = ((e.clientX - r.left) / r.width) * W; };
  cv.addEventListener("pointerdown", (e) => { e.preventDefault(); move(e); cv.setPointerCapture?.(e.pointerId); });
  cv.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType === "touch") move(e); });
  const stop = loop((dt) => {
    if (!ended) {
      time -= dt;
      if (left || right) target = pot + (right ? 1 : -1) * 60;
      pot += Math.max(-340 * dt, Math.min(340 * dt, target - pot));
      pot = Math.max(40, Math.min(W - 40, pot));
      spawn -= dt;
      if (spawn <= 0) {
        const good = Math.random() < 0.72, k = good ? GOOD[Math.floor(Math.random() * GOOD.length)] : BAD[Math.floor(Math.random() * BAD.length)];
        items.push({ x: 24 + Math.random() * (W - 48), y: -20, vy: 130 + (30 - time) * 6 + Math.random() * 60, good, k, rot: Math.random() * 6 });
        spawn = Math.max(0.32, 0.62 - (30 - time) * 0.01);
      }
      for (const it of items) {
        it.y += it.vy * dt; it.rot += dt * 2;
        if (!it.done && it.y > 402 && it.y < 440 && Math.abs(it.x - pot) < 46) {
          it.done = true;
          if (it.good) { score++; api.Snd.pop(); pops.push({ x: it.x, y: 380, s: `+1 ${it.k[1]}`, t: 0.8, c: "#3fd16f" }); }
          else { score = Math.max(0, score - 1); api.Snd.no(); pops.push({ x: W / 2, y: 200, s: it.k[1], t: 1.3, c: "#ff4747" }); }
        }
      }
      items = items.filter((it) => !it.done && it.y < H + 30);
      if (time <= 0) { ended = true; setTimeout(() => api.end(score), 500); }
    }
    x.fillStyle = "#fff6e3"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#f2c94c"; x.fillRect(0, H - 40, W, 40);
    for (const it of items) { x.save(); x.translate(it.x, it.y); x.rotate(Math.sin(it.rot) * 0.4); x.font = "34px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(it.k[0], 0, -6); x.restore(); textC(x, it.k[2], it.x, it.y + 24, 15, it.good ? "#1e2a4a" : "#c0262d", "#ffffff"); }
    // pot
    x.fillStyle = "#4b5563"; rr(x, pot - 46, 412, 92, 34, 10); x.fill();
    x.fillStyle = "#ef4444"; rr(x, pot - 40, 406, 80, 12, 6); x.fill();
    x.fillStyle = "#374151"; x.fillRect(pot - 58, 418, 12, 6); x.fillRect(pot + 46, 418, 12, 6);
    for (let i = 0; i < Math.min(score, 12); i++) { x.fillStyle = i % 2 ? "#fde68a" : "#fff"; x.fillRect(pot - 34 + (i % 6) * 12, 402 - Math.floor(i / 6) * 6, 9, 6); }
    textC(x, `${Math.max(0, Math.ceil(time))}초`, 50, 30, 26);
    textC(x, `${score}점`, W - 50, 30, 26, "#ef4444");
    for (const p of pops) { p.t -= dt; p.y -= dt * 40; textC(x, p.s, p.x, p.y, p.c === "#ff4747" ? 26 : 20, p.c, "#ffffff"); }
    pops = pops.filter((p) => p.t > 0);
  });
  return () => { stop(); stopKeys(); removeEventListener("keyup", up); };
}

// ---------- 4. 로봇 길 찾기 ----------
function code(stage, api) {
  const LEVELS = [
    { start: [0, 4, 0], goal: [0, 1], walls: [] },
    { start: [0, 4, 0], goal: [2, 2], walls: [[0, 1], [1, 3], [2, 3]] },
    { start: [4, 4, 3], goal: [0, 0], walls: [[2, 4], [1, 4], [0, 4], [3, 2], [2, 1], [0, 2], [4, 1]] },
  ];
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  let li = 0, cleared = 0, prog = [], running = false, bot = null;
  const wrap = document.createElement("div"); wrap.className = "code-wrap";
  wrap.innerHTML = `<div class="code-top"><span class="code-level" id="cLvl"></span><span class="code-msg" id="cMsg" aria-live="polite"></span></div>
    <div class="code-grid" id="cGrid"></div>
    <div class="code-prog" id="cProg" aria-label="내 명령"></div>
    <div class="code-pal">
      <button type="button" data-c="F">▲ 앞으로</button><button type="button" data-c="L">↺ 왼쪽 돌기</button><button type="button" data-c="R">↻ 오른쪽 돌기</button>
    </div>
    <div class="code-run"><button type="button" id="cUndo">한 칸 지우기</button><button type="button" id="cClear">모두 지우기</button><button type="button" class="go" id="cRun">▶ 실행</button></div>`;
  stage.appendChild(wrap);
  const $ = (s) => wrap.querySelector(s);
  const msg = (t) => { $("#cMsg").textContent = t; };
  function reset() { const L = LEVELS[li]; bot = { x: L.start[0], y: L.start[1], d: L.start[2] }; draw(); }
  function draw() {
    const L = LEVELS[li], g = $("#cGrid");
    $("#cLvl").textContent = `${li + 1} / ${LEVELS.length} 단계`;
    g.innerHTML = "";
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      const c = document.createElement("div"); c.className = "cell";
      if (L.walls.some(([a, b]) => a === x && b === y)) c.classList.add("wall");
      if (L.goal[0] === x && L.goal[1] === y) { c.classList.add("goal"); c.textContent = "★"; }
      if (bot.x === x && bot.y === y) { const r = document.createElement("span"); r.className = "bot"; r.textContent = "▲"; r.style.transform = `rotate(${bot.d * 90}deg)`; c.appendChild(r); }
      g.appendChild(c);
    }
    $("#cProg").innerHTML = prog.length ? prog.map((p, i) => `<span class="op" data-i="${i}">${p === "F" ? "▲" : p === "L" ? "↺" : "↻"}</span>`).join("") : '<span class="hint">아래 버튼으로 명령을 쌓아요</span>';
  }
  function add(c) { if (running || prog.length >= 14) return; prog.push(c); api.Snd.tick(); draw(); }
  function run() {
    if (running || !prog.length) return;
    running = true; reset(); msg("로봇 출발!");
    let i = 0;
    const step = () => {
      const L = LEVELS[li];
      if (i >= prog.length) { running = false; msg("별까지 조금 더! 명령을 고쳐 볼까요?"); api.Snd.no(); return; }
      const c = prog[i++];
      if (c === "L") bot.d = (bot.d + 3) % 4;
      else if (c === "R") bot.d = (bot.d + 1) % 4;
      else {
        const nx = bot.x + DIRS[bot.d][0], ny = bot.y + DIRS[bot.d][1];
        if (nx < 0 || ny < 0 || nx > 4 || ny > 4 || L.walls.some(([a, b]) => a === nx && b === ny)) {
          running = false; msg("쾅! 벽에 박치기했어요. (로봇: 괜찮아요, 저는 튼튼해요)"); api.Snd.no(); draw();
          setTimeout(reset, 900); return;
        }
        bot.x = nx; bot.y = ny; api.Snd.tick();
      }
      draw();
      if (bot.x === L.goal[0] && bot.y === L.goal[1]) {
        running = false; cleared = li + 1; api.Snd.ok();
        msg(li < LEVELS.length - 1 ? "도착! 다음 단계로 가요." : "모든 단계 성공! 코딩 천재!");
        setTimeout(() => { if (li < LEVELS.length - 1) { li++; prog = []; reset(); msg("새 미로예요!"); } else api.end(cleared); }, 1200);
        return;
      }
      setTimeout(step, 420);
    };
    setTimeout(step, 300);
  }
  wrap.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => add(b.dataset.c)));
  $("#cProg").addEventListener("click", (e) => { const i = e.target.dataset?.i; if (i !== undefined && !running) { prog.splice(+i, 1); draw(); } });
  $("#cUndo").addEventListener("click", () => { if (!running) { prog.pop(); draw(); } });
  $("#cClear").addEventListener("click", () => { if (!running) { prog = []; draw(); } });
  $("#cRun").addEventListener("click", run);
  const stopKeys = onKeys({ ArrowUp: () => add("F"), ArrowLeft: () => add("L"), ArrowRight: () => add("R"), Backspace: () => { if (!running) { prog.pop(); draw(); } }, Enter: run });
  reset(); msg("로봇을 별까지 보내 주세요!");
  api.setQuit(() => api.end(cleared));
  return () => stopKeys();
}

// ---------- 5. 드럼 비트 따라 치기 ----------
// 진짜 드럼 연습처럼: 박자 세기(하나 둘 셋 넷) → 시범 한 마디 듣기 → 두 마디 같이 치기.
// 4비트 → 8비트 → 16비트로 하이햇이 촘촘해져요. 한 단계마다 60% 넘게 맞히면 다음 비트로!
const DRUM_STAGES = [
  { name: "4비트", bpm: 92, tip: "하이햇은 한 박에 한 번 '치'. 킥(쿵)은 1·3박, 스네어(짝)는 2·4박이에요.", hh: [0, 4, 8, 12], sn: [4, 12], kk: [0, 8] },
  { name: "8비트", bpm: 88, tip: "하이햇이 두 배! 한 박에 두 번 '치키치키'. 킥은 1박·3박·3박 반, 스네어는 2·4박.", hh: [0, 2, 4, 6, 8, 10, 12, 14], sn: [4, 12], kk: [0, 8, 10] },
  { name: "16비트", bpm: 72, tip: "하이햇을 한 박에 네 번! 진짜 드러머처럼 두 손가락(→ ↑)으로 번갈아 쳐요.", hh: [...Array(16).keys()], sn: [4, 12], kk: [0, 6, 8] },
];
function drum(stage, api) {
  const Snd = api.Snd, W = 360, H = 300, HIT = 66, PX = 150;
  // 위에서부터 하이햇·스네어·킥: 드럼 악보와 같은 순서예요
  const LANES = [
    { name: "하이햇", s: "치", c: "#22c55e", y: 132, snd: 2 },
    { name: "스네어", s: "짝", c: "#3b82f6", y: 192, snd: 1 },
    { name: "킥", s: "쿵", c: "#ef4444", y: 252, snd: 0 },
  ];
  const { x } = makeCanvas(stage, W, H);
  const pads = document.createElement("div"); pads.className = "mg-pads drum-kit";
  for (const [lane, key] of [[2, "←"], [1, "↓"], [0, "→ ↑"]]) {
    const L = LANES[lane], b = document.createElement("button");
    b.type = "button"; b.style.background = L.c; b.innerHTML = `<b>${L.s}</b><small>${L.name} ${key}</small>`;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); hit(lane); });
    pads.appendChild(b); L.btn = b;
  }
  stage.appendChild(pads);
  let si = -1, cleared = 0, st = null, notes = [], pops = [], over = false, result = null;
  const flash = (lane) => { const b = LANES[lane].btn; b.classList.add("hit"); setTimeout(() => b.classList.remove("hit"), 120); LANES[lane].glow = 1; };
  function startStage() {
    si++;
    const S0 = DRUM_STAGES[si], beat = 60 / S0.bpm, bar = beat * 4, t0 = Snd.now() + 3.0;
    st = { ...S0, beat, bar, t0, demo: t0 + bar, play: t0 + bar * 2, end: t0 + bar * 4, perfect: 0, good: 0, judged: false };
    notes = [];
    for (let b = 0; b < 3; b++) {
      const start = st.demo + b * bar, auto = b === 0;
      for (const [lane, steps] of [[0, S0.hh], [1, S0.sn], [2, S0.kk]]) for (const k of steps) notes.push({ t: start + k * beat / 4, lane, auto, done: false, res: "" });
    }
    notes.sort((p, q) => p.t - q.t);
    if (Snd.ctx) {
      for (let k = 0; k < 4; k++) Snd.tone(k ? 1400 : 1900, k ? 1400 : 1900, 0.04, "square", 0.06, t0 + k * beat);
      for (const n of notes) if (n.auto) Snd.drum(LANES[n.lane].snd, n.t);
      const bass = [98, 98, 130.8, 116.5];
      for (let b = 0; b < 3; b++) for (const k of [0, 2]) { const f = bass[(b * 2 + k / 2) % 4]; Snd.tone(f, f, beat * 1.7, "triangle", 0.13, st.demo + b * bar + k * beat); }
      for (let k = 0; k < 8; k++) Snd.tone(1500, 1500, 0.02, "square", 0.012, st.play + k * beat);
    }
  }
  function hit(lane) {
    if (over) return;
    Snd.drum(LANES[lane].snd);
    flash(lane);
    if (!st) return;
    const now = Snd.now();
    let best = null, bd = 0.15;
    for (const n of notes) if (!n.auto && !n.done && n.lane === lane && Math.abs(n.t - now) < bd) { bd = Math.abs(n.t - now); best = n; }
    if (!best) return;
    best.done = true;
    if (bd < 0.06) { st.perfect++; best.res = "p"; pops.push({ s: "딱 맞아요!", c: "#ffd91a", y: LANES[lane].y - 30, t: 0.5 }); }
    else { st.good++; best.res = "g"; pops.push({ s: "좋아요", c: "#ffffff", y: LANES[lane].y - 30, t: 0.5 }); }
  }
  function wrap(s, maxW, size) {
    x.font = `${size}px ${FONT}`;
    const out = []; let line = "";
    for (const w of s.split(" ")) { const t = line ? line + " " + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
    if (line) out.push(line);
    return out;
  }
  const stopKeys = onKeys({ ArrowLeft: () => hit(2), KeyD: () => hit(2), ArrowDown: () => hit(1), KeyF: () => hit(1), ArrowRight: () => hit(0), ArrowUp: () => hit(0), KeyJ: () => hit(0), KeyK: () => hit(0) });
  const stop = loop((dt) => {
    const now = Snd.now();
    x.fillStyle = "#1e2a4a"; x.fillRect(0, 0, W, H);
    if (st) {
      for (const n of notes) if (!n.auto && !n.done && now - n.t > 0.16) { n.done = true; n.res = "m"; pops.push({ s: "놓쳤어요", c: "#94a3b8", y: LANES[n.lane].y - 30, t: 0.4 }); }
      for (const n of notes) if (n.auto && !n.flashed && now >= n.t) { n.flashed = true; flash(n.lane); }
      // 박자 선: 마디 첫 박은 굵게, 위에 1 2 3 4
      for (let b = 0; b < 12; b++) {
        const tb = st.demo + b * st.beat, bx = HIT + (tb - now) * PX;
        if (bx < 20 || bx > W + 10) continue;
        x.fillStyle = b % 4 === 0 ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.12)"; x.fillRect(bx - (b % 4 === 0 ? 1.5 : 0.5), 104, b % 4 === 0 ? 3 : 1, 176);
        textC(x, String((b % 4) + 1), bx, 94, 15, b % 4 === 0 ? "#ffd91a" : "rgba(255,255,255,.6)");
      }
      for (const L of LANES) {
        L.glow = Math.max(0, (L.glow || 0) - dt * 5);
        x.strokeStyle = L.c; x.lineWidth = 3; x.fillStyle = `rgba(255,255,255,${0.08 + L.glow * 0.35})`;
        x.beginPath(); x.arc(HIT, L.y, 22, 0, 7); x.fill(); x.stroke();
        textC(x, L.name, 22, L.y - 30, 12, L.c);
      }
      for (const n of notes) {
        if (n.done && n.res !== "m") continue;
        const nx = HIT + (n.t - now) * PX;
        if (nx < -20 || nx > W + 20 || (n.auto && now > n.t + 0.1)) continue;
        const L = LANES[n.lane];
        x.globalAlpha = n.auto ? 0.45 : n.res === "m" ? 0.35 : 1;
        x.fillStyle = n.res === "m" ? "#64748b" : L.c; x.beginPath(); x.arc(nx, L.y, 17, 0, 7); x.fill();
        textC(x, L.s, nx, L.y + 1, 17, "#ffffff");
        x.globalAlpha = 1;
      }
      // 안내 글씨
      let head = "", big = "";
      if (now < st.t0) head = `${st.name} · ${st.bpm} BPM`;
      else if (now < st.demo) big = ["하나", "둘", "셋", "넷"][Math.min(3, Math.floor((now - st.t0) / st.beat))];
      else if (now < st.play) head = "시범을 잘 들어 보세요";
      else if (now < st.end) head = "이제 같이 쳐요!";
      if (head) textC(x, head, W / 2, 26, 22, "#ffd91a");
      if (now < st.t0) wrap(st.tip, W - 40, 15).forEach((l, i) => textC(x, l, W / 2, 54 + i * 20, 15, "#ffffff"));
      if (big) textC(x, big, W / 2, 50, 40, "#ffffff", "#000");
      if (!st.judged && now > st.end + 0.3) {
        st.judged = true;
        const total = notes.filter((n) => !n.auto).length, acc = Math.round(((st.perfect + st.good * 0.75) / total) * 100);
        if (acc >= 60) { cleared++; Snd.drum(3); Snd.ok(); result = { s: `${st.name} 성공! ${acc}%`, sub: ["드러머 데뷔!", "옆 반까지 들썩들썩!", "박자가 딱딱 맞아요!"][si], t: 2.2 }; }
        else { Snd.no(); result = { s: `아쉬워요! ${acc}%`, sub: "박자가 잠깐 산책을 나갔어요…", t: 2.2 }; }
        const passed = acc >= 60;
        setTimeout(() => { if (over) return; if (passed && si < DRUM_STAGES.length - 1) { result = null; startStage(); } else { over = true; api.end(cleared); } }, 2300);
      }
      if (result) { textC(x, result.s, W / 2, 30, 26, "#ffd91a", "#000"); textC(x, result.sub, W / 2, 62, 16, "#ffffff"); }
    }
    for (const p of pops) { p.t -= dt; p.y -= dt * 30; textC(x, p.s, HIT + 70, p.y, 16, p.c, "#000"); }
    pops = pops.filter((p) => p.t > 0);
  });
  startStage();
  stage.drumState = () => ({ notes, now: Snd.now(), stage: si, cleared }); // 자동 테스트용
  api.setQuit(() => { over = true; api.end(cleared); });
  return () => { over = true; stop(); stopKeys(); };
}

export const MINIGAMES = { stack, rhythm, cook, code, drum };
