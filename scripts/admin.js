history.replaceState(null, "", "admin.page");

    import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
    import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
        sendEmailVerification }
        from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
    import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc, writeBatch }
        from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

    const firebaseConfig = {
        apiKey: "AIzaSyCM8fjWstKNjL4l4AbG3Z16xiYVl6s-XAA",
        authDomain: "poemas-jg.firebaseapp.com",
        projectId: "poemas-jg",
        storageBucket: "poemas-jg.firebasestorage.app",
        messagingSenderId: "619654028698",
        appId: "1:619654028698:web:2d59e97d07a7efd643ee23"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app, "default");

    const $ = (selector) => document.querySelector(selector);
    const lista = $("#lista");

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

    function errorFirestore(e) {
        console.error(e);
        if (e.code === "permission-denied") {
            const correo = auth.currentUser?.email || "";
            estado(`Firestore rechazó la acción. Comprueba que tu correo (${correo}) sea el que pusiste en las reglas y que las publicaste.`, "error");
        } else {
            estado("No se pudo completar la acción: " + (e.message || e.code), "error");
        }
    }

    /* ---------- Validación ---------- */
    const numero = (texto) => (String(texto).trim() === "" ? NaN : Number(texto));

    function validar(suma, votos) {
        if (!Number.isInteger(suma) || !Number.isInteger(votos) || suma < 0 || votos < 0) {
            return "La suma y los votos deben ser números enteros, de 0 en adelante.";
        }
        if (votos === 0 && suma !== 0) return "Con 0 votos, la suma debe ser 0.";
        if (votos > 0 && (suma < votos || suma > votos * 5)) {
            return `Con ${votos} ${votos === 1 ? "voto" : "votos"}, la suma debe estar entre ${votos} y ${votos * 5}.`;
        }
        return "";
    }

    /* ---------- Estado de la lista ---------- */
    const AUTORES = { he: "𝑱𝑮", mg: "AzDor Lupita", ar: "Angela", sin: "Sin autor" };
    let items = [];               // { id, suma, votos, borrador? }
    let enVista = [];             // lo que se ve con el filtro y el orden actuales
    const seleccion = new Set();  // ids marcados (siempre dentro de lo que se ve)
    const vista = { autor: "todos", orden: "nombre-az", texto: "" };

    const autorDe = (id) => (id.endsWith("-he") ? "he" : id.endsWith("-mg") ? "mg" : id.endsWith("-ar") ? "ar" : "sin");
    const nombreDe = (id) => id.replace(/-(he|mg|ar)$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const promedioDe = (i) => (i.votos > 0 ? i.suma / i.votos : null);
    const txt = (x, y) => x.localeCompare(y, "es");
    const porNombre = (x, y) => txt(nombreDe(x.id), nombreDe(y.id));

    // Los poemas sin votos siempre quedan al final al ordenar por calificación
    const porCalif = (dir) => (x, y) => {
        const px = promedioDe(x), py = promedioDe(y);
        if (px === null && py === null) return porNombre(x, y);
        if (px === null) return 1;
        if (py === null) return -1;
        return (px - py) * dir || porNombre(x, y);
    };
    const ORDENES = {
        "nombre-az": porNombre,
        "nombre-za": (x, y) => porNombre(y, x),
        "id-az": (x, y) => txt(x.id, y.id),
        "id-za": (x, y) => txt(y.id, x.id),
        "autor": (x, y) => txt(AUTORES[autorDe(x.id)], AUTORES[autorDe(y.id)]) || porNombre(x, y),
        "calif-desc": porCalif(-1),
        "calif-asc": porCalif(1),
        "votos-desc": (x, y) => y.votos - x.votos || porNombre(x, y),
        "votos-asc": (x, y) => x.votos - y.votos || porNombre(x, y)
    };

    function calcularVista() {
        const t = vista.texto.trim().toLowerCase();
        enVista = items
            .filter((i) => (vista.autor === "todos" || autorDe(i.id) === vista.autor)
                && (!t || i.id.includes(t) || nombreDe(i.id).toLowerCase().includes(t)))
            .sort(ORDENES[vista.orden]);
        const ids = new Set(enVista.map((i) => i.id));
        seleccion.forEach((id) => { if (!ids.has(id)) seleccion.delete(id); });
    }

    /* ---------- Filas ---------- */
    function campoNumero(rotulo, valor) {
        const celda = document.createElement("label");
        celda.className = "celda";
        const r = document.createElement("span");
        r.className = "rotulo";
        r.textContent = rotulo;
        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.step = "1";
        input.inputMode = "numeric";
        input.value = valor;
        celda.append(r, input);
        return { celda, input };
    }

    function boton(texto, clase) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = clase;
        b.textContent = texto;
        return b;
    }

    function actualizarSeleccion() {
        const marcados = seleccion.size;
        const todo = $("#selTodo");
        todo.checked = enVista.length > 0 && marcados === enVista.length;
        todo.indeterminate = marcados > 0 && marcados < enVista.length;
        $("#borrarSel").hidden = marcados === 0;
        $("#borrarSel").textContent = `Borrar seleccionados (${marcados})`;
        $("#conteo").textContent = `${marcados ? marcados + " seleccionado" + (marcados === 1 ? "" : "s") + " · " : ""}${enVista.length} de ${items.length} poemas`;
    }

    function pintar() {
        calcularVista();
        lista.replaceChildren(...enVista.map(crearFila));
        const vacio = $("#vacio");
        vacio.hidden = enVista.length > 0;
        vacio.textContent = items.length
            ? "Ningún poema coincide con el filtro."
            : "Todavía no hay poemas con votos. Agrega uno abajo o espera el primer voto en tu página.";
        actualizarSeleccion();
    }

    function crearFila(item) {
        const id = item.id;
        const fila = document.createElement("li");
        fila.className = "fila";
        fila.dataset.id = id;

        const marca = document.createElement("input");
        marca.type = "checkbox";
        marca.className = "marca";
        marca.checked = seleccion.has(id);
        marca.setAttribute("aria-label", "Seleccionar " + nombreDe(id));
        marca.addEventListener("change", () => {
            if (marca.checked) seleccion.add(id); else seleccion.delete(id);
            actualizarSeleccion();
        });

        const poemaNombre = document.createElement("p");
        poemaNombre.className = "nombre";
        poemaNombre.textContent = nombreDe(id);

        const etiqueta = document.createElement("span");
        etiqueta.className = "autor autor-" + autorDe(id);
        etiqueta.textContent = AUTORES[autorDe(id)];

        const poemaId = document.createElement("p");
        poemaId.className = "id";
        poemaId.textContent = id;

        const datosPoema = document.createElement("div");
        datosPoema.className = "datosPoema";
        datosPoema.append(poemaNombre, poemaId, etiqueta);

        const cabeza = document.createElement("div");
        cabeza.className = "cabezaFila";
        cabeza.append(marca, datosPoema);

        const s = campoNumero("Suma", item.borrador ? item.borrador.suma : item.suma);
        const v = campoNumero("Votos", item.borrador ? item.borrador.votos : item.votos);

        const p = document.createElement("div");
        p.className = "celda";
        const pr = document.createElement("span");
        pr.className = "rotulo";
        pr.textContent = "Promedio";
        const pv = document.createElement("span");
        pv.className = "promedio";
        p.append(pr, pv);

        const acciones = document.createElement("div");
        acciones.className = "acciones";
        const bGuardar = boton("Guardar cambios", "primario");
        const bBorrar = boton("Borrar", "peligro");
        acciones.append(bGuardar, bBorrar);

        const actual = () => ({ suma: numero(s.input.value), votos: numero(v.input.value) });

        function refrescar() {
            const a = actual();
            const cambio = s.input.value !== String(item.suma) || v.input.value !== String(item.votos);
            if (cambio) item.borrador = { suma: s.input.value, votos: v.input.value }; else delete item.borrador;
            fila.classList.toggle("cambiado", cambio);
            bGuardar.disabled = !cambio;
            pv.textContent = a.votos > 0 && Number.isFinite(a.suma) ? (a.suma / a.votos).toFixed(2) : "-";
        }

        s.input.addEventListener("input", refrescar);
        v.input.addEventListener("input", refrescar);

        bGuardar.addEventListener("click", async () => {
            const a = actual();
            const error = validar(a.suma, a.votos);
            if (error) return estado(error, "error");
            bGuardar.disabled = true;
            try {
                await setDoc(doc(db, "poemas", id), a);
                item.suma = a.suma;
                item.votos = a.votos;
                delete item.borrador;
                pintar();
                estado(`Guardado: ${id}`, "ok");
            } catch (e) {
                refrescar();
                errorFirestore(e);
            }
        });

        bBorrar.addEventListener("click", async () => {
            if (!confirm(`¿Borrar "${id}"? Se perderán sus ${item.votos} votos.`)) return;
            try {
                await deleteDoc(doc(db, "poemas", id));
                items = items.filter((i) => i.id !== id);
                seleccion.delete(id);
                pintar();
                estado(`Borrado: ${id}`, "ok");
            } catch (e) {
                errorFirestore(e);
            }
        });

        fila.append(cabeza, s.celda, v.celda, p, acciones);
        refrescar();
        return fila;
    }

    /* ---------- Filtros, orden y selección ---------- */
    $("#buscar").addEventListener("input", (e) => { vista.texto = e.target.value; pintar(); });
    $("#filtroAutor").addEventListener("change", (e) => { vista.autor = e.target.value; pintar(); });
    $("#orden").addEventListener("change", (e) => { vista.orden = e.target.value; pintar(); });

    $("#selTodo").addEventListener("change", (e) => {
        enVista.forEach((i) => { if (e.target.checked) seleccion.add(i.id); else seleccion.delete(i.id); });
        pintar();
    });

    $("#borrarSel").addEventListener("click", async () => {
        const ids = [...seleccion];
        if (!ids.length) return;
        if (!confirm(`¿Borrar ${ids.length} poema${ids.length === 1 ? "" : "s"}? Se perderán sus votos.`)) return;
        try {
            for (let i = 0; i < ids.length; i += 400) {
                const lote = writeBatch(db);
                ids.slice(i, i + 400).forEach((id) => lote.delete(doc(db, "poemas", id)));
                await lote.commit();
            }
            items = items.filter((i) => !seleccion.has(i.id));
            seleccion.clear();
            pintar();
            estado(`Borrados: ${ids.length}`, "ok");
        } catch (e) {
            errorFirestore(e);
        }
    });

    /* ---------- Cargar ---------- */
    async function cargar() {
        estado("Cargando...");
        try {
            const snap = await getDocs(collection(db, "poemas"));
            items = snap.docs.map((d) => ({
                id: d.id,
                suma: Number(d.data().suma) || 0,
                votos: Number(d.data().votos) || 0
            }));
            seleccion.clear();
            pintar();
            estado("");
        } catch (e) {
            errorFirestore(e);
        }
    }

    /* ---------- Agregar ---------- */
    $("#formNuevo").addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const id = $("#nuevoId").value
            .trim()
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9_-]/g, "");
        const suma = numero($("#nuevoSuma").value);
        const votos = numero($("#nuevoVotos").value);

        if (!id || id.includes("/") || id === "." || id === "..") {
            return estado("El identificador no puede estar vacío ni contener «/».", "error");
        }
        if (items.some((i) => i.id === id)) {
            return estado("Ya existe un poema con ese identificador. Edítalo en la lista.", "error");
        }
        const error = validar(suma, votos);
        if (error) return estado(error, "error");

        try {
            await setDoc(doc(db, "poemas", id), { suma, votos });
            $("#formNuevo").reset();
            await cargar();
            estado(`Agregado: ${id}`, "ok");
        } catch (e) {
            errorFirestore(e);
        }
    });

    /* ---------- Solicitudes de publicación ---------- */
    const listaSol = $("#listaSol");
    let solicitudes = [];

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
        try {
            const snap = await getDocs(collection(db, "solicitudes"));
            solicitudes = snap.docs
                .map((d) => ({ ...d.data(), id: d.id }))
                .sort((a, b) => (b.fecha?.toMillis?.() ?? 0) - (a.fecha?.toMillis?.() ?? 0));
            pintarSolicitudes();
        } catch (e) {
            errorFirestore(e);
        }
    }
    $("#recargarSol").addEventListener("click", cargarSolicitudes);

    /* ---------- Secciones y menú ---------- */
    const SECCIONES = ["calificaciones", "solicitudes", "poemas"];
    let seccionActual = localStorage.getItem("admin-seccion") || "calificaciones";
    if (!SECCIONES.includes(seccionActual)) seccionActual = "calificaciones";

    function mostrarSeccion(nombre) {
        seccionActual = nombre;
        localStorage.setItem("admin-seccion", nombre);
        SECCIONES.forEach((n) => { $("#seccion-" + n).hidden = n !== nombre; });
        document.querySelectorAll("#menu button").forEach((b) => {
            b.setAttribute("aria-current", String(b.dataset.seccion === nombre));
        });
        if (nombre === "poemas") cargarPoemas();
    }
    document.querySelectorAll("#menu button").forEach((b) => {
        b.addEventListener("click", () => mostrarSeccion(b.dataset.seccion));
    });

    /* ---------- Editar poemas publicados ---------- */
    const listaPoemas = $("#listaPoemas");
    const AUTORES_PUB = { HE: "𝑱𝑮", MG: "AzDor Lupita", AR: "Angela" };
    let poemasPub = [];             // { id, titulo, fecha, poema, autor, nuevo?, especial? }
    let poemasCargados = false;
    let poemasCargando = false;
    const vistaPoemas = { autor: "todos", orden: "fecha-desc", texto: "" };

    // "Fácil, pero difícil" + "HE" -> "facil-pero-dificil-he" (igual que en poemas-publicados.js).
    // El identificador de los votos se arma con el título, así que al cambiar el título hay que moverlos.
    function crearDataPoema(titulo, codigo) {
        const base = titulo
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        return `${base}-${codigo.toLowerCase()}`;
    }

    async function migrarVotos(viejoId, nuevoId) {
        const viejo = await getDoc(doc(db, "poemas", viejoId));
        if (!viejo.exists()) return;
        const nuevo = await getDoc(doc(db, "poemas", nuevoId));
        if (nuevo.exists()) {
            estado("El nuevo título ya tiene votos; los votos anteriores se quedaron con el identificador viejo.", "error");
            return;
        }
        await setDoc(doc(db, "poemas", nuevoId), viejo.data());
        await deleteDoc(doc(db, "poemas", viejoId));
        const item = items.find((i) => i.id === viejoId);
        if (item) { item.id = nuevoId; pintar(); }
    }

    function crearEditorPoema(p) {
        const li = document.createElement("li");
        li.className = "poema";
        li.dataset.id = p.id;

        const titulo = document.createElement("input");
        titulo.type = "text";
        titulo.value = p.titulo;
        titulo.maxLength = 200;
        titulo.setAttribute("aria-label", "Título");

        const fecha = document.createElement("input");
        fecha.type = "date";
        fecha.value = p.fecha || "";
        fecha.setAttribute("aria-label", "Fecha");

        const etiqueta = document.createElement("span");
        etiqueta.className = "autor autor-" + String(p.autor || "").toLowerCase();
        etiqueta.textContent = AUTORES_PUB[p.autor] || p.autor || "";

        const cabeza = document.createElement("div");
        cabeza.className = "poemaCabeza";
        cabeza.append(titulo, fecha, etiqueta);

        const cuerpo = document.createElement("textarea");
        cuerpo.value = p.poema || "";
        cuerpo.rows = 8;
        cuerpo.setAttribute("aria-label", "Cuerpo del poema");

        const nota = document.createElement("p");
        nota.className = "nota";
        nota.textContent = "Si cambias el título, sus votos se mueven al nuevo identificador.";

        const acciones = document.createElement("div");
        acciones.className = "acciones";
        const bGuardar = boton("Guardar cambios", "primario");
        const bBorrar = boton("Borrar poema", "peligro");
        acciones.append(bGuardar, bBorrar);

        function refrescar() {
            const cambio = titulo.value !== p.titulo || fecha.value !== (p.fecha || "") || cuerpo.value !== (p.poema || "");
            li.classList.toggle("cambiado", cambio);
            bGuardar.disabled = !cambio;
        }
        [titulo, fecha, cuerpo].forEach((el) => el.addEventListener("input", refrescar));

        bGuardar.addEventListener("click", async () => {
            const nuevoTitulo = titulo.value.trim();
            const nuevaFecha = fecha.value;
            const nuevoCuerpo = cuerpo.value;
            if (!nuevoTitulo) return estado("El título no puede estar vacío.", "error");
            if (!/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) return estado("La fecha debe tener el formato AAAA-MM-DD.", "error");
            bGuardar.disabled = true;
            try {
                await setDoc(doc(db, "poemas-publicados", p.id),
                    { titulo: nuevoTitulo, fecha: nuevaFecha, poema: nuevoCuerpo }, { merge: true });
                const viejoId = crearDataPoema(p.titulo, p.autor);
                const nuevoId = crearDataPoema(nuevoTitulo, p.autor);
                if (viejoId !== nuevoId) await migrarVotos(viejoId, nuevoId);
                p.titulo = nuevoTitulo;
                p.fecha = nuevaFecha;
                p.poema = nuevoCuerpo;
                pintarPoemas();
                estado(`Guardado: ${nuevoTitulo}`, "ok");
            } catch (e) {
                refrescar();
                errorFirestore(e);
            }
        });

        bBorrar.addEventListener("click", async () => {
            if (!confirm(`¿Borrar el poema "${p.titulo}"? También se borrarán sus votos.`)) return;
            try {
                const idVotos = crearDataPoema(p.titulo, p.autor);
                await deleteDoc(doc(db, "poemas-publicados", p.id));
                await deleteDoc(doc(db, "poemas", idVotos));
                poemasPub = poemasPub.filter((x) => x.id !== p.id);
                items = items.filter((i) => i.id !== idVotos);
                pintarPoemas();
                pintar();
                estado(`Borrado: ${p.titulo}`, "ok");
            } catch (e) {
                errorFirestore(e);
            }
        });

        li.append(cabeza, cuerpo, nota, acciones);
        refrescar();
        return li;
    }

    function calcularVistaPoemas() {
        const t = vistaPoemas.texto.trim().toLowerCase();
        return poemasPub
            .filter((p) => (vistaPoemas.autor === "todos" || p.autor === vistaPoemas.autor)
                && (!t || p.titulo.toLowerCase().includes(t) || (p.poema || "").toLowerCase().includes(t)))
            .sort((x, y) => {
                if (vistaPoemas.orden === "fecha-desc") return (y.fecha || "").localeCompare(x.fecha || "") || txt(x.titulo, y.titulo);
                if (vistaPoemas.orden === "fecha-asc") return (x.fecha || "").localeCompare(y.fecha || "") || txt(x.titulo, y.titulo);
                if (vistaPoemas.orden === "titulo-az") return txt(x.titulo, y.titulo);
                return txt(y.titulo, x.titulo);
            });
    }

    function pintarPoemas() {
        const enVista = calcularVistaPoemas();
        listaPoemas.replaceChildren(...enVista.map(crearEditorPoema));
        const vacio = $("#vacioPoemas");
        vacio.hidden = enVista.length > 0;
        vacio.textContent = poemasPub.length
            ? "Ningún poema coincide con el filtro."
            : "Todavía no hay poemas publicados.";
        $("#conteoPoemas").textContent = `${enVista.length} de ${poemasPub.length} poemas`;
    }

    async function cargarPoemas(forzar) {
        if (poemasCargando) return;
        if (poemasCargados && !forzar) return;
        poemasCargando = true;
        estado("Cargando poemas...");
        try {
            const snap = await getDocs(collection(db, "poemas-publicados"));
            poemasPub = snap.docs.map((d) => ({ id: d.id, ...d.data(), titulo: d.data().titulo || "Sin título" }));
            poemasCargados = true;
            pintarPoemas();
            estado("");
        } catch (e) {
            errorFirestore(e);
        } finally {
            poemasCargando = false;
        }
    }

    $("#buscarPoema").addEventListener("input", (e) => { vistaPoemas.texto = e.target.value; pintarPoemas(); });
    $("#filtroAutorPoema").addEventListener("change", (e) => { vistaPoemas.autor = e.target.value; pintarPoemas(); });
    $("#ordenPoema").addEventListener("change", (e) => { vistaPoemas.orden = e.target.value; pintarPoemas(); });
    $("#recargarPoemas").addEventListener("click", () => cargarPoemas(true));

    /* ---------- Sesión ---------- */
    // Solo sirve para decidir qué se muestra. La seguridad real está en las reglas de Firestore.
    // Se guardan hashes (SHA-256) para no dejar los correos admin a la vista en el repositorio público.
    const ADMIN_HASHES = [
        "3653a6f0d32bea8e7d2cd9cc3f3367794dccf198477932bf823b97ec9b45e731",
        "8d9f2a2da2c92f7bae013a2318bb982589e8667536b30d8a192f606892f5a6d2",
        "89b371f3721a815d6db8ada95989cf1ca1808c92b248f2e7dfefd03c390e74e7",
        "1cdf38a5cec7b70d77ff015a51ae51ff1833648b76af813bfb501ffe5f605606"
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
    $("#recargar").addEventListener("click", cargar);

    async function mostrarSegunUsuario(user) {
        const ocultarTodo = () => ["#sesion", "#verificar", "#soloUsuario", "#panel", "#menu", "#usuario"].forEach((q) => { $(q).hidden = true; });
        ocultarTodo();
        if (!user) {
            $("#sesion").hidden = false;
            history.replaceState(null, "", "admin.page");
            lista.replaceChildren();
            listaSol.replaceChildren();
            listaPoemas.replaceChildren();
            poemasPub = [];
            poemasCargados = false;
            return;
        }
        $("#usuario").hidden = false;
        $("#correo").textContent = user.email;
        const admin = await esAdminCliente(user.email);
        // Los administradores sí deben verificar su correo (las reglas lo exigen).
        // Los usuarios normales entran sin verificar.
        if (admin && !user.emailVerified) {
            $("#verCorreo").textContent = user.email;
            $("#verificar").hidden = false;
            return;
        }
        if (admin) {
            $("#panel").hidden = false;
            $("#menu").hidden = false;
            const nombre = user.email.split("@")[0];
            history.replaceState(null, "", "admin." + encodeURIComponent(nombre));
            cargar();
            cargarSolicitudes();
            mostrarSeccion(seccionActual);
        } else {
            if (user.email.includes(".edu.mx")) {
                const nombre = user.email.split("@")[0];
                const dom = user.email.split("@")[1];
                history.replaceState(null, "", "admin." + encodeURIComponent(nombre) + "." + encodeURIComponent(dom));
                $("#correoInstitucional").hidden = false;
            } else {
                const nombre = user.email.split("@")[0];
                history.replaceState(null, "", "admin." + encodeURIComponent(nombre));
                $("#soloUsuario").hidden = false;
            }
        }
    }

    onAuthStateChanged(auth, mostrarSegunUsuario);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { scope: './' });
}