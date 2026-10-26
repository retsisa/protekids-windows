// Núcleo: recursos con alternativa, navegación con historial y Cuentos (se conserva).
(function () {
  "use strict";
  var PK = window.PK;
  function $(id) { return document.getElementById(id); }
  PK.$ = $;

  // Imagen con alternativa: si el archivo no existe, se muestra "fb" (texto o función que crea un elemento).
  PK.img = function (src, alt, fb, cls) {
    var img = new Image();
    img.alt = alt || "";
    if (cls) img.className = cls;
    img.onerror = function () {
      var el;
      if (typeof fb === "function") { el = fb(); }
      else {
        el = document.createElement("span");
        el.className = "fb";
        el.textContent = fb || "";
        el.setAttribute("role", "img");
        el.setAttribute("aria-label", alt || "");
      }
      if (cls) { cls.split(" ").forEach(function (c) { if (c) el.classList.add(c); }); }
      if (img.parentNode) img.parentNode.replaceChild(el, img);
    };
    img.src = src;
    return img;
  };

  // Silueta provisional en ropa de baño (cuando no existe nino.png / nina.png).
  PK.silhouette = function (id) {
    var d = document.createElement("div");
    d.className = "sil " + id;
    d.setAttribute("role", "img");
    d.innerHTML = "<u></u><i></i><b></b>";
    return d;
  };

  // Silueta con carita encima (alternativa de la pantalla de confirmación).
  PK.silhouetteWithFace = function (id, face) {
    var w = document.createElement("div");
    w.className = "sil-wrap";
    w.appendChild(PK.silhouette(id));
    var b = document.createElement("span");
    b.className = "badge";
    b.textContent = face || "";
    w.appendChild(b);
    return w;
  };

  PK.hydrate = function (root) {
    var nodes = (root || document).querySelectorAll("[data-img]");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var img = PK.img(n.getAttribute("data-img"), n.getAttribute("data-alt") || "",
        n.getAttribute("data-fb") || "", n.getAttribute("data-cls") || "");
      n.parentNode.replaceChild(img, n);
    }
  };

  // ----- Navegación (usa el historial: el botón atrás del teléfono también funciona) -----
  PK.hooks = {};
  var depth = 0;

  function render(id) {
    PK.Audio.stop();
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) { screens[i].classList.remove("active"); }
    $(id).classList.add("active");
    if (PK.hooks[id]) { PK.hooks[id](); }
    window.scrollTo(0, 0);
  }
  PK.go = function (id) {
    depth += 1;
    history.pushState({ id: id, depth: depth }, "");
    render(id);
  };
  PK.back = function () {
    if (depth > 0) { history.back(); } else { PK.go("welcome"); }
  };
  window.addEventListener("popstate", function (e) {
    var st = e.state || { id: "welcome", depth: 0 };
    depth = st.depth;
    render(st.id);
  });

  // ----- Cuentos -----
  // Los datos (texto + audio de cada página) están en js/cuentos.js -> PK.STORIES.
  var STORIES = PK.STORIES || [];
  var current = { story: 0, page: 0 };

  function renderList() {
    var list = $("story-list");
    list.textContent = "";
    STORIES.forEach(function (story, index) {
      var btn = document.createElement("button");
      btn.className = "story-card";
      var h = document.createElement("strong"); h.textContent = story.title;
      var d = document.createElement("span"); d.textContent = story.description || "";
      btn.appendChild(h); btn.appendChild(d);
      btn.addEventListener("click", function () { current.story = index; current.page = 0; renderPage(); PK.go("reader"); });
      list.appendChild(btn);
    });
  }

  function renderPage() {
    PK.Audio.stop();                                   // al cambiar de página se detiene el audio anterior
    var s = STORIES[current.story], p = s.pages[current.page], total = s.pages.length;
    $("story-title").textContent = s.title;
    $("story-page-title").textContent = p.title || "";
    var box = $("story-text");
    box.textContent = "";
    p.text.split("\n").forEach(function (line) {      // párrafos cortos
      if (!line.trim()) { return; }
      var para = document.createElement("p"); para.textContent = line; box.appendChild(para);
    });
    $("story-page").textContent = "Página " + (current.page + 1) + " de " + total;
    $("story-bar").style.width = Math.round(((current.page + 1) / total) * 100) + "%";
    $("story-audio-msg").textContent = "";
    $("btn-prev").disabled = current.page === 0;
    $("btn-next").disabled = current.page === total - 1;
  }

  // Escuchar la página: usa el reproductor de js/audio.js (nunca se superponen dos audios).
  function listenPage() {
    var p = STORIES[current.story].pages[current.page], msg = $("story-audio-msg");
    msg.textContent = "";
    PK.Audio.play({
      src: p.audio || null,
      text: p.text.replace(/\n/g, " "),
      onFallback: function (voiceOk) {                // el archivo no existe o falló
        msg.textContent = voiceOk
          ? "Todavía no tengo la voz grabada de esta página. ¡Te la leo con la voz del teléfono!"
          : "No pude reproducir el audio, ¡pero puedes leer el cuento!";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    PK.hydrate();
    renderList();
    $("btn-stories").addEventListener("click", function () { PK.go("stories"); });
    $("btn-back-home").addEventListener("click", function () { PK.go("welcome"); });
    $("btn-back-stories").addEventListener("click", function () { PK.go("stories"); });
    $("btn-prev").addEventListener("click", function () { if (current.page > 0) { current.page -= 1; renderPage(); } });
    $("btn-story-listen").addEventListener("click", listenPage);
    $("btn-next").addEventListener("click", function () {
      if (current.page < STORIES[current.story].pages.length - 1) { current.page += 1; renderPage(); }
    });
    var backs = document.querySelectorAll("[data-back]");
    for (var i = 0; i < backs.length; i++) { backs[i].addEventListener("click", PK.back); }
    var says = document.querySelectorAll("[data-say]");
    for (var j = 0; j < says.length; j++) {
      says[j].addEventListener("click", function (e) { PK.Audio.play(PK.AUDIO[e.currentTarget.getAttribute("data-say")]); });
    }
    history.replaceState({ id: "welcome", depth: 0 }, "");
    render("welcome");
  });
})();
