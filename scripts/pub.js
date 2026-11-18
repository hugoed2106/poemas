import { auth, db, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
    sendEmailVerification, collection, addDoc,
    esAdminCliente, errorAuth, crearEstado } from "./firestore.js";

const $ = (selector) => document.querySelector(selector);
const form = $("#form");
const titleInput = $("#title");
const dateInput = $("#date");
const specialCheckbox = $("#special");
const authorSelect = $("#authors");
const poemInput = $("#poem");
const submitButton = form.querySelector('button[type="submit"]');

// La fecha empieza en hoy; la etiqueta «nuevo» se calcula sola desde la fecha.
if (!dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);

/* ---------- Contador de caracteres ---------- */
const contador = $("#contador");
function actualizarContador() {
    if (!contador) return;
    const texto = poemInput.value;
    const lineas = texto ? texto.split("\n").length : 0;
    contador.textContent = `${texto.length} caracteres · ${lineas} ${lineas === 1 ? "línea" : "líneas"}`;
}
poemInput.addEventListener("input", actualizarContador);
actualizarContador();

/* ---------- Mensajes ---------- */
const estado = crearEstado($("#estado"));

/* ---------- Publicar poema ---------- */
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    try {
        const titulo = titleInput.value.trim();
        if (!titulo) return estado("Escribe el título del poema.", "error");
        if (!dateInput.value) return estado("Elige la fecha del poema.", "error");
        if (!poemInput.value.trim()) return estado("Escribe el cuerpo del poema.", "error");
        const docRef = await addDoc(collection(db, "poemas-publicados"), {
            titulo,
            fecha: dateInput.value,
            especial: specialCheckbox.checked,
            autor: authorSelect.value,
            poema: poemInput.value
        });
        console.log("Documento escrito con ID:", docRef.id);
        estado("Poema publicado", "ok");
        form.reset();
        dateInput.value = new Date().toISOString().slice(0, 10);
        actualizarContador();
    } catch (e) {
        console.error("Error al escribir el documento: ", e);
        if (e.code === "permission-denied") {
            estado(`Firestore rechazó la acción. Comprueba que tu correo (${auth.currentUser?.email || ""}) esté en las reglas y que las publicaste.`, "error");
        } else {
            estado("No se pudo publicar el poema: " + (e.message || e.code), "error");
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
    ["#sesion", "#verificar", "#soloUsuario", "#form", "#usuario"].forEach((q) => { $(q).hidden = true; });
    if (!user) {
        $("#sesion").hidden = false;
        return;
    }
    $("#usuario").hidden = false;
    $("#correo").textContent = user.email;
    const admin = await esAdminCliente(user.email);
    // Los administradores deben verificar su correo (las reglas lo exigen).
    if (admin && !user.emailVerified) {
        $("#verCorreo").textContent = user.email;
        $("#verificar").hidden = false;
        return;
    }
    if (admin) {
        $("#form").hidden = false;
    } else {
        $("#soloUsuario").hidden = false;
    }
}

onAuthStateChanged(auth, mostrarSegunUsuario);
