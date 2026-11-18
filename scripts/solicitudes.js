history.replaceState(null, "", "solicitudes.page");

import { auth, db, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
    sendEmailVerification, collection, getDocs, doc, deleteDoc,
    esAdminCliente, errorAuth, crearEstado } from "./firestore.js";

const $ = (selector) => document.querySelector(selector);
const listaSol = $("#listaSol");

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

/* ---------- Solicitudes de publicación ---------- */
let solicitudes = [];

function boton(texto, clase) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = clase;
    b.textContent = texto;
    return b;
}

function fechaTexto(f) {
    const d = f && typeof f.toDate === "function" ? f.toDate() : null;
    return d ? d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "";
}

function crearSolicitud(s) {
    const li = document.createElement("li");
    li.className = "solicitud";

    const autor = document.createElement("p");
    autor.className = "nombre";
    autor.textContent = s.autor || "(sin nombre)";
    const meta = document.createElement("p");
    meta.className = "id";
    meta.textContent = [s.correo, fechaTexto(s.fecha)].filter(Boolean).join(" · ");
    const cab = document.createElement("div");
    cab.className = "solicitudCab";
    cab.append(autor, meta);

    // textContent: el mensaje lo escribe un usuario, nunca se inserta como HTML.
    const cuerpo = document.createElement("pre");
    cuerpo.className = "solicitudCuerpo";
    cuerpo.textContent = s.mensaje || "";

    const acciones = document.createElement("div");
    acciones.className = "acciones";
    if (s.correo) {
        const responder = document.createElement("a");
        responder.className = "boton";
        responder.href = "mailto:" + encodeURIComponent(s.correo).replace("%40", "@") +
            "?subject=" + encodeURIComponent("Re: " + (s.titulo || "Solicitud de publicación"));
        responder.textContent = "Responder por correo";
        acciones.append(responder);
    }
    const bBorrar = boton("Borrar", "peligro");
    bBorrar.addEventListener("click", async () => {
        if (!confirm(`¿Borrar la solicitud de "${s.autor || "sin nombre"}"?`)) return;
        try {
            await deleteDoc(doc(db, "solicitudes", s.id));
            solicitudes = solicitudes.filter((x) => x.id !== s.id);
            pintarSolicitudes();
            estado("Solicitud borrada", "ok");
        } catch (e) {
            errorFirestore(e);
        }
    });
    acciones.append(bBorrar);

    li.append(cab, cuerpo, acciones);
    return li;
}

function pintarSolicitudes() {
    listaSol.replaceChildren(...solicitudes.map(crearSolicitud));
    $("#vacioSol").hidden = solicitudes.length > 0;
    $("#conteoSol").textContent = solicitudes.length
        ? `${solicitudes.length} solicitud${solicitudes.length === 1 ? "" : "es"}`
        : "";
}

async function cargarSolicitudes() {
    estado("Cargando...");
    try {
        const snap = await getDocs(collection(db, "solicitudes"));
        solicitudes = snap.docs
            .map((d) => ({ ...d.data(), id: d.id }))
            .sort((a, b) => (b.fecha?.toMillis?.() ?? 0) - (a.fecha?.toMillis?.() ?? 0));
        pintarSolicitudes();
        estado("");
    } catch (e) {
        errorFirestore(e);
    }
}
$("#recargarSol").addEventListener("click", cargarSolicitudes);

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
        history.replaceState(null, "", "solicitudes.page");
        listaSol.replaceChildren();
        solicitudes = [];
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
        history.replaceState(null, "", "solicitudes." + encodeURIComponent(nombre));
        cargarSolicitudes();
    } else {
        const nombre = user.email.split("@")[0];
        if (user.email.includes(".edu.mx")) {
            const dom = user.email.split("@")[1];
            history.replaceState(null, "", "solicitudes." + encodeURIComponent(nombre) + "." + encodeURIComponent(dom));
            $("#correoInstitucional").hidden = false;
        } else {
            history.replaceState(null, "", "solicitudes." + encodeURIComponent(nombre));
            $("#soloUsuario").hidden = false;
        }
    }
}

onAuthStateChanged(auth, mostrarSegunUsuario);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js', { scope: '../' });
}
