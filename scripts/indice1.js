document.addEventListener('DOMContentLoaded', () => {
    // Cada autor: botón del índice + lista (índice de poemas) + contenedor de poemas
    const autores = [
        {
            btn: document.getElementById('HE'),
            lista: document.getElementById('pH'),
            poemas: document.getElementById('poemsH')
        },
        {
            btn: document.getElementById('MG'),
            lista: document.getElementById('pL'),
            poemas: document.getElementById('poemsL')
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
    
    mostrar(null);

    function handleHash() {
        switch (window.location.hash) {
            case "#pG":
                document.querySelector("#MG")?.click();
                break;

            case "#pH":
                document.querySelector("#HE")?.click();
                break;
        }
    }
    document.addEventListener("DOMContentLoaded", handleHash);
    
    autores.forEach((a) => {
        if (!a.btn) return;
        a.btn.addEventListener('click', () => mostrar(a));
    });
});
