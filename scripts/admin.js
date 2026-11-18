history.replaceState(null, "", "admin.page");

    import { auth, db, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
        sendEmailVerification, collection, getDocs, getDoc, doc, setDoc, deleteDoc, writeBatch,
        query, where, crearDataPoema, esAdminCliente, esAdminPrincipal, errorAuth, crearEstado, COLORES_AUTORES, cargarAutores }
        from "./firestore.js";

    const $ = (selector) => document.querySelector(selector);
    const lista = $("#lista");

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
    // Nombres y colores de los autores (colección "autores" de Firestore).
    // Mientras no cargan, se usan los base para no dejar la lista vacía.
    const AUTORES_BASE_NOMBRES = { HE: "𝑱𝑮", MG: "AzDor Lupita", AR: "Angela" };
    let mapaAutores = new Map(); // código en MAYÚS -> { id, codigo, nombre, color }
    const nombreAutor = (codigo) => mapaAutores.get(String(codigo || "").toUpperCase())?.nombre
        || AUTORES_BASE_NOMBRES[String(codigo || "").toUpperCase()] || String(codigo || "");
    const colorAutor = (codigo) => mapaAutores.get(String(codigo || "").toUpperCase())?.color || null;
    let items = [];               // { id, suma, votos, borrador? }
    let enVista = [];             // lo que se ve con el filtro y el orden actuales
    const seleccion = new Set();  // ids marcados (siempre dentro de lo que se ve)
    const vista = { autor: "todos", orden: "nombre-az", texto: "" };

    const autorDe = (id) => {
        const m = String(id).match(/-([a-z0-9]+)$/);
        return m ? m[1] : "sin";
    };
    const esCodigoConocido = (suf) => mapaAutores.has(String(suf).toUpperCase())
        || ["he", "mg", "ar"].includes(String(suf).toLowerCase());
    const nombreDe = (id) => {
        const suf = autorDe(id);
        const base = (suf !== "sin" && esCodigoConocido(suf)) ? id.slice(0, -(suf.length + 1)) : id;
        return base.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };
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
    // JG es el autor principal: va primero; los demás se ordenan de la A a la Z.
    const ordenAutor = (a, b) => (a === "he" ? -1 : b === "he" ? 1 : txt(nombreAutor(a), nombreAutor(b)));

    const ORDENES = {
        "nombre-az": porNombre,
        "nombre-za": (x, y) => porNombre(y, x),
        "id-az": (x, y) => txt(x.id, y.id),
        "id-za": (x, y) => txt(y.id, x.id),
        "autor": (x, y) => ordenAutor(autorDe(x.id), autorDe(y.id)) || porNombre(x, y),
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
        etiqueta.className = "autor";
        const color = colorAutor(autorDe(id));
        if (color) etiqueta.style.setProperty("--autor", color.oscuro);
        etiqueta.textContent = autorDe(id) === "sin" ? "Sin autor" : nombreAutor(autorDe(id));

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


    /* ---------- Secciones y menú ---------- */
    const SECCIONES = ["calificaciones", "poemas", "autores"];
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
        if (nombre === "autores") cargarAutoresAdmin();
    }
    document.querySelectorAll("#menu button").forEach((b) => {
        b.addEventListener("click", () => mostrarSeccion(b.dataset.seccion));
    });

    /* ---------- Editar poemas publicados ---------- */
    const listaPoemas = $("#listaPoemas");
    let poemasPub = [];             // { id, titulo, fecha, poema, autor, nuevo?, especial? }
    let poemasCargados = false;
    let poemasCargando = false;
    const vistaPoemas = { autor: "todos", orden: "fecha-desc", texto: "" };

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
        etiqueta.className = "autor";
        const color = colorAutor(p.autor);
        if (color) etiqueta.style.setProperty("--autor", color.oscuro);
        etiqueta.textContent = nombreAutor(p.autor);

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

    /* ---------- Autores ---------- */
    // Solo los dos primeros admins pueden agregar y eliminar autores.
    // Editar el nombre, el color o el código lo puede cualquier admin.
    let esPrincipal = false;

    function aplicarPermisosAutores() {
        $("#formAutor").closest(".nuevo").hidden = !esPrincipal;
        $("#notaAutores").hidden = esPrincipal;
    }

    // Mapa para las listas y las píldoras de autor de todo el admin.
    async function cargarMapaAutores() {
        try {
            const lista = await cargarAutores();
            mapaAutores = new Map(lista.map((a) => [a.codigo, a]));
            reconstruirFiltrosAutor();
            return lista;
        } catch (e) {
            console.error("No se pudieron cargar los autores:", e);
            return [];
        }
    }

    function opcion(valor, texto) {
        const o = document.createElement("option");
        o.value = valor;
        o.textContent = texto;
        return o;
    }

    // Los filtros de autor se arman desde la colección, no desde valores fijos.
    function reconstruirFiltrosAutor() {
        const selCalif = $("#filtroAutor");
        const selPoemas = $("#filtroAutorPoema");
        const valorCalif = selCalif.value;
        const valorPoemas = selPoemas.value;
        const autores = [...mapaAutores.values()].sort((a, b) =>
            (a.codigo === "HE" ? -1 : b.codigo === "HE" ? 1 : txt(a.nombre, b.nombre)));
        selCalif.replaceChildren(
            opcion("todos", "Todos"),
            ...autores.map((a) => opcion(a.codigo.toLowerCase(), a.nombre)),
            opcion("sin", "Sin autor")
        );
        selPoemas.replaceChildren(
            opcion("todos", "Todos"),
            ...autores.map((a) => opcion(a.codigo, a.nombre))
        );
        if ([...selCalif.options].some((o) => o.value === valorCalif)) selCalif.value = valorCalif;
        if ([...selPoemas.options].some((o) => o.value === valorPoemas)) selPoemas.value = valorPoemas;
        vista.autor = selCalif.value;
        vistaPoemas.autor = selPoemas.value;
    }

    const listaAutores = $("#listaAutores");
    let autoresAdmin = []; // [{ id, codigo, nombre, color, guardado }]
    let autoresCargados = false;

    function coloresOcupados(exceptoId) {
        return new Set(autoresAdmin.filter((a) => a.id !== exceptoId).map((a) => a.color.nombre));
    }

    // Un color ya usado por otro autor se desactiva, a menos que ya estén
    // todos ocupados (entonces se pueden repetir).
    function llenarColores(select, seleccionado, exceptoId) {
        const ocupados = coloresOcupados(exceptoId);
        const todosOcupados = ocupados.size >= COLORES_AUTORES.length;
        select.replaceChildren(...COLORES_AUTORES.map((c) => {
            const o = document.createElement("option");
            o.value = c.nombre;
            o.textContent = c.nombre;
            o.disabled = !todosOcupados && ocupados.has(c.nombre) && c.nombre !== seleccionado;
            return o;
        }));
        if (seleccionado) select.value = seleccionado;
    }

    async function guardarAutorBase(a) {
        try {
            await setDoc(doc(db, "autores", a.id), { Nombre: a.nombre, Color: a.color.nombre, Codigo: a.codigo });
            await cargarAutoresAdmin(true);
            await cargarMapaAutores();
            estado(`Autor guardado: ${a.nombre}`, "ok");
        } catch (e) {
            errorFirestore(e);
        }
    }

    function crearFilaAutor(a) {
        const li = document.createElement("li");
        li.className = "autor-fila";

        const muestra = document.createElement("span");
        muestra.className = "muestra";
        muestra.style.background = a.color.oscuro;
        muestra.title = a.color.nombre;

        const datos = document.createElement("div");
        datos.className = "datos";
        const nombre = document.createElement("p");
        nombre.className = "nombre";
        nombre.textContent = a.nombre;
        const meta = document.createElement("p");
        meta.className = "id";
        meta.textContent = `id: ${a.id} · código: ${a.codigo} · color: ${a.color.nombre}` + (a.guardado ? "" : " · sin guardar en Firestore");
        datos.append(nombre, meta);

        const acciones = document.createElement("div");
        acciones.className = "acciones";

        if (!a.guardado) {
            if (esPrincipal) {
                const bGuardar = boton("Guardar en Firestore", "primario");
                bGuardar.addEventListener("click", () => guardarAutorBase(a));
                acciones.append(bGuardar);
            }
            li.append(muestra, datos, acciones);
            return li;
        }

        const bEditar = boton("Editar", "");
        acciones.append(bEditar);
        li.append(muestra, datos, acciones);

        bEditar.addEventListener("click", () => {
            li.replaceChildren();
            li.className = "autor-fila edicion";
            const form = document.createElement("div");
            form.className = "edicion";
            const inpNombre = document.createElement("input");
            inpNombre.type = "text";
            inpNombre.value = a.nombre;
            inpNombre.maxLength = 100;
            inpNombre.setAttribute("aria-label", "Nombre");
            const inpCodigo = document.createElement("input");
            inpCodigo.type = "text";
            inpCodigo.value = a.codigo;
            inpCodigo.maxLength = 10;
            inpCodigo.setAttribute("aria-label", "Código de sus poemas");
            const selColor = document.createElement("select");
            llenarColores(selColor, a.color.nombre, a.id);
            const acc = document.createElement("div");
            acc.className = "acciones";
            const bGuardar = boton("Guardar", "primario");
            const bCancelar = boton("Cancelar", "");
            acc.append(bGuardar, bCancelar);
            form.append(inpNombre, inpCodigo, selColor, acc);
            li.append(form);

            bCancelar.addEventListener("click", pintarAutores);
            bGuardar.addEventListener("click", async () => {
                const nombreNuevo = inpNombre.value.trim();
                const codigoNuevo = inpCodigo.value.trim().toUpperCase();
                const colorNuevo = selColor.value;
                if (!nombreNuevo) return estado("El nombre no puede estar vacío.", "error");
                if (!/^[A-Z0-9]+$/.test(codigoNuevo)) return estado("El código solo puede tener letras y números.", "error");
                if (codigoNuevo !== a.codigo && autoresAdmin.some((x) => x.codigo === codigoNuevo)) {
                    return estado("Ya hay un autor con ese código.", "error");
                }
                const ocupados = coloresOcupados(a.id);
                if (colorNuevo !== a.color.nombre && ocupados.has(colorNuevo) && ocupados.size < COLORES_AUTORES.length) {
                    return estado(`El color ${colorNuevo} ya lo usa otro autor.`, "error");
                }
                bGuardar.disabled = true;
                try {
                    await setDoc(doc(db, "autores", a.id), { Nombre: nombreNuevo, Color: colorNuevo, Codigo: codigoNuevo }, { merge: true });
                    await cargarAutoresAdmin(true);
                    await cargarMapaAutores();
                    pintar();
                    pintarPoemas();
                    estado(`Autor guardado: ${nombreNuevo}`, "ok");
                } catch (e) {
                    bGuardar.disabled = false;
                    errorFirestore(e);
                }
            });
        });

        if (esPrincipal) {
            const bBorrar = boton("Borrar", "peligro");
            acciones.append(bBorrar);
            bBorrar.addEventListener("click", async () => {
                let n = 0;
                try {
                    const snap = await getDocs(query(collection(db, "poemas-publicados"), where("autor", "==", a.codigo)));
                    n = snap.size;
                } catch (e) { console.error(e); }
                const aviso = n > 0
                    ? `¿Borrar al autor "${a.nombre}"? Tiene ${n} poema${n === 1 ? "" : "s"}: los poemas NO se borran, solo el autor.`
                    : `¿Borrar al autor "${a.nombre}"?`;
                if (!confirm(aviso)) return;
                try {
                    await deleteDoc(doc(db, "autores", a.id));
                    await cargarAutoresAdmin(true);
                    await cargarMapaAutores();
                    pintar();
                    pintarPoemas();
                    estado(`Autor borrado: ${a.nombre}`, "ok");
                } catch (e) {
                    errorFirestore(e);
                }
            });
        }

        return li;
    }

    function pintarAutores() {
        listaAutores.replaceChildren(...autoresAdmin.map(crearFilaAutor));
        const vacio = $("#vacioAutores");
        vacio.hidden = autoresAdmin.length > 0;
        vacio.textContent = autoresAdmin.length ? "" : "Todavía no hay autores. Agrega uno abajo.";
        llenarColores($("#autorColor"), "", "");
    }

    async function cargarAutoresAdmin(forzar) {
        if (autoresCargados && !forzar) return;
        estado("Cargando autores...");
        try {
            const snap = await getDocs(collection(db, "autores"));
            const docs = new Set(snap.docs.map((d) => d.id));
            const lista = await cargarAutores(); // mezclada con los autores base
            autoresAdmin = lista.map((a) => ({ ...a, guardado: docs.has(a.id) }));
            autoresCargados = true;
            pintarAutores();
            estado("");
        } catch (e) {
            errorFirestore(e);
        }
    }
    $("#recargarAutores").addEventListener("click", () => cargarAutoresAdmin(true));

    // El código se sugiere desde el identificador, pero se puede cambiar.
    $("#autorId").addEventListener("input", (e) => {
        const codigo = $("#autorCodigo");
        if (!codigo.dataset.tocado) codigo.value = e.target.value.trim().toUpperCase();
    });
    $("#autorCodigo").addEventListener("input", (e) => { e.target.dataset.tocado = "1"; });

    $("#formAutor").addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const id = $("#autorId").value.trim().toLowerCase();
        const nombre = $("#autorNombre").value.trim();
        const codigo = $("#autorCodigo").value.trim().toUpperCase();
        const color = $("#autorColor").value;
        if (!/^[a-z0-9]+$/.test(id)) return estado("El identificador solo puede tener letras minúsculas y números, sin espacios.", "error");
        if (!nombre) return estado("Escribe el nombre del autor.", "error");
        if (!/^[A-Z0-9]+$/.test(codigo)) return estado("El código solo puede tener letras y números.", "error");
        if (autoresAdmin.some((x) => x.id === id)) return estado("Ya hay un autor con ese identificador.", "error");
        if (autoresAdmin.some((x) => x.codigo === codigo)) return estado("Ya hay un autor con ese código.", "error");
        const ocupados = coloresOcupados("");
        if (ocupados.has(color) && ocupados.size < COLORES_AUTORES.length) {
            return estado(`El color ${color} ya lo usa otro autor.`, "error");
        }
        try {
            await setDoc(doc(db, "autores", id), { Nombre: nombre, Color: color, Codigo: codigo });
            $("#formAutor").reset();
            delete $("#autorCodigo").dataset.tocado;
            await cargarAutoresAdmin(true);
            await cargarMapaAutores();
            pintar();
            pintarPoemas();
            estado(`Autor agregado: ${nombre}`, "ok");
        } catch (e) {
            errorFirestore(e);
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
    $("#recargar").addEventListener("click", cargar);

    async function mostrarSegunUsuario(user) {
        const ocultarTodo = () => ["#sesion", "#verificar", "#soloUsuario", "#panel", "#menu", "#usuario"].forEach((q) => { $(q).hidden = true; });
        ocultarTodo();
        if (!user) {
            $("#sesion").hidden = false;
            history.replaceState(null, "", "admin.page");
            lista.replaceChildren();
            listaPoemas.replaceChildren();
            poemasPub = [];
            poemasCargados = false;
            esPrincipal = false;
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
            esPrincipal = await esAdminPrincipal(user.email);
            aplicarPermisosAutores();
            await cargarMapaAutores();
            cargar();
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
