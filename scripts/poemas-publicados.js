import { db, doc, getDoc, setDoc, increment, collection, getDocs, query, where,
    crearDataPoema, formatearFecha, esNuevo, ordenarAutores, cargarAutores, prefijoDeAutor } from "./firestore.js";

/* ---------- Calificación con estrellas ---------- */
async function iniciar(contenedor) {
    const id = contenedor.dataset.poema;
    const clave = "voto-" + id;
    const miVoto = Number(localStorage.getItem(clave)) || 0;

    contenedor.innerHTML = `
        <div class="estrellas">
            ${[1, 2, 3, 4, 5].map(n => `<button data-valor="${n}" aria-label="${n} estrellas">★</button>`).join("")}
        </div>
        <div class="info">Cargando...</div>`;

    const botones = contenedor.querySelectorAll("button");
    const info = contenedor.querySelector(".info");

    function limpiarParciales() {
        botones.forEach(b => {
            b.classList.remove("semiactiva");
            b.style.removeProperty("--p");
        });
    }

    // Pinta las estrellas del voto del visitante
    function pintar(valor) {
        limpiarParciales();
        botones.forEach(b => b.classList.toggle("activa", Number(b.dataset.valor) <= valor));
    }

    // Pinta el promedio (con estrella parcial) mientras el visitante no ha votado
    function pintarPromedio(valor) {
        const promedio = Math.max(0, Math.min(5, Math.round(valor * 10) / 10));
        const enteras = Math.floor(promedio);
        const decimas = Math.round((promedio - enteras) * 10);
        limpiarParciales();
        botones.forEach(b => {
            const numero = Number(b.dataset.valor);
            if (numero <= enteras) {
                b.classList.add("semiactiva");
            } else if (numero === enteras + 1 && decimas > 0) {
                b.classList.add("semiactiva");
                b.style.setProperty("--p", decimas * 10 + "%");
            }
        });
    }

    async function actualizarPromedio() {
        try {
            const snap = await getDoc(doc(db, "poemas", id));
            if (snap.exists()) {
                const { suma, votos } = snap.data();
                const promedio = suma / votos;
                info.textContent = `${promedio.toFixed(1)} / 5 (${votos} ${votos === 1 ? "voto" : "votos"})`;
                if (!miVoto) pintarPromedio(promedio);
            } else {
                info.textContent = "Sé el primero en calificar";
            }
        } catch (e) {
            info.textContent = "";
            console.error(e);
        }
    }

    pintar(miVoto);
    actualizarPromedio();

    botones.forEach(b => b.addEventListener("click", async () => {
        if (localStorage.getItem(clave)) return;
        const valor = Number(b.dataset.valor);
        try {
            await setDoc(
                doc(db, "poemas", id),
                { suma: increment(valor), votos: increment(1) },
                { merge: true }
            );
            localStorage.setItem(clave, valor);
            pintar(valor);
            actualizarPromedio();
        } catch (e) {
            info.textContent = "No se pudo guardar tu voto";
            console.error(e);
        }
    }));
}

/* ---------- Poemas desde Firestore ---------- */
function etiqueta(clase, texto) {
    const s = document.createElement("span");
    s.className = clase;
    s.textContent = texto;
    return s;
}

function crearItemIndice(p, prefijo, n) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "asj";
    a.href = `#${prefijo}${n}`;
    a.textContent = p.titulo;
    li.append(a);
    if (esNuevo(p.fecha)) li.append(etiqueta("new", "nuevo"));
    if (p.especial) li.append(etiqueta("special", "especial"));
    li.append(etiqueta("d", formatearFecha(p.fecha)));
    return li;
}

// Botones para compartir un poema: WhatsApp, compartir en otros lados y copiar su enlace.
// El enlace es la raíz del sitio + el ancla, sin "index.html".
// El botón "Compartir en otros lados" usa la Web Share API (navigator.share):
// en el celular abre la hoja de compartir del sistema y ahí el visitante elige
// Instagram, Telegram, Messenger u otra app. Instagram no tiene un equivalente
// a wa.me: no hay URL que abra un DM con el texto ya escrito. Si el navegador
// no tiene esa opción, copia el enlace para pegarlo a mano donde quiera.
async function copiarTexto(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch (e) {
        const t = document.createElement("textarea");
        t.value = texto;
        document.body.append(t);
        t.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (_) { /* sin portapapeles */ }
        t.remove();
        return ok;
    }
}

function crearCompartir(titulo, nombreAutor, idArticulo) {
    const url = location.href.split("#")[0].replace(/\/index\.html?$/i, "/") + "#" + idArticulo;
    const texto = `Lee «${titulo}» de ${nombreAutor}: ${url}`;
    const div = document.createElement("div");
    div.className = "compartir";

    const wa = document.createElement("a");
    wa.href = "https://wa.me/?text=" + encodeURIComponent(texto);
    wa.target = "_blank";
    wa.rel = "noopener";
    wa.textContent = "WhatsApp";

    const compartir = document.createElement("button");
    compartir.type = "button";
    compartir.textContent = "Compartir en otros lados";
    compartir.title = "Comparte este poema en Instagram, Telegram, Messenger y otras apps";
    compartir.addEventListener("click", async () => {
        // Ojo: Instagram pega el campo url después del texto, así que el texto
        // NO debe llevar la URL o sale dos veces en el DM.
        const datos = { title: `«${titulo}» de ${nombreAutor}`, text: `Lee «${titulo}» de ${nombreAutor}`, url };
        if (navigator.share && (!navigator.canShare || navigator.canShare(datos))) {
            try {
                await navigator.share(datos);
                return;
            } catch (e) {
                if (e && e.name === "AbortError") return; // el usuario cerró la hoja
                // Si falló por otra razón, caemos al respaldo de copiar.
            }
        }
        await copiarTexto(url);
        compartir.textContent = "¡Copiado! Pégalo donde quieras";
        setTimeout(() => { compartir.textContent = "Compartir en otros lados"; }, 2500);
    });

    const copiar = document.createElement("button");
    copiar.type = "button";
    copiar.textContent = "Copiar enlace";
    copiar.addEventListener("click", async () => {
        await copiarTexto(url);
        copiar.textContent = "¡Copiado!";
        setTimeout(() => { copiar.textContent = "Copiar enlace"; }, 2000);
    });

    div.append(wa, compartir, copiar);
    return div;
}

function crearArticulo(p, prefijo, n, codigo, nombreAutor) {
    const art = document.createElement("article");
    art.className = "poem";
    art.id = `${prefijo}${n}`;

    const head = document.createElement("header");
    head.className = "poem-head";

    const h2 = document.createElement("h2");
    h2.textContent = p.titulo;

    const meta = document.createElement("p");
    meta.className = "meta";
    const time = document.createElement("time");
    time.textContent = formatearFecha(p.fecha);
    meta.append(time);
    if (esNuevo(p.fecha)) meta.append(etiqueta("new", "nuevo"));
    if (p.especial) meta.append(etiqueta("special", "especial"));

    const cal = document.createElement("div");
    cal.className = "calificacion";
    cal.dataset.poema = crearDataPoema(p.titulo, codigo);

    head.append(h2, meta, cal, crearCompartir(p.titulo, nombreAutor, art.id));

    // Línea en blanco = nueva estrofa (<p>); salto de línea = <br>
    const body = document.createElement("div");
    body.className = "poem-body";
    p.poema.replace(/\r\n/g, "\n").trim().split(/\n\s*\n/).forEach((estrofa) => {
        const parrafo = document.createElement("p");
        estrofa.split("\n").forEach((linea, i, lineas) => {
            parrafo.append(document.createTextNode(linea.trim()));
            if (i < lineas.length - 1) parrafo.append(document.createElement("br"));
        });
        body.append(parrafo);
    });

    art.append(head, body);
    return art;
}

/* ---------- Visitas (para la página de Estadísticas) ---------- */
// Se cuenta una visita por sesión cada vez que se abre un poema
// (desde el índice o desde un enlace directo como #pH12).
const visitasInfo = new Map(); // id del artículo -> { idVotos, titulo, codigo, fecha }
function registrarVisita(idArticulo) {
    const info = visitasInfo.get(idArticulo);
    if (!info) return;
    try {
        const clave = "visita-" + idArticulo;
        if (sessionStorage.getItem(clave)) return;
        sessionStorage.setItem(clave, "1");
    } catch (e) { /* sin sessionStorage, se cuenta igual */ }
    setDoc(doc(db, "visitas", info.idVotos),
        { visitas: increment(1), titulo: info.titulo, autor: info.codigo, fecha: info.fecha || "" },
        { merge: true }).catch((e) => console.error("No se pudo registrar la visita:", e));
}

async function cargarPoemas() {
    try {
        // Las secciones de cada autor se construyen desde la colección "autores":
        // un autor nuevo tiene su propia sección, con su nombre y su color.
        const autores = ordenarAutores(await cargarAutores());
        const usados = new Set();
        const listaAutores = document.querySelector("#listaAutores");
        const listasBox = document.querySelector("#listasPoemas");
        const seccionesBox = document.querySelector("#seccionesPoemas");
        listaAutores.replaceChildren();
        listasBox.replaceChildren();
        seccionesBox.replaceChildren();

        const secciones = autores.map((a) => {
            const prefijo = prefijoDeAutor(a.codigo, usados);

            const li = document.createElement("li");
            li.className = "autor-tema";
            li.style.setProperty("--autor-claro", a.color.claro);
            li.style.setProperty("--autor-oscuro", a.color.oscuro);
            const btn = document.createElement("a");
            btn.href = `#${prefijo}`;
            btn.id = a.codigo;
            btn.className = "asj";
            btn.textContent = a.nombre;
            const conteo = document.createElement("span");
            conteo.className = "d";
            conteo.textContent = "Poemas: 0";
            li.append(btn, conteo);
            listaAutores.append(li);

            const ol = document.createElement("ol");
            ol.id = prefijo;
            listasBox.append(ol);

            const contenedor = document.createElement("div");
            contenedor.className = "poems autor-tema";
            contenedor.id = `poems-${prefijo}`;
            contenedor.style.setProperty("--autor-claro", a.color.claro);
            contenedor.style.setProperty("--autor-oscuro", a.color.oscuro);
            seccionesBox.append(contenedor);

            return { ...a, prefijo, btn, li, conteo, lista: ol, poemas: contenedor };
        });
        window.registrarSeccionesAutores?.(secciones.map(({ prefijo, btn, lista, poemas }) => ({ prefijo, btn, lista, poemas })));

        const conteos = {};
        for (const a of secciones) {
            const snap = await getDocs(
                query(collection(db, "poemas-publicados"), where("autor", "==", a.codigo))
            );
            const lista = snap.docs
                .map((d) => ({ ...d.data(), titulo: d.data().titulo || "Sin título" }))
                .sort((x, y) => x.fecha.localeCompare(y.fecha)); // del más antiguo al más nuevo

            lista.forEach((p, i) => {
                const n = i + 1;
                a.lista.append(crearItemIndice(p, a.prefijo, n));
                const art = crearArticulo(p, a.prefijo, n, a.codigo, a.nombre);
                a.poemas.append(art);
                visitasInfo.set(art.id, {
                    idVotos: crearDataPoema(p.titulo, a.codigo),
                    titulo: p.titulo,
                    codigo: a.codigo,
                    fecha: p.fecha || ""
                });
            });

            a.conteo.textContent = `Poemas: ${lista.length}`;
            conteos[a.codigo] = lista.length;

            // Si un autor no tiene poemas, ocultar su entrada del índice.
            if (lista.length === 0) a.li.style.setProperty("display", "none");
        }

        // Línea de autores del encabezado: solo los que tienen poemas.
        const visibles = secciones
            .filter((a) => (conteos[a.codigo] || 0) > 0)
            .map((a) => a.nombre);
        const lineaAutores = document.querySelector(".hero .by");
        if (lineaAutores && visibles.length) lineaAutores.textContent = visibles.join(", ");

        document.querySelectorAll(".calificacion").forEach(iniciar);

        // Si entraron con un enlace a un poema (#pG3, #pH12, #pA2...),
        // mostrar primero su sección y luego ir a él.
        const m = location.hash.match(/^#(p[A-Za-z]+)(\d+)$/);
        if (m) {
            window.mostrarAutor?.(m[1]);
            document.querySelector(location.hash)?.scrollIntoView();
            registrarVisita(location.hash.slice(1));
        }
    } catch (e) {
        console.error("No se pudieron cargar los poemas:", e);
    }
}

// Enlace a un poema pulsado ya dentro de la página: mostrar su sección e ir a él.
window.addEventListener("hashchange", () => {
    const m = location.hash.match(/^#(p[A-Za-z]+)(\d+)$/);
    if (m) {
        window.mostrarAutor?.(m[1]);
        document.querySelector(location.hash)?.scrollIntoView();
        registrarVisita(location.hash.slice(1));
    }
});

cargarPoemas();
