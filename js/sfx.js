// 효과음과 배경음악: 파일 없이 Web Audio로 직접 만들어요.
export const Snd = {
  ctx: null, out: null, musicGain: null, on: true, musicOn: true, next: 0, step: 0, noise: null,
  init() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.out = this.ctx.createGain();
    this.out.gain.value = this.on ? 0.55 : 0;
    this.out.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.32;
    this.musicGain.connect(this.out);
    const len = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, len, len), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.next = this.ctx.currentTime + 0.3;
  },
  setOn(on) {
    this.on = on;
    if (!this.ctx) return;
    this.out.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.05);
  },
  now() { return this.ctx ? this.ctx.currentTime : performance.now() / 1000; },
  tone(f0, f1, dur, type = "sine", vol = 0.12, at = 0, dest) {
    if (!this.ctx) return;
    const c = this.ctx, t = Math.max(c.currentTime, at || c.currentTime), o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.out);
    o.start(t); o.stop(t + dur + 0.05);
  },
  burst(dur, f0, f1, vol, type = "lowpass", at = 0, dest) {
    if (!this.ctx) return;
    const c = this.ctx, t = Math.max(c.currentTime, at || c.currentTime), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise;
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.out);
    s.start(t); s.stop(t + dur + 0.05);
  },
  rel(t) { return this.ctx ? this.ctx.currentTime + t : 0; },
  jump() { this.tone(260, 520, 0.16, "square", 0.045); },
  tick() { this.tone(880, 860, 0.03, "square", 0.018); },
  ok() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.22, "triangle", 0.1, this.rel(i * 0.08))); },
  no() { this.tone(300, 200, 0.25, "sawtooth", 0.035); },
  pop() { this.tone(600, 950, 0.08, "triangle", 0.08); },
  star() { [880, 1175, 1568, 2093].forEach((f, i) => this.tone(f, f * 1.01, 0.3, "sine", 0.09, this.rel(i * 0.07))); },
  discover() { [659, 784, 988, 1319].forEach((f, i) => this.tone(f, f, 0.18, "square", 0.04, this.rel(i * 0.06))); },
  ding() { this.tone(1319, 1319, 0.6, "sine", 0.12); this.tone(1047, 1047, 0.8, "sine", 0.1, this.rel(0.25)); },
  door() { this.burst(0.35, 400, 1600, 0.12, "bandpass"); },
  kick() { this.tone(170, 60, 0.12, "sine", 0.22); },
  goal() { this.burst(1.6, 900, 2400, 0.18, "bandpass"); this.ok(); },
  ouch() { this.tone(700, 1400, 0.12, "square", 0.06); this.tone(1400, 500, 0.25, "square", 0.05, this.rel(0.12)); },
  flush() { this.burst(1.4, 2500, 300, 0.2, "lowpass"); },
  squeal() { this.tone(2400, 3200, 0.5, "sine", 0.05); },
  bell() { [1568, 2093, 1568, 2093].forEach((f, i) => this.tone(f, f, 0.9, "sine", 0.09, this.rel(i * 0.18))); },
  beep(hi) { this.tone(hi ? 1320 : 660, hi ? 1320 : 660, hi ? 0.4 : 0.15, "square", 0.06); },
  whoosh() { this.burst(0.5, 300, 1800, 0.1, "bandpass"); },
  drum(i, at = 0) {
    const t = at || (this.ctx ? this.ctx.currentTime : 0);
    if (i === 0) this.tone(150, 45, 0.3, "sine", 0.5, t);
    if (i === 1) { this.burst(0.18, 2500, 900, 0.3, "bandpass", t); this.tone(220, 180, 0.08, "triangle", 0.12, t); }
    if (i === 2) this.burst(0.05, 9000, 7000, 0.14, "highpass", t);
    if (i === 3) this.burst(1.0, 7000, 4000, 0.16, "highpass", t);
  },
  // light, bouncy background loop (C major pentatonic)
  musicTick() {
    if (!this.ctx || !this.musicOn) return;
    const c = this.ctx, spb = 60 / 112 / 2;
    if (this.next < c.currentTime - 0.2) this.next = c.currentTime + 0.05;
    const bass = [130.8, 130.8, 174.6, 196, 220, 220, 174.6, 196];
    const mel = [523, 0, 659, 784, 0, 659, 587, 0, 523, 587, 659, 0, 784, 880, 784, 0];
    while (this.next < c.currentTime + 0.25) {
      const st = this.step % 64, t = this.next;
      if (st % 4 === 0) this.tone(bass[(st >> 3) % 8], bass[(st >> 3) % 8], 0.3, "triangle", 0.16, t, this.musicGain);
      if (st % 2 === 1) this.burst(0.04, 8000, 6000, 0.035, "highpass", t, this.musicGain);
      if (st % 8 === 4) this.burst(0.12, 2200, 900, 0.05, "bandpass", t, this.musicGain);
      const m = mel[st % 16];
      if (m && st >= 16 && Math.random() < 0.85) this.tone(m, m, 0.22, "square", 0.025, t, this.musicGain);
      this.next += spb;
      this.step++;
    }
  },
};
