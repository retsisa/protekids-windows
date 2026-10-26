// Educadora animada ("rig" 2D) a partir de UN solo PNG, con sincronía labial según el TEXTO del diálogo.
//
// Capas (assets/images/educadora-rig/): cuerpo, antebrazo, boca cerrada y párpados. Se anima en un <canvas> a 60 fps.
//
// API: PK.Educadora.setTalking(bool) · saludar(elemento) · speakStart(texto, audioEl, srcMp3) · speakEnd()
// Si las capas no cargan, la app vuelve sola a la animación CSS anterior.
(function () {
  "use strict";
  var PK = window.PK;
  var P = "assets/images/educadora-rig/";
  var META = { W: 715, H: 1546,
    arm: { x: 0, y: 747 }, mouth: { x: 295, y: 325 },
    eyes: { l: { x: 228, y: 181, w: 130, h: 130 }, r: { x: 365, y: 249, w: 138, h: 118 } } };
  var PIVOT = { x: 152, y: 788 };          // codo (borde del puño): el antebrazo gira desde aquí
  var MOUTH_O = { x: 328.5, y: 342.5, ang: 24.7 * Math.PI / 180 }; // esquina a esquina de la sonrisa
  var PADX = 120, PADT = 24;               // margen del canvas para que la mano pueda abrirse
  var CW = META.W + PADX * 2, CH = META.H + PADT;
  var STRIP = 5, FEET = 1500;
  var WAVE_TOP = 1.95;                     // ángulo del antebrazo al saludar (radianes)

  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var IMG = {}, rigs = [], talking = false, running = false, loading = true, pending = [];
  var NOW = 0, SP = null;                  // SP = diálogo en curso

  // ---------- carga de capas ----------
  function loadAll(cb) {
    var names = { base: "base.png", arm: "forearm.png", mouth: "mouth_closed.png", eyeL: "eye_l_closed.png", eyeR: "eye_r_closed.png" };
    var left = 0, failed = false;
    Object.keys(names).forEach(function (k) {
      left += 1;
      var im = new Image();
      im.onload = function () { IMG[k] = im; left -= 1; if (!left && !failed) { cb(true); } };
      im.onerror = function () { if (!failed) { failed = true; cb(false); } };
      im.src = P + names[k];
    });
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function easeOutBack(k) { var c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }
  function easeInOut(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  // =====================================================================================
  //  TEXTO -> SÍLABAS -> FORMAS DE LA BOCA
  // =====================================================================================
  var SHAPE = {                      // ancho / profundidad de la boca (px del PNG original)
    a: { w: 38, h: 24 }, e: { w: 44, h: 13 }, i: { w: 43, h: 8 }, o: { w: 24, h: 22 }, u: { w: 19, h: 16 }
  };
  var VOWEL_RE = /[aeiouáéíóúü]+/g;
  var STRONG = { a: "a", "á": "a", e: "e", "é": "e", o: "o", "ó": "o" };
  var WEAK = { i: "i", "í": "i", u: "u", "ú": "u", "ü": "u" };
  var cacheTL = {};

  function pickVowel(group) {
    var i, ch;
    for (i = 0; i < group.length; i++) { ch = group.charAt(i); if (STRONG[ch]) { return STRONG[ch]; } }
    return WEAK[group.charAt(group.length - 1)] || "a";
  }

  function addWord(segs, word) {
    var w = word.toLowerCase();
    if (w === "y") { w = "i"; }
    var groups = [], m;
    VOWEL_RE.lastIndex = 0;
    while ((m = VOWEL_RE.exec(w))) { groups.push({ s: m.index, e: m.index + m[0].length, txt: m[0] }); }
    if (!groups.length) { return; }
    // sílaba acentuada: con tilde; si no, penúltima (termina en vocal, n, s) o última
    var n = groups.length, st = -1, k;
    for (k = 0; k < n; k++) { if (/[áéíóú]/.test(groups[k].txt)) { st = k; } }
    if (st < 0 && n > 1) { st = /[aeiouáéíóúns]$/.test(w) ? n - 2 : n - 1; }
    for (k = 0; k < n; k++) {
      var pre = w.slice(k ? groups[k - 1].e : 0, groups[k].s);
      var post = (k === n - 1) ? w.slice(groups[k].e) : "";
      segs.push({
        type: "syl", v: pickVowel(groups[k].txt),
        closure: /[bmpv]$/.test(pre),
        stress: k === st,
        wf: 1 + 0.16 * (pre.length + post.length), mark: ""
      });
    }
    segs.push({ type: "pause", wf: 0.12, mark: "" });   // pequeña separación entre palabras
  }

  function buildTimeline(text) {
    if (cacheTL[text]) { return cacheTL[text]; }
    var segs = [], re = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+|[.,;:!?…]+/g, m, tok, last;
    while ((m = re.exec(text || ""))) {
      tok = m[0];
      if (/^[.,;:!?…]/.test(tok)) {
        last = segs[segs.length - 1];
        if (last && last.type === "pause") {
          var ch = tok.charAt(tok.length - 1);
          last.mark = (ch === "…") ? "." : ch;
          last.wf = /[.!?…]/.test(ch) ? 1.7 : 0.9;
          for (var j = segs.length - 2; j >= 0; j--) { if (segs[j].type === "syl") { segs[j].mark = last.mark; break; } }
        }
      } else { addWord(segs, tok); }
    }
    var tf = 0, tv = 0;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      s.sf = tf; tf += s.wf;
      s.wv = s.type === "syl" ? s.wf : 0;   // en modo "con voz" las pausas no ocupan tiempo (ya hay silencio real)
      s.sv = tv; tv += s.wv;
    }
    var tl = { segs: segs, totalF: tf, totalV: tv, dur: tf * 0.2 / 0.9 };  // duración estimada si no hay audio
    cacheTL[text] = tl;
    return tl;
  }

  // =====================================================================================
  //  VOLUMEN DEL MP3 (envolvente cada 10 ms)
  // =====================================================================================
  var ENV = {}, ENV_WAIT = {};
  function analyze(src, cb) {
    if (ENV[src]) { cb(ENV[src]); return; }
    if (ENV_WAIT[src]) { ENV_WAIT[src].push(cb); return; }
    ENV_WAIT[src] = [cb];
    function done(v) { ENV[src] = v; var q = ENV_WAIT[src]; delete ENV_WAIT[src]; for (var i = 0; i < q.length; i++) { q[i](v); } }
    try {
      var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OAC || !window.fetch) { done(null); return; }
      window.fetch(src).then(function (r) { if (!r.ok) { throw new Error("no audio"); } return r.arrayBuffer(); })
        .then(function (buf) {
          var ctx = new OAC(1, 1, 22050);
          return new Promise(function (ok, bad) { var p = ctx.decodeAudioData(buf, ok, bad); if (p && p.then) { p.then(ok, bad); } });
        })
        .then(function (ab) { done(envelope(ab)); })
        .catch(function () { done(null); });
    } catch (e) { done(null); }
  }

  function envelope(ab) {
    var data = ab.getChannelData(0), sr = ab.sampleRate, bin = Math.max(1, Math.floor(sr * 0.01));
    var n = Math.floor(data.length / bin), rms = new Float32Array(n), i, j, s, v;
    for (i = 0; i < n; i++) {
      s = 0; for (j = 0; j < bin; j++) { v = data[i * bin + j]; s += v * v; }
      rms[i] = Math.sqrt(s / bin);
    }
    // suavizado corto
    var sm = new Float32Array(n);
    for (i = 0; i < n; i++) { sm[i] = ((rms[i - 1] || rms[i]) + 2 * rms[i] + (rms[i + 1] || rms[i])) / 4; }
    var sorted = Array.prototype.slice.call(sm).sort(function (a, b) { return a - b; });
    var ref = sorted[Math.floor(n * 0.95)] || 0.1, thr = Math.max(ref * 0.14, 0.004);
    var voiced = new Uint8Array(n);
    for (i = 0; i < n; i++) { voiced[i] = sm[i] > thr ? 1 : 0; }
    // rellenar huecos cortos (< 120 ms: son consonantes, no pausas) y quitar ruidos sueltos (< 40 ms)
    var run = 0, k;
    for (i = 0; i <= n; i++) {
      if (i < n && !voiced[i]) { run += 1; }
      else { if (run > 0 && run < 12 && i - run > 0 && i < n) { for (k = i - run; k < i; k++) { voiced[k] = 1; } } run = 0; }
    }
    run = 0;
    for (i = 0; i <= n; i++) {
      if (i < n && voiced[i]) { run += 1; }
      else { if (run > 0 && run < 4) { for (k = i - run; k < i; k++) { voiced[k] = 0; } } run = 0; }
    }
    var vc = new Float32Array(n + 1);
    for (i = 0; i < n; i++) { vc[i + 1] = vc[i] + voiced[i]; }
    return { n: n, rms: sm, ref: ref, voiced: voiced, vc: vc, total: vc[n] };
  }

  // =====================================================================================
  //  FÍSICA SUAVE (resortes) PARA QUE EL MOVIMIENTO TENGA INERCIA
  // =====================================================================================
  var S = {
    nod: { x: 0, v: 0 }, tilt: { x: 0, v: 0 }, lean: { x: 0, v: 0 }, hop: { x: 0, v: 0 }, arm: { x: 0, v: 0 },
    tiltT: 0, leanT: 0, armT: 0, qTilt: 0, nextIdle: 2, nextGest: 0, gestEnd: 0, last: 0, fired: -1
  };
  function spring(s, target, k, c, dt) { s.v += (k * (target - s.x) - c * s.v) * dt; s.x += s.v * dt; }

  function blinkSoon() {
    for (var i = 0; i < rigs.length; i++) {
      var r = rigs[i];
      if (r.blinkT0 < 0) { r.blinkAt = NOW / 1000 + r.seed + 0.05; }
    }
  }
  function gesture(angle) { S.armT = angle; S.gestEnd = NOW / 1000 + rnd(0.7, 1.1); S.nextGest = NOW / 1000 + rnd(1.6, 3.2); }

  function boundary(mark) {            // fin de frase o de grupo de palabras
    if (mark === "!") { S.hop.v += 260; gesture(0.95); blinkSoon(); }
    else if (mark === "?") { S.qTilt = 2.2; gesture(1.05); }
    else if (mark === ".") { S.qTilt = 0; S.nod.v += 90; blinkSoon(); }
    else if (mark === "," || mark === ";" || mark === ":") { S.nod.v += 45; }
  }

  function stepWorld(now) {
    var tS = now / 1000, dt = clamp((now - S.last) / 1000, 0.001, 0.033);
    if (!S.last) { dt = 0.016; }
    S.last = now;
    if (reduce) { return; }
    if (tS > S.nextIdle) {                       // vida en reposo: cambia el peso y mira a otro lado
      S.tiltT = rnd(-1.4, 1.4); S.leanT = rnd(-3, 3); S.nextIdle = tS + rnd(3.5, 7);
      if (Math.random() < 0.25) { S.hop.v += 90; }
    }
    if (SP && tS > S.nextGest) { gesture([0.5, 0.75, 1.0][Math.floor(Math.random() * 3)]); }
    if (S.armT && tS > S.gestEnd) { S.armT = 0; }
    if (!SP) { S.qTilt *= 0.97; }
    spring(S.tilt, S.tiltT + S.qTilt, 40, 7, dt);
    spring(S.lean, S.leanT, 30, 6, dt);
    spring(S.nod, 0, 140, 12, dt);
    spring(S.hop, 0, 120, 11, dt);
    spring(S.arm, S.armT, 110, 12, dt);
  }

  // =====================================================================================
  //  DIÁLOGO EN CURSO -> forma de la boca en este instante
  // =====================================================================================
  function speechTick() {
    if (!SP) { return null; }
    var tl = SP.tl, segs = tl.segs, time, env = SP.env, seg = null, u = 0, amp = 1, voiced = true, idx = -1, i;
    if (SP.audio) { time = SP.audio.currentTime; } else { time = (NOW - SP.t0) / 1000; }
    if (env) {
      var b = clamp(Math.floor(time * 100), 0, env.n - 1);
      voiced = !!env.voiced[b];
      amp = clamp(0.55 + 0.6 * env.rms[b] / env.ref, 0.55, 1.15);
      if (voiced && env.total > 0 && tl.totalV > 0) {
        var x = env.vc[b] / env.total * tl.totalV;
        for (i = 0; i < segs.length; i++) {
          if (segs[i].type === "syl" && x >= segs[i].sv && x < segs[i].sv + segs[i].wv) { seg = segs[i]; idx = i; u = (x - segs[i].sv) / segs[i].wv; break; }
        }
        if (!seg) { for (i = segs.length - 1; i >= 0; i--) { if (segs[i].type === "syl") { seg = segs[i]; idx = i; u = 0.95; break; } } }
      }
      if (voiced) { SP.wasVoiced = true; if (idx >= 0) { SP.lastIdx = idx; } }
      else if (SP.wasVoiced) {                         // acaba de callar: aplica la puntuación
        SP.wasVoiced = false;
        if (SP.lastIdx >= 0 && segs[SP.lastIdx].mark && SP.fired !== SP.lastIdx) { SP.fired = SP.lastIdx; boundary(segs[SP.lastIdx].mark); }
      }
    } else {
      var dur = (SP.audio && isFinite(SP.audio.duration) && SP.audio.duration > 0) ? SP.audio.duration : tl.dur / SP.rate;
      var xf = time / dur * tl.totalF;
      if (xf >= 0 && xf < tl.totalF) {
        for (i = 0; i < segs.length; i++) { if (xf >= segs[i].sf && xf < segs[i].sf + segs[i].wf) { seg = segs[i]; idx = i; u = (xf - segs[i].sf) / segs[i].wf; break; } }
      }
      if (seg && seg.type === "pause") {
        if (seg.mark && SP.fired !== idx) { SP.fired = idx; boundary(seg.mark); }
        seg = null; voiced = false;
      }
      if (seg) { SP.lastIdx = idx; }
    }
    if (seg && seg.type === "syl") {
      if (SP.cur !== seg) {                              // entra una sílaba nueva
        SP.cur = seg;
        if (seg.stress) { S.nod.v += 110; }              // cabeceo en la sílaba acentuada
      }
      var sh = SHAPE[seg.v], open;
      if (seg.closure && u < 0.22) { return { w: 36, h: 0.4 }; }
      var uu = seg.closure ? (u - 0.22) / 0.78 : u;
      open = Math.pow(Math.sin(Math.PI * clamp(uu * 0.96 + 0.02, 0, 1)), 0.7);
      var boost = seg.stress ? 1.12 : 1;
      return { w: 36 + (sh.w - 36) * (0.35 + 0.65 * open), h: sh.h * (0.22 + 0.78 * open) * amp * boost };
    }
    SP.cur = null;
    return { w: 36, h: 0 };
  }

  // =====================================================================================
  //  UN PERSONAJE POR CADA .edu DE LA APP
  // =====================================================================================
  function makeRig(edu) {
    var holder = edu.querySelector(".edu-img");
    if (!holder || !holder.parentNode) { return null; }
    var small = edu.classList.contains("small");
    var scale = small ? 0.3 : 0.55;
    var cv = document.createElement("canvas");
    cv.width = Math.round(CW * scale); cv.height = Math.round(CH * scale);
    cv.className = "edu-img edu-canvas";
    cv.setAttribute("role", "img");
    cv.setAttribute("aria-label", "Educadora ProteKids");
    holder.parentNode.replaceChild(cv, holder);
    edu.classList.add("rig");
    cv.addEventListener("click", function () {           // al tocarla: saluda y da un saltito
      PK.Educadora.saludar(edu); S.hop.v += 240;
    });
    return {
      edu: edu, cv: cv, ctx: cv.getContext("2d"), scale: scale,
      wave: 0, blinkAt: rnd(1, 3), blinkT0: -1, blinkDouble: false,
      vis: 0, mw: 36, mh: 0, nextVis: 0, seed: Math.random() * 10, dbg: null
    };
  }

  // formas al azar cuando se pide hablar sin texto (setTalking(true) a secas)
  var VISEMES = [{ w: 36, h: 0 }, { w: 36, h: 6 }, { w: 38, h: 24 }, { w: 24, h: 24 }, { w: 44, h: 12 }, { w: 30, h: 15 }];
  var WEIGHTS = [1, 2, 4, 2, 3, 3];
  function pickViseme(prev) {
    var tot = 0, i; for (i = 0; i < WEIGHTS.length; i++) { tot += WEIGHTS[i]; }
    for (var tries = 0; tries < 6; tries++) {
      var r = Math.random() * tot, acc = 0;
      for (i = 0; i < WEIGHTS.length; i++) { acc += WEIGHTS[i]; if (r <= acc) { break; } }
      if (i !== prev) { return i; }
    }
    return (prev + 1) % VISEMES.length;
  }

  // ---------- dibujo ----------
  function draw(r, now, target) {
    var t = now / 1000 + r.seed, ctx = r.ctx, d = r.dbg;
    if (d && d.t !== undefined) { t = d.t; }

    // saludo (ángulo del antebrazo) -------------------------------------------------
    var armA = S.arm.x + (S.armT ? Math.sin(t * 9) * 0.05 : 0) + Math.sin(t * 1.1) * 0.02, env = 0;
    if (r.wave) {
      var e = t - r.wave, D = 3.4, UP = 0.55, DOWN = 0.6;
      if (e > D) { r.wave = 0; r.edu.classList.remove("wave"); }
      else if (e < UP) { env = easeOutBack(e / UP); armA = WAVE_TOP * env; }
      else if (e > D - DOWN) { env = 1 - easeInOut((e - (D - DOWN)) / DOWN); armA = WAVE_TOP * env; }
      else { env = 1; armA = WAVE_TOP + 0.2 * Math.sin((e - UP) * 14); }
      env = clamp(env, 0, 1);
    }
    if (d && d.arm !== undefined) { armA = d.arm; env = d.arm / WAVE_TOP; }

    // movimiento del cuerpo ---------------------------------------------------------
    var sway = Math.sin(t * 0.9) * 5 + S.lean.x + env * (Math.sin(t * 2.2) * 2.5 - 4);
    var tilt = Math.sin(t * 0.6) * 0.6 + S.tilt.x + (SP ? Math.sin(t * 4.3) * 0.35 : 0) - env * 1.1;
    var breath = (Math.sin(t * 1.7) + 1) / 2;
    var nodHead = S.nod.x * 0.5;            // cabeceo (px, positivo = cabeza abajo)
    var up = breath * 4 + S.hop.x * 0.55;
    var hair = -S.tilt.v * 0.5 - S.lean.v * 0.12 - S.nod.v * 0.02;   // el pelo se retrasa respecto a la cabeza
    if (d && d.talk !== undefined) { nodHead = d.talk * 3; }
    if (reduce) { sway = 0; tilt = 0; breath = 0; nodHead = 0; up = 0; hair = 0; }
    hair = clamp(hair, -7, 7);
    function dx(y) {
      var v = sway * Math.pow(Math.max(0, (FEET - y) / FEET), 1.5) + tilt * Math.max(0, 430 - y) * 0.025;
      if (y > 430 && y < 690) { v += hair * Math.sin(Math.PI * (y - 430) / 260); }
      return v;
    }
    function dy(y) { return -up * clamp((1100 - y) / 1000, 0, 1) + nodHead * clamp((520 - y) / 420, 0, 1); }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, r.cv.width, r.cv.height);
    var s = r.scale;
    ctx.setTransform(s, 0, 0, s, PADX * s, PADT * s);
    ctx.imageSmoothingQuality = "high";

    // 1) antebrazo (va detrás del cuerpo: la manga lo tapa) -------------------------
    ctx.save();
    ctx.translate(PIVOT.x + dx(PIVOT.y), PIVOT.y + dy(PIVOT.y));
    ctx.rotate(armA);
    ctx.drawImage(IMG.arm, META.arm.x - PIVOT.x, META.arm.y - PIVOT.y);
    ctx.restore();

    // 2) cuerpo, deformado en franjas horizontales ----------------------------------
    var y = 0, y1, step, d0, d1;
    while (y < META.H) {
      step = y < 1130 ? STRIP : 26;
      y1 = Math.min(META.H, y + step);
      d0 = y + dy(y); d1 = y1 + dy(y1);
      ctx.drawImage(IMG.base, 0, y, META.W, y1 - y, dx((y + y1) / 2), d0, META.W, d1 - d0 + 0.7);
      y = y1;
    }

    // 3) parpadeo ------------------------------------------------------------------
    var lid = 0;
    if (d && d.lid !== undefined) { lid = d.lid; }
    else if (!reduce) {
      if (r.blinkT0 < 0 && t > r.blinkAt) { r.blinkT0 = t; }
      if (r.blinkT0 >= 0) {
        var be = t - r.blinkT0, C = 0.07, H = 0.05, O = 0.11;
        if (be < C) { lid = be / C; }
        else if (be < C + H) { lid = 1; }
        else if (be < C + H + O) { lid = 1 - (be - C - H) / O; }
        else {
          r.blinkT0 = -1;
          if (!r.blinkDouble && Math.random() < 0.18) { r.blinkDouble = true; r.blinkAt = t + 0.12; }
          else { r.blinkDouble = false; r.blinkAt = t + rnd(2.2, 5); }
        }
      }
    }
    if (lid > 0.02) {
      [["eyeL", META.eyes.l], ["eyeR", META.eyes.r]].forEach(function (p) {
        var b = p[1], yc = b.y + b.h / 2, hh = b.h * Math.min(1, lid);
        ctx.save();
        ctx.translate(dx(yc), dy(yc));
        ctx.beginPath(); ctx.rect(b.x, b.y, b.w, hh + (lid >= 1 ? 2 : 0)); ctx.clip();
        ctx.drawImage(IMG[p[0]], b.x, b.y);
        ctx.restore();
      });
    }

    // 4) boca ----------------------------------------------------------------------
    var tw = 36, th = 0, rate = 0.4;
    if (d && d.mouth) { r.mw = d.mouth.w; r.mh = d.mouth.h; }
    else {
      if (target) { tw = target.w; th = target.h; rate = 0.55; }
      else if (talking && !reduce) {
        if (t > r.nextVis) { r.vis = pickViseme(r.vis); r.nextVis = t + rnd(0.07, 0.14); }
        tw = VISEMES[r.vis].w; th = VISEMES[r.vis].h;
      }
      r.mw += (tw - r.mw) * rate; r.mh += (th - r.mh) * rate;
    }
    var my = MOUTH_O.y;
    ctx.save();
    ctx.translate(dx(my), dy(my));
    var closedA = r.mh < 0.8 ? 1 : (r.mh < 3 ? 1 - r.mh / 3 : 0);
    if (closedA > 0) {
      ctx.globalAlpha = closedA;
      ctx.drawImage(IMG.mouth, META.mouth.x, META.mouth.y);
      ctx.globalAlpha = 1;
    }
    if (r.mh >= 0.8) {
      var w = r.mw, h = r.mh;
      ctx.globalAlpha = r.mh < 3 ? r.mh / 3 : 1;
      ctx.translate(MOUTH_O.x, MOUTH_O.y);
      ctx.rotate(MOUTH_O.ang);
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.quadraticCurveTo(0, -2.5, w / 2, 0);
      ctx.bezierCurveTo(w * 0.42, h * 1.25, -w * 0.42, h * 1.25, -w / 2, 0);
      ctx.closePath();
      ctx.fillStyle = "#6b1f2e"; ctx.fill();
      ctx.save(); ctx.clip();
      if (h > 7) {                                   // dientes y lengua
        ctx.fillStyle = "#ffffff"; ctx.fillRect(-w / 2, -1, w, 4.2);
        ctx.fillStyle = "#ef8590";
        ctx.beginPath(); ctx.ellipse(0, h * 0.95, w * 0.3, h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      ctx.lineJoin = "round"; ctx.lineWidth = 2.6; ctx.strokeStyle = "#d9707f"; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- bucle (solo dibuja los personajes que se ven) ----------
  function frame(now) {
    if (!rigs.length) { running = false; return; }
    NOW = now;
    if (!document.hidden) {
      stepWorld(now);
      var target = speechTick();
      for (var i = 0; i < rigs.length; i++) {
        var r = rigs[i];
        if (r.cv.offsetParent !== null) { draw(r, now, target); }
      }
    }
    window.requestAnimationFrame(frame);
  }
  function start() {
    if (running) { return; }
    running = true;
    window.requestAnimationFrame(frame);
  }

  function attach() {
    var list = document.querySelectorAll(".edu");
    for (var i = 0; i < list.length; i++) {
      if (list[i].classList.contains("rig")) { continue; }
      var r = makeRig(list[i]);
      if (r) { rigs.push(r); draw(r, 0, null); }
    }
    if (rigs.length) { start(); }
    loading = false;
    var q = pending; pending = [];
    for (var j = 0; j < q.length; j++) { PK.Educadora.saludar(q[j]); }
  }

  // ---------- API pública ----------
  PK.Educadora = {
    setTalking: function (on) {
      talking = !!on;
      if (!on) { SP = null; }
      var els = document.querySelectorAll(".edu");
      for (var i = 0; i < els.length; i++) { els[i].classList.toggle("talking", talking); }
    },
    // Empieza un diálogo: texto + (opcional) elemento <audio> y su ruta mp3 para medir el volumen.
    speakStart: function (text, audioEl, src, rate) {
      var tl = buildTimeline(text || "");
      SP = { tl: tl, audio: audioEl || null, t0: performance.now(), rate: rate || 0.9, env: null,
             cur: null, lastIdx: -1, fired: -1, wasVoiced: false, src: src || null };
      S.qTilt = 0; S.nextGest = performance.now() / 1000 + 0.6;
      var mine = SP;
      if (audioEl && src) { analyze(src, function (env) { if (SP === mine) { mine.env = env; } }); }
    },
    speakEnd: function () { SP = null; },
    saludar: function (el) {
      if (!el) { return; }
      var edu = (el.classList && el.classList.contains("edu")) ? el : (el.closest ? el.closest(".edu") : null) || el;
      var found = false;
      for (var i = 0; i < rigs.length; i++) {
        if (rigs[i].edu === edu) { rigs[i].wave = performance.now() / 1000 + rigs[i].seed; found = true; }
      }
      if (!found && loading) { pending.push(edu); return; }   // aún cargando las capas: saluda al terminar
      if (!found) {                       // alternativa: animación CSS antigua
        edu.classList.remove("wave"); void edu.offsetWidth; edu.classList.add("wave");
      }
    },
    // solo para pruebas
    pose: function (o) { for (var i = 0; i < rigs.length; i++) { rigs[i].dbg = o || null; } },
    info: function () { return SP ? { voicedMode: !!SP.env, idx: SP.lastIdx, v: SP.cur && SP.cur.v, time: SP.audio ? SP.audio.currentTime : (NOW - SP.t0) / 1000 } : null; },
    timeline: buildTimeline,
    rigs: rigs
  };

  loadAll(function (ok) {
    if (!ok) {
      loading = false;
      for (var j = 0; j < pending.length; j++) { PK.Educadora.saludar(pending[j]); }
      pending = [];
      return;
    }
    function go() { window.setTimeout(attach, 0); }   // después de PK.hydrate()
    if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", go); }
    else { go(); }
  });
})();
