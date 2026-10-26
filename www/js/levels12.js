// Flujo: Bienvenida -> Nivel 1 -> Confirmación -> Nivel 2 -> (levels34.js)
(function () {
  "use strict";
  var PK = window.PK, $ = PK.$, S = PK.state;

  // CAMBIAR IMAGEN DEL NIÑO AQUÍ (campo img de "nino")
  // CAMBIAR IMAGEN DE LA NIÑA AQUÍ (campo img de "nina")
  // ratio = ancho / alto del PNG (nino.png 624x1674, nina.png 784x1326). Si cambias el dibujo, actualiza ratio
  // y vuelve a ajustar las prendas de abajo.
  var CHARACTERS = [
    { id: "nino", label: "Niño", img: "assets/images/nino.png", ratio: 624 / 1674 },
    { id: "nina", label: "Niña", img: "assets/images/nina.png", ratio: 784 / 1326 }
  ];

  // Imagen de la pantalla de confirmación según personaje + estado emocional.
  // CAMBIAR IMAGEN DEL ESTADO FELIZ AQUÍ (entradas "bien")
  // CAMBIAR IMAGEN DEL ESTADO AGOTADO AQUÍ (entradas "mal")
  var CONFIRM_IMAGES = {
    nino: { bien: { img: "assets/images/nino-feliz.png",   face: "😊", alt: "Niño feliz" },
            mal:  { img: "assets/images/nino-agotado.png", face: "😮‍💨", alt: "Niño agotado" } },
    nina: { bien: { img: "assets/images/nina-feliz.png",   face: "😊", alt: "Niña feliz" },
            mal:  { img: "assets/images/nina-agotada.png", face: "😮‍💨", alt: "Niña agotada" } }
  };

  // RECURSO PROPIO: prendas (PNG con fondo transparente; ya recortadas en assets/images/prendas/).
  // Cada prenda se coloca por separado sobre el niño y la niña: top/left/w/h son % del PNG del personaje,
  // medidos sobre nino.png y nina.png. "z" es el orden de capas (pantalón < vestido < polera < tenis).
  // Para añadir una prenda: agrega otro bloque con sus "parts" para nino y nina.
  var P = "assets/images/prendas/";
  var GARMENTS = [
    //{ id: "visera", label: "Visera", icon: P + "visera.png", emoji: "🧢", color: "#ffb74d", z: 5, parts: { nino: [{ img: P + "visera.png", top: 1, left: 22, w: 56, h: 9 }], nina: [{ img: P + "visera.png", top: 1, left: 22, w: 56, h: 9 }] } },
    { id: "polera", label: "Polera", icon: P + "polera.png", emoji: "👕", color: "#e53935", z: 3, parts: {
      nino: [{ img: P + "polera.png", top: 36.5, left: 11.5, w: 81, h: 27.36 }],
      nina: [{ img: P + "polera.png", top: 37, left: 26, w: 52, h: 27.86 }] } },
    { id: "pantalon", label: "Pantalón", icon: P + "pantalones.png", emoji: "👖", color: "#9e9e9e", z: 1, parts: {
      nino: [{ img: P + "pantalones.png", top: 59.5, left: 22, w: 60, h: 26.81 }],
      nina: [{ img: P + "pantalones.png", top: 60.5, left: 29, w: 42, h: 29.76 }] } },
    { id: "vestido", label: "Vestido", icon: P + "vestido.png", emoji: "👗", color: "#64b5f6", z: 2, parts: {
      nino: [{ img: P + "vestido.png", top: 37, left: 18.5, w: 68, h: 38.02 }],
      nina: [{ img: P + "vestido.png", top: 37, left: 28.5, w: 48, h: 42.57 }] } },
    { id: "tenis", label: "Tenis", icon: P + "tenis.png", emoji: "👟", color: "#ef5350", z: 4, parts: {
      nino: [{ img: P + "tenis-i.png", top: 90, left: 28.5, w: 17, h: 9.25 }, { img: P + "tenis-d.png", top: 90, left: 60.5, w: 17, h: 9.7 }],
      nina: [{ img: P + "tenis-i.png", top: 89, left: 32, w: 12, h: 10.36 }, { img: P + "tenis-d.png", top: 89, left: 54.5, w: 12, h: 10.86 }] } }
  ];
  PK.CHARACTERS = CHARACTERS;
  PK.byId = function (list, id) { return list.filter(function (x) { return x.id === id; })[0]; };
  var byId = PK.byId;

  // ----- Bienvenida: saluda y el niño elige cómo se siente -----
  PK.hooks.welcome = function () {
    PK.Educadora.saludar($("edu-welcome"));
    PK.Audio.play(PK.AUDIO.presentacion, function () { PK.Audio.play(PK.AUDIO.bienvenida); }); // automático si el sistema lo permite
  };
  $("btn-listen").addEventListener("click", function () {
    PK.Educadora.saludar($("edu-welcome"));
    PK.Audio.play(PK.AUDIO.presentacion, function () { PK.Audio.play(PK.AUDIO.bienvenida); });
  });
  var moods = document.querySelectorAll("[data-mood]");
  for (var m = 0; m < moods.length; m++) {
    moods[m].addEventListener("click", function (e) {
      S.mood = e.currentTarget.getAttribute("data-mood");
      PK.record("animo", S.mood === "mal" ? "Mal" : "Bien");
      PK.go("level1");
    });
  }

  // ----- Nivel 1: ¿Quién soy? -----
  function buildCharacters() {
    var box = $("char-list");
    CHARACTERS.forEach(function (c) {
      var b = document.createElement("button");
      b.className = "choice";
      b.setAttribute("data-char", c.id);
      b.setAttribute("aria-pressed", "false");
      var holder = document.createElement("span");
      holder.className = "charbox";
      holder.appendChild(PK.img(c.img, "", function () { return PK.silhouette(c.id); }, ""));
      var t = document.createElement("span");
      t.textContent = c.label;
      b.appendChild(holder); b.appendChild(t);
      b.addEventListener("click", function () { S.character = c.id; PK.record("personaje", c.label); refreshLevel1(); });
      box.appendChild(b);
    });
  }
  function refreshLevel1() {
    var btns = $("char-list").querySelectorAll("[data-char]");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-char") === S.character;
      btns[i].classList.toggle("selected", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    var c = byId(CHARACTERS, S.character);
    $("char-msg").textContent = c ? "Elegiste: " + c.label + ". ¡Puedes cambiarlo cuando quieras!" : "";
    $("btn-l1-next").disabled = !c;
  }
  PK.hooks.level1 = function () { refreshLevel1(); PK.Audio.play(PK.AUDIO.nivel1); };
  $("btn-l1-next").addEventListener("click", function () { if (S.character) { PK.go("confirm"); } });

  // ----- Confirmación: imagen según personaje + estado (se recalcula cada vez que se entra) -----
  function renderConfirmImage() {
    var cid = S.character || "nino";
    var e = CONFIRM_IMAGES[cid][S.mood === "mal" ? "mal" : "bien"];
    var box = $("confirm-img");
    box.textContent = "";
    box.appendChild(PK.img(e.img, e.alt, function () { return PK.silhouetteWithFace(cid, e.face); }, "confirm-pic"));
  }
  PK.hooks.confirm = function () {
    $("notready").hidden = true; $("wait-msg").hidden = true;
    renderConfirmImage();
    PK.Audio.play(PK.AUDIO.listo);
  };
  $("btn-ready-yes").addEventListener("click", function () { PK.go("level2"); });
  $("btn-ready-no").addEventListener("click", function () { $("notready").hidden = false; });
  $("btn-wait").addEventListener("click", function () { $("wait-msg").hidden = false; });
  $("btn-retry").addEventListener("click", function () { $("notready").hidden = true; $("wait-msg").hidden = true; });

  // ----- Nivel 2: Prendas de vestir -----
  function recordWorn() { PK.record("prendas", S.worn.map(function (id) { return byId(GARMENTS, id).label; })); }
  function renderStage() {
    var st = $("stage");
    st.textContent = "";
    var c = byId(CHARACTERS, S.character || "nino");
    st.style.aspectRatio = String(c.ratio);        // el recuadro toma la forma exacta del dibujo
    st.appendChild(PK.img(c.img, c.label, function () { return PK.silhouette(c.id); }, "base"));
    S.worn.forEach(function (gid) {
      var g = byId(GARMENTS, gid);
      (g.parts[c.id] || []).forEach(function (p) {
        var d = document.createElement("div");
        d.className = "g";
        d.style.top = p.top + "%"; d.style.left = p.left + "%";
        d.style.width = p.w + "%"; d.style.height = p.h + "%";
        d.style.zIndex = String(g.z || 1);
        d.style.setProperty("--c", g.color);
        d.appendChild(PK.img(p.img, g.label, g.emoji, ""));
        st.appendChild(d);
      });
    });
    var btns = $("tray").querySelectorAll("[data-g]");
    for (var i = 0; i < btns.length; i++) {
      var on = S.worn.indexOf(btns[i].getAttribute("data-g")) !== -1;
      btns[i].classList.toggle("selected", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    $("btn-undo").disabled = S.worn.length === 0;
  }
  function buildTray() {
    GARMENTS.forEach(function (g) {
      var b = document.createElement("button");
      b.className = "choice";
      b.setAttribute("data-g", g.id);
      b.setAttribute("aria-pressed", "false");
      b.appendChild(PK.img(g.icon, "", g.emoji, "ico"));
      var t = document.createElement("span");
      t.textContent = g.label;
      b.appendChild(t);
      b.addEventListener("click", function () {   // cada prenda se pone/quita sin bloquear a las demás
        var i = S.worn.indexOf(g.id);
        if (i === -1) { S.worn.push(g.id); } else { S.worn.splice(i, 1); }
        recordWorn();
        renderStage();
      });
      $("tray").appendChild(b);
    });
  }
  PK.hooks.level2 = function () { renderStage(); PK.Audio.play(PK.AUDIO.nivel2); };
  $("btn-undo").addEventListener("click", function () { S.worn.pop(); recordWorn(); renderStage(); });
  $("btn-reset").addEventListener("click", function () { S.worn = []; recordWorn(); renderStage(); });
  $("btn-l2-next").addEventListener("click", function () { PK.go("level3"); });

  buildCharacters();
  buildTray();
})();
