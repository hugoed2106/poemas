// scripts/firestore.js
// Punto único de Firebase para toda la página.
//
// Se adapta a cualquier caso:
// - Se puede importar desde cualquier página o script: la inicialización es
//   segura aunque la app ya exista (reutiliza la app activa en vez de
//   crear otra), y funciona igual en la raíz o en cualquier subcarpeta.
// - Expone la configuración, Auth y Firestore, y re-exporta las funciones
//   de Firebase que usan las páginas, así cada script importa solo de aquí.
// - Incluye los ayudantes que antes estaban copiados en cada archivo
//   (identificador de votos, fechas, administradores, mensajes de estado).

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

export const firebaseConfig = {
    apiKey: "AIzaSyCM8fjWstKNjL4l4AbG3Z16xiYVl6s-XAA",
    authDomain: "poemas-jg.firebaseapp.com",
    projectId: "poemas-jg",
    storageBucket: "poemas-jg.firebasestorage.app",
    messagingSenderId: "619654028698",
    appId: "1:619654028698:web:2d59e97d07a7efd643ee23"
};

// Si otra página o script ya inicializó Firebase, se reutiliza esa app.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
// La base de datos del proyecto se llama "default".
export const db = getFirestore(app, "default");

export { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, sendEmailVerification }
    from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
export { doc, getDoc, setDoc, addDoc, deleteDoc, collection, getDocs, query, where, increment, writeBatch }
    from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

/* ---------- Identificadores y fechas ---------- */

// "Fácil, pero difícil" + "HE" -> "facil-pero-dificil-he" (el NFD también convierte la ñ en n).
// El identificador de los votos se arma con el título, así que al cambiar el
// título hay que mover los votos al nuevo identificador.
export function crearDataPoema(titulo, codigo) {
    const base = String(titulo || "sin-titulo")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return `${base || "sin-titulo"}-${String(codigo || "").toLowerCase()}`;
}

// "2026-11-03" -> "03/11/2026". Si no es una fecha ISO, la devuelve tal cual.
export function formatearFecha(iso) {
    const texto = String(iso || "");
    return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto.split("-").reverse().join("/") : texto;
}

// Un poema es "nuevo" si su fecha cae en el mes actual o en el mes anterior.
export function esNuevo(fechaISO, hoy = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fechaISO || ""))) return false;
    const [anio, mes] = String(fechaISO).split("-").map(Number);
    const actual = hoy.getFullYear() * 12 + hoy.getMonth();
    const delPoema = anio * 12 + (mes - 1);
    return delPoema === actual || delPoema === actual - 1;
}

/* ---------- Autores ---------- */

// JG es el autor principal: va primero; los demás se ordenan de la A a la Z.
export function ordenarAutores(autores) {
    return [...autores].sort((a, b) => {
        if (a.codigo === "HE") return -1;
        if (b.codigo === "HE") return 1;
        return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
    });
}

// Paleta de colores con nombre: el documento del autor guarda el nombre
// ("Rojo", "Lila"...), y aquí vive su tono en tema claro y en tema oscuro.
export const COLORES_AUTORES = [
    { nombre: "Rojo", claro: "#C8102E", oscuro: "#FF7A70" },
    { nombre: "Naranja", claro: "#C2410C", oscuro: "#FB923C" },
    { nombre: "Amarillo", claro: "#D9A400", oscuro: "#FACC15" },
    { nombre: "Verde", claro: "#15803D", oscuro: "#4ADE80" },
    { nombre: "Azul", claro: "#1D4ED8", oscuro: "#60A5FA" },
    { nombre: "Morado", claro: "#7E22CE", oscuro: "#C084FC" },
    { nombre: "Lila", claro: "#A86FD1", oscuro: "#C9A0E8" },
    { nombre: "Rosa", claro: "#DB2777", oscuro: "#F472B6" }
];
export function colorDeAutor(nombre) {
    return COLORES_AUTORES.find((c) => c.nombre === nombre) || COLORES_AUTORES[0];
}

// Código de poema (HE/MG/AR) -> documento en la colección "autores" (jg/mg/ar).
// Los autores nuevos usan su id en mayúsculas como código.
export const MAPA_CODIGO_AUTOR = { HE: "jg", MG: "mg", AR: "ar" };
// Enlaces profundos ya en uso: no cambian aunque se edite el nombre del autor.
export const PREFIJOS_AUTOR = { HE: "pH", MG: "pG", AR: "pA" };

// Autores base, por si su documento no existe aún en Firestore.
export const AUTORES_BASE = [
    { codigo: "HE", nombre: "𝑱𝑮", color: "Rojo" },
    { codigo: "MG", nombre: "AzDor Lupita", color: "Lila" },
    { codigo: "AR", nombre: "Angela", color: "Amarillo" }
];

// Lee la colección "autores" y la mezcla con los base: cada autor queda
// { id, codigo, nombre, color } con el color ya resuelto a { nombre, claro, oscuro }.
export async function cargarAutores() {
    const porCodigo = new Map();
    for (const base of AUTORES_BASE) {
        porCodigo.set(base.codigo, { id: MAPA_CODIGO_AUTOR[base.codigo], ...base });
    }
    try {
        const snap = await getDocs(collection(db, "autores"));
        snap.docs.forEach((d) => {
            const datos = d.data();
            const codigo = String(datos.Codigo || "").toUpperCase()
                || Object.keys(MAPA_CODIGO_AUTOR).find((c) => MAPA_CODIGO_AUTOR[c] === d.id)
                || d.id.toUpperCase();
            porCodigo.set(codigo, {
                id: d.id,
                codigo,
                nombre: datos.Nombre || datos.nombre || d.id,
                color: datos.Color || datos.color || "Rojo"
            });
        });
    } catch (e) {
        console.error("No se pudieron cargar los autores:", e);
    }
    return [...porCodigo.values()].map((a) => ({ ...a, color: colorDeAutor(a.color) }));
}

// Prefijo del enlace profundo (#pH12): el ya usado, o la primera letra libre del código.
export function prefijoDeAutor(codigo, usados) {
    if (PREFIJOS_AUTOR[codigo]) {
        usados.add(PREFIJOS_AUTOR[codigo]);
        return PREFIJOS_AUTOR[codigo];
    }
    for (const letra of String(codigo || "").toUpperCase()) {
        const p = "p" + letra;
        if (!usados.has(p)) {
            usados.add(p);
            return p;
        }
    }
    const p = "p" + String(codigo || "X").toUpperCase();
    usados.add(p);
    return p;
}

/* ---------- Administradores ---------- */

// Solo sirve para decidir qué se muestra. La seguridad real está en las reglas de Firestore.
// Se guardan hashes (SHA-256) para no dejar los correos admin a la vista en el repositorio público.
export const ADMIN_HASHES = [
    "3653a6f0d32bea8e7d2cd9cc3f3367794dccf198477932bf823b97ec9b45e731",
    "8d9f2a2da2c92f7bae013a2318bb982589e8667536b30d8a192f606892f5a6d2",
    "89b371f3721a815d6db8ada95989cf1ca1808c92b248f2e7dfefd03c390e74e7",
    "1cdf38a5cec7b70d77ff015a51ae51ff1833648b76af813bfb501ffe5f605606"
];
// Solo los dos primeros pueden agregar y eliminar autores.
export const ADMIN_PRINCIPAL_HASHES = ADMIN_HASHES.slice(0, 2);

async function hashCorreo(correo) {
    const datos = new TextEncoder().encode(String(correo || "").trim().toLowerCase());
    const buf = await crypto.subtle.digest("SHA-256", datos);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function esAdminCliente(correo) {
    return ADMIN_HASHES.includes(await hashCorreo(correo));
}
export async function esAdminPrincipal(correo) {
    return ADMIN_PRINCIPAL_HASHES.includes(await hashCorreo(correo));
}

export const mensajesAuth = {
    "auth/too-many-requests": "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    "auth/operation-not-allowed": "Ese método no está activado.",
    "auth/unauthorized-domain": "Este dominio no está autorizado."
};
export function errorAuth(e, estado) {
    if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
    console.error(e);
    if (typeof estado === "function") estado(mensajesAuth[e.code] || "No se pudo completar: " + (e.message || e.code), "error");
}

/* ---------- Mensajes de estado ---------- */

// Devuelve una función estado(texto, tipo) para un elemento #estado.
// Los mensajes "ok" se ocultan solos a los 3 segundos; los errores se quedan.
export function crearEstado(el) {
    let temporizador;
    return function estado(texto, tipo = "") {
        el.textContent = texto;
        el.className = "estado " + tipo;
        el.hidden = !texto;
        clearTimeout(temporizador);
        if (texto && tipo === "ok") temporizador = setTimeout(() => { el.hidden = true; }, 3000);
    };
}
