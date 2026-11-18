history.replaceState(null, "", "estadisticas.page");

import { auth, db, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
    sendEmailVerification, collection, getDocs,
    esAdminCliente, errorAuth, crearEstado, cargarAutores, formatearFecha } from "./firestore.js";

const $ = (selector) => document.querySelector(selector);
const listaEst = $("#listaEst");

/* ---------- Mensajes ---------- */
const estado = crearEstado($("#estado"));

function errorFirestore(e) {
    console.error(e);
    if (e.code === "permission-denied") {
        const correo = auth.currentUser?.email || "";
        estado(`Firestore rechazó la acción. Comprueba que tu correo (${correo}) sea el que pusiste en las reglas y que las publicaste.`, "error");
    } else {
        estado("No se pudo completar la acción: " + (e.message || e.code), "error");
    }
}

/* ---------- Estadísticas de visitas ---------- */
let filas = [];

function crearFila(f) {
    const li = document.createElement("li");
    li.className = "fila-est";

    const datos = document.createElement("div");
    datos.className = "datos";
    const titulo = document.createElement("p");
    titulo.className = "nombre";
    titulo.textContent = f.titulo || "(sin título)";
    const meta = document.createElement("p");
    meta.className = "id";
    meta.textContent = `${f.autorNombre || ""} · ${formatearFecha(f.fecha)}`;
    datos.append(titulo, meta);

    const visitas = document.createElement("p");
    visitas.className = "visitas";
    visitas.textContent = `${f.visitas} ${f.visitas === 1 ? "visita" : "visitas"}`;

    li.append(datos, visitas);
    return li;
}

function pintarEstadisticas() {
    listaEst.replaceChildren(...filas.map(crearFila));
    $("#vacioEst").hidden = filas.length > 0;
    const total = filas.reduce((s, f) => s + f.visitas, 0);
    $("#resumenEst").textContent = filas.length
        ? `${total} visitas en total · ${filas.length} poema${filas.length === 1 ? "" : "s"} con visitas`
        : "";
}

async function cargarEstadisticas() {
    estado("Cargando...");
    try {
        const autores = await cargarAutores();
        const nombres = new Map(autores.map((a) => [a.codigo, a.nombre]));
        const snap = await getDocs(collection(db, "visitas"));
        filas = snap.docs
            .map((d) => ({
                ...d.data(),
                id: d.id,
                visitas: Number(d.data().visitas) || 0,
                autorNombre: nombres.get(d.data().autor) || d.data().autor || ""
            }))
            .sort((x, y) => y.visitas - x.visitas || String(x.titulo || "").localeCompare(String(y.titulo || ""), "es"));
        pintarEstadisticas();
        estado("");
    } catch (e) {
        errorFirestore(e);
    }
}
$("#recargarEst").addEventListener("click", cargarEstadisticas);

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
    ["#sesion", "#verificar", "#soloUsuario", "#correoInstitucional", "#panel", "#usuario"].forEach((q) => { $(q).hidden = true; });
    if (!user) {
        $("#sesion").hidden = false;
        history.replaceState(null, "", "estadisticas.page");
        listaEst.replaceChildren();
        filas = [];
        return;
    }
    $("#usuario").hidden = false;
    $("#correo").textContent = user.email;
    const admin = await esAdminCliente(user.email);
    // Los administradores sí deben verificar su correo (las reglas lo exigen).
    if (admin && !user.emailVerified) {
        $("#verCorreo").textContent = user.email;
        $("#verificar").hidden = false;
        return;
    }
    if (admin) {
        $("#panel").hidden = false;
        const nombre = user.email.split("@")[0];
        history.replaceState(null, "", "estadisticas." + encodeURIComponent(nombre));
        cargarEstadisticas();
    } else {
        const nombre = user.email.split("@")[0];
        if (user.email.includes(".edu.mx")) {
            const dom = user.email.split("@")[1];
            history.replaceState(null, "", "estadisticas." + encodeURIComponent(nombre) + "." + encodeURIComponent(dom));
            $("#correoInstitucional").hidden = false;
        } else {
            history.replaceState(null, "", "estadisticas." + encodeURIComponent(nombre));
            $("#soloUsuario").hidden = false;
        }
    }
}

onAuthStateChanged(auth, mostrarSegunUsuario);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js', { scope: '../' });
}
