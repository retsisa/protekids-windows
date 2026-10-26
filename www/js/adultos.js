// Zona de adultos: puerta con operación aleatoria + resultados del niño por niveles.
// Los datos los registra PK.record(...) (js/state.js) y se leen con PK.loadRes(). Todo queda en el teléfono.
(function () {
  "use strict";
  var PK = window.PK, $ = PK.$;
  var LIGHT = { v: "✔ Verde (está bien)", a: "✋ Amarillo (con cuidado)", r: "⛔ Rojo (alto)" };
  var LOCK_MS = 30000, MAX_FAILS = 3;
  var gate = { a: 0, b: 0, fails: 0, lockUntil: 0 };

  // ----- Puerta: multiplicación aleatoria, solo números -----
  function newProblem() {
    gate.a = 12 + Math.floor(Math.random() * 8);   // 12 a 19
    gate.b = 6 + Math.floor(Math.random() * 4);    // 6 a 9
    $("gate-q").textContent = gate.a + " × " + gate.b + " = ?";
    $("gate-input").value = "";
  }
  $("gate-input").addEventListener("input", function (e) {
    var v = e.target.value.replace(/\D/g, "").slice(0, 3);     // bloquea todo lo que no sea número
    if (v !== e.target.value) { e.target.value = v; }
  });
  $("gate-input").addEventListener("keydown", function (e) { if (e.key === "Enter") { tryEnter(); } });
  $("btn-gate").addEventListener("click", tryEnter);

  function tryEnter() {
    var msg = $("gate-msg"), now = Date.now();
    if (now < gate.lockUntil) { msg.textContent = "Demasiados intentos. Espera " + Math.ceil((gate.lockUntil - now) / 1000) + " segundos."; return; }
    var v = $("gate-input").value;
    if (!v) { msg.textContent = "Escribe el resultado."; return; }
    if (parseInt(v, 10) === gate.a * gate.b) {
      gate.fails = 0; msg.textContent = "";
      $("adult-gate").hidden = true; $("adult-results").hidden = false;
      render();
    } else {
      gate.fails += 1;
      if (gate.fails >= MAX_FAILS) { gate.fails = 0; gate.lockUntil = now + LOCK_MS; msg.textContent = "Respuesta incorrecta. Espera 30 segundos para intentar de nuevo."; }
      else { msg.textContent = "Respuesta incorrecta. Prueba con esta nueva operación."; }
      newProblem();
    }
  }

  // ----- Resultados por niveles -----
  function section(title, build) {
    var s = document.createElement("div"); s.className = "res-sec";
    var h = document.createElement("h3"); h.textContent = title; s.appendChild(h);
    build(s); $("adult-body").appendChild(s);
  }
  function none(s, text) { var p = document.createElement("p"); p.className = "none"; p.textContent = text; s.appendChild(p); }
  function list(s, items) {
    var ul = document.createElement("ul");
    items.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    s.appendChild(ul);
  }
  function sub(s, text) { var p = document.createElement("p"); p.className = "sub"; p.textContent = text; s.appendChild(p); }

  function render() {
    var r = PK.loadRes() || {}, body = $("adult-body");
    body.textContent = "";
    var keys = Object.keys(r).filter(function (k) { return k !== "fecha"; });
    if (!keys.length) {
      $("adult-date").textContent = "";
      section("Sin respuestas todavía", function (s) { none(s, "Cuando un niño juegue, sus respuestas aparecerán aquí."); });
      return;
    }
    var d = r.fecha ? new Date(r.fecha) : null;
    $("adult-date").textContent = (d && !isNaN(d)) ? "Última partida: " + d.toLocaleString("es") : "";

    section("Bienvenida · ¿Cómo te sientes hoy?", function (s) { r.animo ? list(s, [r.animo]) : none(s, "Sin respuesta"); });
    section("Nivel 1 · ¿Quién soy?", function (s) { r.personaje ? list(s, ["Eligió jugar con: " + r.personaje]) : none(s, "Sin respuesta"); });
    section("Nivel 2 · Prendas de vestir", function (s) {
      if (!r.prendas) { none(s, "Sin respuesta"); }
      else if (!r.prendas.length) { none(s, "No dejó ninguna prenda puesta."); }
      else { list(s, r.prendas); }
    });
    section("Nivel 3 · Partes de mi cuerpo", function (s) {
      var c = r.cuerpo || [];
      if (!c.length) { none(s, "No tocó partes del cuerpo."); return; }
      ["mama", "educadora", "extrano"].forEach(function (p) {
        var mine = c.filter(function (e) { return e.p === p; });
        if (!mine.length) { return; }
        sub(s, { mama: "Con mamá", educadora: "Con la educadora", extrano: "Con una persona desconocida" }[p]);
        list(s, mine.map(function (e) { return e.z + " → " + (LIGHT[e.l] || e.l); }));
      });
    });
    section("Nivel 3 · Preguntas", function (s) {
      var q = (r.preguntas || []).filter(Boolean);
      if (!q.length) { none(s, "No respondió las preguntas."); return; }
      q.forEach(function (e) {
        sub(s, e.q);
        list(s, ["Respondió: " + e.a, e.ok ? "✔ Coincide con la respuesta esperada" : "Se le explicó la respuesta con cariño"]);
      });
    });
    section("Nivel 4 · ¿A quién se lo contaría?", function (s) {
      if (!r.confianza) { none(s, "Sin respuesta"); }
      else if (!r.confianza.length) { none(s, "No eligió a nadie."); }
      else { list(s, r.confianza); }
    });
    section("Nivel 4 · ¿Cómo se siente ahora?", function (s) { r.emocion ? list(s, [r.emocion]) : none(s, "Sin respuesta"); });
    section("Actividad · ¿Qué situación le incomoda?", function (s) {
      if (!r.situaciones || !r.situaciones.length) { none(s, "Sin respuesta"); return; }
      sub(s, "Situaciones que tocó:"); list(s, r.situaciones);
      if (r.acciones && r.acciones.length) { sub(s, "Qué haría:"); list(s, r.acciones); }
    });
    section("Rompecabezas", function (s) { r.rompecabezas ? list(s, [r.rompecabezas]) : none(s, "Sin respuesta"); });
  }

  // ----- Entrada y salida -----
  PK.hooks.adults = function () {                      // siempre se entra por la puerta
    $("adult-gate").hidden = false; $("adult-results").hidden = true; $("adult-body").textContent = "";
    $("gate-msg").textContent = ""; newProblem();
    resetClear();
  };
  $("btn-adults").addEventListener("click", function () { PK.go("adults"); });
  $("btn-adult-exit").addEventListener("click", function () { PK.go("welcome"); });

  var clearTimer = null;
  function resetClear() { clearTimeout(clearTimer); $("btn-adult-clear").textContent = "🗑 Borrar resultados"; $("btn-adult-clear").setAttribute("data-sure", ""); }
  $("btn-adult-clear").addEventListener("click", function () {
    var b = $("btn-adult-clear");
    if (!b.getAttribute("data-sure")) {                // primer toque: pide confirmación
      b.setAttribute("data-sure", "1"); b.textContent = "¿Seguro? Toca otra vez para borrar";
      clearTimer = setTimeout(resetClear, 4000);
    } else { PK.clearRes(); resetClear(); render(); }
  });
})();
