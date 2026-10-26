// Estado en memoria del juego actual.
window.PK = window.PK || {};
PK.state = { mood: null, character: null, worn: [], trusted: [], feeling: null, quiz: [], situations: [], actions: [] };
PK.resetState = function () {
  var s = PK.state;
  s.mood = null; s.character = null; s.worn = []; s.trusted = []; s.feeling = null; s.quiz = []; s.situations = []; s.actions = [];
  PK.res = {};   // empieza una partida nueva; lo guardado de la anterior se conserva hasta la primera respuesta nueva
};

// Respuestas legibles para la ZONA DE ADULTOS. Se guardan SOLO en este teléfono (localStorage); nunca se envían.
// Se conserva la última partida. Se borran desde la propia zona de adultos.
PK.res = {};
var RES_KEY = "protekids_resultados";
PK.record = function (key, value) {
  PK.res[key] = value;
  PK.res.fecha = new Date().toISOString();
  try { localStorage.setItem(RES_KEY, JSON.stringify(PK.res)); } catch (e) {}
};
PK.loadRes = function () {
  try { var s = localStorage.getItem(RES_KEY); if (s) { return JSON.parse(s); } } catch (e) {}
  return PK.res;   // si el almacenamiento no está disponible, se usa lo que hay en memoria
};
PK.clearRes = function () {
  PK.res = {};
  try { localStorage.removeItem(RES_KEY); } catch (e) {}
};
