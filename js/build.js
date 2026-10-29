// 3D 세상 만들기: 재질·텍스처, 블록 캐릭터, 층별 실내(벽은 평면도에서 자동 생성), 바깥 마당
let THREE, CANNON, maxAniso = 4;
export function initBuild(T, C, renderer) {
  THREE = T; CANNON = C;
  maxAniso = renderer.capabilities.getMaxAnisotropy();
}

// ---------- small utils ----------
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shade(hex, amt) { const c = new THREE.Color(hex), h = {}; c.getHSL(h); c.setHSL(h.h, h.s, clamp(h.l + amt, 0, 1)); return "#" + c.getHexString(); }

const matCache = new Map();
export function mat(color, opts) {
  if (!opts && matCache.has(color)) return matCache.get(color);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0, ...(opts || {}) });
  if (!opts) matCache.set(color, m);
  return m;
}
const geoCache = new Map();
function boxGeo(w, h, d) {
  const k = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(k);
}
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const FONT = '"SunchangJua", sans-serif'; // 게임 글씨는 모두 fonts/jua.woff2 하나로 그려요
function fitText(x, text, size, maxW) {
  x.font = `${size}px ${FONT}`;
  const w = x.measureText(text).width;
  if (w > maxW) { size = Math.floor(size * maxW / w); x.font = `${size}px ${FONT}`; }
  return size;
}
export function studTex(base, rep) {
  return canvasTex(64, 64, (x) => {
    x.fillStyle = base; x.fillRect(0, 0, 64, 64);
    x.fillStyle = shade(base, -0.07); x.beginPath(); x.arc(34, 34, 17, 0, 7); x.fill();
    x.fillStyle = shade(base, 0.08); x.beginPath(); x.arc(30, 30, 17, 0, 7); x.fill();
    x.fillStyle = base; x.beginPath(); x.arc(32, 32, 15, 0, 7); x.fill();
  }, rep);
}
function tileTex(colors, grout, rep, seed = 9) {
  const r = rng(seed);
  return canvasTex(256, 256, (x) => {
    x.fillStyle = grout; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = colors[Math.floor(r() * colors.length)]; x.fillRect(i * 64 + 3, j * 64 + 3, 58, 58); }
  }, rep);
}
function plankTex(base, rep) {
  const r = rng(4);
  return canvasTex(256, 256, (x) => {
    for (let i = 0; i < 8; i++) {
      x.fillStyle = shade(base, (r() - 0.5) * 0.06);
      x.fillRect(0, i * 32, 256, 32);
      x.fillStyle = shade(base, -0.12);
      x.fillRect(0, i * 32, 256, 2);
      x.fillRect(Math.floor(r() * 256), i * 32, 2, 32);
    }
  }, rep);
}
function windowTex(frame, glass) {
  return canvasTex(128, 128, (x) => {
    x.fillStyle = frame; x.fillRect(0, 0, 128, 128);
    const g = x.createLinearGradient(0, 0, 128, 128);
    g.addColorStop(0, shade(glass, 0.12)); g.addColorStop(0.55, glass); g.addColorStop(1, shade(glass, -0.1));
    x.fillStyle = g; x.fillRect(8, 8, 52, 112); x.fillRect(68, 8, 52, 112);
    x.fillStyle = "rgba(255,255,255,.5)"; x.fillRect(16, 16, 7, 44); x.fillRect(76, 16, 7, 44);
  });
}
function signTex(text, bg, fg, w, h, sub) {
  return canvasTex(w, h, (x) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
    fitText(x, text, Math.round(h * (sub ? 0.5 : 0.62)), w * 0.92);
    x.fillText(text, w / 2, sub ? h * 0.4 : h * 0.54);
    if (sub) { x.globalAlpha = 0.85; x.font = `${Math.round(h * 0.2)}px ${FONT}`; x.fillText(sub, w / 2, h * 0.79); x.globalAlpha = 1; }
  });
}
function iconTex(bg, glyph, fg = "#ffffff") {
  return canvasTex(128, 128, (x) => {
    x.fillStyle = bg; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = shade(bg, -0.2); x.lineWidth = 8; x.strokeRect(4, 4, 120, 120);
    x.fillStyle = fg; x.font = `88px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(glyph, 64, 70);
  });
}
function faceTex(skin, blank) {
  return canvasTex(256, 128, (x) => {
    x.fillStyle = skin; x.fillRect(0, 0, 256, 128);
    if (blank) return;
    x.fillStyle = "#1b1b1b";
    for (const ex of [116, 140]) { x.beginPath(); x.ellipse(ex, 54, 5, 10, 0, 0, 7); x.fill(); }
    x.strokeStyle = "#1b1b1b"; x.lineWidth = 5; x.lineCap = "round";
    x.beginPath(); x.arc(128, 62, 19, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke();
  });
}
export function signSprite(text, color = "#26355e", scale = 1) {
  const c = document.createElement("canvas"), x = c.getContext("2d");
  c.width = 512; c.height = 128;
  x.font = `64px ${FONT}`;
  const tw = Math.min(470, x.measureText(text).width + 56);
  const left = (512 - tw) / 2;
  x.fillStyle = color;
  x.beginPath();
  if (x.roundRect) x.roundRect(left, 14, tw, 100, 26); else x.rect(left, 14, tw, 100);
  x.fill();
  x.lineWidth = 6; x.strokeStyle = "rgba(0,0,0,.35)"; x.stroke();
  x.fillStyle = "#ffffff"; x.textAlign = "center"; x.textBaseline = "middle";
  fitText(x, text, 64, tw - 40);
  x.fillText(text, 256, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(4 * scale, 1 * scale, 1);
  s.renderOrder = 5;
  return s;
}

// ---------- scene context ----------
function newCtx() {
  return { group: new THREE.Group(), bodies: [], fade: [], occ: [], interact: [], dyn: [], anim: [], rooms: [], quizBlocks: {}, keep: [], zones: [], special: {} };
}
export function staticBody(ctx, cx, cy, cz, w, h, d, ry = 0, mat0) {
  const b = new CANNON.Body({ mass: 0, material: mat0 || ctx.groundMat, shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)) });
  b.position.set(cx, cy, cz);
  if (ry) b.quaternion.setFromEuler(0, ry, 0);
  b.updateAABB(); // 경계 상자는 만들 때 원점 기준으로 잡혀서, 옮긴 뒤 다시 계산해야 발밑 검사 광선이 찾을 수 있어요
  ctx.bodies.push(b);
  return b;
}
// box placed by its bottom (y = floor level of the box)
function bx(ctx, w, h, d, color, x, y, z, o = {}) {
  const m = new THREE.Mesh(boxGeo(w, h, d), typeof color === "string" ? mat(color) : color);
  m.position.set(x, y + h / 2, z);
  if (o.ry) m.rotation.y = o.ry;
  m.castShadow = o.shadow !== false;
  m.receiveShadow = true;
  (o.parent || ctx.group).add(m);
  if (o.solid) staticBody(ctx, x, y + Math.max(h, o.minH || 0) / 2, z, o.ry && Math.abs(Math.sin(o.ry)) > 0.5 ? d : w, Math.max(h, o.minH || 0), o.ry && Math.abs(Math.sin(o.ry)) > 0.5 ? w : d);
  return m;
}
function cyl(ctx, r, h, color, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg || 14), typeof color === "string" ? mat(color) : color);
  m.position.set(x, y + h / 2, z);
  m.castShadow = o.shadow !== false;
  m.receiveShadow = true;
  (o.parent || ctx.group).add(m);
  if (o.solid) staticBody(ctx, x, y + h / 2, z, r * 2, h, r * 2);
  return m;
}
// furniture item: built facing +z in local space, placed at (x, z) with rotation rot (multiples of PI/2)
function item(ctx, x, z, rot, fn, y = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rot;
  ctx.group.add(g);
  const c = Math.round(Math.cos(rot)), s = Math.round(Math.sin(rot));
  const add = (w, h, d, color, lx, ly, lz, solid) => {
    const m = bx(ctx, w, h, d, color, lx, ly, lz, { parent: g });
    if (solid) {
      const wx = x + lx * c + lz * s, wz = z - lx * s + lz * c;
      const swap = Math.abs(s) === 1;
      staticBody(ctx, wx, y + ly + h / 2, wz, swap ? d : w, h, swap ? w : d);
    }
    return m;
  };
  const addCyl = (r, h, color, lx, ly, lz, o = {}) => cyl(ctx, r, h, color, lx, ly, lz, { ...o, parent: g });
  const addSolid = (w, h, d, lx, ly, lz) => { const swap = Math.abs(s) === 1; staticBody(ctx, x + lx * c + lz * s, y + ly + h / 2, z - lx * s + lz * c, swap ? d : w, h, swap ? w : d); };
  fn(g, add, addCyl, addSolid);
  return g;
}
const blocked = (ctx, x, z, r) => ctx.keep.some((k) => Math.hypot(k.x - x, k.z - z) < k.r + r);

// ---------- block avatar ----------
// 블록 캐릭터는 2.15m로 만들고 0.75배로 줄여 실제 사람 키(약 1.6m)에 맞춰요. 그래야 설계도 크기의 방이 실제처럼 느껴져요.
export const AV_SCALE = 0.75;
export function makeAvatar(o) {
  const g = new THREE.Group();
  const skin = mat(o.skin), shirt = mat(o.shirt), pants = mat(o.pants), hair = mat(o.hair || "#333");
  const torso = bx({ group: g }, 0.72, 0.72, 0.36, shirt, 0, 0.72, 0, { parent: g });
  const headMats = [new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.45, map: faceTex(o.skin, o.blank) }), skin, skin];
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.44, 24), headMats);
  head.position.y = 1.69; head.rotation.y = Math.PI; head.castShadow = true;
  g.add(head);
  const limbs = {};
  for (const [name, x, y, m] of [["armL", -0.54, 1.44, skin], ["armR", 0.54, 1.44, skin], ["legL", -0.18, 0.72, pants], ["legR", 0.18, 0.72, pants]]) {
    const piv = new THREE.Group();
    piv.position.set(x, y, 0);
    bx({ group: piv }, 0.36, 0.72, 0.36, m, 0, -0.72, 0, { parent: piv });
    if (name.startsWith("arm")) bx({ group: piv }, 0.38, 0.26, 0.38, shirt, 0, -0.26, 0, { parent: piv });
    if (name.startsWith("arm") && o.gloves) bx({ group: piv }, 0.46, 0.3, 0.46, "#22c55e", 0, -0.86, 0, { parent: piv });
    g.add(piv);
    limbs[name] = piv;
  }
  const hatG = new THREE.Group();
  g.add(hatG);
  g.userData = { kind: "block", limbs, height: 2.15 * AV_SCALE, hair, hatG, torso, look: o };
  setHat(g, o.hat || "none", o.hatColor);
  g.scale.setScalar(AV_SCALE);
  return g;
}
export function setHat(av, hat, color = "#ffc93c") {
  const { hatG, hair } = av.userData;
  while (hatG.children.length) hatG.remove(hatG.children[0]);
  const p = { group: hatG, parent: hatG };
  const B = (w, h, d, c, x, y, z) => bx(p, w, h, d, c, x, y, z, { parent: hatG });
  const blank = av.userData.look.blank;
  if (!blank && !["chef", "helmet", "antenna"].includes(hat)) { B(0.56, 0.12, 0.56, hair, 0, 1.89, 0); B(0.56, 0.32, 0.12, hair, 0, 1.6, -0.23); }
  if (hat === "cap") { B(0.6, 0.16, 0.6, mat(color), 0, 1.98, 0); B(0.5, 0.06, 0.26, mat(color), 0, 1.96, 0.4); }
  if (hat === "bow") { const b = mat(color); B(0.16, 0.14, 0.08, b, -0.14, 1.99, -0.1); B(0.16, 0.14, 0.08, b, 0.14, 1.99, -0.1); B(0.1, 0.1, 0.1, b, 0, 2.0, -0.1); }
  if (hat === "bun") B(0.24, 0.2, 0.24, hair, 0, 2.01, -0.1);
  if (hat === "headphones") { const c = mat(color); B(0.62, 0.07, 0.12, c, 0, 2.0, 0); B(0.12, 0.26, 0.24, c, -0.31, 1.58, 0); B(0.12, 0.26, 0.24, c, 0.31, 1.58, 0); }
  if (hat === "crown") { const c = mat("#ffd400", { emissive: new THREE.Color("#7a5a00") }); B(0.56, 0.14, 0.56, c, 0, 2.0, 0); for (const [x, z] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22], [0, 0.24], [0, -0.24]]) B(0.1, 0.18, 0.1, c, x, 2.13, z); B(0.08, 0.08, 0.04, "#ff4747", 0, 2.07, 0.29); }
  if (hat === "party") { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 4), mat("#ff4fa3")); cone.position.y = 2.29; cone.rotation.y = Math.PI / 4; cone.castShadow = true; hatG.add(cone); B(0.1, 0.1, 0.1, "#ffd400", 0, 2.56, 0); }
  if (hat === "chef") { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.34, 16), mat("#ffffff")); c.position.y = 2.08; hatG.add(c); const s = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 10), mat("#ffffff")); s.position.y = 2.32; s.scale.y = 0.6; hatG.add(s); }
  if (hat === "pirate") { B(0.78, 0.08, 0.42, "#1f1f1f", 0, 1.94, 0); B(0.5, 0.22, 0.3, "#1f1f1f", 0, 2.0, 0); B(0.1, 0.1, 0.02, "#ffffff", 0, 2.06, 0.16); B(0.3, 0.06, 0.02, "#1f1f1f", 0.06, 1.73, 0.27); }
  if (hat === "banana") { const tor = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.08, 6, 12, Math.PI * 0.9), mat("#ffe135")); tor.position.set(0, 2.0, 0); tor.rotation.set(0, Math.PI / 2, Math.PI * 0.05); tor.castShadow = true; hatG.add(tor); B(0.06, 0.08, 0.06, "#6b4f1d", 0, 2.24, 0.02); }
  if (hat === "antenna") { B(0.04, 0.32, 0.04, "#7a8699", 0, 1.91, 0); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat("#ff4747", { emissive: new THREE.Color("#ff2020") })); ball.position.y = 2.27; hatG.add(ball); }
  if (hat === "goggles") { B(0.56, 0.06, 0.56, "#333", 0, 1.83, 0); B(0.14, 0.12, 0.06, "#6fd3ff", -0.1, 1.82, 0.27); B(0.14, 0.12, 0.06, "#6fd3ff", 0.1, 1.82, 0.27); }
  if (hat === "helmet") { B(0.62, 0.24, 0.62, mat(color), 0, 1.86, 0); B(0.5, 0.06, 0.2, mat(color), 0, 1.86, 0.36); }
  if (hat === "headband") { B(0.55, 0.08, 0.55, mat(color), 0, 1.8, 0); }
  av.userData.hat = hat;
}
// 롤러스케이트: 다리 끝에 신발과 바퀴를 달아요. 신은 동안은 캐릭터를 SKATE_LIFT만큼 띄워야 바퀴가 바닥에 닿아요.
export const SKATE_LIFT = 0.2 * AV_SCALE;
export function setSkates(av, on, color = "#ff4fa3") {
  const u = av.userData;
  if (!!u.skates === on) return;
  if (!on) { for (const g of u.skates) g.parent.remove(g); u.skates = null; return; }
  u.skates = [];
  for (const name of ["legL", "legR"]) {
    const g = new THREE.Group(); g.position.set(0, -0.72, 0);
    const P = { group: g };
    bx(P, 0.44, 0.26, 0.52, color, 0, -0.02, 0.06, { parent: g });
    bx(P, 0.46, 0.06, 0.08, "#ffffff", 0, 0.2, 0.06, { parent: g });
    bx(P, 0.32, 0.05, 0.6, "#cbd5e1", 0, -0.08, 0.06, { parent: g });
    bx(P, 0.14, 0.1, 0.1, "#ef4444", 0, -0.12, 0.38, { parent: g });
    for (const z of [-0.14, 0.26]) for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12), mat("#ffd400"));
      w.rotation.z = Math.PI / 2; w.position.set(sx * 0.15, -0.12, z); w.castShadow = true; g.add(w);
    }
    u.limbs[name].add(g);
    u.skates.push(g);
  }
}
export function makeAnimal(kind = "dog", pose) {
  const g = new THREE.Group(), cat = kind === "cat";
  const fur = mat(cat ? "#f2a65a" : "#d9a066"), dark = mat("#3a2a1e"), white = mat("#fff4e0");
  const s = cat ? 0.8 : 1;
  const body = new THREE.Group(); g.add(body);
  const P = { group: body };
  const sleep = pose === "sleep";
  bx(P, 0.42 * s, 0.34 * s, 0.72 * s, fur, 0, sleep ? 0.02 : 0.34 * s, 0, { parent: body });
  const head = new THREE.Group(); head.position.set(0, sleep ? 0.22 : 0.64 * s, 0.42 * s); body.add(head);
  const H = { group: head };
  bx(H, 0.4 * s, 0.34 * s, 0.34 * s, fur, 0, -0.17 * s, 0, { parent: head });
  bx(H, 0.22 * s, 0.14 * s, 0.14 * s, white, 0, -0.2 * s, 0.22 * s, { parent: head });
  bx(H, 0.08 * s, 0.06 * s, 0.05 * s, dark, 0, -0.12 * s, 0.3 * s, { parent: head });
  for (const sx of [-1, 1]) {
    bx(H, 0.07 * s, sleep ? 0.02 : 0.08 * s, 0.02, dark, sx * 0.1 * s, -0.03 * s, 0.175 * s, { parent: head, shadow: false });
    if (cat) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), fur); ear.position.set(sx * 0.13 * s, 0.2 * s, 0); ear.rotation.y = Math.PI / 4; head.add(ear); }
    else bx(H, 0.1, 0.18, 0.06, dark, sx * 0.15, 0.02, -0.02, { parent: head });
  }
  const legs = [];
  if (!sleep) for (const [x, z] of [[-0.13, 0.24], [0.13, 0.24], [-0.13, -0.24], [0.13, -0.24]]) { const p = new THREE.Group(); p.position.set(x * s, 0.34 * s, z * s); bx({ group: p }, 0.12 * s, 0.34 * s, 0.12 * s, fur, 0, -0.34 * s, 0, { parent: p }); body.add(p); legs.push(p); }
  const tail = new THREE.Group(); tail.position.set(0, (sleep ? 0.2 : 0.62) * s, -0.36 * s); tail.rotation.x = cat ? -0.9 : 0.7;
  bx({ group: tail }, 0.08, 0.08, 0.34, fur, 0, -0.04, -0.15, { parent: tail }); body.add(tail);
  g.userData = { kind: "animal", legs, tail, body, height: (sleep ? 0.75 : 1.1 * s) * 0.8 };
  g.scale.setScalar(0.8);
  return g;
}
export function animateAvatar(av, t, mv, air, dt) {
  const u = av.userData;
  if (u.kind === "animal") {
    const s = Math.sin(t * 15) * 0.75 * mv;
    if (u.legs.length) { u.legs[0].rotation.x = s; u.legs[3].rotation.x = s; u.legs[1].rotation.x = -s; u.legs[2].rotation.x = -s; }
    u.tail.rotation.y = Math.sin(t * (mv > 0.1 ? 20 : 6)) * 0.6;
    u.body.position.y = Math.abs(Math.sin(t * 15)) * 0.05 * mv;
    return;
  }
  const L = u.limbs, sw = Math.sin(t * 9.5) * 0.95 * mv;
  if (u.skates && !air) {
    // 스케이트 타기: 다리를 번갈아 옆뒤로 밀고, 팔은 크게 흔들어요
    const ph = t * 5.5, push = Math.max(0, Math.sin(ph)) * mv, push2 = Math.max(0, -Math.sin(ph)) * mv;
    L.legL.rotation.z = damp(L.legL.rotation.z, -push * 0.45, 14, dt); L.legR.rotation.z = damp(L.legR.rotation.z, push2 * 0.45, 14, dt);
    L.legL.rotation.x = damp(L.legL.rotation.x, push * 0.35, 14, dt); L.legR.rotation.x = damp(L.legR.rotation.x, push2 * 0.35, 14, dt);
    L.armL.rotation.x = damp(L.armL.rotation.x, Math.sin(ph) * 0.9 * mv, 12, dt); L.armR.rotation.x = damp(L.armR.rotation.x, -Math.sin(ph) * 0.9 * mv, 12, dt);
    return;
  }
  L.legL.rotation.z = damp(L.legL.rotation.z, 0, 14, dt); L.legR.rotation.z = damp(L.legR.rotation.z, 0, 14, dt);
  const tg = air ? [-2.9, -2.9, 0.3, -0.3] : u.dance ? [-2.6 + Math.sin(t * 8) * 0.5, -0.4 - Math.sin(t * 8) * 0.5, Math.sin(t * 8) * 0.4, -Math.sin(t * 8) * 0.4] : [sw, -sw, -sw, sw];
  L.armL.rotation.x = damp(L.armL.rotation.x, tg[0], 18, dt);
  L.armR.rotation.x = damp(L.armR.rotation.x, tg[1], 18, dt);
  L.legL.rotation.x = damp(L.legL.rotation.x, tg[2], 18, dt);
  L.legR.rotation.x = damp(L.legR.rotation.x, tg[3], 18, dt);
}

// ---------- shared props ----------
function quizBlock(ctx, id, x, z, solved) {
  bx(ctx, 0.5, 0.9, 0.5, "#26355e", x, 0, z, { solid: true });
  const cube = new THREE.Mesh(boxGeo(0.7, 0.7, 0.7), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.4, map: iconTex(solved ? "#3fd16f" : "#ffb800", solved ? "✓" : "?") }));
  cube.position.set(x, 1.55, z);
  cube.castShadow = true;
  ctx.group.add(cube);
  ctx.quizBlocks[id] = cube;
  ctx.anim.push((t) => { if (!cube.userData.solved) { cube.rotation.y = t * 1.4; cube.position.y = 1.55 + Math.sin(t * 2.2) * 0.1; } });
  cube.userData.solved = solved;
  ctx.keep.push({ x, z, r: 1.0 });
}
export function markQuizSolved(cube) {
  if (!cube || cube.userData.solved) return;
  cube.userData.solved = true;
  cube.material.map.dispose();
  cube.material.map = iconTex("#3fd16f", "✓");
  cube.material.needsUpdate = true;
  cube.rotation.y = 0.5;
}
function gameMarker(ctx, x, z) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 32), new THREE.MeshBasicMaterial({ color: "#ff4fa3", transparent: true, opacity: 0.85 }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.03, z);
  ctx.group.add(ring);
  const cube = new THREE.Mesh(boxGeo(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: "#ffffff", map: iconTex("#ff4fa3", "★"), emissive: new THREE.Color("#401030") }));
  cube.position.set(x, 1.9, z);
  ctx.group.add(cube);
  ctx.anim.push((t) => { cube.rotation.y = -t * 1.6; cube.position.y = 1.9 + Math.sin(t * 3) * 0.12; ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.3; });
  ctx.keep.push({ x, z, r: 1.1 });
  ctx.markers = ctx.markers || [];
  ctx.markers.push(cube, ring);
}
function plant(ctx, x, z, s = 1) {
  bx(ctx, 0.5 * s, 0.45 * s, 0.5 * s, "#c56a3a", x, 0, z, { solid: true });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.42 * s, 12, 10), mat("#38b356"));
  b.position.set(x, 0.75 * s, z); b.castShadow = true; ctx.group.add(b);
}
function chair(ctx, x, z, rot, color = "#2f80ed") {
  item(ctx, x, z, rot, (g, add) => { add(0.45, 0.06, 0.45, color, 0, 0.42, 0); add(0.45, 0.45, 0.06, color, 0, 0.48, -0.2); add(0.06, 0.42, 0.06, "#555", -0.18, 0, 0.18); add(0.06, 0.42, 0.06, "#555", 0.18, 0, 0.18); add(0.06, 0.42, 0.06, "#555", -0.18, 0, -0.18); add(0.06, 0.42, 0.06, "#555", 0.18, 0, -0.18); });
}
function desk(ctx, x, z, rot, w = 1.2, d = 0.6, color = "#f2e6d0", screen) {
  item(ctx, x, z, rot, (g, add) => {
    add(w, 0.08, d, color, 0, 0.7, 0, true);
    for (const sx of [-1, 1]) add(0.06, 0.7, d - 0.08, "#666", sx * (w / 2 - 0.05), 0, 0);
    if (screen) { add(0.55, 0.36, 0.04, "#1d2333", 0, 0.86, -d / 2 + 0.12); add(0.5, 0.3, 0.01, mat(screen, { emissive: new THREE.Color(screen).multiplyScalar(0.6) }), 0, 0.89, -d / 2 + 0.145); add(0.1, 0.12, 0.08, "#333", 0, 0.78, -d / 2 + 0.12); }
  });
}
function shelf(ctx, x, z, rot, w = 1.6, h = 1.9, colors = ["#ff4747", "#2fb2ff", "#ffd91a", "#3fd16f", "#9b7bff"], seed = 1) {
  const r = rng(seed);
  item(ctx, x, z, rot, (g, add, addCyl, addSolid) => {
    const wood = "#c98a49", rows = Math.max(2, Math.floor(h / 0.45)), step = (h - 0.06) / rows;
    add(w, h, 0.05, wood, 0, 0, -0.175); add(0.05, h, 0.4, wood, -w / 2 + 0.025, 0, 0); add(0.05, h, 0.4, wood, w / 2 - 0.025, 0, 0);
    for (let i = 0; i <= rows; i++) add(w, 0.04, 0.4, wood, 0, i * step, 0);
    for (let i = 0; i < rows; i++) {
      let cx = -w / 2 + 0.08;
      while (cx < w / 2 - 0.15) { const bw = 0.07 + r() * 0.07, bh = Math.min(step - 0.08, 0.22 + r() * 0.12); add(bw, bh, 0.28, colors[Math.floor(r() * colors.length)], cx + bw / 2, 0.04 + i * step, 0.0); cx += bw + 0.01; }
    }
    addSolid(w, h, 0.4, 0, 0, 0);
  });
}
function wallBoard(ctx, x, z, rot, w, color, glow, y = 0.9, h = 1.2) {
  item(ctx, x, z, rot, (g, add) => { add(w + 0.12, h + 0.12, 0.06, "#2b3655", 0, y - 0.06, 0); add(w, h, 0.04, glow ? mat(color, { emissive: new THREE.Color(color).multiplyScalar(0.55) }) : color, 0, y, 0.03); });
}

// ---------- walls from plan ----------
function union(iv) {
  const s = iv.slice().sort((a, b) => a[0] - b[0]), out = [];
  for (const [a, b] of s) { if (out.length && a <= out[out.length - 1][1] + 1e-6) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b); else out.push([a, b]); }
  return out;
}
function subtract(iv, cut) {
  let res = iv.map((x) => x.slice());
  for (const [c0, c1] of cut) {
    const next = [];
    for (const [a, b] of res) { if (c1 <= a || c0 >= b) { next.push([a, b]); continue; } if (c0 > a) next.push([a, c0]); if (c1 < b) next.push([c1, b]); }
    res = next;
  }
  return res.filter(([a, b]) => b - a > 0.05);
}
export function doorLine(rect, d) {
  const [x0, x1, z0, z1] = rect, w = d.w || 1.4;
  if (d.side === "n") return { axis: "z", c: z0, a0: d.at - w / 2, a1: d.at + w / 2, inX: 0, inZ: 1 };
  if (d.side === "s") return { axis: "z", c: z1, a0: d.at - w / 2, a1: d.at + w / 2, inX: 0, inZ: -1 };
  if (d.side === "w") return { axis: "x", c: x0, a0: d.at - w / 2, a1: d.at + w / 2, inX: 1, inZ: 0 };
  return { axis: "x", c: x1, a0: d.at - w / 2, a1: d.at + w / 2, inX: -1, inZ: 0 };
}
const WALL_H = 2.6;
function buildWalls(ctx, def) {
  const ext = new Map(), intr = new Map(), gaps = new Map();
  const key = (axis, c) => axis + ":" + c.toFixed(2);
  const put = (map, axis, c, a0, a1) => { const k = key(axis, c); if (!map.has(k)) map.set(k, { axis, c, iv: [] }); map.get(k).iv.push([Math.min(a0, a1), Math.max(a0, a1)]); };
  const pts = def.outline;
  for (let i = 0; i < pts.length; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % pts.length];
    if (Math.abs(z0 - z1) < 1e-6) put(ext, "z", z0, x0, x1); else put(ext, "x", x0, z0, z1);
  }
  const frames = [];
  for (const r of def.rooms) {
    if (r.open) continue;
    const [x0, x1, z0, z1] = r.rect;
    put(intr, "z", z0, x0, x1); put(intr, "z", z1, x0, x1); put(intr, "x", x0, z0, z1); put(intr, "x", x1, z0, z1);
    if (!r.solid) for (const d of r.doors || []) { const g = doorLine(r.rect, d); put(gaps, g.axis, g.c, g.a0, g.a1); frames.push({ ...g, color: r.color || "#26355e" }); }
  }
  for (const e of def.exits || []) { put(gaps, e.axis, e.c, e.at - e.w / 2, e.at + e.w / 2); frames.push({ axis: e.axis, c: e.c, a0: e.at - e.w / 2, a1: e.at + e.w / 2, color: e.to ? "#ff4fa3" : "#3fd16f", exit: true }); }
  const wallM = mat("#f4f1ea"), capM = mat("#2b3655"), baseM = mat("#e2ddd1");
  const glassM = new THREE.MeshStandardMaterial({ color: "#8fd3ff", transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false });
  const piece = (axis, c, a0, a1, exterior) => {
    a0 -= 0.1; a1 += 0.1;
    const len = a1 - a0, mid = (a0 + a1) / 2, t = exterior ? 0.3 : 0.2;
    const [w, d, x, z] = axis === "z" ? [len, t, mid, c] : [t, len, c, mid];
    if (exterior) {
      const base = bx(ctx, w, 1.0, d, baseM, x, 0, z);
      base.userData.fade = true; ctx.fade.push(base);
      const gl = bx(ctx, w * (axis === "z" ? 1 : 0.4), WALL_H - 1.0, d * (axis === "x" ? 1 : 0.4), glassM, x, 1.0, z, { shadow: false });
      gl.receiveShadow = false;
      bx(ctx, w, 0.08, d, capM, x, WALL_H, z, { shadow: false });
      // vertical mullions
      const n = Math.floor(len / 2.4);
      for (let i = 1; i < n; i++) { const p = a0 + (len / n) * i; bx(ctx, axis === "z" ? 0.08 : t, WALL_H - 1.0, axis === "z" ? t : 0.08, capM, axis === "z" ? p : c, 1.0, axis === "z" ? c : p, { shadow: false }); }
    } else {
      const m = bx(ctx, w, WALL_H, d, wallM, x, 0, z);
      m.userData.fade = true; ctx.fade.push(m);
      bx(ctx, w + 0.01, 0.06, d + 0.01, capM, x, WALL_H, z, { shadow: false });
    }
    staticBody(ctx, x, 5, z, w, 10, d);
  };
  for (const [k, e] of ext) for (const [a, b] of subtract(union(e.iv), union(gaps.get(k)?.iv || []))) piece(e.axis, e.c, a, b, true);
  for (const [k, e] of intr) {
    let iv = union(e.iv);
    if (ext.has(k)) iv = subtract(iv, union(ext.get(k).iv));
    for (const [a, b] of subtract(iv, union(gaps.get(k)?.iv || []))) piece(e.axis, e.c, a, b, false);
  }
  // door frames
  for (const f of frames) {
    const t = 0.34, fm = mat(f.color);
    for (const p of [f.a0, f.a1]) bx(ctx, f.axis === "z" ? 0.22 : t, WALL_H, f.axis === "z" ? t : 0.22, fm, f.axis === "z" ? p : f.c, 0, f.axis === "z" ? f.c : p, { shadow: false });
    bx(ctx, f.axis === "z" ? f.a1 - f.a0 : t, 0.32, f.axis === "z" ? t : f.a1 - f.a0, fm, f.axis === "z" ? (f.a0 + f.a1) / 2 : f.c, WALL_H - 0.32, f.axis === "z" ? f.c : (f.a0 + f.a1) / 2, { shadow: false });
  }
}

// ---------- floors ----------
const FLOOR_STYLE = {
  tile: () => tileTex(["#eef0f3", "#e3e7ec"], "#d5dae1", [1, 1], 3),
  wood: () => plankTex("#e0b07a", [1, 1]),
  carpet: () => tileTex(["#7f97c9", "#7590c4"], "#6f88bc", [1, 1], 5),
  mat: () => tileTex(["#6c7a96", "#66748f"], "#5c6985", [1, 1], 7),
  green: () => tileTex(["#2bbf4a"], "#2bbf4a", [1, 1]),
  lounge: () => tileTex(["#ffd25a", "#ff8a5b", "#58c4ff", "#7bd668", "#f4efe4"], "#f6f1e4", [1, 1], 11),
  deck: () => plankTex("#b98552", [1, 1]),
  court: () => studTex("#2fa84f", [1, 1]),
  gym: () => plankTex("#f0c27b", [1, 1]),
  rink: () => tileTex(["#dfe7f0"], "#d6dfe9", [1, 1]),
  hall: () => tileTex(["#f3eee4", "#ebe5d8"], "#ddd6c7", [1, 1], 13),
};
function floorPlate(ctx, rect, style, y = 0) {
  const [x0, x1, z0, z1] = rect, w = x1 - x0, d = z1 - z0;
  const t = (FLOOR_STYLE[style] || FLOOR_STYLE.hall)();
  const per = style === "court" ? 0.5 : style === "lounge" ? 3 : 2;
  t.repeat.set(w / per, d / per);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, map: t }));
  m.position.set((x0 + x1) / 2, y - 0.02, (z0 + z1) / 2);
  m.receiveShadow = true;
  ctx.group.add(m);
  return m;
}

// ---------- room furniture ----------
function backSide(r) {
  const ds = new Set((r.doors || []).map((d) => d.side));
  const opp = { n: "s", s: "n", e: "w", w: "e" };
  const first = r.doors && r.doors[0] ? opp[r.doors[0].side] : "n";
  if (!ds.has(first)) return first;
  return ["n", "s", "e", "w"].find((s) => !ds.has(s)) || "n";
}
function wallSpot(rc, side, t, inset) {
  const [x0, x1, z0, z1] = rc;
  if (side === "n") return { x: x0 + t * (x1 - x0), z: z0 + inset, rot: 0 };
  if (side === "s") return { x: x0 + t * (x1 - x0), z: z1 - inset, rot: Math.PI };
  if (side === "w") return { x: x0 + inset, z: z0 + t * (z1 - z0), rot: Math.PI / 2 };
  return { x: x1 - inset, z: z0 + t * (z1 - z0), rot: -Math.PI / 2 };
}
const sideLen = (rc, s) => (s === "n" || s === "s" ? rc[1] - rc[0] : rc[3] - rc[2]);
function groupTables(ctx, rc, cols, rows, mk, margin = 1.3) {
  const [x0, x1, z0, z1] = rc;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = x0 + margin + (i + 0.5) * (x1 - x0 - margin * 2) / cols, z = z0 + margin + (j + 0.5) * (z1 - z0 - margin * 2) / rows;
    if (!blocked(ctx, x, z, 0.9)) mk(x, z, i, j);
  }
}
const FURNISH = {
  meeting(ctx, r) {
    const rc = r.rect, b = backSide(r), [x0, x1, z0, z1] = rc, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const vertical = z1 - z0 > x1 - x0;
    const L = (vertical ? z1 - z0 : x1 - x0) - 3.0;
    item(ctx, cx, cz, vertical ? Math.PI / 2 : 0, (g, add) => { add(L, 0.08, 1.2, "#f2e6d0", 0, 0.7, 0, true); add(0.1, 0.7, 0.1, "#555", -L / 2 + 0.2, 0, 0); add(0.1, 0.7, 0.1, "#555", L / 2 - 0.2, 0, 0); });
    const n = Math.floor(L / 0.8);
    for (let i = 0; i < n; i++) {
      const a = -L / 2 + 0.4 + i * (L / n);
      for (const sd of [-1, 1]) { if (vertical) chair(ctx, cx + sd * 0.95, cz + a, sd > 0 ? -Math.PI / 2 : Math.PI / 2, "#26355e"); else chair(ctx, cx + a, cz + sd * 0.95, sd > 0 ? Math.PI : 0, "#26355e"); }
    }
    const s = wallSpot(rc, b, 0.5, 0.15);
    wallBoard(ctx, s.x, s.z, s.rot, Math.min(2.2, sideLen(rc, b) - 0.6), "#ffffff", false);
  },
  lego(ctx, r) {
    const [x0, x1, z0, z1] = r.rect, cx = x0 + 2.6, cz = (z0 + z1) / 2;
    item(ctx, cx, cz, 0, (g, add) => { add(2.6, 0.1, 1.4, "#ffffff", 0, 0.62, 0, true); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(0.1, 0.62, 0.1, "#555", sx * 1.2, 0, sz * 0.6); });
    const r0 = rng(21), cols = ["#ff4747", "#2fb2ff", "#ffd91a", "#3fd16f", "#ff9a1a", "#9b7bff"];
    for (let i = 0; i < 26; i++) bx(ctx, 0.24 + r0() * 0.2, 0.12 + Math.floor(r0() * 3) * 0.12, 0.16, cols[i % 6], cx - 1.1 + r0() * 2.2, 0.72, cz - 0.55 + r0() * 1.1, { shadow: false });
    for (let k = 0; k < 7; k++) bx(ctx, 0.5, 0.3, 0.5, cols[k % 6], x0 + 0.5, k * 0.3, z0 + 0.6, { solid: k === 0, minH: 2 });
    shelf(ctx, (x0 + x1) / 2, z1 - 0.3, Math.PI, 2.4, 1.4, cols, 3);
    // floor bricks (the painful ones)
    for (let i = 0; i < 9; i++) bx(ctx, 0.2, 0.1, 0.12, cols[i % 6], x0 + 0.9 + r0() * (x1 - x0 - 1.8), 0, z0 + 0.7 + r0() * (z1 - z0 - 1.4), { shadow: false, ry: r0() * 3 });
  },
  telecom(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    for (let i = 0; i < 4; i++) {
      const x = x0 + 0.7 + i * 0.9;
      bx(ctx, 0.7, 1.9, 0.7, "#1f2533", x, 0, (z0 + z1) / 2 - 0.1, { solid: true });
      for (let k = 0; k < 5; k++) {
        const led = bx(ctx, 0.08, 0.05, 0.02, mat(k % 2 ? "#3fd16f" : "#2fb2ff", { emissive: new THREE.Color(k % 2 ? "#3fd16f" : "#2fb2ff") }), x - 0.2 + (k % 3) * 0.12, 0.4 + k * 0.28, (z0 + z1) / 2 + 0.26, { shadow: false });
        ctx.anim.push((t) => { led.visible = Math.sin(t * (4 + k + i) + i * 3) > -0.3; });
      }
    }
  },
  office(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = x0 + 2.0 + i * 1.2, z = z0 + 3.05 + j * 0.7; desk(ctx, x, z, j ? Math.PI : 0, 1.2, 0.7, "#ffffff", "#7dd3fc"); chair(ctx, x, z + (j ? 0.7 : -0.7), j ? 0 : Math.PI, "#1f2937"); }
    for (let k = 0; k < 3; k++) bx(ctx, 0.9, 1.3, 0.45, "#e9e2cf", x0 + 0.33, 0, z0 + 0.6 + k * 0.95, { solid: true, ry: Math.PI / 2 });
    bx(ctx, 0.6, 0.9, 0.5, "#d1d5db", x1 - 0.6, 0, z1 - 0.5, { solid: true });
    plant(ctx, x0 + 0.6, z1 - 0.6);
    // paper mountain gag
    for (let k = 0; k < 7; k++) bx(ctx, 0.32, 0.12, 0.24, "#ffffff", x0 + 2.0 + (k % 2) * 0.04, 0.78 + k * 0.12, z0 + 3.05, { shadow: false });
  },
  club(ctx, r) {
    const rc = r.rect, b = backSide(r), [x0, x1, z0, z1] = rc;
    const s = wallSpot(rc, b, 0.5, 0.15);
    wallBoard(ctx, s.x, s.z, s.rot, 2.2, "#60a5fa", true, 0.9, 1.25);
    const cols = Math.max(1, Math.floor((x1 - x0 - 2) / 1.9)), rows = Math.max(1, Math.floor((z1 - z0 - 1.6) / 2.2));
    groupTables(ctx, [x0 + 0.4, x1 - 0.8, z0, z1], cols, rows, (x, z) => { desk(ctx, x, z, Math.PI / 2, 1.1, 0.6, "#ffffff"); chair(ctx, x - 0.65, z, -Math.PI / 2, "#ff9a1a"); }, 1.2);
  },
  vestibule(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    bx(ctx, Math.min(3, x1 - x0 - 0.8), 0.03, 1.4, "#3b4766", (x0 + x1) / 2, 0.01, (z0 + z1) / 2, { shadow: false });
    if (x1 - x0 > 4) { plant(ctx, x0 + 0.6, z0 + 0.6); }
  },
  books(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    shelf(ctx, x0 + 2.6, z0 + 0.3, 0, 2.2, 1.9, undefined, 7);
    shelf(ctx, x0 + 5.0, z0 + 0.3, 0, 2.2, 1.9, undefined, 8);
    // L-sofa + coffee table
    item(ctx, x0 + 3.2, z0 + 4.4, 0, (g, add) => { add(2.6, 0.42, 0.8, "#f5e6c8", 0, 0, 0, true); add(2.6, 0.45, 0.2, "#f5e6c8", 0, 0.42, -0.3); add(0.8, 0.42, 1.6, "#f5e6c8", 1.7, 0, 0.4, true); add(1.0, 0.4, 0.6, "#ffffff", 0.2, 0, 1.3, true); });
    for (let k = 0; k < 2; k++) {
      const x = x0 + 2.0 + k * 2.6, z = z0 + 7.6;
      cyl(ctx, 0.45, 0.72, "#c98a49", x, 0, z, { solid: true });
      for (const a of [0, Math.PI]) chair(ctx, x + Math.cos(a) * 0.8, z, a === 0 ? -Math.PI / 2 : Math.PI / 2, "#e8b04b");
    }
    for (let k = 0; k < 2; k++) {
      const x = x0 + 2.4 + k * 2.6, z = z1 - 1.6;
      item(ctx, x, z, Math.PI / 2, (g, add) => { add(2.0, 0.08, 0.9, "#a86b3c", 0, 0.7, 0, true); add(0.1, 0.7, 0.7, "#555", -0.85, 0, 0); add(0.1, 0.7, 0.7, "#555", 0.85, 0, 0); });
      for (const sd of [-0.75, 0.75]) for (const dz of [-0.6, 0.6]) chair(ctx, x + sd, z + dz, sd > 0 ? -Math.PI / 2 : Math.PI / 2, "#26355e");
    }
    // coffee counter
    item(ctx, x1 - 0.5, z1 - 3.2, -Math.PI / 2, (g, add) => { add(2.4, 1.0, 0.6, "#26355e", 0, 0, 0, true); add(0.5, 0.5, 0.4, "#9ca3af", -0.6, 1.0, 0); add(0.3, 0.3, 0.3, "#ffffff", 0.5, 1.0, 0); });
    bx(ctx, 3.0, 0.02, 2.0, "#ff8a5b", x0 + 3.2, 0.005, z0 + 5.2, { shadow: false });
  },
  lobby(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    [z0 + 1.4, z0 + 3.0, z0 + 4.6].forEach((z, k) => item(ctx, x1 - 0.8, z, -Math.PI / 2, (g, add) => { add(1.2, 1.0, 0.4, "#ffffff", 0, 0, 0, true); add(1.0, 0.8, 0.04, mat(["#ffd25a", "#58c4ff", "#ff8a5b"][k]), 0, 1.0, 0.22); }));
    plant(ctx, x1 - 0.5, z1 - 0.6);
    void x0;
  },
  hall() {},
  ehall(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    item(ctx, (x0 + x1) / 2, z0 + 0.4, 0, (g, add) => { add(0.5, 1.2, 0.45, "#e5e7eb", 0, 0, 0, true); add(0.42, 0.34, 0.03, "#7dd3fc", 0, 1.2, 0); add(0.12, 0.08, 0.08, "#3b82f6", -0.1, 0.66, 0.25); add(0.12, 0.08, 0.08, "#ef4444", 0.1, 0.66, 0.25); add(0.36, 0.05, 0.2, "#9ca3af", 0, 0.42, 0.3); });
    bx(ctx, 0.5, 0.42, 1.8, "#3fd16f", x1 - 0.4, 0, z0 + 2.6, { solid: true });
    plant(ctx, x0 + 0.5, z0 + 0.5);
    void z1;
  },
  lounge(ctx, r) {
    const [x0, x1, z0, z1] = r.rect, cols = ["#ff4747", "#2fb2ff", "#ffd91a", "#3fd16f", "#9b7bff"];
    for (let k = 0; k < 8; k++) {
      const x = x0 + 2.4 + k * 2.6, z = z1 - 1.0;
      if (blocked(ctx, x, z, 0.6)) continue;
      const bean = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), mat(cols[k % 5]));
      bean.scale.set(1, 0.6, 1); bean.position.set(x, 0.3, z); bean.castShadow = true; ctx.group.add(bean);
      staticBody(ctx, x, 0.3, z, 0.8, 0.6, 0.8);
    }
    plant(ctx, x0 + 0.7, z1 - 0.7);
    void z0;
  },
  fashion(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    for (let k = 0; k < 2; k++) {
      const z = z0 + 2.6 + k * 2.2;
      item(ctx, x0 + 3.6, z, 0, (g, add) => { add(2.4, 0.08, 0.9, "#ffffff", 0, 0.72, 0, true); for (const sx of [-1, 1]) add(0.08, 0.72, 0.7, "#888", sx * 1.1, 0, 0); add(0.45, 0.3, 0.22, "#f5f5f5", -0.5, 0.8, 0); add(0.1, 0.18, 0.22, "#f5f5f5", -0.7, 1.1, 0); add(0.4, 0.06, 0.22, "#f5f5f5", -0.5, 1.26, 0); add(0.45, 0.3, 0.22, "#f5f5f5", 0.6, 0.8, 0); });
      chair(ctx, x0 + 3.1, z + 0.8, Math.PI, "#ff6b8b"); chair(ctx, x0 + 4.2, z + 0.8, Math.PI, "#ff6b8b");
    }
    // clothes rack
    item(ctx, x1 - 0.6, z0 + 3.0, -Math.PI / 2, (g, add) => { add(2.4, 0.06, 0.06, "#888", 0, 1.7, 0); add(0.06, 1.7, 0.06, "#888", -1.15, 0, 0); add(0.06, 1.7, 0.06, "#888", 1.15, 0, 0); ["#ff6b8b", "#ffd91a", "#2fb2ff", "#3fd16f", "#9b7bff", "#ff9a1a"].forEach((c, i) => add(0.3, 0.8, 0.06, c, -0.9 + i * 0.36, 0.85, 0)); });
    staticBody(ctx, x1 - 0.6, 1, z0 + 3.0, 0.5, 2, 2.4);
    item(ctx, x0 + 0.2, z1 - 1.5, Math.PI / 2, (g, add) => { add(1.2, 1.9, 0.06, "#cfe8ff", 0, 0.1, 0); add(1.3, 2.0, 0.04, "#26355e", 0, 0.05, -0.04); });
  },
  chroma(ctx, r) {
    const [x0, x1, z0, z1] = r.rect, green = mat("#2bbf4a");
    bx(ctx, 0.1, 2.4, z1 - z0 - 0.4, green, x0 + 0.2, 0, (z0 + z1) / 2, { shadow: false });
    bx(ctx, 2.4, 0.02, z1 - z0 - 0.4, green, x0 + 1.4, 0.02, (z0 + z1) / 2, { shadow: false });
    item(ctx, x0 + 3.6, (z0 + z1) / 2 - 0.4, -Math.PI / 2, (g, add) => { add(0.4, 0.3, 0.5, "#1f2937", 0, 1.3, 0); add(0.18, 0.18, 0.2, "#111", 0, 1.36, 0.32); for (const a of [0, 2.1, 4.2]) add(0.04, 1.3, 0.04, "#555", Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25); });
    for (const sz of [-1, 1]) item(ctx, x0 + 0.9, (z0 + z1) / 2 + sz * 1.05, Math.PI / 2, (g, add) => { add(0.05, 1.8, 0.05, "#333", 0, 0, 0); add(0.5, 0.4, 0.2, mat("#fff7d6", { emissive: new THREE.Color("#fff3b0") }), 0, 1.8, 0); });
  },
  makeup(ctx, r) {
    const [x0, x1, z0] = r.rect;
    item(ctx, x0 + 0.35, z0 + 1.5, Math.PI / 2, (g, add) => {
      add(2.2, 0.8, 0.5, "#ffffff", 0, 0, 0, true);
      add(2.0, 0.9, 0.04, "#cfe8ff", 0, 1.05, -0.2);
      for (let i = 0; i < 6; i++) add(0.08, 0.08, 0.08, mat("#fff7d6", { emissive: new THREE.Color("#fff3b0") }), -0.95 + i * 0.38, 2.0, -0.18);
    });
    chair(ctx, x0 + 1.2, z0 + 1.0, -Math.PI / 2, "#ff9ad5"); chair(ctx, x0 + 1.2, z0 + 2.0, -Math.PI / 2, "#ff9ad5");
    void x1;
  },
  dance(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    item(ctx, (x0 + x1) / 2, z1 - 0.12, Math.PI, (g, add) => { add(x1 - x0 - 1.2, 2.1, 0.04, mat("#d7ecff", { roughness: 0.05, metalness: 0.3 }), 0, 0.2, 0); });
    for (const sx of [x0 + 0.6, x1 - 0.6]) bx(ctx, 0.6, 1.1, 0.5, "#1f2937", sx, 0, z1 - 0.6, { solid: true });
    wallBoard(ctx, x0 + 0.15, (z0 + z1) / 2, Math.PI / 2, 1.8, "#a78bfa", true, 1.1, 1.0);
    // dance pad
    for (let i = 0; i < 4; i++) bx(ctx, 0.6, 0.03, 0.6, ["#ff4747", "#2fb2ff", "#ffd91a", "#3fd16f"][i], 14 + (i % 2 ? 0.65 : -0.65) * (i < 2 ? 1 : 0), 0.01, 16.4 + (i >= 2 ? (i === 2 ? -0.65 : 0.65) : 0), { shadow: false });
  },
  cooking(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const x = x0 + 2.4 + i * 3.6, z = z0 + 3.1 + j * 2.6;
      item(ctx, x, z, 0, (g, add) => { add(2.4, 0.9, 1.1, "#e5e7eb", 0, 0, 0, true); add(2.44, 0.06, 1.14, "#9ca3af", 0, 0.9, 0); for (const sx of [-0.7, -0.2]) add(0.4, 0.02, 0.4, mat("#111", { emissive: new THREE.Color("#7f1d1d") }), sx, 0.96, 0); add(0.6, 0.02, 0.45, "#cbd5e1", 0.6, 0.96, 0); add(0.36, 0.22, 0.36, "#ef4444", -0.7, 0.98, 0); });
    }
    for (let k = 0; k < 3; k++) bx(ctx, 0.8, 1.9, 0.7, "#f3f4f6", x0 + 0.6 + k * 0.85, 0, z1 - 0.45, { solid: true });
    item(ctx, x1 - 0.4, (z0 + z1) / 2 + 1.2, -Math.PI / 2, (g, add) => { add(3.4, 0.9, 0.6, "#e5e7eb", 0, 0, 0, true); add(0.4, 0.5, 0.35, "#374151", 1.2, 0.9, 0); });
    void z0;
  },
  coding(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      const x = x0 + 1.7 + i * 2.6, z = z0 + 1.6 + j * 2.0;
      desk(ctx, x, z, 0, 1.4, 0.7, "#ffffff", "#34d399");
      chair(ctx, x - 0.3, z + 0.7, Math.PI, "#2fb2ff"); chair(ctx, x + 0.35, z + 0.7, Math.PI, "#2fb2ff");
    }
    desk(ctx, x1 - 1.2, z1 - 1.0, Math.PI, 1.4, 0.7, "#f2e6d0", "#60a5fa");
  },
  band(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    const dx = x0 + 1.0, dz = z0 + 2.6;
    cyl(ctx, 0.35, 0.5, "#e0464e", dx, 0, dz, { solid: true });
    for (const [ox, oz, rr, h] of [[0.5, -0.3, 0.2, 0.7], [-0.4, -0.35, 0.18, 0.75], [0.55, 0.35, 0.22, 0.55]]) cyl(ctx, rr, 0.18, "#f1f5f9", dx + ox, h, dz + oz);
    cyl(ctx, 0.3, 0.02, "#ffd400", dx + 0.7, 1.1, dz - 0.5);
    bx(ctx, 0.7, 0.7, 0.4, "#1f2937", x1 - 0.6, 0, z0 + 1.0, { solid: true });
    item(ctx, x1 - 0.7, z0 + 3.4, -Math.PI / 2, (g, add) => { add(1.3, 0.12, 0.35, "#111", 0, 0.8, 0, true); add(1.2, 0.02, 0.2, "#f8fafc", 0, 0.92, 0.04); add(0.06, 0.8, 0.06, "#555", -0.5, 0, 0); add(0.06, 0.8, 0.06, "#555", 0.5, 0, 0); });
    cyl(ctx, 0.03, 1.5, "#555", (x0 + x1) / 2, 0, z1 - 1.6);
    for (let i = 0; i < 4; i++) bx(ctx, 0.06, 0.8, 0.6, "#7c5cff", x0 + 0.13, 1.0, z0 + 0.8 + i * 1.3, { shadow: false });
  },
  classroom(ctx, r) {
    const rc = r.rect, b = backSide(r), [x0, x1, z0, z1] = rc;
    const s = wallSpot(rc, b, 0.5, 0.15);
    wallBoard(ctx, s.x, s.z, s.rot, Math.min(2.4, sideLen(rc, b) - 1), "#1e3a8a", true, 0.9, 1.25);
    groupTables(ctx, [x0 + 0.3, x1 - 0.3, z0 + 0.4, z1 - 0.2], 2, 2, (x, z) => {
      item(ctx, x, z, 0, (g, add) => { add(1.4, 0.08, 1.0, "#ffffff", 0, 0.7, 0, true); add(0.08, 0.7, 0.08, "#666", -0.6, 0, -0.4); add(0.08, 0.7, 0.08, "#666", 0.6, 0, 0.4); add(0.08, 0.7, 0.08, "#666", -0.6, 0, 0.4); add(0.08, 0.7, 0.08, "#666", 0.6, 0, -0.4); });
      chair(ctx, x - 0.35, z - 0.75, 0, "#3fd16f"); chair(ctx, x + 0.35, z - 0.75, 0, "#3fd16f"); chair(ctx, x - 0.35, z + 0.75, Math.PI, "#3fd16f"); chair(ctx, x + 0.35, z + 0.75, Math.PI, "#3fd16f");
    }, 1.5);
  },
  invent(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    for (let j = 0; j < 2; j++) {
      const z = z0 + 3.0 + j * 2.6;
      item(ctx, (x0 + x1) / 2, z, 0, (g, add) => { add(3.2, 0.9, 1.0, "#c98a49", 0, 0, 0, true); add(0.3, 0.12, 0.2, "#ef4444", -1, 0.9, 0); add(0.5, 0.06, 0.06, "#9ca3af", 0.4, 0.92, 0.1); add(0.2, 0.2, 0.2, "#ffd91a", 1.1, 0.9, -0.2); });
    }
    wallBoard(ctx, x1 - 0.15, z1 - 2.2, -Math.PI / 2, 2.2, "#d6b07a", false, 0.9, 1.1);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 12), mat("#fff3b0", { emissive: new THREE.Color("#ffd84d") }));
    bulb.position.set(x0 + 1.0, 1.9, z1 - 1.0); ctx.group.add(bulb);
    cyl(ctx, 0.22, 1.4, "#9ca3af", x0 + 1.0, 0, z1 - 1.0, { solid: true });
    ctx.anim.push((t) => { bulb.material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.4; });
  },
  maker(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    for (let i = 0; i < 2; i++) {
      const x = x0 + 1.6 + i * 2.4, z = z0 + 3.0;
      item(ctx, x, z, 0, (g, add) => { add(1.8, 0.08, 1.0, "#ffffff", 0, 0.72, 0, true); add(0.08, 0.72, 0.8, "#666", -0.8, 0, 0); add(0.08, 0.72, 0.8, "#666", 0.8, 0, 0); });
      chair(ctx, x - 0.4, z + 0.8, Math.PI, "#ff9a1a"); chair(ctx, x + 0.4, z + 0.8, Math.PI, "#ff9a1a");
    }
    for (let k = 0; k < 2; k++) {
      const x = x1 - 1.4 - k * 1.2, z = z0 + 0.7;
      bx(ctx, 0.9, 0.8, 0.6, "#e5e7eb", x, 0, z, { solid: true });
      bx(ctx, 0.7, 0.6, 0.5, mat("#111827", { transparent: true, opacity: 0.6 }), x, 0.8, z, { shadow: false });
      const head = bx(ctx, 0.12, 0.1, 0.12, mat("#ff9a1a", { emissive: new THREE.Color("#ff6a00") }), x, 1.2, z, { shadow: false });
      ctx.anim.push((t) => { head.position.x = x + Math.sin(t * 3 + k) * 0.25; head.position.z = z + Math.cos(t * 2.3 + k) * 0.15; });
    }
  },
  prep(ctx, r) {
    const rc = r.rect, b = backSide(r);
    const n = Math.max(1, Math.floor((sideLen(rc, b) - 0.6) / 1.7));
    for (let i = 0; i < n; i++) { const s = wallSpot(rc, b, (i + 0.5) / n, 0.3); shelf(ctx, s.x, s.z, s.rot, 1.5, 1.8, ["#c98a49", "#e5e7eb", "#9ca3af", "#fde68a"], 40 + i); }
    const [x0, x1, z0, z1] = rc;
    if (!blocked(ctx, (x0 + x1) / 2, (z0 + z1) / 2, 0.6)) bx(ctx, 0.6, 0.5, 0.6, "#c98a49", (x0 + x1) / 2 + 0.4, 0, (z0 + z1) / 2, { solid: true });
  },
  theater(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    bx(ctx, 2.6, 0.5, z1 - z0 - 0.4, "#7f1d1d", x0 + 1.5, 0, (z0 + z1) / 2, { solid: true });
    // animated movie screen
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), new THREE.MeshBasicMaterial({ map: tex }));
    screen.position.set(x0 + 0.2, 1.9, (z0 + z1) / 2); screen.rotation.y = Math.PI / 2;
    ctx.group.add(screen);
    let lastDraw = -1;
    ctx.anim.push((t) => {
      if (t - lastDraw < 0.08) return;
      lastDraw = t;
      const x = cv.getContext("2d"), T = t % 8;
      x.fillStyle = "#87ceeb"; x.fillRect(0, 0, 512, 256);
      x.fillStyle = "#4fb443"; x.fillRect(0, 190, 512, 66);
      const px = 40 + Math.min(T, 4) * 70, hop = T > 4 && T < 5.5 ? Math.sin((T - 4) / 1.5 * Math.PI) * 120 : 0;
      for (let i = 0; i < 3; i++) { x.fillStyle = ["#ff4747", "#2fb2ff", "#ffd91a"][i]; x.fillRect(330 + i * 18, 178, 14, 12); }
      x.fillStyle = "#2f4b8f"; x.fillRect(px, 150 - hop, 14, 40); x.fillRect(px + 18, 150 - hop, 14, 40);
      x.fillStyle = "#ff5a5f"; x.fillRect(px - 2, 110 - hop, 36, 42);
      x.fillStyle = "#ffd9b8"; x.fillRect(px + 3, 80 - hop, 26, 30);
      x.fillStyle = "#222"; x.fillRect(px + 9, 90 - hop, 4, 7); x.fillRect(px + 19, 90 - hop, 4, 7);
      x.font = `40px ${FONT}`; x.textAlign = "center"; x.fillStyle = "#ffffff"; x.strokeStyle = "#222"; x.lineWidth = 6;
      const cap = T < 4 ? "평화로운 오후…" : T < 6 ? "아야!!! 레고 밟았다!" : "교훈: 레고는 정리하자";
      x.strokeText(cap, 256, 48); x.fillText(cap, 256, 48);
      tex.needsUpdate = true;
    });
    // seats: rows facing west, aisle in the middle
    const seatG = new THREE.BoxGeometry(0.5, 0.45, 0.5), backG = new THREE.BoxGeometry(0.1, 0.5, 0.5);
    const rows = [], seatsPos = [];
    for (let i = 0; i < 9; i++) { const x = x0 + 4.4 + i * 1.6; if (x > x1 - 1.2) break; rows.push(x); }
    for (const x of rows) for (let z = z0 + 1.0; z < z1 - 0.6; z += 0.6) { if (Math.abs(z - (z0 + z1) / 2) < 0.7) continue; seatsPos.push([x, z]); }
    const im = new THREE.InstancedMesh(seatG, mat("#c0262d"), seatsPos.length), ib = new THREE.InstancedMesh(backG, mat("#991b1b"), seatsPos.length);
    const m4 = new THREE.Matrix4();
    seatsPos.forEach(([x, z], i) => { m4.makeTranslation(x, 0.225, z); im.setMatrixAt(i, m4); m4.makeTranslation(x + 0.25, 0.65, z); ib.setMatrixAt(i, m4); });
    im.castShadow = ib.castShadow = true;
    ctx.group.add(im, ib);
    for (const x of rows) {
      const zl0 = z0 + 0.7, zl1 = (z0 + z1) / 2 - 0.7, zr0 = (z0 + z1) / 2 + 0.7, zr1 = z1 - 0.3;
      staticBody(ctx, x + 0.05, 0.5, (zl0 + zl1) / 2, 0.6, 1, zl1 - zl0);
      staticBody(ctx, x + 0.05, 0.5, (zr0 + zr1) / 2, 0.6, 1, zr1 - zr0);
    }
    // wheelchair spots at the back
    for (const z of [(z0 + z1) / 2 + 1.2, (z0 + z1) / 2]) { bx(ctx, 1.0, 0.02, 1.0, "#2563eb", x1 - 1.0, 0.01, z, { shadow: false }); const s = signSprite("휠체어석", "#2563eb", 0.45); s.position.set(x1 - 1.0, 1.3, z); ctx.group.add(s); }
  },
  perform(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    item(ctx, (x0 + x1) / 2, (z0 + z1) / 2 + 0.6, Math.PI / 2, (g, add) => { add(2.8, 0.08, 1.0, "#f2e6d0", 0, 0.7, 0, true); add(0.1, 0.7, 0.8, "#555", -1.2, 0, 0); add(0.1, 0.7, 0.8, "#555", 1.2, 0, 0); });
    for (const dz of [-0.6, 0.6, 1.6]) { chair(ctx, (x0 + x1) / 2 - 0.8, (z0 + z1) / 2 + dz, Math.PI / 2, "#ff6b8b"); chair(ctx, (x0 + x1) / 2 + 0.8, (z0 + z1) / 2 + dz, -Math.PI / 2, "#ff6b8b"); }
    item(ctx, (x0 + x1) / 2, z0 + 0.5, 0, (g, add) => { add(2.4, 0.06, 0.06, "#888", 0, 1.7, 0); add(0.06, 1.7, 0.06, "#888", -1.15, 0, 0); add(0.06, 1.7, 0.06, "#888", 1.15, 0, 0); ["#ffd400", "#ff4fa3", "#ffffff", "#1f1f1f", "#ffe135"].forEach((c, i) => add(0.3, 0.3, 0.3, c, -0.8 + i * 0.4, 1.2, 0)); });
    staticBody(ctx, (x0 + x1) / 2, 1, z0 + 0.5, 2.4, 2, 0.4);
  },
  terrace(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    plant(ctx, x1 - 0.6, z0 + 0.8, 1.1); plant(ctx, x1 - 0.6, z1 - 0.8, 1.1);
    bx(ctx, 1.6, 0.42, 0.5, "#c98a49", (x0 + x1) / 2, 0, z1 - 1.0, { solid: true });
  },
  roof(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    for (const [x, z] of [[x0 + 1.0, z1 - 1.0], [x1 - 1.0, z1 - 1.0], [x0 + 3.5, z1 - 1.0]]) plant(ctx, x, z, 1.2);
    cyl(ctx, 0.5, 0.72, "#ffffff", x0 + 3.0, 0, z0 + 3.6, { solid: true });
    const umb = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.5, 8), mat("#ff4747")); umb.position.set(x0 + 3.0, 2.4, z0 + 3.6); umb.castShadow = true; ctx.group.add(umb);
    cyl(ctx, 0.04, 2.2, "#555", x0 + 3.0, 0, z0 + 3.6);
    // telescope
    item(ctx, x1 - 1.2, z0 + 1.2, -Math.PI / 4, (g, add, addCyl) => { for (const a of [0, 2.1, 4.2]) add(0.04, 1.1, 0.04, "#555", Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2); const tube = addCyl(0.09, 0.9, "#26355e", 0, 1.05, 0); tube.rotation.x = Math.PI / 2.6; });
  },
  broadcast(ctx, r) {
    const [x0, x1, z0] = r.rect;
    item(ctx, (x0 + x1) / 2, z0 + 0.6, 0, (g, add) => { add(3.0, 0.8, 0.8, "#26355e", 0, 0, 0, true); add(1.0, 0.06, 0.5, "#111", -0.5, 0.8, 0); for (let i = 0; i < 6; i++) add(0.05, 0.08, 0.05, mat(i % 2 ? "#ff4747" : "#3fd16f", { emissive: new THREE.Color(i % 2 ? "#ff2020" : "#20c040") }), -0.9 + i * 0.16, 0.86, 0.05); add(0.04, 0.4, 0.04, "#555", 0.6, 0.8, 0); add(0.12, 0.16, 0.12, "#333", 0.6, 1.2, 0); add(0.6, 0.4, 0.05, mat("#60a5fa", { emissive: new THREE.Color("#2563eb") }), 0.9, 1.0, -0.3); });
    chair(ctx, (x0 + x1) / 2, z0 + 1.6, Math.PI, "#9b7bff");
  },
  skateLocker(ctx, r) {
    const [x0, x1, z0, z1] = r.rect, cols = ["#ff4747", "#2fb2ff", "#ffd91a", "#3fd16f"];
    for (let k = 0; k < 3; k++) {
      const x = x0 + 1.4 + k * 2.1;
      item(ctx, x, (z0 + z1) / 2 - 0.6, Math.PI / 2, (g, add) => { add(4.0, 1.7, 0.6, "#e5e7eb", 0, 0, 0, true); for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) add(0.3, 0.12, 0.2, cols[(i + j) % 4], -1.6 + i * 0.8, 0.25 + j * 0.5, 0.3); });
    }
    bx(ctx, 1.6, 0.42, 0.45, "#c98a49", x0 + 1.2, 0, z1 - 1.0, { solid: true });
  },
  shop(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    item(ctx, x0 + 2.4, (z0 + z1) / 2, -Math.PI / 2, (g, add) => { add(2.6, 1.0, 0.7, "#ff7a1a", 0, 0, 0, true); add(2.6, 0.06, 0.8, "#ffffff", 0, 1.0, 0); add(0.4, 0.25, 0.3, "#fde047", -0.8, 1.06, 0); add(0.2, 0.3, 0.2, "#f472b6", 0.6, 1.06, 0); });
    bx(ctx, 0.9, 1.9, 0.6, mat("#bfdbfe", { transparent: true, opacity: 0.85 }), x0 + 0.5, 0, z0 + 0.6, { solid: true });
    shelf(ctx, x0 + 0.3, z1 - 1.0, Math.PI / 2, 1.4, 1.6, ["#fde047", "#f472b6", "#fb923c", "#a3e635"], 61);
    void x1;
  },
  waiting(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    for (let z = z0 + 2.4; z < z1 - 1.5; z += 3.2) { if (!blocked(ctx, x0 + 0.6, z, 1)) bx(ctx, 0.5, 0.42, 1.8, "#3fd16f", x0 + 0.45, 0, z, { solid: true }); }
    if (!blocked(ctx, x0 + 0.5, z1 - 0.8, 0.8)) item(ctx, x0 + 0.45, z1 - 0.8, Math.PI / 2, (g, add) => { add(0.9, 1.8, 0.7, "#ef4444", 0, 0, 0, true); add(0.6, 0.8, 0.02, mat("#bfdbfe", { emissive: new THREE.Color("#3b82f6") }), 0, 0.8, 0.36); });
    plant(ctx, x1 - 0.5, z0 + 0.6);
  },
  rink(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    const cx = (x0 + x1) / 2 + 0.3, cz = 37, R = 7.0, ri = 3.2, half = 15;
    ctx.special.rink = { cx, cz, R: (R + ri) / 2, half };
    const stadium = (rad) => { const s = new THREE.Shape(); s.moveTo(cx - rad, cz - half); s.lineTo(cx - rad, cz + half); s.absarc(cx, cz + half, rad, Math.PI, 0, true); s.lineTo(cx + rad, cz - half); s.absarc(cx, cz - half, rad, 0, Math.PI, true); return s; };
    const outer = stadium(R), hole = new THREE.Path(); { const s = stadium(ri); hole.curves = s.curves; }
    outer.holes.push(hole);
    const tg = new THREE.ShapeGeometry(outer, 24); tg.rotateX(Math.PI / 2);
    const track = new THREE.Mesh(tg, mat("#4f7cff", { side: THREE.DoubleSide })); track.position.y = 0.02; track.receiveShadow = true; ctx.group.add(track);
    const lane = new THREE.Shape(); { const a = stadium(5.15), b = stadium(4.95); lane.curves = a.curves; const h2 = new THREE.Path(); h2.curves = b.curves; lane.holes.push(h2); }
    const lg = new THREE.ShapeGeometry(lane, 24); lg.rotateX(Math.PI / 2);
    const laneM = new THREE.Mesh(lg, mat("#ffffff", { side: THREE.DoubleSide })); laneM.position.y = 0.026; ctx.group.add(laneM);
    bx(ctx, R - ri, 0.02, 0.3, "#ffffff", cx + (R + ri) / 2, 0.022, cz, { shadow: false });
    // island columns + low barrier
    for (const z of [cz - 14, cz - 7, cz, cz + 7, cz + 14]) cyl(ctx, 0.42, 4, "#d1d5db", cx, 0, z, { solid: true });
    bx(ctx, 0.3, 0.8, half * 2, "#ffd91a", cx - ri + 0.2, 0, cz, { solid: true });
    bx(ctx, 0.3, 0.8, half * 2, "#ffd91a", cx + ri - 0.2, 0, cz, { solid: true });
    // safety mats on walls
    bx(ctx, 0.2, 1.4, z1 - z0 - 1, "#2563eb", x1 - 0.3, 0, (z0 + z1) / 2, { shadow: false });
  },
  lockerRoom(ctx, r) {
    const [x0, x1, z0, z1] = r.rect, b = backSide(r);
    const n = Math.floor((x1 - x0 - 4) / 1.0);
    for (let i = 0; i < n; i++) { const s = wallSpot(r.rect, b, (i + 0.5) / n * 0.75 + 0.22, 0.32); item(ctx, s.x, s.z, s.rot, (g, add) => { add(0.9, 1.9, 0.5, r.id.endsWith("m") ? "#93c5fd" : "#f9a8d4", 0, 0, 0, true); add(0.04, 1.7, 0.02, "#475569", 0, 0.1, 0.26); }); }
    bx(ctx, 4.0, 0.42, 0.45, "#c98a49", (x0 + x1) / 2 + 2, 0, (z0 + z1) / 2, { solid: true });
  },
  futsal(ctx, r) {
    const [x0, x1, z0, z1] = r.rect, cx = (x0 + x1) / 2;
    const L = (w, d, x, z) => bx(ctx, w, 0.012, d, "#ffffff", x, 0.012, z, { shadow: false });
    L(x1 - x0 - 1.2, 0.1, cx, z0 + 0.6); L(x1 - x0 - 1.2, 0.1, cx, z1 - 0.6); L(0.1, z1 - z0 - 1.2, x0 + 0.6, (z0 + z1) / 2); L(0.1, z1 - z0 - 1.2, x1 - 0.6, (z0 + z1) / 2); L(x1 - x0 - 1.2, 0.1, cx, (z0 + z1) / 2);
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.12, 40), mat("#ffffff")); ring.rotation.x = -Math.PI / 2; ring.position.set(cx, 0.014, (z0 + z1) / 2); ctx.group.add(ring);
    for (const [gz, dir] of [[z0 + 1.5, 1], [z1 - 1.5, -1]]) {
      const post = "#f8fafc";
      bx(ctx, 0.12, 2.0, 0.12, post, cx - 1.55, 0, gz, { solid: true });
      bx(ctx, 0.12, 2.0, 0.12, post, cx + 1.55, 0, gz, { solid: true });
      bx(ctx, 3.22, 0.12, 0.12, post, cx, 2.0, gz);
      const net = bx(ctx, 3.1, 2.0, 0.05, new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.35 }), cx, 0, gz - dir * 1.0, { shadow: false });
      staticBody(ctx, cx, 1.0, gz - dir * 1.0, 3.1, 2.0, 0.1);
      staticBody(ctx, cx - 1.55, 1.0, gz - dir * 0.5, 0.1, 2.0, 1.0);
      staticBody(ctx, cx + 1.55, 1.0, gz - dir * 0.5, 0.1, 2.0, 1.0);
      staticBody(ctx, cx, 2.05, gz - dir * 0.5, 3.2, 0.1, 1.0);
      void net;
    }
    bx(ctx, 0.25, 0.012, 0.25, "#ffffff", cx, 0.013, z0 + 7.5, { shadow: false });
    ctx.special.goal = { cx, z: z0 + 1.5, half: 1.5, spot: z0 + 7.5 };
  },
  gym(ctx, r) {
    const [x0, x1, z0, z1] = r.rect, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const L = (w, d, x, z, c = "#ffffff") => bx(ctx, w, 0.012, d, c, x, 0.012, z, { shadow: false });
    L(x1 - x0 - 1.4, 0.1, cx, z0 + 0.7); L(x1 - x0 - 1.4, 0.1, cx, z1 - 0.7); L(x1 - x0 - 1.4, 0.1, cx, cz); L(0.1, z1 - z0 - 1.4, x0 + 0.7, cz); L(0.1, z1 - z0 - 1.4, x1 - 0.7, cz);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.8, 1.92, 40), mat("#e0464e")); ring.rotation.x = -Math.PI / 2; ring.position.set(cx, 0.014, cz); ctx.group.add(ring);
    for (const [hz, dir] of [[z0 + 0.6, 1], [z1 - 0.6, -1]]) {
      bx(ctx, 0.2, 3.2, 0.2, "#475569", cx, 0, hz, { solid: true });
      bx(ctx, 1.8, 1.1, 0.06, "#ffffff", cx, 2.9, hz + dir * 0.6);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 6, 20), mat("#ff7a1a")); rim.rotation.x = Math.PI / 2; rim.position.set(cx, 3.05, hz + dir * 0.95); ctx.group.add(rim);
    }
    for (let k = 0; k < 3; k++) bx(ctx, 0.6, 0.4 + k * 0.4, 8, "#94a3b8", x1 - 0.5 - k * 0.6, 0, cz, { solid: true });
  },
  climb(ctx, r) {
    const [x0, x1, z0, z1] = r.rect;
    bx(ctx, 0.3, 7.5, z1 - z0 - 1, "#e8d9c4", x0 + 0.15, 0, (z0 + z1) / 2, { shadow: false });
    staticBody(ctx, x0 + 0.15, 6, (z0 + z1) / 2, 0.4, 12, z1 - z0);
    staticBody(ctx, (x0 + x1) / 2, 6, z1 - 0.2, x1 - x0, 12, 0.4);
    bx(ctx, x1 - x0 - 0.4, 0.3, z1 - z0 - 1, "#2563eb", (x0 + x1) / 2, 0, (z0 + z1) / 2, { shadow: false });
    staticBody(ctx, (x0 + x1) / 2, 0.15, (z0 + z1) / 2, x1 - x0 - 0.4, 0.3, z1 - z0 - 1);
    const holds = [[1.2, 50.6, 0.9], [2.2, 52.2, 1.7], [1.2, 53.8, 2.5], [2.4, 55.4, 3.3], [1.2, 57.0, 4.1], [2.2, 58.8, 4.9], [1.2, 60.6, 5.7], [2.0, 62.6, 6.5]];
    const cols = ["#ff4747", "#ffd91a", "#3fd16f", "#2fb2ff", "#ff9a1a", "#9b7bff", "#ff4fa3", "#22c55e"];
    holds.forEach(([x, z, y], i) => {
      bx(ctx, 1.3, 0.22, 1.2, cols[i % cols.length], x, y, z, { solid: true });
      for (let k = 0; k < 3; k++) bx(ctx, 0.14, 0.12, 0.14, cols[(i + k + 2) % cols.length], x0 + 0.33, 0.5 + k * 2.3 + (i % 3) * 0.4, z - 0.5 + k * 0.4, { shadow: false });
    });
    const top = [1.6, 64.6, 7.2];
    bx(ctx, 2.6, 0.3, 2.0, "#26355e", top[0], top[2], top[1], { solid: true });
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 12, 1, true), mat("#ffd400", { side: THREE.DoubleSide, emissive: new THREE.Color("#806000") }));
    bell.position.set(top[0], top[2] + 1.4, top[1]); ctx.group.add(bell);
    cyl(ctx, 0.04, 1.4, "#555", top[0] + 0.5, top[2] + 0.3, top[1]);
    ctx.special.bell = { x: top[0], y: top[2] + 0.3, z: top[1], mesh: bell };
    ctx.anim.push((t) => { bell.rotation.z = Math.sin(t * 2) * 0.15; });
  },
};
function stairsRoom(ctx, r) {
  const rc = r.rect, [x0, x1, z0, z1] = rc, back = backSide(r), n = 9;
  const alongX = back === "e" || back === "w";
  const width = alongX ? z1 - z0 - 0.6 : x1 - x0 - 0.6, depth = n * 0.38;
  for (let i = 0; i < n; i++) {
    for (const [k, col, base] of [[0, "#cbd5e1", 0], [1, "#94a3b8", 1.62]]) {
      const h = base + 0.18 * (i + 1), off = (k ? 1 : -1) * width / 4;
      const dist = 0.3 + (k ? i : n - 1 - i) * 0.38 + 0.19;
      const s = wallSpot(rc, back, 0.5, dist);
      const x = alongX ? s.x : s.x + off, z = alongX ? s.z + off : s.z;
      bx(ctx, alongX ? 0.38 : width / 2 - 0.1, h, alongX ? width / 2 - 0.1 : 0.38, col, x, 0, z, { shadow: false });
    }
  }
  const c = wallSpot(rc, back, 0.5, 0.3 + depth / 2);
  staticBody(ctx, c.x, 1.5, c.z, alongX ? depth : width + 0.2, 3, alongX ? width + 0.2 : depth);
  let pad = wallSpot(rc, back, 0.5, depth + 1.25);
  const n0 = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }[back];
  let face = Math.atan2(n0[0], n0[1]);
  if (pad.x < x0 + 0.9 || pad.x > x1 - 0.9 || pad.z < z0 + 0.9 || pad.z > z1 - 0.9) {
    // 계단실이 좁으면 문 바로 바깥에 워프 발판을 둬요
    const g = doorLine(rc, r.doors[0]), mx = g.axis === "z" ? r.doors[0].at : g.c, mz = g.axis === "z" ? g.c : r.doors[0].at;
    pad = { x: mx - g.inX * 1.3, z: mz - g.inZ * 1.3 };
    face = Math.atan2(-g.inX, -g.inZ);
  }
  ctx.special.stairs = ctx.special.stairs || [];
  ctx.special.stairs.push({ x: pad.x, z: pad.z, face });
}
function solidRoom(ctx, r) {
  const [x0, x1, z0, z1] = r.rect;
  const lid = bx(ctx, x1 - x0, 0.1, z1 - z0, r.kind === "elevator" ? "#94a3b8" : "#cbd5e1", (x0 + x1) / 2, WALL_H - 0.05, (z0 + z1) / 2, { shadow: false });
  void lid;
  staticBody(ctx, (x0 + x1) / 2, 2.5, (z0 + z1) / 2, x1 - x0, 5, z1 - z0);
  for (const d of r.doors || []) {
    const g = doorLine(r.rect, d), along = g.axis === "z", off = 0.12;
    const px = along ? d.at : g.c + g.inX * -off, pz = along ? g.c + g.inZ * -off : d.at;
    if (r.kind === "elevator") {
      for (const s of [-1, 1]) bx(ctx, along ? 0.58 : 0.06, 2.2, along ? 0.06 : 0.58, mat("#d1d5db", { metalness: 0.5, roughness: 0.25 }), px + (along ? s * 0.3 : 0), 0, pz + (along ? 0 : s * 0.3));
      bx(ctx, along ? 0.2 : 0.06, 0.32, along ? 0.06 : 0.2, mat("#ffd400", { emissive: new THREE.Color("#806000") }), px + (along ? 0.95 : 0), 1.0, pz + (along ? 0 : 0.95));
    } else {
      bx(ctx, along ? 1.0 : 0.06, 2.1, along ? 0.06 : 1.0, r.sign === "남" ? "#3b82f6" : "#ef4444", px, 0, pz);
      const s = signSprite(r.name, r.sign === "남" ? "#2563eb" : "#dc2626", 0.6); s.position.set(px - g.inX * 0.4, 2.95, pz - g.inZ * 0.4); ctx.group.add(s);
    }
  }
}

// ---------- warp pads (엘리베이터·계단) ----------
const WARP = "#19c3ff";
function warpPad(ctx, x, z, label, face) {
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.04, 36), new THREE.MeshBasicMaterial({ color: "#9beaff", transparent: true, opacity: 0.85 }));
  disc.position.set(x, 0.035, z); ctx.group.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.08, 8, 48), new THREE.MeshBasicMaterial({ color: WARP }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.07, z); ctx.group.add(ring);
  const arrows = new THREE.Group(); arrows.position.set(x, 0.08, z); ctx.group.add(arrows);
  for (const sgn of [1, -1]) {
    const tri = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.4, 3), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    tri.rotation.x = sgn > 0 ? -Math.PI / 2 : Math.PI / 2; tri.position.set(0, 0.01, sgn * 0.42); tri.scale.y = 0.15; arrows.add(tri);
  }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 3.6, 32, 1, true), new THREE.MeshBasicMaterial({ color: WARP, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(x, 1.8, z); ctx.group.add(beam);
  const sparkM = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.9 });
  const sparks = [];
  for (let i = 0; i < 7; i++) { const sp = new THREE.Mesh(boxGeo(0.1, 0.1, 0.1), sparkM); const a = i * 0.9; sp.userData = { a, r: 0.45 + (i % 3) * 0.22, o: i / 7 }; ctx.group.add(sp); sparks.push(sp); }
  // 엘리베이터와 계단 표지가 가까이 있어도 겹치지 않게 높이를 달리해요
  const sy = label === "계단" ? 4.0 : 4.55;
  const sign = signSprite(`▲▼ ${label}`, "#0b8fd0", 0.95); sign.position.set(x, sy, z); ctx.group.add(sign);
  const sub = signSprite("밟으면 층 이동", "#26355e", 0.55); sub.position.set(x, sy - 0.88, z); ctx.group.add(sub);
  ctx.anim.push((t) => {
    ring.scale.setScalar(1 + Math.sin(t * 4) * 0.06);
    arrows.rotation.y = t * 1.2;
    beam.material.opacity = 0.16 + Math.sin(t * 3) * 0.06;
    sign.position.y = sy + Math.sin(t * 2.2) * 0.08;
    for (const sp of sparks) { const u = (t * 0.45 + sp.userData.o) % 1, a = sp.userData.a + t * 1.5; sp.position.set(x + Math.cos(a) * sp.userData.r, 0.2 + u * 3.2, z + Math.sin(a) * sp.userData.r); sp.scale.setScalar(1 - u * 0.8); }
  });
  ctx.warps.push({ x, z, label, face });
}

// ---------- interior scene ----------
export function buildInterior(def, opts) {
  const ctx = newCtx();
  ctx.groundMat = opts.groundMat;
  const level = def.level;
  const below = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: "#ffffff", map: studTex("#4fb443", [400, 400]), roughness: 0.6 }));
  below.rotation.x = -Math.PI / 2; below.position.y = -(level - 1) * 4.2 - 0.12; below.receiveShadow = level === 1;
  ctx.group.add(below);
  for (const s of def.slabs) floorPlate(ctx, s, "hall", -0.01);
  for (const t of def.terraces || []) floorPlate(ctx, t.rect, "deck", -0.01);
  // keep-out spots: doors, quiz blocks, games, gags, exits
  for (const r of def.rooms) {
    for (const d of r.doors || []) { const g = doorLine(r.rect, d); const mx = g.axis === "z" ? d.at : g.c, mz = g.axis === "z" ? g.c : d.at; ctx.keep.push({ x: mx + g.inX * 0.9, z: mz + g.inZ * 0.9, r: 1.2 }); ctx.keep.push({ x: mx - g.inX * 0.9, z: mz - g.inZ * 0.9, r: 1.0 }); }
    if (r.quizAt) ctx.keep.push({ x: r.quizAt[0], z: r.quizAt[1], r: 1.1 });
    if (r.quiz2At) ctx.keep.push({ x: r.quiz2At[0], z: r.quiz2At[1], r: 1.1 });
    if (r.gameAt) ctx.keep.push({ x: r.gameAt[0], z: r.gameAt[1], r: 1.2 });
  }
  for (const e of def.exits || []) { const mx = e.axis === "z" ? e.at : e.c, mz = e.axis === "z" ? e.c : e.at; ctx.keep.push({ x: mx, z: mz, r: 1.6 }); }
  for (const g of def.gags || []) if (g.pos) ctx.keep.push({ x: g.pos[0], z: g.pos[1], r: 0.9 });
  for (const n of def.npcs || []) ctx.keep.push({ x: n.pos[0], z: n.pos[1], r: 0.8 });
  if (def.elevator) ctx.keep.push({ x: def.elevator.x, z: def.elevator.z, r: 1.2 });
  buildWalls(ctx, def);
  // terrace railings
  for (const t of def.terraces || []) {
    const [x0, x1, z0, z1] = t.rect, gm = new THREE.MeshStandardMaterial({ color: "#8fd3ff", transparent: true, opacity: 0.4, depthWrite: false });
    for (const side of t.rails) {
      const horiz = side === "n" || side === "s", c = side === "n" ? z0 : side === "s" ? z1 : side === "w" ? x0 : x1;
      const len = horiz ? x1 - x0 : z1 - z0, mid = horiz ? (x0 + x1) / 2 : (z0 + z1) / 2;
      bx(ctx, horiz ? len : 0.08, 1.1, horiz ? 0.08 : len, gm, horiz ? mid : c, 0, horiz ? c : mid, { shadow: false });
      bx(ctx, horiz ? len : 0.14, 0.08, horiz ? 0.14 : len, "#26355e", horiz ? mid : c, 1.1, horiz ? c : mid, { shadow: false });
      staticBody(ctx, horiz ? mid : c, 2.5, horiz ? c : mid, horiz ? len + 0.3 : 0.3, 5, horiz ? 0.3 : len + 0.3);
    }
  }
  for (const r of def.rooms) {
    const rects = r.rects || [r.rect];
    if (!r.solid) for (const rc of rects) floorPlate(ctx, rc, r.floor || "hall", r.floor ? 0.012 : 0.004);
    ctx.rooms.push({ ...r, rects });
    if (r.solid) solidRoom(ctx, r);
    else if (r.kind === "stairs") stairsRoom(ctx, r);
    else if (FURNISH[r.kind]) FURNISH[r.kind](ctx, { ...r, rect: rects[0] });
    if (!r.noDex && r.name) {
      const rc = rects[0], s = signSprite(r.name, r.color || "#26355e", r.signScale || (r.outside ? 0.7 : 0.78));
      const at = r.signAt || [(rc[0] + rc[1]) / 2, (rc[2] + rc[3]) / 2];
      s.position.set(at[0], r.signY || 3.5, at[1]);
      ctx.group.add(s);
    }
  }
  ctx.warps = [];
  if (def.elevator) warpPad(ctx, def.elevator.x, def.elevator.z, "엘리베이터", def.spawns.elevator ? def.spawns.elevator.face : 0);
  for (const s of ctx.special.stairs || []) warpPad(ctx, s.x, s.z, "계단", s.face);
  return ctx;
}
// quiz blocks / game markers are placed after furniture so they can be re-coloured when solved
export function placeQuizAndGames(ctx, def, solved) {
  for (const r of ctx.rooms) {
    const at = (spot) => {
      if (spot) return spot;
      const d = r.doors && r.doors[0];
      if (!d) { const rc = r.rects[0]; return [(rc[0] + rc[1]) / 2, (rc[2] + rc[3]) / 2]; }
      const g = doorLine(r.rects[0], d), mx = g.axis === "z" ? d.at : g.c, mz = g.axis === "z" ? g.c : d.at;
      const ax = g.axis === "z" ? 1 : 0, az = g.axis === "z" ? 0 : 1;
      const rc = r.rects[0];
      let px = mx + g.inX * 1.3 + ax * 1.5, pz = mz + g.inZ * 1.3 + az * 1.5;
      if (px > rc[1] - 0.6 || pz > rc[3] - 0.6) { px = mx + g.inX * 1.3 - ax * 1.5; pz = mz + g.inZ * 1.3 - az * 1.5; }
      return [px, pz];
    };
    if (r.quiz) { const [x, z] = at(r.quizAt); quizBlock(ctx, r.quiz, x, z, solved.has(r.quiz)); ctx.interact.push({ kind: "quiz", id: r.quiz, x, z, r: 1.7, label: `${r.name} 퀴즈`, verb: "풀기", room: r.name }); }
    if (r.quiz2) { const [x, z] = r.quiz2At; quizBlock(ctx, r.quiz2, x, z, solved.has(r.quiz2)); ctx.interact.push({ kind: "quiz", id: r.quiz2, x, z, r: 1.7, label: `${r.name} 퀴즈 2`, verb: "풀기", room: r.name }); }
    if (r.game && r.gameAt) { const [x, z] = r.gameAt; gameMarker(ctx, x, z); ctx.interact.push({ kind: "game", id: r.game, x, z, r: 1.6, label: "미니게임", verb: "시작하기", room: r.name }); }
  }
}

// ---------- outdoor ----------
const OX = -14.4, OZ = -30;
const R = (x0, x1, z0, z1) => ({ x0: x0 + OX, x1: x1 + OX, z0: z0 + OZ, z1: z1 + OZ });
const FLOORS = [
  { y0: 0, y1: 4.8, boxes: [R(6.6, 28.8, 0, 6.6), R(0, 28.8, 6.4, 20)] },
  { y0: 4.8, y1: 8.7, boxes: [R(6.6, 28.8, 0, 6.6), R(28.8, 34.8, 0, 10.4), R(0, 28.8, 6.4, 20)] },
  { y0: 8.7, y1: 12.6, boxes: [R(6.6, 28.8, 0, 6.6), R(28.8, 34.8, 0, 6.4), R(0, 31, 6.4, 20)] },
  { y0: 12.6, y1: 17.1, boxes: [R(6.6, 28.8, 0, 6.6), R(0, 28.8, 6.4, 11), R(0, 20.6, 11, 20)] },
];
export const EAST = { x0: 28, x1: 50.2, z0: -27.1, z1: 39.5, h: 12.5 };
const DOOR = { x: -4.1, z: -10 };
const BENCHES = [[-11.5, -1.3], [2.5, -1.3], [12.5, -1.3]];
const JARS = { x: -12.5, z: -5.2 };
const MONUMENT = { x: -6.5, z: -0.9 };
export const OBBY = [{ x: 18, z: 0, h: 0.7, s: 1.9 }, { x: 20.3, z: -1.5, h: 1.4, s: 1.6 }, { x: 22.3, z: -3.4, h: 2.1, s: 1.6 }, { x: 21.7, z: -5.9, h: 2.8, s: 1.6 }, { x: 19.4, z: -7.3, h: 3.5, s: 2.1 }];
const CARS = [[-19.75, 3.3, 0], [-12.25, 3.3, Math.PI], [-2.25, 3.3, 0], [-9.75, 16.5, Math.PI], [1.25, 21.5, 0], [-17.25, 35.1, Math.PI]];
const NE_COLS = [-29.4, -24.8, -20.0];
const DECK_A = { x: 14.4, z: -19 }, DECK_B = { x: EAST.x0, z: -14 };
const TREES = [];
for (let z = -34; z <= 42; z += 6) TREES.push([-24.5, z]);
for (let x = -18; x <= 52; x += 7) TREES.push([x, 43.5]);
for (let x = -20; x <= 24; x += 6.5) TREES.push([x, -35.5]);
for (let z = -30; z <= 42; z += 6.5) TREES.push([54, z]);
for (let z = 7; z <= 37; z += 6) TREES.push([15.6, z]);
TREES.push([-14.6, -0.4], [14.9, -0.6]);
const P = {
  grass: "#4fb443", path: "#e6dfcc", tiles: ["#ffd25a", "#ff8a5b", "#58c4ff", "#7bd668"], grout: "#f6f1e4", asphalt: "#59606b", line: "#f4f4f4",
  wall: "#f2eee5", trim: "#26355e", glass: "#4fc3ff", doorGlass: "#2b6f98", frame: "#ffffff", fins: ["#ff4f5a", "#ffb000", "#00a2ea", "#6cc000"],
  east: "#e5e9ee", stripe: "#ff7a1a", roof: "#9ea8b3", trunk: "#86552f", leaf: ["#2f9e48", "#38b356", "#4cc265"], jar: "#7b3a20", lid: "#5c2814",
  wood: "#c98a49", stone: "#b9b2a6", obby: ["#ff4747", "#ff9a1a", "#ffd91a", "#3fd16f", "#2fb2ff"], star: "#ffd400", cars: ["#ff4747", "#2fb2ff", "#ffd91a", "#3fd16f", "#f4f4f4", "#9b7bff"],
  panel: "#24407a", crate: "#c98a49", bush: "#3cbf5c",
};
function addWindows(ctx, b, y0, h, base, bandH) {
  const wh = bandH || Math.min(h - 1.4, h > 4.5 ? 3.0 : 2.3), y = y0 + h / 2 + 0.1 - wh / 2;
  const faces = [[b.x1 - b.x0, (b.x0 + b.x1) / 2, b.z1 + 0.03, 0], [b.x1 - b.x0, (b.x0 + b.x1) / 2, b.z0 - 0.03, Math.PI], [b.z1 - b.z0, b.x1 + 0.03, (b.z0 + b.z1) / 2, Math.PI / 2], [b.z1 - b.z0, b.x0 - 0.03, (b.z0 + b.z1) / 2, -Math.PI / 2]];
  for (const [len, x, z, ry] of faces) {
    if (len < 2.5) continue;
    const t = base.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round((len - 1) / 2.6)), 1); t.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len - 1.0, wh), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3, map: t }));
    m.position.set(x, y + wh / 2, z); m.rotation.y = ry; m.receiveShadow = true;
    ctx.group.add(m);
  }
}
function carModel(ctx, color, x, z, rot) {
  item(ctx, x, z, rot, (g, add, addCyl) => {
    add(1.8, 0.7, 4.0, color, 0, 0.3, 0); add(1.5, 0.56, 2.0, P.glass, 0, 1.0, -0.2); add(1.62, 0.12, 2.1, color, 0, 1.56, -0.2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = addCyl(0.34, 0.26, "#2b2b33", sx * 0.9, 0.21, sz * 1.3); w.rotation.z = Math.PI / 2; w.position.y = 0.34; }
    for (const sx of [-1, 1]) { add(0.36, 0.16, 0.06, "#fff4b0", sx * 0.6, 0.7, 2.02); add(0.36, 0.16, 0.06, "#ff5c5c", sx * 0.6, 0.7, -2.02); }
  });
  staticBody(ctx, x, 0.8, z, Math.abs(Math.sin(rot)) > 0.5 ? 4.1 : 1.9, 1.6, Math.abs(Math.sin(rot)) > 0.5 ? 1.9 : 4.1);
}
function starShape() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 0.26 : 0.6; if (i) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  s.closePath();
  return s;
}
export function buildOutdoor(def, opts) {
  const ctx = newCtx();
  ctx.groundMat = opts.groundMat;
  const G = ctx.group;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, map: studTex(P.grass, [320, 320]) }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(15, 0, 4); ground.receiveShadow = true; G.add(ground);
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(30.4, 0.06, 9.6), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.55, map: tileTex(P.tiles, P.grout, [30.4 / 4, 9.6 / 4]) }));
  plaza.position.set(0, 0.03, -5.2); plaza.receiveShadow = true; G.add(plaza);
  bx(ctx, 13.6, 0.05, 70, P.path, 21.2, 0, 4.5, { shadow: false });
  bx(ctx, 34.8, 0.04, 37.5, P.asphalt, -4, 0, 19.25, { shadow: false });
  {
    const segs = [];
    for (let i = 0; i <= 13; i++) { segs.push([-21 + i * 2.5, 3.3]); segs.push([-21 + i * 2.5, 35.1]); }
    for (let i = 0; i <= 8; i++) { segs.push([-14 + i * 2.5, 16.5]); segs.push([-14 + i * 2.5, 21.5]); }
    const lm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.02, 5), mat(P.line), segs.length);
    const m4 = new THREE.Matrix4();
    segs.forEach(([x, z], i) => { m4.makeTranslation(x, 0.05, z); lm.setMatrixAt(i, m4); });
    lm.receiveShadow = true; G.add(lm);
    bx(ctx, 20.5, 0.02, 0.12, P.line, -3.75, 0.04, 19, { shadow: false });
  }
  CARS.forEach(([x, z, r], i) => carModel(ctx, P.cars[i % P.cars.length], x, z, r));
  const wallM = mat(P.wall), roofM = mat(P.roof), trimM = mat(P.trim);
  const winBase = windowTex(P.frame, P.glass);
  for (const f of FLOORS) {
    const h = f.y1 - f.y0;
    for (const b of f.boxes) {
      const w = b.x1 - b.x0, d = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [wallM, wallM, roofM, wallM, wallM, wallM]);
      m.position.set(cx, f.y0 + h / 2, cz); m.castShadow = m.receiveShadow = true; G.add(m); ctx.occ.push(m);
      bx(ctx, w + 0.16, 0.34, d + 0.16, trimM, cx, f.y1 - 0.34, cz, { shadow: false });
      addWindows(ctx, b, f.y0, h, winBase);
    }
  }
  for (const b of FLOORS[0].boxes) staticBody(ctx, (b.x0 + b.x1) / 2, 8.55, (b.z0 + b.z1) / 2, b.x1 - b.x0, 17.1, b.z1 - b.z0);
  let fi = 0;
  for (let x = -13.4; x <= 14; x += 3.85) { const top = x < 7.2 ? 14.2 : 12.4; bx(ctx, 0.34, top - 4.8, 0.55, P.fins[fi++ % P.fins.length], x, 4.8, -10 + 0.28); }
  {
    const signM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: signTex("순창 청소년 자치배움터", P.trim, "#ffffff", 1400, 170) });
    const m = new THREE.Mesh(new THREE.BoxGeometry(17.4, 2.0, 0.2), [trimM, trimM, trimM, trimM, signM, trimM]);
    m.position.set(-3.5, 15.5, -9.9); G.add(m);
  }
  bx(ctx, 4.6, 3.5, 0.3, trimM, DOOR.x, 0, -9.95, { shadow: false });
  bx(ctx, 3.9, 3.0, 0.34, P.doorGlass, DOOR.x, 0, -9.92, { shadow: false });
  bx(ctx, 0.09, 3.0, 0.38, P.frame, DOOR.x, 0, -9.92, { shadow: false });
  bx(ctx, 6.2, 0.36, 3.0, P.fins[0], DOOR.x, 3.62, -8.6);
  for (const s of [-1, 1]) bx(ctx, 0.22, 3.62, 0.22, trimM, DOOR.x + s * 2.9, 0, -7.25, { solid: true });
  bx(ctx, 3.0, 0.03, 1.8, P.fins[2], DOOR.x, 0.055, -8.9, { shadow: false });
  bx(ctx, 0.3, 2.8, 2.4, P.doorGlass, 14.55, 0, -22.4, { shadow: false });
  for (const z of NE_COLS) cyl(ctx, 0.32, 4.8, trimM, 20.0, 0, z, { solid: true });
  for (const [x, z] of [[2, -26], [-6, -26.5]]) bx(ctx, 2.4, 1.2, 1.6, shade(P.roof, -0.1), x, 17.1, z);
  {
    const gm = new THREE.MeshStandardMaterial({ color: P.glass, transparent: true, opacity: 0.5 });
    bx(ctx, 9.2, 1.0, 0.06, gm, 12.0, 12.6, -10.05, { shadow: false });
    bx(ctx, 0.06, 1.0, 8.4, gm, 16.55, 12.6, -14.2, { shadow: false });
  }
  for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.045, 6, 14, Math.PI), mat(P.trim)); t.position.set(17.3, 0, -26.1 + i * 0.9); t.rotation.y = Math.PI / 2; t.castShadow = true; G.add(t); }
  staticBody(ctx, 17.3, 0.45, -23.4, 0.5, 0.9, 6);
  // east wing
  const E = EAST, ew = E.x1 - E.x0, ed = E.z1 - E.z0, ecx = (E.x0 + E.x1) / 2, ecz = (E.z0 + E.z1) / 2, eastM = mat(P.east);
  {
    const m = new THREE.Mesh(new THREE.BoxGeometry(ew, E.h, ed), [eastM, eastM, roofM, eastM, eastM, eastM]);
    m.position.set(ecx, E.h / 2, ecz); m.castShadow = m.receiveShadow = true; G.add(m); ctx.occ.push(m);
  }
  staticBody(ctx, ecx, E.h / 2, ecz, ew, E.h, ed);
  addWindows(ctx, E, 0, 4.8, winBase, 3.0);
  addWindows(ctx, E, 4.8, 7.0, winBase, 4.2);
  bx(ctx, ew + 0.3, 0.5, ed + 0.3, P.stripe, ecx, E.h - 0.5, ecz, { shadow: false });
  bx(ctx, ew + 0.2, 0.3, ed + 0.2, trimM, ecx, 4.65, ecz, { shadow: false });
  ctx.occ.push(bx(ctx, 2.2, 3.4, 7.2, eastM, E.x0 - 1.1, 0, 3.9, { solid: true }));
  bx(ctx, 0.1, 2.8, 3.0, P.doorGlass, E.x0 - 2.22, 0, 3.9, { shadow: false });
  {
    const sm = new THREE.MeshStandardMaterial({ color: "#ffffff", map: signTex("롤러스케이트장 · 풋살장 · 실내체육관", P.stripe, "#ffffff", 1600, 170) }), so = mat(P.stripe);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 14), [so, sm, so, so, so, so]); m.position.set(E.x0 - 0.15, 11.2, 6); G.add(m);
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(3.0, 0.08, 1.8), mat(P.panel), 6 * 17);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0, 0)), sc = new THREE.Vector3(1, 1, 1), ps = new THREE.Vector3();
    let k = 0;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 17; j++) { ps.set(E.x0 + 2.4 + i * 3.5, E.h + 0.5, E.z0 + 3 + j * 3.6); m4.compose(ps, q, sc); pm.setMatrixAt(k++, m4); }
    G.add(pm);
  }
  {
    const L = Math.hypot(DECK_B.x - DECK_A.x, DECK_B.z - DECK_A.z), ang = Math.atan2(DECK_B.z - DECK_A.z, DECK_B.x - DECK_A.x);
    const g = new THREE.Group(); g.position.set((DECK_A.x + DECK_B.x) / 2, 0, (DECK_A.z + DECK_B.z) / 2); g.rotation.y = -ang; G.add(g);
    bx({ group: g }, L, 0.35, 3, P.wood, 0, 4.62, 0, { parent: g });
    const gm = new THREE.MeshStandardMaterial({ color: P.glass, transparent: true, opacity: 0.55 });
    for (const s of [-1, 1]) bx({ group: g }, L, 0.9, 0.08, gm, 0, 4.97, s * 1.46, { parent: g, shadow: false });
    for (const t of [-0.25, 0.25]) {
      cyl(ctx, 0.25, 4.8, trimM, 0, 0, 0, { parent: g }).position.set(t * L, 2.4, 0);
      staticBody(ctx, (DECK_A.x + DECK_B.x) / 2 + Math.cos(ang) * t * L, 2.4, (DECK_A.z + DECK_B.z) / 2 + Math.sin(ang) * t * L, 0.5, 4.8, 0.5);
    }
    const s = signSprite("교류데크", "#c98a49", 0.8); s.position.set((DECK_A.x + DECK_B.x) / 2, 6.6, (DECK_A.z + DECK_B.z) / 2); G.add(s);
  }
  TREES.forEach(([x, z], i) => {
    cyl(ctx, 0.27, 2.4, P.trunk, x, 0, z, { r2: 0.24, seg: 8 });
    const lf = new THREE.Mesh(new THREE.SphereGeometry(1.55, 14, 10), mat(P.leaf[i % 3])); lf.position.set(x, 3.3, z); lf.castShadow = true; G.add(lf);
    staticBody(ctx, x, 1.5, z, 0.5, 3, 0.5);
  });
  for (const [x, z] of BENCHES) { bx(ctx, 2.2, 0.12, 0.6, P.wood, x, 0.44, z); bx(ctx, 2.2, 0.5, 0.1, P.wood, x, 0.6, z + 0.27); for (const sx of [-0.9, 0.9]) bx(ctx, 0.12, 0.45, 0.5, P.trim, x + sx, 0, z); staticBody(ctx, x, 0.5, z, 2.2, 1, 0.75); }
  {
    bx(ctx, 4.6, 0.45, 3, P.stone, JARS.x, 0, JARS.z);
    const prof = [[0, 0], [0.3, 0], [0.44, 0.22], [0.52, 0.5], [0.47, 0.8], [0.33, 0.95], [0.3, 1.0], [0, 1.0]].map(([a, b]) => new THREE.Vector2(a, b));
    const jarG = new THREE.LatheGeometry(prof, 10), r = rng(3);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const s = 0.8 + r() * 0.35, jx = JARS.x - 1.4 + i * 1.4, jz = JARS.z - 0.65 + j * 1.3;
      const jar = new THREE.Mesh(jarG, mat(P.jar)); jar.position.set(jx, 0.45, jz); jar.scale.setScalar(s); jar.castShadow = true; G.add(jar);
      cyl(ctx, 0.35 * s, 0.1, P.lid, jx, 0.45 + s, jz, { seg: 10 });
    }
    staticBody(ctx, JARS.x, 0.8, JARS.z, 4.6, 1.6, 3);
    const s = signSprite("순창 장독대", "#7b3a20", 0.7); s.position.set(JARS.x, 2.6, JARS.z); G.add(s);
  }
  {
    const m = MONUMENT, tm = new THREE.MeshStandardMaterial({ color: "#ffffff", map: signTex("순창 청소년 자치배움터", P.fins[2], "#ffffff", 1024, 300, "창의교육마당 · 순창 창의예술미래공간 복합시설") }), side = mat(P.fins[2]);
    for (const s of [-1, 1]) bx(ctx, 0.25, 1.2, 0.25, P.trim, m.x + s * 1.9, 0, m.z);
    const pm = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.35, 0.3), [side, side, side, side, tm, side]); pm.position.set(m.x, 1.55, m.z); pm.castShadow = true; G.add(pm);
    staticBody(ctx, m.x, 1, m.z, 4.6, 2, 0.5);
  }
  OBBY.forEach((o, i) => {
    const c = P.obby[i % P.obby.length], top = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.45, map: studTex(c, [o.s / 0.5, o.s / 0.5]) }), side = mat(c);
    const m = new THREE.Mesh(new THREE.BoxGeometry(o.s, o.h, o.s), [side, side, top, side, side, side]); m.position.set(o.x, o.h / 2, o.z); m.castShadow = m.receiveShadow = true; G.add(m);
    staticBody(ctx, o.x, o.h / 2, o.z, o.s, o.h, o.s);
  });
  {
    const g = new THREE.ExtrudeGeometry(starShape(), { depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 });
    g.center();
    const star = new THREE.Mesh(g, mat(P.star, { emissive: new THREE.Color(P.star).multiplyScalar(0.35) }));
    star.position.set(19.4, 4.5, -7.3); star.castShadow = true; G.add(star);
    ctx.special.star = star;
    ctx.anim.push((t) => { star.rotation.y = t * 2.2; star.position.y = 4.5 + Math.sin(t * 2) * 0.18; });
    const s = signSprite("점프 블록", "#ff4747", 0.7); s.position.set(18, 2.6, 0); G.add(s);
  }
  // dynamic toys
  const crateT = canvasTex(128, 128, (x) => { x.fillStyle = P.crate; x.fillRect(0, 0, 128, 128); x.strokeStyle = shade(P.crate, -0.2); x.lineWidth = 10; x.strokeRect(5, 5, 118, 118); x.lineWidth = 8; x.beginPath(); x.moveTo(10, 10); x.lineTo(118, 118); x.stroke(); });
  const crateM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: crateT, roughness: 0.6 });
  for (const [x, y] of [[8.2, 0.4], [9.05, 0.4], [9.9, 0.4], [8.62, 1.21], [9.47, 1.21], [9.05, 2.02]]) {
    const b = new CANNON.Body({ mass: 0.5, material: opts.crateMat, shape: new CANNON.Box(new CANNON.Vec3(0.4, 0.4, 0.4)) });
    b.position.set(x, y, -5.5); b.sleepSpeedLimit = 0.2; ctx.bodies.push(b);
    const m = new THREE.Mesh(boxGeo(0.8, 0.8, 0.8), crateM); m.castShadow = m.receiveShadow = true; G.add(m);
    ctx.dyn.push({ body: b, mesh: m, start: b.position.clone(), kind: "crate" });
  }
  ctx.special.ball = makeBall(ctx, opts, 6.4, -3.6);
  for (const z of def.zones) {
    const [x0, x1, z0, z1] = z.rect;
    ctx.zones.push({ ...z, rects: [z.rect] });
    if (z.quiz) { quizBlock(ctx, z.quiz, z.quizAt[0], z.quizAt[1], opts.solved.has(z.quiz)); ctx.interact.push({ kind: "quiz", id: z.quiz, x: z.quizAt[0], z: z.quizAt[1], r: 1.7, label: `${z.name} 퀴즈`, verb: "풀기", room: z.name }); }
    void x0; void x1; void z0; void z1;
  }
  for (const d of def.doors) {
    const s = signSprite(`${d.label} ▶`, "#ff4fa3", 0.75); s.position.set(d.x, 3.2, d.z); G.add(s);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 32), new THREE.MeshBasicMaterial({ color: "#ff4fa3", transparent: true, opacity: 0.8 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(d.x, 0.08, d.z); G.add(ring);
    ctx.anim.push((t) => { ring.material.opacity = 0.5 + Math.sin(t * 4) * 0.3; });
    ctx.interact.push({ kind: "door", x: d.x, z: d.z, r: d.r, label: d.label, verb: d.verb, to: d.to, spawn: d.spawn });
  }
  // clouds
  const cr = rng(17);
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group(), n = 3 + Math.floor(cr() * 3);
    for (let k = 0; k < n; k++) { const s = 3 + cr() * 3; const m = new THREE.Mesh(boxGeo(s * 1.4, s * 0.8, s * 1.1), mat("#ffffff")); m.position.set(k * s * 0.9 - n * 1.5, (cr() - 0.5) * 1.5, (cr() - 0.5) * 3); g.add(m); }
    g.position.set(-80 + cr() * 180, 42 + cr() * 18, -90 + cr() * 160); G.add(g);
    ctx.anim.push((t, dt) => { g.position.x += dt * 1.2; if (g.position.x > 110) g.position.x = -90; });
  }
  // site walls
  staticBody(ctx, -26.5, 3, 4, 1, 6, 90); staticBody(ctx, 56.5, 3, 4, 1, 6, 90); staticBody(ctx, 15, 3, -38.5, 90, 6, 1); staticBody(ctx, 15, 3, 46.5, 90, 6, 1);
  return ctx;
}
export function makeBall(ctx, opts, x, z) {
  const t = canvasTex(256, 128, (c) => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, 256, 128); c.fillStyle = "#222"; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(i * 44 + (j % 2) * 22 + 10, 20 + j * 44, 11, 0, 7); c.fill(); } });
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 22, 16), new THREE.MeshStandardMaterial({ color: "#ffffff", map: t, roughness: 0.5 }));
  m.castShadow = true; ctx.group.add(m);
  const b = new CANNON.Body({ mass: 0.45, material: opts.ballMat, shape: new CANNON.Sphere(0.35), linearDamping: 0.25, angularDamping: 0.4 });
  b.position.set(x, 0.35, z);
  ctx.bodies.push(b);
  const d = { body: b, mesh: m, start: b.position.clone(), kind: "ball" };
  ctx.dyn.push(d);
  return d;
}
