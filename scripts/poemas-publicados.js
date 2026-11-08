import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, increment, collection, getDocs, query, where }
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

const db = getFirestore(initializeApp(firebaseConfig), "default");

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
    
    function pintar(valor) {
        limpiarParciales();
        botones.forEach(b => b.classList.toggle("activa", Number(b.dataset.valor) <= valor));
    }
    
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

const AUTORES = [
    { codigo: "MG", prefijo: "pG", lista: "#pL", poemas: "#poemsL", conteo: "#MG" },
    { codigo: "HE", prefijo: "pH", lista: "#pH", poemas: "#poemsH", conteo: "#HE" }
];

function crearDataPoema(titulo, codigo) {
    const base = titulo
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    return `${base}-${codigo}`;
}

const formatearFecha = (iso) => iso.split("-").reverse().join("/");

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
    if (p.nuevo) li.append(etiqueta("new", "nuevo"));
    if (p.especial) li.append(etiqueta("special", "especial"));
    li.append(etiqueta("d", formatearFecha(p.fecha)));
    return li;
}

function crearArticulo(p, prefijo, n, codigo) {
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
    if (p.nuevo) meta.append(etiqueta("new", "nuevo"));
    if (p.especial) meta.append(etiqueta("special", "especial"));

    const cal = document.createElement("div");
    cal.className = "calificacion";
    cal.dataset.poema = crearDataPoema(p.titulo, codigo);

    head.append(h2, meta, cal);
    
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

async function cargarPoemas() {
    try {
        for (const a of AUTORES) {
            const snap = await getDocs(
                query(collection(db, "poemas-publicados"), where("autor", "==", a.codigo))
            );
            const lista = snap.docs
                .map((d) => ({ ...d.data(), titulo: d.data().titulo || "Sin título" }))
                .sort((x, y) => x.fecha.localeCompare(y.fecha)); // del más antiguo al más nuevo

            const ol = document.querySelector(a.lista);
            const contenedor = document.querySelector(a.poemas);
            ol.replaceChildren();
            contenedor.replaceChildren();

            lista.forEach((p, i) => {
                const n = i + 1;
                ol.append(crearItemIndice(p, a.prefijo, n));
                contenedor.append(crearArticulo(p, a.prefijo, n, a.codigo));
            });

            const spanConteo = document.querySelector(a.conteo)?.nextElementSibling;
            if (spanConteo) spanConteo.textContent = `Poemas: ${lista.length}`;
        }

        document.querySelectorAll(".calificacion").forEach(iniciar);
        
        if (/^#p[GH]\d+$/.test(location.hash)) {
            document.querySelector(location.hash)?.scrollIntoView();
        }
    } catch (e) {
        console.error("No se pudieron cargar los poemas:", e);
    }
}

cargarPoemas();