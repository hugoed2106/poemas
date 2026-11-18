// scripts/indice1.js
// Secciones de autor: las construye poemas-publicados.js desde Firestore
// (un autor nuevo tiene su propia sección) y las registra aquí.
// Este archivo solo cambia qué sección se ve; no toca los poemas.

let secciones = []; // { prefijo, btn, lista, poemas }

function setVisible(el, visible) {
    if (!el) return;
    el.hidden = !visible;
    el.style.display = visible ? "" : "none";
}

function mostrar(activo) {
    secciones.forEach((a) => {
        const visible = a === activo;
        setVisible(a.lista, visible);
        setVisible(a.poemas, visible);
    });
}

// Muestra la sección de un autor por su prefijo de hash ("pH", "pG", "pA"...).
// La usa poemas-publicados.js antes de desplazarse a un poema concreto.
window.mostrarAutor = function (prefijo) {
    const autor = secciones.find((a) => a.prefijo === prefijo);
    if (autor) mostrar(autor);
};

// El hash manda: #pH, #pG, #pA (sección) o #pH12, #pG3, #pA2 (poema concreto).
function aplicarHash() {
    const m = window.location.hash.match(/^#(p[A-Za-z]+)(\d*)$/);
    if (m) window.mostrarAutor(m[1]);
}

// poemas-publicados.js llama a esto cuando ya construyó las secciones.
window.registrarSeccionesAutores = function (lista) {
    secciones = lista;
    secciones.forEach((a) => {
        if (a.btn) a.btn.addEventListener("click", () => mostrar(a));
    });
    mostrar(null);
    aplicarHash();
};

window.addEventListener("hashchange", aplicarHash);
