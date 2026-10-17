document.addEventListener('DOMContentLoaded', () => {
    // Cada autor: botón del índice, lista de títulos y contenedor de poemas
    const autores = [
        {
            btn: document.getElementById('HE'),
            lista: document.getElementById('pH'),
            poemas: document.getElementById('poemsH')
        },
        {
            btn: document.getElementById('In'),
            lista: document.getElementById('pI'),
            poemas: document.getElementById('poemsI')
        }
    ];

    function mostrar(activo) {
        autores.forEach((a) => {
            const visible = a === activo;
            if (a.lista) a.lista.hidden = !visible;
            if (a.poemas) a.poemas.hidden = !visible;
        });
    }

    autores.forEach((a) => {
        if (!a.btn) return; // si falta un elemento, no rompe el resto
        a.btn.addEventListener('click', () => mostrar(a));
    });
});