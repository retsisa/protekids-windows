// Un solo reproductor: iniciar un audio detiene el anterior, así nunca se superponen.
// Reproducción automática: se INTENTA al entrar a cada pantalla. Android/WebView puede bloquearla
// hasta que el niño toque algo; en ese caso queda en silencio y el botón 🔊 permite escuchar.
(function () {
  "use strict";
  var PK = window.PK;
  var A = "assets/audio/";

  // Para cambiar un audio: pon tu archivo en esa ruta (o cambia "src").
  // "text" es la voz provisional del teléfono (speechSynthesis): se usa SOLO si el archivo no existe.
  PK.AUDIO = {
    presentacion: { src: A + "educadora/presentacion.mp3", text: "¡Bienvenidos, corazones! Yo soy ProteKids. ¿Comenzamos?" },
    // CAMBIAR AUDIO DE BIENVENIDA AQUÍ (identificador: bienvenida)
    bienvenida: { src: A + "bienvenida.mp3", text: "¡Hola, hola! ¿Cómo estás? Yo muy bien, ¿y tú qué tal? ¿Cómo te sientes hoy?" },
    // CAMBIAR AUDIO DEL NIVEL 1 AQUÍ (identificador: nivel1)
    nivel1: { src: A + "educadora/nivel1.mp3", text: "¿eres niño o niña?" },
    // CAMBIAR AUDIO DE CONFIRMACIÓN AQUÍ (identificador: listo)
    listo: { src: A + "educadora/listo.mp3", text: "¿Estás listo para comenzar? Elige sí si quieres empezar o todavía no si necesitas un poquito más de tiempo." },
    // CAMBIAR AUDIO DEL NIVEL 2 AQUÍ (identificador: nivel2)
    nivel2: { src: A + "educadora/nivel2.mp3", text: "¡Vamos a vestir a nuestro personaje! Elige las prendas que más te gusten." },
    // Nivel 3 (una pregunta por persona)
    nivel3mama: { src: A + "educadora/nivel3-mama.mp3", text: "¿Qué partes de tu cuerpo puede tocar tu mamá? Toca el cuerpo." },
    nivel3educadora: { src: A + "educadora/nivel3-educadora.mp3", text: "¿Qué partes de tu cuerpo puede tocar tu profesora? Toca el cuerpo." },
    nivel3extrano: { src: A + "educadora/nivel3-extrano.mp3", text: "¿Qué partes de tu cuerpo puede tocar una persona desconocida? Toca el cuerpo." },
    // Rompecabezas
    puzzle: { src: A + "educadora/puzzle.mp3", text: "¡Hora de jugar! Toca una pieza y luego otra para cambiarlas de lugar y armar al gatito." },
    puzzlewin: { src: A + "educadora/puzzle-fin.mp3", text: "¡Lo lograste! ¡Qué bien armaste al gatito!" },
    // Nivel 4
    nivel4: { src: A + "educadora/nivel4.mp3", text: "Si alguien te toca aquí o hace algo que te incomoda, ¿a quién se lo contarías? Puedes elegir a una o más personas." },
    sentiste: { src: A + "educadora/sentiste.mp3", text: "¿Y cómo te sientes ahora? Toca la carita que se parezca a ti." },
    // Actividad: ¿Qué situación te incomoda?
    // CAMBIAR AUDIO DE SITUACIONES AQUÍ: hay 2 versiones, según el personaje elegido en el Nivel 1
    situaciones_nino: { src: A + "educadora/situaciones-nino.mp3", text: "Mira las situaciones. ¿Qué situación te pone incómodo? Toca la que no te gusta." },
    situaciones_nina: { src: A + "educadora/situaciones-nina.mp3", text: "Mira las situaciones. ¿Qué situación te pone incómoda? Toca la que no te gusta." },
    // Despedida (RECURSO PROPIO: reemplaza por la grabación original)
    despedida: { src: A + "educadora/despedida.mp3", text: "ProteKids te enseña a amar, respetar y cuidar tu cuerpo. Si algo te incomoda, ¡cuéntaselo a un adulto de confianza! ¡Protege tu cuerpo, alza tu voz y vive feliz y seguro! ¡Gracias por visitarnos! ¡Hasta una próxima aventura con ProteKids!" }
  };

  // PK.AUDIO.situaciones (y el botón 🔊 data-say="situaciones") devuelve el audio del niño o de la niña.
  Object.defineProperty(PK.AUDIO, "situaciones", {
    enumerable: false,
    get: function () { return (PK.state && PK.state.character === "nina") ? PK.AUDIO.situaciones_nina : PK.AUDIO.situaciones_nino; }
  });

  var el = new Audio();
  var token = 0;
  var playing = false, curKey = null, startedAt = 0;   // para "no repetir mientras suena lo mismo"

  function talking(on) { if (PK.Educadora) { PK.Educadora.setTalking(on); } duck(on); }

  function stop() {
    token += 1; playing = false; curKey = null;
    try { el.pause(); } catch (e) {}
    try { if (window.speechSynthesis) { window.speechSynthesis.cancel(); } } catch (e2) {}
    talking(false);
  }

  function speak(text, my, done) {
    try {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || !text) { if (my === token) { playing = false; } if (done) { done(); } return; }
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "es-ES"; u.rate = 0.9; u.pitch = 1.2;
      u.onstart = function () { if (my === token) { talking(true); } };
      u.onend = u.onerror = function () { if (my !== token) { return; } playing = false; talking(false); if (done) { done(); } };
      window.speechSynthesis.speak(u);
    } catch (e) { playing = false; talking(false); }
  }

  // item = { src, text }. Sin "src" se usa directamente la voz del teléfono.
  // key (opcional) identifica el mensaje; sirve para playOnce().
  function play(item, done, key) {
    if (!item) { return; }
    stop();
    var my = token, fell = false;
    playing = true; curKey = key || null; startedAt = Date.now();
    function fallback() {
      if (fell || my !== token) { return; }
      fell = true;
      var voiceOk = !!(window.speechSynthesis && window.SpeechSynthesisUtterance && item.text);
      if (item.onFallback) { item.onFallback(voiceOk); }   // p. ej. el lector de cuentos avisa con un mensaje amable
      speak(item.text, my, done);
    }
    if (!item.src) { fallback(); return; }
    el.onerror = fallback;
    el.onplaying = function () { if (my === token) { talking(true); } };
    el.onended = function () { if (my !== token) { return; } playing = false; talking(false); if (done) { done(); } };
    try {
      el.src = item.src;
      var p = el.play();
      if (p && p.catch) {
        p.catch(function (err) {
          if (err && err.name === "NotAllowedError") { if (my === token) { playing = false; } return; } // bloqueado por el sistema: queda en silencio
          fallback();
        });
      }
    } catch (e) { fallback(); }
  }

  // ---------- Música de fondo (canal aparte, a propósito: suena junto a la voz, más bajita) ----------
  // RECURSO PROPIO: coloca tu música aquí -> www/assets/audio/musica-fondo.mp3 (o cambia MUSIC_SRC).
  // Arranca con el primer toque del niño (Android bloquea el audio antes), va en bucle, baja el volumen
  // mientras habla la educadora, se pausa si la app pasa a segundo plano y tiene botón para silenciarla.
  // Si el archivo no existe, no pasa nada: el botón no aparece.
  var MUSIC_SRC = A + "musica-fondo.mp3", MUSIC_VOL = 0.25, MUSIC_DUCK = 0.08;
  var bg = null, bgOk = false, bgOn = true;
  function duck(on) { if (bg) { try { bg.volume = on ? MUSIC_DUCK : MUSIC_VOL; } catch (e) {} } }
  function musicBtn() { return document.getElementById("btn-music"); }
  function startMusic() {
    if (!bgOk || !bgOn || !bg) { return; }
    try { var p = bg.play(); if (p && p.catch) { p.catch(function () {}); } } catch (e) {}
  }
  function initMusic() {
    try {
      bg = new Audio();
      bg.loop = true; bg.volume = MUSIC_VOL;
      bg.addEventListener("canplay", function () { bgOk = true; var b = musicBtn(); if (b) { b.hidden = false; } });
      bg.addEventListener("error", function () { bgOk = false; var b = musicBtn(); if (b) { b.hidden = true; } });
      bg.src = MUSIC_SRC;
    } catch (e) { bg = null; return; }
    document.addEventListener("pointerdown", function once() {
      document.removeEventListener("pointerdown", once);
      startMusic();
    });
    document.addEventListener("visibilitychange", function () {
      if (!bg) { return; }
      if (document.hidden) { try { bg.pause(); } catch (e) {} } else { startMusic(); }
    });
    var b = musicBtn();
    if (b) {
      b.addEventListener("click", function () {
        bgOn = !bgOn;
        b.textContent = bgOn ? "🎵" : "🔇";
        b.setAttribute("aria-pressed", bgOn ? "false" : "true");
        if (bgOn) { startMusic(); } else { try { bg.pause(); } catch (e) {} }
      });
    }
  }
  initMusic();

  // Reproduce solo si ese mensaje (key) NO está sonando ya. Si cambia la key (otro color, otra opción) corta
  // el audio actual y suena el nuevo; si es la misma key y el audio ya terminó, vuelve a sonar.
  function playOnce(item, key) {
    if (playing && curKey === key && Date.now() - startedAt < 30000) { return false; }
    play(item, null, key);
    return true;
  }

  PK.Audio = { play: play, playOnce: playOnce, stop: stop, say: function (text) { play({ text: text }); } };
})();
