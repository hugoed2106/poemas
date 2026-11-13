document.addEventListener('DOMContentLoaded', () => {
    // Cada autor: botón del índice + lista (índice de poemas) + contenedor de poemas
    // Los ids de las listas coinciden con su hash de sección: pH (JG), pG (AzDor), pA (Angela)
    const autores = [
        {
            codigo: 'HE',
            prefijo: 'pH',
            btn: document.getElementById('HE'),
            lista: document.getElementById('pH'),
            poemas: document.getElementById('poemsH')
        },
        {
            codigo: 'MG',
            prefijo: 'pG',
            btn: document.getElementById('MG'),
            lista: document.getElementById('pG'),
            poemas: document.getElementById('poemsL')
        },
        {
            codigo: 'AR',
            prefijo: 'pA',
            btn: document.getElementById('AR'),
            lista: document.getElementById('pA'),
            poemas: document.getElementById('poemsA')
        }
    ];

    function setVisible(el, visible) {
        if (!el) return;
        el.hidden = !visible;
        el.style.display = visible ? '' : 'none';
    }

    function mostrar(activo) {
        autores.forEach((a) => {
            const visible = a === activo;
            setVisible(a.lista, visible);
            setVisible(a.poemas, visible);
        });
    }

    // Muestra la sección de un autor por su prefijo de hash ("pH", "pG" o "pA").
    // La usa poemas-publicados.js antes de desplazarse a un poema concreto.
    window.mostrarAutor = function (prefijo) {
        const autor = autores.find((a) => a.prefijo === prefijo);
        if (autor) mostrar(autor);
    };

    // El hash manda: #pH, #pG, #pA (sección) o #pH12, #pG3, #pA2 (poema concreto).
    // Se aplica al cargar y cada vez que cambia el hash, para que el enlace
    // caiga en la sección correcta en vez de dejar la página vacía.
    function aplicarHash() {
        const m = window.location.hash.match(/^#(p[HGA])(\d*)$/);
        if (m) window.mostrarAutor(m[1]);
    }

    mostrar(null);
    aplicarHash();
    window.addEventListener('hashchange', aplicarHash);

    autores.forEach((a) => {
        if (!a.btn) return;
        a.btn.addEventListener('click', () => mostrar(a));
    });
});
