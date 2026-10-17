const HE = document.getElementById("HE");
const pH = document.getElementById("pH");
const poemsH = document.getElementById("poemsH");

const In = document.getElementById("In");
const pI = document.getElementById("pI");
const poemsI = document.getElementById("poemsI");

(function poemasH() {
    HE.addEventListener('click', () => {
        pH.remove("hidden");
        poemsH.remove("hidden");
        pI.add("hidden");
        poemsI.add("hidden");
    })
})();

(function poemasI() {
    In.addEventListener('click', () => {
        pI.remove("hidden");
        poemsI.remove("hidden");
        pH.add("hidden");
        poemsH.add("hidden");
    })
})();