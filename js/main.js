// 순창 청소년 자치배움터 탐험대: 장면 전환, 캐릭터 조작, 카메라, 공간 발견, 대화, 퀴즈, 미니게임, 저장
import { SCENES, OUTDOOR, QUIZZES, GAMES, HATS, COSTUME_HATS, SHIRTS, TOILET_LINES, LEGO_LINES, ELEVATOR_LINES } from "./data.js";
import { Snd } from "./sfx.js";
import { MINIGAMES } from "./minigames.js";
import * as B from "./build.js";

const $ = (s) => document.querySelector(s);
const loadMsg = $("#loadMsg");
const fail = (t) => { loadMsg.className = "err"; loadMsg.textContent = t; };
async function loadLib(local, cdn) { try { return await import(local); } catch (e) { return import(cdn); } }
let THREE, CANNON;
try {
  [THREE, CANNON] = await Promise.all([
    loadLib("../vendor/three.module.min.js", "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js"),
    loadLib("../vendor/cannon-es.js", "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js"),
  ]);
} catch (e) {
  fail("3D 엔진을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.");
  throw e;
}
try { await Promise.race([document.fonts.load('64px "Jua"'), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* fallback fonts */ }
const { clamp, damp } = B;
const angDamp = (a, b, k, dt) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * (1 - Math.exp(-k * dt));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
GAMES.obby = { name: "점프 블록 별", room: "창의교육마당", howto: "", goals: [1], unit: "" };
const maxStars = (id) => (GAMES[id].goals.length >= 3 && id !== "climb" ? 3 : 1);

// ---------- save ----------
const SAVE_KEY = "sunchang-explorer-v1";
const save = { name: "", shirt: 0, hat: "cap", rooms: [], quizzes: [], stars: {}, done: false, scene: null, spawn: null };
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || "{}")); } catch (e) { /* private mode */ }
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } };
const DEX = [];
for (const [sid, def] of Object.entries(SCENES)) for (const r of def.rooms) if (!r.noDex) DEX.push({ id: r.id, name: r.name, scene: sid, zone: def.name, desc: r.desc, quiz: r.quiz, quiz2: r.quiz2, game: r.game });
for (const z of OUTDOOR.zones) DEX.push({ id: z.id, name: z.name, scene: "outdoor", zone: "바깥 마당", desc: z.desc, quiz: z.quiz });
const dexById = Object.fromEntries(DEX.map((d) => [d.id, d]));
const quizRoom = {};
for (const d of DEX) { if (d.quiz) quizRoom[d.quiz] = d; if (d.quiz2) quizRoom[d.quiz2] = d; }
const QUIZ_TOTAL = Object.keys(QUIZZES).length;
const STAR_TOTAL = Object.keys(GAMES).reduce((s, id) => s + maxStars(id), 0);
const starCount = () => Object.entries(save.stars).reduce((s, [id, v]) => s + Math.min(v, GAMES[id] ? maxStars(id) : 0), 0);
const playerName = () => (save.name || "탐험대원").trim();

// ---------- renderer ----------
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { fail("이 기기에서는 3D 화면을 켤 수 없어요. 크롬, 삼성 인터넷, 사파리 최신 버전으로 열어 주세요."); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$("#stage").appendChild(renderer.domElement);
B.initBuild(THREE, CANNON, renderer);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#d4f1ff", 70, 230);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 700);
const fitFov = () => { camera.fov = innerWidth / innerHeight < 0.8 ? 68 : 55; camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
fitFov();
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color("#3aa6ff") }, bottom: { value: new THREE.Color("#d4f1ff") } },
  vertexShader: "varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: "uniform vec3 top; uniform vec3 bottom; varying float h; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.02, 0.55, h)), 1.0);\n#include <colorspace_fragment>\n}",
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), skyMat);
sky.renderOrder = -1;
scene.add(sky);
const hemi = new THREE.HemisphereLight(0xffffff, 0x7fae5c, 1.05);
const sun = new THREE.DirectionalLight(0xffffff, 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 160 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(hemi, sun, sun.target);

// ---------- physics ----------
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -28, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
const matGround = new CANNON.Material("ground"), matPlayer = new CANNON.Material("player"), matBall = new CANNON.Material("ball"), matCrate = new CANNON.Material("crate");
const cm = (a, b, friction, restitution) => world.addContactMaterial(new CANNON.ContactMaterial(a, b, { friction, restitution }));
cm(matPlayer, matGround, 0, 0); cm(matPlayer, matCrate, 0, 0); cm(matPlayer, matBall, 0, 0.3);
cm(matBall, matGround, 0.4, 0.5); cm(matCrate, matGround, 0.5, 0.05); cm(matCrate, matCrate, 0.5, 0.05); cm(matBall, matCrate, 0.3, 0.4);
{
  // 바닥은 납작한 큰 상자예요. 고정된 물체는 옮긴 뒤 경계 상자를 다시 계산해야 발밑 검사 광선이 찾을 수 있어요.
  const g = new CANNON.Body({ mass: 0, material: matGround, shape: new CANNON.Box(new CANNON.Vec3(400, 0.5, 400)) });
  g.position.set(0, -0.5, 0);
  g.updateAABB();
  world.addBody(g);
}
const pBody = new CANNON.Body({ mass: 5, material: matPlayer, fixedRotation: true, allowSleep: false, linearDamping: 0 });
pBody.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3(0, 0.3, 0));
pBody.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3(0, 0.82, 0));
pBody.collisionFilterGroup = 2;
pBody.updateMassProperties();
world.addBody(pBody);

// ---------- state ----------
const S = { mode: "loading", modal: null, busy: false, sceneId: null, cur: null, talk: null, typing: null, sport: null, room: null, roomCheck: 0, invisT: 0, legoCD: 0, bellCD: 0, T: 0, lastSpawn: null };
const player = { face: Math.PI, grounded: true, coyote: 0, jumpBuf: 0, moveAmt: 0, avatar: null };
function buildPlayer() {
  if (player.avatar) scene.remove(player.avatar);
  player.avatar = B.makeAvatar({ skin: "#ffd9b8", shirt: SHIRTS[save.shirt] || SHIRTS[0], pants: "#2f4b8f", hair: "#3b2a20", hat: save.hat || "none", hatColor: "#ffc93c" });
  scene.add(player.avatar);
}
buildPlayer();

// ---------- scenes ----------
const built = {};
const buildOpts = () => ({ groundMat: matGround, ballMat: matBall, crateMat: matCrate, solved: new Set(save.quizzes) });
const insideSlabs = (def, x, z) => def.slabs.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1);
function exitPoint(def, e) {
  const bx = e.axis === "z" ? e.at : e.c, bz = e.axis === "z" ? e.c : e.at, nx = e.axis === "z" ? 0 : 1, nz = e.axis === "z" ? 1 : 0;
  if (insideSlabs(def, bx + nx * 0.9, bz + nz * 0.9)) return { x: bx + nx * 0.9, z: bz + nz * 0.9 };
  return { x: bx - nx * 0.9, z: bz - nz * 0.9 };
}
function makeNPCs(ctx, list) {
  return (list || []).map((d, i) => {
    const av = d.animal ? B.makeAnimal(d.animal, d.pose) : B.makeAvatar(d.look);
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.innerHTML = `${d.name}<small>${d.role}</small>`;
    tag.style.opacity = 0;
    $("#tags").appendChild(tag);
    ctx.group.add(av);
    return { d, name: d.name, lines: d.lines, pos: new THREE.Vector3(d.pos[0], d.y || 0, d.pos[1]), face: d.face ?? Math.PI, area: d.area, still: d.still || !d.area, target: null, wait: 1 + i, moving: 0, phase: i * 1.7, avatar: av, tag, talking: false };
  });
}
function addGag(ctx, g) {
  if (g.kind === "lego") { ctx.legoRect = g.rect; return; }
  if (g.kind === "toilet") { ctx.interact.push({ kind: "gag", gag: "toilet", x: g.pos[0], z: g.pos[1], r: 1.5, label: "화장실", verb: "노크하기" }); return; }
  ctx.interact.push({ kind: "gag", gag: g.kind, x: g.pos[0], z: g.pos[1], r: g.r || 1.6, label: g.label, verb: g.verb, lines: g.lines });
  const s = B.signSprite(g.label, "#ffb000", 0.5);
  s.position.set(g.pos[0], 2.35, g.pos[1]);
  ctx.group.add(s);
}
function getScene(id) {
  if (built[id]) return built[id];
  const opts = buildOpts();
  let ctx;
  if (id === "outdoor") {
    ctx = B.buildOutdoor(OUTDOOR, opts);
    ctx.def = OUTDOOR;
    ctx.indoor = false;
  } else {
    const def = SCENES[id];
    ctx = B.buildInterior(def, opts);
    B.placeQuizAndGames(ctx, def, opts.solved);
    ctx.def = def;
    ctx.indoor = true;
    for (const e of def.exits || []) if (e.to) { const p = exitPoint(def, e); ctx.interact.push({ kind: "door", x: p.x, z: p.z, r: 1.8, label: e.label, verb: e.verb, to: e.to, spawn: e.spawn }); }
    for (const w of ctx.warps) ctx.interact.push({ kind: "elev", x: w.x, z: w.z, r: 1.7, label: w.label, verb: "층 이동" });
    for (const g of def.gags || []) addGag(ctx, g);
    if (ctx.special.goal) {
      const g = ctx.special.goal;
      ctx.special.pball = B.makeBall(ctx, opts, g.cx + 2.5, g.spot + 2);
      const kb = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.8, 0.3)) });
      kb.position.set(g.cx, 0.8, g.z + 0.6);
      ctx.bodies.push(kb);
      ctx.special.keeperBody = kb;
    }
  }
  ctx.npcs = makeNPCs(ctx, ctx.def.npcs);
  built[id] = ctx;
  return ctx;
}
const fadeEl = $("#fade");
const fade = (on) => new Promise((res) => { fadeEl.classList.toggle("on", on); setTimeout(res, 380); });
async function enterScene(id, spawnKey, instant) {
  if (S.busy) return;
  S.busy = true;
  endTalk();
  stopSport();
  if (!instant) await fade(true);
  if (S.cur) {
    scene.remove(S.cur.group);
    for (const b of S.cur.bodies) world.removeBody(b);
    for (const n of S.cur.npcs) n.tag.style.opacity = 0;
  }
  const from = { x: pBody.position.x, z: pBody.position.z };
  const ctx = getScene(id);
  S.cur = ctx; S.sceneId = id;
  scene.add(ctx.group);
  for (const b of ctx.bodies) world.addBody(b);
  let sp = ctx.def.spawns[spawnKey];
  if (!sp && spawnKey === "stairs" && ctx.warps) {
    // 계단으로 왔으면 같은 자리의 계단에서 나타나요
    const st = ctx.warps.filter((w) => w.label === "계단").sort((a, b) => Math.hypot(a.x - from.x, a.z - from.z) - Math.hypot(b.x - from.x, b.z - from.z))[0];
    if (st) sp = st;
  }
  sp = sp || ctx.def.spawns.elevator || Object.values(ctx.def.spawns)[0];
  S.warpArmed = false;
  S.lastSpawn = { id, key: spawnKey };
  pBody.position.set(sp.x, 0.08, sp.z);
  pBody.velocity.set(0, 0, 0);
  player.face = sp.face;
  cam.yaw = sp.face + Math.PI;
  cam.pitch = ctx.indoor ? 0.9 : 0.42;
  cam.dist = ctx.indoor ? 10.5 : 8.5;
  cam.cur = cam.dist;
  cam.target.set(sp.x, 1.15, sp.z);
  scene.fog.near = ctx.indoor ? 50 : 70;
  scene.fog.far = ctx.indoor ? 170 : 230;
  S.room = null;
  if (S.mode === "play") banner(ctx.def.name);
  updateLocation();
  save.scene = id; save.spawn = spawnKey; persist();
  if (!instant) await fade(false);
  S.busy = false;
}
function respawn() { const sp = S.lastSpawn || { id: "outdoor", key: "start" }; const s = S.cur.def.spawns[sp.key] || Object.values(S.cur.def.spawns)[0]; pBody.position.set(s.x, 0.5, s.z); pBody.velocity.set(0, 0, 0); }

// ---------- HUD & UI ----------
let toastTimer;
function toast(t, ms = 2800) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), ms); }
let bannerTimer;
function banner(t) { S.bannerUntil = S.T + 1.7; const el = $("#banner"); el.textContent = t; el.classList.remove("show"); void el.offsetWidth; el.classList.add("show"); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => el.classList.remove("show"), 1900); }
function confetti(n = 50) {
  const fx = $("#fx"), cols = ["#ff5a5f", "#ffc93c", "#1fbf9f", "#4fb3ff", "#ff9ad5"];
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    s.className = "cf";
    s.style.left = Math.random() * 100 + "vw";
    s.style.background = cols[i % cols.length];
    s.style.setProperty("--dx", (Math.random() - 0.5) * 220 + "px");
    s.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
    s.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
    s.style.animationDelay = Math.random() * 0.3 + "s";
    fx.appendChild(s);
    setTimeout(() => s.remove(), 3600);
  }
}
function updateHUD() {
  $("#cDex").textContent = `${save.rooms.filter((id) => dexById[id]).length}/${DEX.length}`;
  $("#cQuiz").textContent = `${save.quizzes.filter((id) => QUIZZES[id]).length}/${QUIZ_TOTAL}`;
  $("#cStar").textContent = `${starCount()}/${STAR_TOTAL}`;
}
function updateLocation() {
  const ctx = S.cur;
  if (!ctx) return;
  $("#locZone").textContent = ctx.def.name;
  $("#locRoom").textContent = S.room ? S.room.name : ctx.indoor ? "복도" : "바깥";
}
let cardTimer;
function showRoomCard(r, isNew) {
  const d = dexById[r.id];
  if (!d) return;
  if (S.bannerUntil && S.T < S.bannerUntil) { setTimeout(() => { if (S.room === r) showRoomCard(r, isNew); }, (S.bannerUntil - S.T) * 1000 + 50); return; }
  if (S.sport) return;
  $("#rcKick").textContent = isNew ? "새 공간 발견!" : S.cur.def.name;
  $("#rcName").textContent = d.name;
  $("#rcDesc").textContent = d.desc || "";
  const chips = [];
  if (d.quiz) chips.push(`<span class="chip ${save.quizzes.includes(d.quiz) ? "ok" : ""}">퀴즈 ${save.quizzes.includes(d.quiz) ? "완료" : "있어요"}</span>`);
  if (d.game) chips.push(`<span class="chip game">미니게임 · ${GAMES[d.game].name}</span>`);
  $("#rcChips").innerHTML = chips.join("");
  const el = $("#roomCard");
  el.hidden = false;
  el.classList.toggle("new", isNew);
  el.classList.remove("out");
  clearTimeout(cardTimer);
  cardTimer = setTimeout(() => el.classList.add("out"), isNew ? 7000 : 4000);
}
function discover(r) {
  if (r.noDex || !dexById[r.id] || save.rooms.includes(r.id)) { if (dexById[r.id]) showRoomCard(r, false); return; }
  save.rooms.push(r.id);
  persist();
  Snd.discover();
  showRoomCard(r, true);
  updateHUD();
  const n = save.rooms.filter((id) => dexById[id]).length;
  if (n === DEX.length && !save.done) setTimeout(() => { save.done = true; persist(); confetti(120); Snd.star(); openCert(true); }, 2600);
  else if (n === Math.ceil(DEX.length / 2)) setTimeout(() => toast("도감 절반 완성! 벌써 반이나 탐험했어요.", 3600), 1500);
}
function roomAt(x, z) {
  const ctx = S.cur;
  if (!ctx) return null;
  if (!ctx.indoor) { for (const r of ctx.zones) for (const [x0, x1, z0, z1] of r.rects) if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return r; return null; }
  let open = null;
  for (const r of ctx.rooms) for (const [x0, x1, z0, z1] of r.rects) if (x >= x0 && x <= x1 && z >= z0 && z <= z1) { if (!r.open) return r; open = open || r; }
  return open;
}

// ---------- dialogue bubble ----------
function typeText(el, text) {
  if (S.typing) clearInterval(S.typing.id);
  let i = 0;
  el.textContent = "";
  S.typing = { el, text, id: setInterval(() => {
    i += 1;
    el.textContent = text.slice(0, i);
    if (i % 3 === 0) Snd.tick();
    if (i >= text.length) { clearInterval(S.typing.id); S.typing = null; }
  }, 24) };
}
function finishTyping() { if (!S.typing) return; clearInterval(S.typing.id); S.typing.el.textContent = S.typing.text; S.typing = null; }
function startTalk(t) {
  endTalk();
  S.talk = { ...t, i: 0 };
  if (t.npc) t.npc.talking = true;
  showLine();
}
function showLine() {
  const b = $("#bubble"), t = S.talk;
  b.hidden = false;
  b.classList.toggle("named", !!t.name);
  $("#bubbleWho").textContent = t.name || "";
  typeText($("#bubbleText"), t.lines[t.i].replace(/\{name\}/g, playerName()));
}
function nextLine() { S.talk.i++; if (S.talk.i >= S.talk.lines.length) endTalk(); else showLine(); }
function endTalk() {
  if (!S.talk) return;
  finishTyping();
  if (S.talk.npc) { S.talk.npc.talking = false; S.talk.npc.wait = 1.2; }
  S.talk = null;
  $("#bubble").hidden = true;
}
function say(anchor, text, name = "") { startTalk({ name, lines: [text], anchor: () => anchor, gag: true }); }

// ---------- interaction ----------
function findInteract() {
  const ctx = S.cur;
  if (!ctx) return null;
  const p = pBody.position;
  let best = null, bd = Infinity;
  for (const n of ctx.npcs) { const d = Math.hypot(n.pos.x - p.x, n.pos.z - p.z); if (d < 2.3 && d < bd && Math.abs(n.pos.y - p.y) < 2) { bd = d; best = { kind: "npc", npc: n, label: n.name, verb: "말 걸기" }; } }
  for (const it of ctx.interact) { const d = Math.hypot(it.x - p.x, it.z - p.z); if (d < it.r && d < bd && p.y < 2.5) { bd = d; best = it; } }
  return best;
}
const MIRROR_LINES = ["거울아 거울아, 이 배움터에서 누가 제일 멋지니? …바로 너!", "거울 속 내가 윙크했어요… 기분 탓이겠죠?", "머리 정리 완료! 오늘도 멋져요."];
function act() {
  if (S.mode !== "play" || S.modal || S.busy) return;
  if (S.sport) { sportAction(); return; }
  if (S.talk) { if (S.typing) finishTyping(); else nextLine(); return; }
  const it = findInteract();
  if (!it) return;
  const at = new THREE.Vector3(it.x ?? 0, 2.4, it.z ?? 0);
  if (it.kind === "npc") { startTalk({ name: it.npc.name, lines: it.npc.lines, npc: it.npc, anchor: () => _anchor.set(it.npc.pos.x, it.npc.pos.y + it.npc.avatar.userData.height + 0.55, it.npc.pos.z) }); return; }
  if (it.kind === "quiz") { openQuiz(it.id); return; }
  if (it.kind === "game") { startGame(it.id); return; }
  if (it.kind === "door") { Snd.door(); enterScene(it.to, it.spawn); return; }
  if (it.kind === "elev") { openElevator(it.label); return; }
  if (it.gag === "toilet") { const line = pick(TOILET_LINES); if (line.includes("쏴아아")) Snd.flush(); else Snd.pop(); say(at, line); return; }
  if (it.gag === "mirror") { Snd.pop(); say(at, pick(MIRROR_LINES)); return; }
  if (it.gag === "ghost") { S.invisT = 6; setInvisible(true); Snd.whoosh(); say(at, "녹화 시작! …어? 초록 배경 앞에서 몸이 사라졌어요! 투명인간이다!"); return; }
  if (it.gag === "hat") {
    const i = (COSTUME_HATS.indexOf(save.hat) + 1) % COSTUME_HATS.length;
    save.hat = COSTUME_HATS[i];
    B.setHat(player.avatar, save.hat, "#ffc93c");
    persist(); Snd.pop();
    say(at, `${HATS[save.hat]} 착용! 잘 어울려요. 한 번 더 누르면 다른 모자예요.`);
    return;
  }
  if (it.gag === "mic") { Snd.squeal(); say(at, `삐이이— 아아, 마이크 테스트! 지금 롤러장에 계신 ${playerName()} 어린이, 오늘 정말 멋져요!`); return; }
  Snd.pop();
  say(at, pick(it.lines));
}
const _anchor = new THREE.Vector3();
function setInvisible(on) {
  const u = player.avatar.userData;
  u.torso.visible = !on;
  for (const k in u.limbs) u.limbs[k].visible = !on;
}

// ---------- modals ----------
function openModal(id) { S.modal = id; for (const k in K) K[k] = false; joyEnd(); $("#" + id).hidden = false; }
function closeModal() {
  if (!S.modal) return;
  const id = S.modal;
  $("#" + id).hidden = true;
  S.modal = null;
  if (id === "mg") Snd.musicOn = save.music !== false;
  renderer.domElement.focus?.();
}
document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
document.querySelectorAll(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m && m.id !== "mg" && m.id !== "cert") closeModal(); }));

// quiz
let quizState = null;
function openQuiz(id) {
  const q = QUIZZES[id], room = quizRoom[id];
  if (!q) return;
  quizState = { id, solved: false };
  $("#qZone").textContent = room ? (room.scene === "outdoor" ? "바깥" : SCENES[room.scene].short) : "";
  $("#qTitle").textContent = room ? room.name : "퀴즈";
  $("#qDesc").textContent = room ? room.desc : "";
  $("#qQ").textContent = "Q. " + q.q;
  $("#qWhy").textContent = save.quizzes.includes(id) ? "이미 스탬프를 받은 퀴즈예요. 다시 풀어 봐도 좋아요!" : "";
  $("#qStamp").hidden = true;
  $("#qStamp").innerHTML = `${room ? room.name : ""}<br>통과!`;
  $("#qClose").hidden = true;
  const order = q.opts.map((_, i) => i).sort(() => Math.random() - 0.5);
  $("#qOpts").innerHTML = order.map((k, i) => `<button type="button" data-k="${k}"><b>${i + 1}</b><span>${q.opts[k]}</span></button>`).join("");
  $("#qOpts").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => pickQuiz(b)));
  openModal("quiz");
  $("#qOpts button").focus({ preventScroll: true });
}
function pickQuiz(btn) {
  if (!quizState || quizState.solved || btn.disabled) return;
  const q = QUIZZES[quizState.id];
  if (+btn.dataset.k === q.a) {
    quizState.solved = true;
    btn.classList.add("right");
    $("#qOpts").querySelectorAll("button").forEach((b) => (b.disabled = true));
    $("#qWhy").textContent = "정답! " + q.why;
    $("#qStamp").hidden = false;
    $("#qClose").hidden = false;
    $("#qClose").focus({ preventScroll: true });
    Snd.ok(); confetti(60);
    if (!save.quizzes.includes(quizState.id)) { save.quizzes.push(quizState.id); persist(); updateHUD(); }
    B.markQuizSolved(S.cur.quizBlocks[quizState.id]);
  } else {
    btn.classList.add("wrong");
    btn.disabled = true;
    $("#qWhy").textContent = pick(["음, 그건 아닌 것 같아요. 다시 골라 볼까요?", "아깝다! 공간 설명을 다시 읽어 봐요.", "땡! 하지만 괜찮아요, 한 번 더!"]);
    Snd.no();
  }
}

// elevator
function openElevator(kind) {
  const def = S.cur.def;
  const floors = Object.entries(SCENES).filter(([, d]) => d.building === def.building).sort((a, b) => a[1].level - b[1].level);
  $("#elTitle").textContent = kind === "계단" ? "계단으로 이동" : "엘리베이터";
  $("#elList").innerHTML = floors.map(([id, d]) => {
    const names = d.rooms.filter((r) => !r.noDex).map((r) => r.name);
    const found = d.rooms.filter((r) => !r.noDex && save.rooms.includes(r.id)).length;
    return `<button type="button" data-to="${id}" ${id === S.sceneId ? "disabled" : ""}><b>${d.level}층</b><span>${names.slice(0, 4).join(" · ")}${names.length > 4 ? " …" : ""}</span><em>${id === S.sceneId ? "지금 여기" : `발견 ${found}/${names.length}`}</em></button>`;
  }).reverse().join("");
  $("#elList").querySelectorAll("button[data-to]").forEach((b) => b.addEventListener("click", () => {
    closeModal();
    Snd.ding();
    toast(pick(ELEVATOR_LINES));
    enterScene(b.dataset.to, kind === "계단" ? "stairs" : "elevator");
  }));
  openModal("elev");
}

// menu (도감 · 미니게임 · 설정)
function openMenu(tab = "dex") {
  const zones = {};
  for (const d of DEX) (zones[d.zone] = zones[d.zone] || []).push(d);
  $("#menuDex").innerHTML = Object.entries(zones).map(([z, list]) => `<h3>${z} <small>${list.filter((d) => save.rooms.includes(d.id)).length}/${list.length}</small></h3><ul class="dex">${list.map((d) => {
    const got = save.rooms.includes(d.id);
    const qs = [d.quiz, d.quiz2].filter(Boolean).map((q) => (save.quizzes.includes(q) ? "✓" : "?")).join("");
    return `<li class="${got ? "got" : ""}"><button type="button" data-dex="${d.id}" ${got ? "" : "disabled"}><b>${got ? d.name : "???"}</b>${qs ? `<span class="q">퀴즈 ${qs}</span>` : ""}${d.game ? `<span class="g">★</span>` : ""}</button></li>`;
  }).join("")}</ul>`).join("");
  $("#menuDex").querySelectorAll("[data-dex]").forEach((b) => b.addEventListener("click", () => { const d = dexById[b.dataset.dex]; $("#dexDetail").innerHTML = `<b>${d.name}</b> · ${d.zone}<br>${d.desc}`; }));
  $("#dexDetail").textContent = "발견한 공간을 누르면 설명을 다시 볼 수 있어요.";
  $("#menuGames").innerHTML = Object.entries(GAMES).map(([id, g]) => { const st = Math.min(save.stars[id] || 0, maxStars(id)); return `<li><b>${g.name}</b><span>${g.room}</span><em>${"★".repeat(st)}${"☆".repeat(maxStars(id) - st)}</em></li>`; }).join("");
  $("#mDexCount").textContent = $("#cDex").textContent;
  $("#certBtn").hidden = !save.done;
  setMenuTab(tab);
  openModal("menu");
}
function setMenuTab(tab) {
  document.querySelectorAll("#menu [data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  document.querySelectorAll("#menu [data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== tab));
}
document.querySelectorAll("#menu [data-tab]").forEach((b) => b.addEventListener("click", () => setMenuTab(b.dataset.tab)));

// certificate
function openCert(first) {
  const n = save.rooms.filter((id) => dexById[id]).length;
  $("#certName").value = playerName() === "탐험대원" ? "" : playerName();
  $("#certStats").innerHTML = `<span><b>${n}/${DEX.length}</b>공간 발견</span><span><b>${save.quizzes.length}/${QUIZ_TOTAL}</b>퀴즈 스탬프</span><span><b>${starCount()}/${STAR_TOTAL}</b>미니게임 별</span>`;
  const d = new Date();
  $("#certDate").textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  $("#certKick").textContent = first ? "도감 완성!" : "탐험대장 임명장";
  if (S.modal) closeModal();
  openModal("cert");
}
$("#certName").addEventListener("input", (e) => { save.name = e.target.value.slice(0, 10); persist(); });
$("#certBtn").addEventListener("click", () => openCert(false));

// map
function openMap() {
  openModal("map");
  drawMap();
}
function drawMap() {
  const cv = $("#mapCanvas"), x = cv.getContext("2d"), ctx = S.cur, def = ctx.def;
  const W = cv.width, H = cv.height;
  x.fillStyle = "#eaf6ff"; x.fillRect(0, 0, W, H);
  let rects = [], bounds;
  if (ctx.indoor) {
    rects = def.slabs.concat((def.terraces || []).map((t) => t.rect));
  } else {
    rects = [[-26, 56, -38, 46]];
  }
  const xs = rects.flatMap((r) => [r[0], r[1]]), zs = rects.flatMap((r) => [r[2], r[3]]);
  bounds = [Math.min(...xs) - 1, Math.max(...xs) + 1, Math.min(...zs) - 1, Math.max(...zs) + 1];
  const sc = Math.min((W - 20) / (bounds[1] - bounds[0]), (H - 20) / (bounds[3] - bounds[2]));
  const ox = (W - (bounds[1] - bounds[0]) * sc) / 2, oz = (H - (bounds[3] - bounds[2]) * sc) / 2;
  const X = (v) => ox + (v - bounds[0]) * sc, Z = (v) => oz + (v - bounds[2]) * sc;
  const box = (r, fill, stroke) => { x.fillStyle = fill; x.fillRect(X(r[0]), Z(r[2]), (r[1] - r[0]) * sc, (r[3] - r[2]) * sc); if (stroke) { x.strokeStyle = stroke; x.lineWidth = 2; x.strokeRect(X(r[0]), Z(r[2]), (r[1] - r[0]) * sc, (r[3] - r[2]) * sc); } };
  const label = (t, cx, cz, size = 13, color = "#1e2a4a") => { x.font = `${size}px Jua, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = color; x.fillText(t, cx, cz); };
  if (ctx.indoor) {
    for (const r of def.slabs) box(r, "#f4f1ea");
    for (const t of def.terraces || []) box(t.rect, "#d9c3a5");
    for (const r of ctx.rooms) for (const rc of r.rects) {
      const got = save.rooms.includes(r.id);
      const fill = r.noDex ? (r.solid ? "#cbd5e1" : "#f4f1ea") : got ? r.color || "#9ec5ff" : "#d6dbe3";
      box(rc, fill, r.open ? null : "#2b3655");
    }
    for (const r of ctx.rooms) { const rc = r.rects[0]; if (r.noDex && !r.solid && r.kind !== "stairs") continue; const got = save.rooms.includes(r.id) || r.noDex; label(got ? r.name : "?", X((rc[0] + rc[1]) / 2), Z((rc[2] + rc[3]) / 2), r.name.length > 6 ? 11 : 13, got && !r.noDex ? "#ffffff" : "#1e2a4a"); }
  } else {
    x.fillStyle = "#bfe6b0"; x.fillRect(X(-26), Z(-38), 82 * sc, 84 * sc);
    for (const z of ctx.zones) { const got = save.rooms.includes(z.id); box(z.rect, got ? "#ffd25a" : "#e5e7eb", "#2b3655"); label(got ? z.name : "?", X((z.rect[0] + z.rect[1]) / 2), Z((z.rect[2] + z.rect[3]) / 2)); }
    for (const r of SCENES.w1.slabs) box([r[0] - 14.4, r[1] - 14.4, r[2] - 30, r[3] - 30], "#f2eee5", "#26355e");
    label("자치배움터", X(0), Z(-20), 15);
    const E = B.EAST; box([E.x0, E.x1, E.z0, E.z1], "#e5e9ee", "#26355e"); label("스포츠동", X((E.x0 + E.x1) / 2), Z(6), 15);
  }
  for (const it of ctx.interact) {
    const icon = it.kind === "quiz" ? (save.quizzes.includes(it.id) ? "✓" : "?") : it.kind === "game" ? "★" : it.kind === "door" ? "문" : it.kind === "elev" ? (it.label === "계단" ? "계" : "E") : null;
    if (!icon) continue;
    const col = it.kind === "quiz" ? "#ffb800" : it.kind === "game" ? "#ff4fa3" : it.kind === "door" ? "#ff4fa3" : "#0b8fd0";
    x.fillStyle = col; x.beginPath(); x.arc(X(it.x), Z(it.z), 9, 0, 7); x.fill();
    label(icon, X(it.x), Z(it.z) + 1, 11, "#ffffff");
  }
  const p = pBody.position;
  x.save(); x.translate(X(p.x), Z(p.z)); x.rotate(-player.face + Math.PI);
  x.fillStyle = "#ff5a5f"; x.strokeStyle = "#ffffff"; x.lineWidth = 3;
  x.beginPath(); x.moveTo(0, -11); x.lineTo(8, 8); x.lineTo(0, 4); x.lineTo(-8, 8); x.closePath(); x.stroke(); x.fill();
  x.restore();
  $("#mapTitle").textContent = def.name;
}

// ---------- minigames (2D) ----------
let mgCleanup = null, mgQuit = null;
function starsFor(id, score) { return GAMES[id].goals.filter((g) => score >= g).length; }
function award(id, stars) {
  const before = save.stars[id] || 0;
  if (stars > before) { save.stars[id] = stars; persist(); updateHUD(); }
  return stars > before;
}
function startGame(id) {
  if (id === "race") { startRace(); return; }
  if (id === "penalty") { startPenalty(); return; }
  const g = GAMES[id];
  $("#mgTitle").textContent = g.name;
  $("#mgRoom").textContent = g.room;
  const best = save.stars[id] || 0;
  $("#mgStage").innerHTML = `<div class="mg-intro"><p>${g.howto}</p><p class="goals">목표: ${g.goals.map((v, i) => `${"★".repeat(i + 1)} ${v}${g.unit}`).join(" · ")}</p><p class="best">최고 기록: ${"★".repeat(best)}${"☆".repeat(3 - best)}</p></div>`;
  $("#mgActions").innerHTML = `<button class="btn" type="button" id="mgGo">시작!</button>`;
  $("#mgGo").addEventListener("click", () => runGame(id));
  openModal("mg");
  $("#mgGo").focus({ preventScroll: true });
}
function runGame(id) {
  const g = GAMES[id];
  $("#mgStage").innerHTML = "";
  $("#mgActions").innerHTML = "";
  Snd.musicOn = false;
  mgQuit = null;
  let finished = false;
  const api = {
    Snd,
    setQuit(fn) { mgQuit = fn; $("#mgActions").innerHTML = `<button class="btn ghost" type="button" id="mgStop">그만하고 결과 보기</button>`; $("#mgStop").addEventListener("click", () => mgQuit && mgQuit()); },
    end(score) {
      if (finished) return;
      finished = true;
      if (mgCleanup) { mgCleanup(); mgCleanup = null; }
      const st = starsFor(id, score), better = award(id, st);
      const cheer = st === 3 ? pick(["완벽해요! 이 배움터의 전설이 될 거예요!", "와, 만점! 선생님도 깜짝 놀랐어요."]) : st === 2 ? pick(["멋져요! 조금만 더 하면 별 셋!", "훌륭해요! 한 번 더 해 볼까요?"]) : st === 1 ? pick(["좋은 출발이에요!", "별 하나 획득! 연습하면 금방 늘어요."]) : pick(["괜찮아요, 처음엔 다 그래요!", "아깝다! 한 번만 더 해 봐요."]);
      $("#mgStage").innerHTML = `<div class="mg-result"><div class="stars">${"★".repeat(st)}<span>${"★".repeat(3 - st)}</span></div><p class="score">${score}${g.unit} ${better ? "· 새 기록!" : ""}</p><p>${cheer}</p></div>`;
      $("#mgActions").innerHTML = `<button class="btn ghost" type="button" id="mgAgain">다시 하기</button><button class="btn" type="button" id="mgDone">닫기</button>`;
      $("#mgAgain").addEventListener("click", () => runGame(id));
      $("#mgDone").addEventListener("click", closeModal);
      $("#mgDone").focus({ preventScroll: true });
      if (st) { Snd.star(); confetti(st * 25); }
    },
  };
  mgCleanup = MINIGAMES[id]($("#mgStage"), api);
}
$("#mgClose").addEventListener("click", () => { if (mgCleanup) { mgCleanup(); mgCleanup = null; } closeModal(); });

// ---------- 3D sports: race / penalty / climb / obby ----------
function stadiumPoint(rk, s) {
  const { cx, cz, R: Rc, half } = rk, L = 4 * half + 2 * Math.PI * Rc, arc = Math.PI * Rc;
  s = ((s % L) + L) % L;
  if (s < half) return { x: cx + Rc, z: cz - s, tx: 0, tz: -1 };
  s -= half;
  if (s < arc) { const a = s / Rc; return { x: cx + Rc * Math.cos(a), z: cz - half - Rc * Math.sin(a), tx: -Math.sin(a), tz: -Math.cos(a) }; }
  s -= arc;
  if (s < 2 * half) return { x: cx - Rc, z: cz - half + s, tx: 0, tz: 1 };
  s -= 2 * half;
  if (s < arc) { const a = Math.PI + s / Rc; return { x: cx + Rc * Math.cos(a), z: cz + half - Rc * Math.sin(a), tx: -Math.sin(a), tz: -Math.cos(a) }; }
  s -= arc;
  return { x: cx + Rc, z: cz + half - s, tx: 0, tz: -1 };
}
const sportUI = $("#sport");
const showMarkers = (on) => { for (const m of S.cur.markers || []) m.visible = on; };
function sportMsg(html, big) { $("#roomCard").classList.add("out"); $("#spMain").innerHTML = html; $("#spBig").textContent = big || ""; sportUI.hidden = false; }
function startRace() {
  const rk = S.cur.special.rink;
  if (!rk) return;
  endTalk();
  const L = 4 * rk.half + 2 * Math.PI * rk.R;
  const rings = [];
  for (let i = 0; i < 8; i++) {
    const p = stadiumPoint(rk, (i * L) / 8);
    const m = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.12, 8, 28), new THREE.MeshStandardMaterial({ color: "#ffd400", emissive: new THREE.Color("#806000"), transparent: true, opacity: 0.9 }));
    m.position.set(p.x, 1.5, p.z);
    m.rotation.y = Math.atan2(p.tx, p.tz);
    S.cur.group.add(m);
    rings.push({ m, p });
  }
  const gp = S.cur.npcs.find((n) => n.d.id === "grandpa");
  if (gp) { endTalk(); gp.racing = true; }
  const st = stadiumPoint(rk, 0);
  pBody.position.set(st.x, 0.08, st.z + 1.2); pBody.velocity.set(0, 0, 0);
  player.face = Math.PI; cam.yaw = 0; cam.pitch = 0.55; cam.dist = 9;
  showMarkers(false);
  S.sport = { type: "race", t: -3.5, time: 0, k: 0, L, rk, rings, rival: 0, gp, freeze: true, lastCount: 4 };
  sportMsg("롤러 레이스 · 빛나는 고리를 차례로 지나 두 바퀴!", "준비");
}
function updateRace(dt) {
  const sp = S.sport;
  if (sp.t < 0) {
    sp.t += dt;
    const c = Math.ceil(-sp.t);
    if (c !== sp.lastCount && c >= 1 && c <= 3) { sp.lastCount = c; Snd.beep(false); $("#spBig").textContent = String(c); }
    if (sp.t >= 0) { sp.freeze = false; Snd.beep(true); $("#spBig").textContent = "출발!"; setTimeout(() => { if (S.sport === sp) $("#spBig").textContent = ""; }, 700); }
  } else if (!sp.done) {
    sp.time += dt;
    sp.rival += 7.6 * dt;
    const next = (sp.k + 1) % 8, ring = sp.rings[next], p = pBody.position;
    if (Math.hypot(ring.p.x - p.x, ring.p.z - p.z) < 2.6) {
      sp.k++;
      Snd.pop();
      if (sp.k % 8 === 0 && sp.k < 16) { toast("한 바퀴 완료! 마지막 바퀴!"); Snd.ok(); }
      if (sp.k >= 16) { finishRace(); return; }
    }
    $("#spMain").innerHTML = `롤러 레이스 · <b>${Math.min(2, Math.floor(sp.k / 8) + 1)}/2바퀴</b> · <b>${sp.time.toFixed(1)}초</b>`;
    if (Math.hypot(p.x - 13.9, p.z - 37) > 30) { toast("트랙을 벗어나서 레이스를 멈췄어요."); stopSport(); return; }
  }
  sp.rings.forEach((r, i) => {
    const isNext = !sp.done && i === (sp.k + 1) % 8;
    r.m.material.opacity = isNext ? 0.95 : 0.25;
    r.m.scale.setScalar(isNext ? 1 + Math.sin(S.T * 6) * 0.06 : 0.85);
  });
  if (sp.gp) {
    const q = stadiumPoint(sp.rk, sp.rival), ox = -q.tz * 1.0, oz = q.tx * 1.0;
    sp.gp.pos.set(q.x + ox, 0, q.z + oz);
    sp.gp.face = Math.atan2(q.tx, q.tz);
    sp.gp.moving = sp.t >= 0 && !sp.done ? 1 : 0;
  }
}
function finishRace() {
  const sp = S.sport;
  sp.done = true;
  const win = sp.rival < sp.L * 2;
  const stars = win ? 3 : sp.time < 45 ? 2 : 1;
  award("race", stars);
  Snd.star(); confetti(stars * 25);
  $("#spBig").textContent = win ? "1등!" : "완주!";
  const line = win ? "쌩쌩 할아버지: 허허, 젊은 친구 제법이구먼! 내 왕관을 넘겨주마!" : "쌩쌩 할아버지: 허허, 아직 이 할아버지를 따라오긴 멀었구먼!";
  sportMsg(`${sp.time.toFixed(1)}초 · ${"★".repeat(stars)}${"☆".repeat(3 - stars)}<br><small>${line}</small>`, win ? "1등!" : "완주!");
  setTimeout(() => { if (S.sport === sp) stopSport(); }, 4200);
}
function startPenalty() {
  const g = S.cur.special.goal, ball = S.cur.special.pball;
  if (!g || !ball) return;
  endTalk();
  showMarkers(false);
  S.sport = { type: "penalty", shot: 0, goals: 0, phase: "aim", t: 0, aim: 0, power: 0, kx: g.cx, kTarget: g.cx, g, ball, keeper: S.cur.npcs.find((n) => n.d.id === "keeper"), freeze: true, judged: false };
  resetShot();
}
function resetShot() {
  const sp = S.sport, g = sp.g, b = sp.ball.body;
  b.position.set(g.cx, 0.35, g.spot); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0); b.wakeUp();
  pBody.position.set(g.cx - 0.85, 0.08, g.spot + 1.0); pBody.velocity.set(0, 0, 0);
  player.face = Math.PI - 0.5;
  sp.phase = "aim"; sp.t = 0; sp.judged = false; sp.kTarget = g.cx;
  sportMsg(`승부차기 <b>${sp.shot + 1}/5</b> · 골 <b>${sp.goals}</b><div class="bar aim"><i id="spAim"></i></div><small>지금이다 싶을 때 F (또는 F 버튼)로 조준!</small>`);
}
function sportAction() {
  const sp = S.sport;
  if (!sp || sp.type !== "penalty") return;
  if (sp.phase === "aim") {
    sp.phase = "power"; sp.t = 0; Snd.tick();
    sportMsg(`승부차기 <b>${sp.shot + 1}/5</b> · 골 <b>${sp.goals}</b><div class="bar power"><i id="spPow"></i></div><small>힘이 알맞을 때 F를 눌러 슛!</small>`);
  } else if (sp.phase === "power") {
    const g = sp.g, b = sp.ball.body, tx = g.cx + sp.aim * 1.45, ty = 0.35 + sp.power * 1.4, tz = g.z - 0.6;
    const dx = tx - b.position.x, dy = ty - b.position.y, dz = tz - b.position.z, len = Math.hypot(dx, dy, dz), spd = 12 + sp.power * 7;
    b.velocity.set((dx / len) * spd, (dy / len) * spd + 2.2 * sp.power, (dz / len) * spd);
    b.angularVelocity.set(-8, 0, 0);
    Snd.kick();
    const r = Math.random(), side = sp.aim >= 0 ? 1 : -1;
    sp.kTarget = r < 0.38 ? g.cx + side * 1.15 : r < 0.72 ? g.cx - side * 1.15 : g.cx;
    sp.phase = "fly"; sp.t = 0;
    sportMsg(`승부차기 <b>${sp.shot + 1}/5</b> · 골 <b>${sp.goals}</b>`);
  }
}
function updatePenalty(dt) {
  const sp = S.sport, g = sp.g, b = sp.ball.body, kb = S.cur.special.keeperBody;
  sp.t += dt;
  if (sp.phase === "aim") { sp.aim = Math.sin(sp.t * 2.4); const el = $("#spAim"); if (el) el.style.left = `${50 + sp.aim * 46}%`; }
  if (sp.phase === "power") { sp.power = 0.5 - Math.cos(sp.t * 3.2) * 0.5; const el = $("#spPow"); if (el) el.style.width = `${sp.power * 100}%`; }
  const prev = sp.kx;
  if (sp.phase === "fly") sp.kx += clamp(sp.kTarget - sp.kx, -6 * dt, 6 * dt);
  else sp.kx = g.cx + Math.sin(S.T * 1.7) * 0.45;
  kb.position.set(sp.kx, 0.8, g.z + 0.55);
  kb.velocity.set((sp.kx - prev) / Math.max(dt, 1e-3), 0, 0);
  if (sp.keeper) { sp.keeper.pos.set(sp.kx, 0, g.z + 0.55); sp.keeper.face = 0; sp.keeper.moving = sp.phase === "fly" ? 0.6 : 0.2; }
  if (sp.phase === "fly" && !sp.judged) {
    const goal = b.position.z < g.z - 0.1 && Math.abs(b.position.x - g.cx) < g.half - 0.08 && b.position.y < 2.0;
    const stopped = sp.t > 0.9 && b.velocity.length() < 0.6;
    if (goal || sp.t > 2.6 || stopped) {
      sp.judged = true;
      sp.shot++;
      if (goal) { sp.goals++; Snd.goal(); confetti(30); $("#spBig").textContent = "골!!!"; if (sp.keeper) say(new THREE.Vector3(sp.kx, 2.2, g.z + 0.6), pick(["으아악! 눈 감고 있었는데!", "공이 너무 빨라!", "거미손이 뚫렸다!"]), "골대지기"); }
      else { Snd.no(); $("#spBig").textContent = Math.abs(b.position.x - g.cx) > g.half + 0.3 || b.position.y > 2.2 ? "아깝다!" : "막았다!"; if (sp.keeper) say(new THREE.Vector3(sp.kx, 2.2, g.z + 0.6), pick(["순창의 거미손이 막았다!", "흐흐, 내 손은 고추장보다 끈끈하지!", "다음엔 반대쪽으로 차 봐!"]), "골대지기"); }
      setTimeout(() => {
        if (S.sport !== sp) return;
        $("#spBig").textContent = "";
        endTalk();
        if (sp.shot >= 5) {
          const stars = starsFor("penalty", sp.goals);
          award("penalty", stars);
          if (stars) { Snd.star(); confetti(stars * 25); }
          sportMsg(`승부차기 끝! 5번 중 <b>${sp.goals}골</b> · ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`, sp.goals >= 4 ? "슈퍼스타!" : "수고했어요!");
          sp.phase = "done";
          setTimeout(() => { if (S.sport === sp) stopSport(); }, 3200);
        } else resetShot();
      }, 1900);
    }
  }
}
function stopSport() {
  const sp = S.sport;
  if (!sp) return;
  if (sp.type === "race") { for (const r of sp.rings) { S.cur.group.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); } if (sp.gp) { sp.gp.racing = false; sp.gp.pos.set(sp.gp.d.pos[0], 0, sp.gp.d.pos[1]); } }
  if (sp.type === "penalty" && sp.keeper) sp.keeper.pos.set(sp.keeper.d.pos[0], 0, sp.keeper.d.pos[1]);
  S.sport = null;
  showMarkers(true);
  sportUI.hidden = true;
  $("#spBig").textContent = "";
  if (S.cur) { cam.pitch = S.cur.indoor ? 0.9 : 0.42; cam.dist = S.cur.indoor ? 10.5 : 8.5; }
}

// ---------- input ----------
const K = { up: false, down: false, left: false, right: false };
const KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
let touchMode = false;
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (S.mode === "title") { if (e.code === "Enter" && !e.repeat) { e.preventDefault(); startPlay(); } return; }
  if (S.mode !== "play") return;
  if (S.modal) {
    if (S.modal === "quiz") {
      const m = /^(?:Digit|Numpad)([1-3])$/.exec(e.code);
      if (m) { const b = $("#qOpts").children[+m[1] - 1]; if (b) pickQuiz(b); }
      if (e.code === "Escape" || (quizState?.solved && (e.code === "Enter" || e.code === "KeyF"))) { e.preventDefault(); closeModal(); }
      return;
    }
    if (S.modal === "mg") { if (e.code === "Escape" && !mgCleanup) closeModal(); return; }
    if (e.code === "Escape" || (S.modal === "map" && e.code === "KeyM")) { e.preventDefault(); closeModal(); }
    return;
  }
  const k = KEYMAP[e.code];
  if (k) { K[k] = true; e.preventDefault(); }
  if (e.code === "Space") { e.preventDefault(); if (document.activeElement && document.activeElement.tagName === "BUTTON") document.activeElement.blur(); if (S.sport && S.sport.type === "penalty") { if (!e.repeat) sportAction(); } else if (!e.repeat) player.jumpBuf = 0.15; }
  if (e.code === "KeyF" && !e.repeat) act();
  if (e.code === "Enter" && !e.repeat && S.talk) act();
  if (e.code === "KeyM" && !e.repeat) openMap();
  if ((e.code === "Escape" || e.code === "KeyP") && !e.repeat) { if (S.talk) endTalk(); else if (S.sport) { stopSport(); toast("게임을 멈췄어요."); } else openMenu(); }
});
addEventListener("keyup", (e) => { const k = KEYMAP[e.code]; if (k) K[k] = false; if (e.code === "Space" && S.mode === "play") e.preventDefault(); });
addEventListener("blur", () => { for (const k in K) K[k] = false; });

const JOY = { id: null, cx: 0, cy: 0, x: 0, y: 0, R: 52 };
const joyEl = $("#joy"), knob = joyEl.querySelector(".joy-knob");
function joyMove(e) {
  let dx = e.clientX - JOY.cx, dy = e.clientY - JOY.cy;
  const d = Math.hypot(dx, dy);
  if (d > JOY.R) { dx *= JOY.R / d; dy *= JOY.R / d; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  JOY.x = dx / JOY.R; JOY.y = dy / JOY.R;
  if (Math.hypot(JOY.x, JOY.y) < 0.14) JOY.x = JOY.y = 0;
}
function joyStartAt(e, cx, cy, moveBase) {
  JOY.id = e.pointerId; JOY.cx = cx; JOY.cy = cy;
  if (moveBase) { joyEl.style.left = cx - 65 + "px"; joyEl.style.top = cy - 65 + "px"; joyEl.style.bottom = "auto"; }
  joyMove(e);
}
function joyEnd() { JOY.id = null; JOY.x = JOY.y = 0; knob.style.transform = ""; joyEl.style.left = joyEl.style.top = joyEl.style.bottom = ""; }
joyEl.addEventListener("pointerdown", (e) => { e.preventDefault(); if (JOY.id !== null) return; const r = joyEl.getBoundingClientRect(); joyStartAt(e, r.left + r.width / 2, r.top + r.height / 2, false); });
const drag = { id: null, x: 0, y: 0 }, pinch = new Map();
const cv = renderer.domElement;
cv.addEventListener("contextmenu", (e) => e.preventDefault());
cv.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch" && !touchMode) setTouch(true);
  if (S.mode !== "play" || S.modal) return;
  if (touchMode && e.clientX < innerWidth * 0.42 && JOY.id === null) { e.preventDefault(); joyStartAt(e, e.clientX, e.clientY, true); return; }
  pinch.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (drag.id !== null) return;
  drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY;
});
addEventListener("pointermove", (e) => {
  if (e.pointerId === JOY.id) { joyMove(e); return; }
  if (pinch.has(e.pointerId)) {
    const prev = pinch.get(e.pointerId);
    pinch.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.size === 2) { const [a, b] = [...pinch.values()], d = Math.hypot(a.x - b.x, a.y - b.y), pd = pinch.pd || d; cam.dist = clamp(cam.dist * (pd / d), 4, 16); pinch.pd = d; return; }
    void prev;
  }
  if (e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY;
  if (S.sport && S.sport.type === "penalty") return;
  cam.yaw -= dx * (e.pointerType === "touch" ? 0.008 : 0.006);
  cam.pitch = clamp(cam.pitch + dy * 0.005, 0.12, 1.3);
});
const endPtr = (e) => { if (e.pointerId === JOY.id) joyEnd(); if (e.pointerId === drag.id) drag.id = null; pinch.delete(e.pointerId); if (pinch.size < 2) pinch.pd = 0; };
addEventListener("pointerup", endPtr);
addEventListener("pointercancel", endPtr);
cv.addEventListener("wheel", (e) => { if (S.mode !== "play" || S.modal) return; e.preventDefault(); cam.dist = clamp(cam.dist * (1 + e.deltaY * 0.001), 4, 16); }, { passive: false });
function holdBtn(el, down) {
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); el.classList.add("held"); down(); });
  const up = () => el.classList.remove("held");
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("pointerleave", up);
}
holdBtn($("#tJump"), () => { if (S.sport && S.sport.type === "penalty") sportAction(); else player.jumpBuf = 0.15; });
holdBtn($("#tAct"), act);
function setTouch(on) {
  touchMode = on;
  document.body.classList.toggle("touch", on);
  $("#touchUI").hidden = !on || S.mode !== "play";
  $("#padBtn").setAttribute("aria-pressed", String(on));
  $("#padBtn").setAttribute("aria-label", on ? "터치 컨트롤러 끄기" : "터치 컨트롤러 켜기");
  if (!on) joyEnd();
}
$("#padBtn").addEventListener("click", (e) => { setTouch(!touchMode); e.currentTarget.blur(); toast(touchMode ? "컨트롤러 모드: 왼쪽 조이스틱, 오른쪽 점프·F 버튼" : "키보드 모드로 바꿨어요"); });
function syncSound() {
  $("#sndBtn").setAttribute("aria-pressed", String(Snd.on));
  $("#sndBtn").setAttribute("aria-label", Snd.on ? "소리 끄기" : "소리 켜기");
  $("#sndOn").style.display = Snd.on ? "" : "none";
  $("#sndOff").style.display = Snd.on ? "none" : "";
  $("#optSound").checked = Snd.on;
  $("#optMusic").checked = save.music !== false;
}
$("#sndBtn").addEventListener("click", (e) => { Snd.setOn(!Snd.on); save.sound = Snd.on; persist(); syncSound(); e.currentTarget.blur(); });
$("#optSound").addEventListener("change", (e) => { Snd.setOn(e.target.checked); save.sound = Snd.on; persist(); syncSound(); });
$("#optMusic").addEventListener("change", (e) => { save.music = e.target.checked; Snd.musicOn = save.music; persist(); });
$("#optPad").addEventListener("change", (e) => setTouch(e.target.checked));
$("#mapBtn").addEventListener("click", (e) => { e.currentTarget.blur(); if (S.mode === "play" && !S.modal) openMap(); });
$("#menuBtn").addEventListener("click", (e) => { e.currentTarget.blur(); if (S.mode === "play" && !S.modal) openMenu(); });
document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", (e) => { e.currentTarget.blur(); if (S.mode === "play" && !S.modal) openMenu(b.dataset.open); }));
const resetBtn = $("#resetBtn");
resetBtn.addEventListener("click", () => {
  if (!resetBtn.classList.contains("confirm")) { resetBtn.classList.add("confirm"); resetBtn.textContent = "한 번 더 누르면 기록이 모두 지워져요"; setTimeout(() => { resetBtn.classList.remove("confirm"); resetBtn.textContent = "처음부터 다시 하기"; }, 4000); return; }
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  location.reload();
});
if (matchMedia("(pointer: coarse)").matches) setTouch(true);
addEventListener("touchstart", () => { if (!touchMode) setTouch(true); }, { once: true, passive: true });
if (save.sound === false) Snd.on = false;
if (save.music === false) Snd.musicOn = false;
syncSound();

// ---------- camera ----------
const cam = { yaw: 0, pitch: 0.42, dist: 10, cur: 10, target: new THREE.Vector3() };
const ray = new THREE.Raycaster();
const _dir = new THREE.Vector3(), _des = new THREE.Vector3(), _head = new THREE.Vector3();
const fadeMat = new THREE.MeshStandardMaterial({ color: "#f4f1ea", transparent: true, opacity: 0.18, depthWrite: false });
let faded = [];
function updateCamera(dt) {
  if (S.mode !== "play") {
    const a = 0.55 * Math.sin(S.T * 0.11);
    camera.position.set(1 + Math.sin(a) * 34, 14, -6 + Math.cos(a) * 34);
    camera.lookAt(1, 5.5, -13);
    return;
  }
  const p = pBody.position;
  let tx = p.x, tz = p.z, ty = p.y + 1.15, dist = cam.dist;
  if (S.talk && S.talk.npc) {
    const n = S.talk.npc.pos, dx = n.x - p.x, dz = n.z - p.z, dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl;
    tx = (p.x + n.x) / 2; tz = (p.z + n.z) / 2; dist = Math.min(cam.dist, 6.5);
    const off = (a) => Math.abs(Math.atan2(Math.sin(a - cam.yaw), Math.cos(a - cam.yaw)));
    const [a, b] = [[-uz, ux], [uz, -ux]].map(([px, pz]) => Math.atan2(px - ux * 0.7, pz - uz * 0.7));
    cam.yaw = angDamp(cam.yaw, off(a) <= off(b) ? a : b, 2.5, dt);
  }
  if (S.sport && S.sport.type === "penalty") { const g = S.sport.g; tx = g.cx; tz = g.spot - 2.6; ty = 1.0; cam.yaw = angDamp(cam.yaw, 0.28, 6, dt); cam.pitch = damp(cam.pitch, 0.38, 6, dt); dist = 9; }
  cam.target.set(damp(cam.target.x, tx, 12, dt), damp(cam.target.y, ty, 7, dt), damp(cam.target.z, tz, 12, dt));
  const cp = Math.cos(cam.pitch);
  _des.set(cam.target.x + Math.sin(cam.yaw) * cp * dist, cam.target.y + Math.sin(cam.pitch) * dist, cam.target.z + Math.cos(cam.yaw) * cp * dist);
  _dir.subVectors(_des, cam.target);
  const len = _dir.length();
  _dir.divideScalar(len);
  let want = len;
  if (!S.cur.indoor) {
    ray.set(cam.target, _dir); ray.far = len;
    const hit = ray.intersectObjects(S.cur.occ, false)[0];
    if (hit) want = Math.max(1.4, hit.distance - 0.4);
  }
  cam.cur = want < cam.cur ? want : damp(cam.cur, want, 4, dt);
  camera.position.copy(cam.target).addScaledVector(_dir, cam.cur);
  if (camera.position.y < 0.5) camera.position.y = 0.5;
  camera.lookAt(cam.target);
  // indoor: walls between the camera and the player turn see-through
  for (const m of faded) m.material = m.userData.orig;
  faded = [];
  if (S.cur.indoor) {
    for (const hy of [0.4, 1.2]) {
      _head.set(p.x, p.y + hy, p.z);
      _dir.subVectors(_head, camera.position);
      const d = _dir.length();
      ray.set(camera.position, _dir.divideScalar(d)); ray.far = d;
      for (const h of ray.intersectObjects(S.cur.fade, false)) { const m = h.object; if (!m.userData.orig) m.userData.orig = m.material; if (m.material !== fadeMat) { m.material = fadeMat; faded.push(m); } }
    }
  }
}

// ---------- player ----------
const _from = new CANNON.Vec3(), _to = new CANNON.Vec3(), _rr = new CANNON.RaycastResult();
const RAY_OFF = [[0, 0], [0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2]];
function onGround() {
  const p = pBody.position;
  for (const [ox, oz] of RAY_OFF) {
    _from.set(p.x + ox, p.y + 0.5, p.z + oz); _to.set(p.x + ox, p.y - 0.1, p.z + oz);
    _rr.reset();
    world.raycastClosest(_from, _to, { collisionFilterMask: 1, skipBackfaces: true }, _rr);
    if (_rr.hasHit) return true;
  }
  return false;
}
function controlPlayer(dt, active) {
  const racing = S.sport && S.sport.type === "race";
  const SPEED = racing ? 10.5 : 5.6;
  const g = onGround() && pBody.velocity.y < 2.5;
  player.grounded = g;
  player.coyote = g ? 0.12 : player.coyote - dt;
  player.jumpBuf -= dt;
  let ix = 0, iz = 0;
  if (active) {
    ix = (K.right ? 1 : 0) - (K.left ? 1 : 0) + JOY.x;
    iz = (K.down ? 1 : 0) - (K.up ? 1 : 0) + JOY.y;
    const l = Math.hypot(ix, iz);
    if (l > 1) { ix /= l; iz /= l; }
  }
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
  const dx = rx * ix - fx * iz, dz = rz * ix - fz * iz;
  const k = g ? (racing ? 5 : 14) : 4;
  pBody.velocity.x = damp(pBody.velocity.x, dx * SPEED, k, dt);
  pBody.velocity.z = damp(pBody.velocity.z, dz * SPEED, k, dt);
  if (Math.hypot(dx, dz) > 0.08) player.face = angDamp(player.face, Math.atan2(dx, dz), 12, dt);
  else if (S.talk && S.talk.npc) player.face = angDamp(player.face, Math.atan2(S.talk.npc.pos.x - pBody.position.x, S.talk.npc.pos.z - pBody.position.z), 8, dt);
  if (active && player.jumpBuf > 0 && player.coyote > 0) { pBody.velocity.y = 10.5; player.jumpBuf = 0; player.coyote = 0; Snd.jump(); }
  player.moveAmt = damp(player.moveAmt, Math.min(1, Math.hypot(pBody.velocity.x, pBody.velocity.z) / 5.6), 10, dt);
}

// ---------- NPCs ----------
const _tmp = new THREE.Vector3();
function updateNPCs(dt) {
  const p = pBody.position;
  for (const n of S.cur.npcs) {
    const dP = Math.hypot(p.x - n.pos.x, p.z - n.pos.z);
    if (n.racing || (S.sport && S.sport.keeper === n)) { /* moved by the minigame */ }
    else if (n.talking) { n.face = angDamp(n.face, Math.atan2(p.x - n.pos.x, p.z - n.pos.z), 8, dt); n.moving = damp(n.moving, 0, 8, dt); }
    else if (n.still) { n.moving = damp(n.moving, 0, 8, dt); if (dP < 4 && !n.d.blank && !n.d.pose) n.face = angDamp(n.face, Math.atan2(p.x - n.pos.x, p.z - n.pos.z), 3, dt); }
    else {
      const a = n.area;
      if (n.d.animal === "dog" && dP < 6 && dP > 1.6 && S.mode === "play") { n.target = new THREE.Vector3(clamp(p.x - ((p.x - n.pos.x) / dP) * 1.4, a[0], a[1]), 0, clamp(p.z - ((p.z - n.pos.z) / dP) * 1.4, a[2], a[3])); n.wait = 0; }
      if (n.wait > 0) { n.wait -= dt; n.moving = damp(n.moving, 0, 8, dt); if (n.wait <= 0) n.target = new THREE.Vector3(a[0] + Math.random() * (a[1] - a[0]), 0, a[2] + Math.random() * (a[3] - a[2])); }
      else if (n.target) {
        _tmp.subVectors(n.target, n.pos); _tmp.y = 0;
        const d = _tmp.length();
        if (d < 0.25) { n.target = null; n.wait = n.d.animal ? 0.6 + Math.random() : 1.8 + Math.random() * 3; }
        else if (dP > 1.1) { _tmp.divideScalar(d); const spd = n.d.animal ? 2.6 : 1.4; n.pos.addScaledVector(_tmp, Math.min(d, spd * dt)); n.face = angDamp(n.face, Math.atan2(_tmp.x, _tmp.z), 8, dt); n.moving = damp(n.moving, n.d.animal ? 1 : 0.75, 8, dt); }
        else n.moving = damp(n.moving, 0, 8, dt);
      } else n.wait = 1;
    }
    const rad = n.d.animal ? 0.55 : 0.72;
    if (dP < rad && dP > 0.001 && Math.abs(p.y - n.pos.y) < 1.5) { const push = (rad - dP) / dP; pBody.position.x += (p.x - n.pos.x) * push; pBody.position.z += (p.z - n.pos.z) * push; }
    n.avatar.position.copy(n.pos);
    n.avatar.rotation.y = n.face;
    B.animateAvatar(n.avatar, S.T + n.phase, n.moving, false, dt);
  }
}

// ---------- overlays ----------
const _v = new THREE.Vector3();
function placeEl(el, x, y, z, maxD = 30) {
  _v.set(x, y, z).project(camera);
  const vis = _v.z < 1 && Math.abs(_v.x) < 1.15 && Math.abs(_v.y) < 1.15 && camera.position.distanceTo(_tmp.set(x, y, z)) < maxD;
  el.style.opacity = vis ? 1 : 0;
  if (vis) el.style.transform = `translate(${(_v.x * 0.5 + 0.5) * innerWidth}px, ${(-_v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -100%)`;
}
function updateOverlays() {
  const play = S.mode === "play" && !S.busy;
  for (const n of S.cur.npcs) { if (!play || S.modal) { n.tag.style.opacity = 0; continue; } placeEl(n.tag, n.pos.x, n.pos.y + n.avatar.userData.height + 0.15, n.pos.z, 26); }
  if (S.talk) {
    const a = S.talk.anchor();
    placeEl($("#bubble"), a.x, a.y, a.z, 60);
    if (S.talk.npc || S.talk.gag) { const p = pBody.position; if (Math.hypot(p.x - a.x, p.z - a.z) > 5) endTalk(); }
  }
  let text = null;
  if (play && !S.modal) {
    if (S.sport) text = S.sport.type === "penalty" && (S.sport.phase === "aim" || S.sport.phase === "power") ? (S.sport.phase === "aim" ? "조준 고정" : "슛!") : null;
    else if (S.talk) text = S.typing ? "말 다 듣기" : S.talk.i >= S.talk.lines.length - 1 ? "닫기" : "다음 이야기";
    else { const it = findInteract(); if (it) text = `${it.label} · ${it.verb}`; }
  }
  $("#prompt").hidden = !text;
  if (text && $("#promptText").textContent !== text) $("#promptText").textContent = text;
  $("#tAct").classList.toggle("ready", !!text);
}

// ---------- triggers ----------
function triggers(dt) {
  const ctx = S.cur, p = pBody.position;
  S.legoCD -= dt; S.bellCD -= dt;
  if (ctx.legoRect && S.legoCD <= 0 && player.moveAmt > 0.3 && player.grounded) {
    const [x0, x1, z0, z1] = ctx.legoRect;
    if (p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1 && Math.random() < dt * 1.2) {
      S.legoCD = 9; Snd.ouch(); pBody.velocity.y = 6.5;
      startTalk({ name: playerName(), lines: [pick(LEGO_LINES)], anchor: () => _anchor.set(pBody.position.x, pBody.position.y + 2.1, pBody.position.z), gag: true });
    }
  }
  const bell = ctx.special.bell;
  if (bell && S.bellCD <= 0 && Math.hypot(p.x - bell.x, p.z - bell.z) < 1.6 && Math.abs(p.y - bell.y) < 1.2) {
    S.bellCD = 6; Snd.bell(); confetti(60);
    const better = award("climb", 1);
    toast(better ? "딩동댕! 꼭대기 종을 울렸어요. 별 획득!" : "딩동댕! 또 올라왔네요. 대단해요!", 3600);
  }
  const star = ctx.special.star;
  if (star && star.visible && Math.hypot(p.x - star.position.x, p.z - star.position.z) < 1.3 && Math.abs(p.y + 0.9 - star.position.y) < 1.4) {
    star.visible = false; Snd.star(); confetti(50);
    award("obby", 1);
    toast("점프 블록 꼭대기의 별을 얻었어요!", 3200);
  }
  if (S.invisT > 0) { S.invisT -= dt; if (S.invisT <= 0) { setInvisible(false); toast("짠! 다시 보여요."); } }
  // 워프 발판: 한 번 벗어났다가 다시 밟으면 층 이동 창이 열려요
  if (ctx.warps && ctx.warps.length && !S.modal && !S.busy && !S.talk && !S.sport) {
    let best = null, bd = Infinity;
    for (const w of ctx.warps) { const d = Math.hypot(p.x - w.x, p.z - w.z); if (d < bd) { bd = d; best = w; } }
    if (bd > 1.9) S.warpArmed = true;
    else if (S.warpArmed && bd < 0.8 && player.grounded) { S.warpArmed = false; Snd.whoosh(); openElevator(best.label); }
  }
}

// ---------- title & flow ----------
function renderTitle() {
  $("#nameInput").value = save.name || "";
  $("#shirts").innerHTML = SHIRTS.map((c, i) => `<button type="button" class="swatch" data-i="${i}" style="--c:${c}" aria-pressed="${i === save.shirt}" aria-label="옷 색 ${i + 1}"></button>`).join("");
  $("#hats").innerHTML = ["none", "cap", "bow", "headphones"].map((h) => `<button type="button" data-h="${h}" aria-pressed="${h === save.hat}">${HATS[h]}</button>`).join("");
  $("#shirts").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { save.shirt = +b.dataset.i; persist(); buildPlayer(); renderTitle(); }));
  $("#hats").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { save.hat = b.dataset.h; persist(); buildPlayer(); renderTitle(); }));
  const has = save.rooms.length > 0;
  $("#startBtn").textContent = has ? "이어서 탐험하기" : "탐험 시작!";
  $("#progressNote").hidden = !has;
  $("#progressNote").textContent = has ? `지난번 기록: 공간 ${save.rooms.filter((id) => dexById[id]).length}/${DEX.length} · 퀴즈 ${save.quizzes.length}/${QUIZ_TOTAL} · 별 ${starCount()}/${STAR_TOTAL}` : "";
}
$("#nameInput").addEventListener("input", (e) => { save.name = e.target.value.slice(0, 10); persist(); });
async function startPlay() {
  if (S.mode !== "title") return;
  Snd.init();
  if (!Snd.on) Snd.setOn(false);
  S.mode = "play";
  $("#title").hidden = true;
  $("#hud").hidden = false;
  $("#touchUI").hidden = !touchMode;
  updateHUD();
  const resume = save.scene && (save.scene === "outdoor" || SCENES[save.scene]) && save.rooms.length;
  if (resume && save.scene !== "outdoor") await enterScene(save.scene, save.spawn || "elevator");
  else { banner("창의교육마당"); if (S.sceneId !== "outdoor") await enterScene("outdoor", "start"); else { const s = OUTDOOR.spawns.start; pBody.position.set(s.x, 0.08, s.z); player.face = s.face; cam.yaw = s.face + Math.PI; cam.target.set(s.x, 1.15, s.z); } }
  toast(touchMode ? "왼쪽 조이스틱으로 움직이고, F 버튼으로 말을 걸어요!" : "방향키로 움직이고, Space 점프, F로 말을 걸어요!", 4200);
}
$("#startBtn").addEventListener("click", startPlay);

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  S.T += dt;
  Snd.musicTick();
  const active = S.mode === "play" && !S.modal && !S.busy && !(S.sport && S.sport.freeze);
  controlPlayer(dt, active);
  world.step(1 / 60, dt, 5);
  if (pBody.position.y < -6) respawn();
  for (const d of S.cur.dyn) { d.mesh.position.copy(d.body.position); d.mesh.quaternion.copy(d.body.quaternion); if (d.body.position.y < -5) { d.body.position.copy(d.start); d.body.velocity.set(0, 0, 0); } }
  if (S.sport) { if (S.sport.type === "race") updateRace(dt); else if (S.sport.type === "penalty") updatePenalty(dt); }
  updateNPCs(dt);
  if (S.mode === "play") triggers(dt);
  const p = pBody.position;
  player.avatar.position.set(p.x, p.y, p.z);
  player.avatar.rotation.y = player.face;
  player.avatar.userData.dance = false;
  B.animateAvatar(player.avatar, S.T, player.moveAmt, !player.grounded, dt);
  S.roomCheck -= dt;
  if (S.mode === "play" && S.roomCheck <= 0 && !S.busy) {
    S.roomCheck = 0.15;
    const r = roomAt(p.x, p.z);
    if (r !== S.room) { S.room = r; updateLocation(); if (r && !r.noDex) discover(r); }
  }
  for (const f of S.cur.anim) f(S.T, dt);
  updateCamera(dt);
  sun.position.set(p.x + 24, p.y + 42, p.z + 18);
  sun.target.position.set(p.x, p.y, p.z);
  sky.position.copy(camera.position);
  updateOverlays();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
addEventListener("resize", () => { fitFov(); renderer.setSize(innerWidth, innerHeight); });

await enterScene("outdoor", "start", true);
fadeEl.classList.remove("on");
S.mode = "title";
renderTitle();
$("#title").hidden = false;
$("#loading").classList.add("done");
requestAnimationFrame((t) => { last = t; frame(t); });
window.__game = { S, save, pBody, cam, enterScene, act, openQuiz, startGame, startRace, startPenalty, getScene, DEX, player, world, renderer };
