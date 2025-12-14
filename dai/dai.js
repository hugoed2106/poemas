function mostrarPorFecha(id, mesInicio, diaInicio, mesFin, diaFin) {
  const hoy = new Date();
  const año = hoy.getFullYear();

  const inicio = new Date(año, mesInicio - 1, diaInicio);
  const fin = new Date(año, mesFin - 1, diaFin, 23, 59, 59);

  const dic = document.getElementById("mensaje-dic");

  if (hoy >= inicio && hoy <= fin) {
    dic.classList.remove("hidden");
  }
}
(function () {
    const PASSWORD = "231224"; // Cambia aquí la contraseña si lo deseas
    const STORAGE_KEY = "poemas-unlocked-v1";

    const screen = document.getElementById("screenBlock");
    const form = document.getElementById("passForm");
    const input = document.getElementById("passInput");
    const err = document.getElementById("passError");
    const remember = document.getElementById("remember");
    const clearBtn = document.getElementById("clearBtn");
    const poemList = document.getElementById('poemList');

    // Si ya está autorizado, ocultar la pantalla de bloqueo
    if (localStorage.getItem(STORAGE_KEY) === "1") {
        screen.classList.add("hidden");
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const val = input.value || "";
        if (val === PASSWORD) {
            if (remember.checked) localStorage.setItem(STORAGE_KEY, "1");
            screen.classList.add("hidden");
            err.style.display = "none";
            poemList.classList.remove('hidden'); // Mostrar la lista de poemas
        } else {
            err.style.display = "block";
            input.value = "";
            input.focus();
        }
    });

    clearBtn.addEventListener("click", function () {
        input.value = "";
        err.style.display = "none"; // Ocultar el mensaje de error al limpiar
        input.focus();
    });

    // Permitir Enter y accesibilidad mínima
    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") form.requestSubmit();
    });
})();