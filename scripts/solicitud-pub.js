import { auth, db, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
    sendEmailVerification, collection, addDoc,
    esAdminCliente, errorAuth, crearEstado } from "./firestore.js";

const $ = (selector) => document.querySelector(selector);
const form = $("#form");
const authorInput = $("#author");
const messageInput = $("#message");
const submitButton = form.querySelector('button[type="submit"]');

const ASUNTO = "Solicitud para publicación de poema de: ";

/* ---------- Mensajes ---------- */
const estado = crearEstado($("#estado"));

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

$("#entrar").addEventListener("click", async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { errorAuth(e, estado); }
});

$("#btnReenviar").addEventListener("click", async () => {
    try {
        await sendEmailVerification(auth.currentUser);
        estado("Correo reenviado.", "ok");
    } catch (e) { errorAuth(e, estado); }
});

$("#btnYaVerifique").addEventListener("click", async () => {
    try {
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true); // refresca email_verified para las reglas
        await mostrarSegunUsuario(auth.currentUser);
        if (!auth.currentUser.emailVerified) estado("Todavía no aparece verificado. Abre el enlace del correo y vuelve a intentar.", "error");
    } catch (e) { errorAuth(e, estado); }
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

const definicion = document.querySelector("#definicion");
const definicionCuadro = document.querySelector("#definicionCuadro");
const definicionCerrar = document.querySelector("#definicionCerrar");

function mostrarOcultarDefinicion() {
    definicionCuadro.hidden = !definicionCuadro.hidden;
}
function cerrarDefinicion() {
    definicionCuadro.hidden = true;
}

definicion.addEventListener("click", mostrarOcultarDefinicion);
definicionCerrar.addEventListener("click", cerrarDefinicion);

const hoy = new Date();

const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
const fechaFormateada = hoy.toLocaleDateString('es-ES', opciones);

document.getElementById('fecha').textContent = fechaFormateada;