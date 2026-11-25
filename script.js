"use strict";

// ===== Reglas tomadas del código Python original =====
const PALABRA = "iMPORT";   // Distingue mayúsculas y minúsculas, igual que Python
const MAX_INTENTOS = 7;
const TIEMPO_TOTAL = 180;      // 3 minutos (requisito añadido, no existe en Python)
const ALFABETO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

const $ = (id) => document.getElementById(id);
let adivinadas = [], incorrectas = [], nombre = "Jugador";
let segundos = TIEMPO_TOTAL, temporizador = null, jugando = false, sonidoActivo = true, audio = null;

// ===== Utilidades =====
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach((p) => p.classList.remove("activa"));
  $(id).classList.add("activa");
}

function sonido(frecuencia, duracion) {
  if (!sonidoActivo) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator(), vol = audio.createGain();
    osc.frequency.value = frecuencia; osc.type = "square"; vol.gain.value = 0.04;
    osc.connect(vol); vol.connect(audio.destination);
    osc.start(); osc.stop(audio.currentTime + duracion);
  } catch (e) { /* el sonido es opcional */ }
}

function mensaje(texto, tipo) {
  const el = $("mensaje");
  el.textContent = texto;
  el.className = "mensaje " + (tipo || "");
  if (tipo === "mal") { void el.offsetWidth; el.classList.add("shake"); }
}

// ===== Teclado: 27 mayúsculas + 27 minúsculas (son letras distintas) =====
function construirTeclado() {
  const cont = $("teclado");
  cont.innerHTML = "";
  [...ALFABETO, ...ALFABETO.toLowerCase()].forEach((letra) => {
    const b = document.createElement("button");
    b.textContent = letra;
    b.dataset.letra = letra;
    b.type = "button";
    b.addEventListener("click", () => intentar(letra));
    cont.appendChild(b);
  });
}

// ===== Dibujo del progreso =====
function mostrarProgreso() {
  const progreso = [...PALABRA].map((l) => (adivinadas.includes(l) ? l : "_")).join(" ");
  $("palabra").textContent = progreso;
  $("incorrectas").textContent = "[" + incorrectas.map((l) => `'${l}'`).join(", ") + "]";
  $("intentos").textContent = MAX_INTENTOS - incorrectas.length;
  const aciertos = [...PALABRA].filter((l) => adivinadas.includes(l)).length;
  $("barra-progreso").style.width = (aciertos / PALABRA.length) * 100 + "%";
  document.querySelectorAll(".parte").forEach((p) =>
    p.classList.toggle("visible", Number(p.dataset.e) <= incorrectas.length));
  document.body.dataset.tension = incorrectas.length >= 7 ? 7 : incorrectas.length >= 5 ? 5 : incorrectas.length >= 3 ? 3 : 0;
}

// ===== Lógica principal (misma que el bucle de Python) =====
function intentar(intento) {
  if (!jugando) return;
  if (intento.length !== 1 || !/\p{L}/u.test(intento)) {
    mensaje("Escribe solo una letra.", "mal");
    return;
  }
  if (adivinadas.includes(intento) || incorrectas.includes(intento)) {
    mensaje("Ya probaste esa letra.", "mal");
    return;
  }
  const boton = document.querySelector(`#teclado button[data-letra="${intento}"]`);
  if (boton) boton.disabled = true;

  if (PALABRA.includes(intento)) {
    adivinadas.push(intento);
    if (boton) boton.classList.add("ok");
    mensaje("¡Bien!", "bien");
    sonido(660, 0.12);
  } else {
    incorrectas.push(intento);
    if (boton) boton.classList.add("mal");
    mensaje("Esa letra no está.", "mal");
    sonido(110, 0.3);
  }
  mostrarProgreso();
  verificarFin();
}

function verificarFin() {
  // Python revisa primero la victoria y luego la derrota
  if ([...PALABRA].every((l) => adivinadas.includes(l))) {
    terminar(true, "¡Ganaste! La palabra era " + PALABRA);
  } else if (incorrectas.length >= MAX_INTENTOS) {
    terminar(false, "¡Perdiste! Participa de nuevo.");
  }
}

// ===== Temporizador =====
function formatear(s) {
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

function actualizarReloj() {
  const reloj = $("reloj");
  reloj.textContent = formatear(segundos);
  reloj.classList.toggle("alerta", segundos <= 60 && segundos > 30);
  reloj.classList.toggle("critico", segundos <= 30);
}

function detenerTemporizador() {
  clearInterval(temporizador);
  temporizador = null;
}

function tick() {
  segundos--;
  actualizarReloj();
  if (segundos <= 30 && segundos > 0) sonido(880, 0.05);
  if (segundos <= 0) terminar(false, "Se acabó el tiempo. El desafío ha terminado. ¡Perdiste! Participa de nuevo.");
}

// ===== Flujo de partida =====
function iniciar() {
  detenerTemporizador();
  nombre = $("nombre").value.trim() || "Jugador";
  adivinadas = []; incorrectas = []; segundos = TIEMPO_TOTAL; jugando = true;
  construirTeclado();
  $("saludo").textContent = `Hola ${nombre}, ¡bienvenido al juego del Ahorcado!`;
  mensaje(`Que comience el juego del Ahorcado, ${nombre}.`);
  $("pantalla-final").classList.remove("victoria");
  actualizarReloj();
  mostrarProgreso();
  mostrarPantalla("pantalla-juego");
  temporizador = setInterval(tick, 1000);
}

function terminar(victoria, texto) {
  if (!jugando) return;
  jugando = false;
  detenerTemporizador();
  document.querySelectorAll("#teclado button").forEach((b) => (b.disabled = true));
  $("final-titulo").textContent = victoria ? "DESAFÍO SUPERADO" : "FIN DEL DESAFÍO";
  $("final-texto").textContent = texto;
  $("final-palabra").textContent = PALABRA;
  $("final-revelacion").hidden = !victoria;   // al perder no se revela la palabra
  $("btn-reiniciar").textContent = victoria ? "JUGAR DE NUEVO" : "VOLVER A INTENTAR";
  $("pantalla-final").classList.toggle("victoria", victoria);
  sonido(victoria ? 880 : 70, 0.5);
  setTimeout(() => mostrarPantalla("pantalla-final"), 900);
}

function reiniciar() {
  document.body.dataset.tension = 0;
  mostrarPantalla("pantalla-inicio");
}

// ===== Eventos =====
$("btn-iniciar").addEventListener("click", iniciar);
$("btn-reiniciar").addEventListener("click", reiniciar);
$("btn-sonido").addEventListener("click", (e) => {
  sonidoActivo = !sonidoActivo;
  e.target.textContent = "Sonido: " + (sonidoActivo ? "sí" : "no");
  e.target.setAttribute("aria-pressed", sonidoActivo);
});
document.addEventListener("keydown", (e) => {
  if (!jugando || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  intentar(e.key);   // respeta mayúscula/minúscula tal como se escribe
});
