import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
    sendEmailVerification }
    from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc }
    from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCM8fjWstKNjL4l4AbG3Z16xiYVl6s-XAA",
    authDomain: "poemas-jg.firebaseapp.com",
    projectId: "poemas-jg",
    storageBucket: "poemas-jg.firebasestorage.app",
    messagingSenderId: "619654028698",
    appId: "1:619654028698:web:2d59e97d07a7efd643ee23",
    measurementId: "G-QHE41GVRSH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "default");

const $ = (selector) => document.querySelector(selector);
const form = $("#form");
const authorInput = $("#author");
const messageInput = $("#message");
const submitButton = form.querySelector('button[type="submit"]');

const ASUNTO = "Solicitud para publicación de poema de: ";

/* ---------- Mensajes ---------- */
let temporizador;
function estado(texto, tipo = "") {
    const el = $("#estado");
    el.textContent = texto;
    el.className = "estado " + tipo;
    el.hidden = !texto;
    clearTimeout(temporizador);
    if (texto && tipo === "ok") temporizador = setTimeout(() => { el.hidden = true; }, 3000);
}

/* ---------- Solicitud y vista previa ---------- */
// Se arma cada vez que se necesita, con lo que haya escrito en ese momento.
function armarSolicitud() {
    const autor = authorInput.value.trim();
    const mensaje = messageInput.value.trim();
    return {
        asunto: ASUNTO + autor,
        cuerpo: "Hola, quiero solicitar un espacio en tu página web para publicar mis poemas.\n\n" +
            (mensaje ? mensaje + "\n\n" : "") +
            "Adiós, gracias.",
        autor,
        mensaje
    };
}

function actualizarVista() {
    const c = armarSolicitud();
    $("#vpAsunto").textContent = c.asunto;
    $("#vpCuerpo").textContent = c.cuerpo;
}
authorInput.addEventListener("input", actualizarVista);
messageInput.addEventListener("input", actualizarVista);
actualizarVista();

/* ---------- Solicitud ---------- */
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const c = armarSolicitud();
    submitButton.disabled = true;
    try {
        const docRef = await addDoc(collection(db, "solicitudes"), {
            titulo: c.asunto,
            autor: c.autor,
            mensaje: c.cuerpo
        });
        console.log("Documento escrito con ID:", docRef.id);
        estado("Solicitud enviada", "ok");
        form.reset();
        actualizarVista();
    } catch (e) {
        console.error("Error al escribir el documento: ", e);
        if (e.code === "permission-denied") {
            estado(`Firestore rechazó la acción. Comprueba que tu correo (${auth.currentUser?.email || ""}) esté en las reglas y que las publicaste.`, "error");
        } else {
            estado("No se pudo enviar la solicitud: " + (e.message || e.code), "error");
        }
    } finally {
        submitButton.disabled = false;
    }
});

/* ---------- Sesión ---------- */
// Solo sirve para decidir qué se muestra. La seguridad real está en las reglas de Firestore.
// Se guardan hashes (SHA-256) para no dejar los correos admin a la vista en el repositorio público.
const ADMIN_HASHES = [
    "3653a6f0d32bea8e7d2cd9cc3f3367794dccf198477932bf823b97ec9b45e731",
    "8d9f2a2da2c92f7bae013a2318bb982589e8667536b30d8a192f606892f5a6d2"
];
async function esAdminCliente(correo) {
    const datos = new TextEncoder().encode(String(correo || "").trim().toLowerCase());
    const buf = await crypto.subtle.digest("SHA-256", datos);
    const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    return ADMIN_HASHES.includes(hex);
}

const mensajesAuth = {
    "auth/too-many-requests": "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    "auth/operation-not-allowed": "Ese método no está activado.",
    "auth/unauthorized-domain": "Este dominio no está autorizado."
};
function errorAuth(e) {
    if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
    console.error(e);
    estado(mensajesAuth[e.code] || "No se pudo completar: " + (e.message || e.code), "error");
}

$("#entrar").addEventListener("click", async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { errorAuth(e); }
});

$("#btnReenviar").addEventListener("click", async () => {
    try {
        await sendEmailVerification(auth.currentUser);
        estado("Correo reenviado.", "ok");
    } catch (e) { errorAuth(e); }
});

$("#btnYaVerifique").addEventListener("click", async () => {
    try {
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true); // refresca email_verified para las reglas
        await mostrarSegunUsuario(auth.currentUser);
        if (!auth.currentUser.emailVerified) estado("Todavía no aparece verificado. Abre el enlace del correo y vuelve a intentar.", "error");
    } catch (e) { errorAuth(e); }
});

$("#salir").addEventListener("click", () => signOut(auth));

async function mostrarSegunUsuario(user) {
    ["#sesion", "#verificar", "#soloAdmin", "#instrucciones", "#form", "#vistaPrevia", "#usuario"].forEach((q) => { $(q).hidden = true; });
    if (!user) {
        $("#sesion").hidden = false;
        return;
    }
    $("#usuario").hidden = false;
    $("#correo").textContent = user.email;
    const admin = await esAdminCliente(user.email);
    if (admin) {
        $("#soloAdmin").hidden = false;
        return;
    }
    if (!user.emailVerified) {
        $("#verCorreo").textContent = user.email;
        $("#verificar").hidden = false;
        return;
    }
    $("#instrucciones").hidden = false;
    $("#form").hidden = false;
    $("#vistaPrevia").hidden = false;
}

onAuthStateChanged(auth, mostrarSegunUsuario);
