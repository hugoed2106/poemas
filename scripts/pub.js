import { auth, db, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
    sendEmailVerification, collection, getDocs, doc, setDoc, deleteDoc, addDoc,
    esAdminCliente, errorAuth, crearEstado, crearDataPoema, cargarAutores } from "./firestore.js";

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
async function publicar(datos) {
    const docRef = await addDoc(collection(db, "poemas-publicados"), datos);
    console.log("Documento escrito con ID:", docRef.id);
    return docRef.id;
}

function errorPublicar(e, accion = "publicar el poema") {
    console.error("Error al escribir el documento: ", e);
    if (e.code === "permission-denied") {
        estado(`Firestore rechazó la acción. Comprueba que tu correo (${auth.currentUser?.email || ""}) esté en las reglas y que las publicaste.`, "error");
    } else {
        estado(`No se pudo ${accion}: ` + (e.message || e.code), "error");
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    try {
        const titulo = titleInput.value.trim();
        if (!titulo) return estado("Escribe el título del poema.", "error");
        if (!dateInput.value) return estado("Elige la fecha del poema.", "error");
        if (!poemInput.value.trim()) return estado("Escribe el cuerpo del poema.", "error");
        await publicar({
            titulo,
            fecha: dateInput.value,
            especial: specialCheckbox.checked,
            autor: authorSelect.value,
            poema: poemInput.value
        });
        if (editandoBorrador) {
            try { await deleteDoc(doc(db, "borradores", editandoBorrador)); } catch (e) { console.error(e); }
            editandoBorrador = "";
            await cargarBorradores();
        }
        estado("Poema publicado", "ok");
        form.reset();
        dateInput.value = new Date().toISOString().slice(0, 10);
        actualizarContador();
    } catch (e) {
        errorPublicar(e);
    } finally {
        submitButton.disabled = false;
    }
});

/* ---------- Autores del formulario ---------- */
// La lista de autores sale de la colección "autores" de Firestore.
async function cargarAutoresSelect() {
    try {
        const autores = await cargarAutores();
        const actual = authorSelect.value;
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.selected = true;
        placeholder.disabled = true;
        placeholder.hidden = true;
        placeholder.textContent = "Selecciona el autor";
        authorSelect.replaceChildren(placeholder, ...autores.map((a) => {
            const o = document.createElement("option");
            o.value = a.codigo;
            o.textContent = a.nombre;
            return o;
        }));
        if (actual) authorSelect.value = actual;
    } catch (e) {
        console.error("No se pudieron cargar los autores:", e);
    }
}
cargarAutoresSelect();

/* ---------- Borradores ---------- */
// Un borrador vive en la colección "borradores" con el mismo id que tendría
// en calificaciones (crearDataPoema: título + código del autor).
let borradores = [];
let editandoBorrador = "";
const listaBorradores = $("#listaBorradores");

function boton(texto, clase) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = clase;
    b.textContent = texto;
    return b;
}

function crearFilaBorrador(b) {
    const li = document.createElement("li");
    li.className = "borrador";
    const datos = document.createElement("div");
    datos.className = "datos";
    const titulo = document.createElement("p");
    titulo.className = "nombre";
    titulo.textContent = b.titulo;
    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = `${b.autorNombre || b.autor} · ${b.fecha || "sin fecha"}`;
    datos.append(titulo, meta);
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    const bEditar = boton("Editar", "");
    const bPublicar = boton("Publicar", "primario");
    const bBorrar = boton("Eliminar", "peligro");
    acciones.append(bEditar, bPublicar, bBorrar);
    li.append(datos, acciones);

    bEditar.addEventListener("click", () => {
        titleInput.value = b.titulo;
        dateInput.value = b.fecha || "";
        specialCheckbox.checked = !!b.especial;
        authorSelect.value = b.autor;
        poemInput.value = b.poema || "";
        actualizarContador();
        editandoBorrador = b.id;
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        estado(`Editando borrador: ${b.titulo}`, "ok");
    });

    bPublicar.addEventListener("click", async () => {
        bPublicar.disabled = true;
        try {
            await publicar({ titulo: b.titulo, fecha: b.fecha, especial: !!b.especial, autor: b.autor, poema: b.poema || "" });
            await deleteDoc(doc(db, "borradores", b.id));
            if (editandoBorrador === b.id) {
                editandoBorrador = "";
                form.reset();
                dateInput.value = new Date().toISOString().slice(0, 10);
                actualizarContador();
            }
            await cargarBorradores();
            estado("Poema publicado", "ok");
        } catch (e) {
            bPublicar.disabled = false;
            errorPublicar(e);
        }
    });

    bBorrar.addEventListener("click", async () => {
        if (!confirm(`¿Eliminar el borrador "${b.titulo}"?`)) return;
        try {
            await deleteDoc(doc(db, "borradores", b.id));
            if (editandoBorrador === b.id) editandoBorrador = "";
            await cargarBorradores();
            estado("Borrador eliminado", "ok");
        } catch (e) {
            errorPublicar(e, "eliminar el borrador");
        }
    });

    return li;
}

function pintarBorradores() {
    listaBorradores.replaceChildren(...borradores.map(crearFilaBorrador));
    $("#vacioBorradores").hidden = borradores.length > 0;
}

async function cargarBorradores() {
    try {
        const snap = await getDocs(collection(db, "borradores"));
        const autores = await cargarAutores();
        const nombres = new Map(autores.map((a) => [a.codigo, a.nombre]));
        borradores = snap.docs
            .map((d) => ({ id: d.id, ...d.data(), autorNombre: nombres.get(d.data().autor) || d.data().autor }))
            .sort((x, y) => String(y.actualizado || "").localeCompare(String(x.actualizado || "")));
        pintarBorradores();
    } catch (e) {
        console.error("No se pudieron cargar los borradores:", e);
    }
}

async function guardarBorrador() {
    const titulo = titleInput.value.trim();
    const autor = authorSelect.value;
    if (!titulo) return estado("Escribe el título para guardar el borrador.", "error");
    if (!autor) return estado("Elige el autor para guardar el borrador.", "error");
    const id = crearDataPoema(titulo, autor);
    const fecha = dateInput.value || new Date().toISOString().slice(0, 10);
    try {
        await setDoc(doc(db, "borradores", id), {
            titulo,
            fecha,
            especial: specialCheckbox.checked,
            autor,
            poema: poemInput.value,
            actualizado: new Date().toISOString()
        });
        if (editandoBorrador && editandoBorrador !== id) {
            await deleteDoc(doc(db, "borradores", editandoBorrador));
        }
        editandoBorrador = id;
        await cargarBorradores();
        estado("Borrador guardado", "ok");
    } catch (e) {
        errorPublicar(e, "guardar el borrador");
    }
}
$("#guardarBorrador").addEventListener("click", guardarBorrador);

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
    ["#sesion", "#verificar", "#soloUsuario", "#form", "#borradores", "#usuario"].forEach((q) => { $(q).hidden = true; });
    if (!user) {
        $("#sesion").hidden = false;
        listaBorradores.replaceChildren();
        borradores = [];
        editandoBorrador = "";
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
        $("#borradores").hidden = false;
        cargarBorradores();
    } else {
        $("#soloUsuario").hidden = false;
    }
}

onAuthStateChanged(auth, mostrarSegunUsuario);
