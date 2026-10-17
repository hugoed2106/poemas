const HE = document.getElementById("HE");
const pH = document.getElementById("pH");
const poemsH = document.getElementById("poemsH");

const In = document.getElementById("In");
const pI = document.getElementById("pI");
const poemsI = document.getElementById("poemsI");

(function poemasH() {
    HE.addEventListener('click', () => {
        pH.hidden = false;
        poemsH.hidden = false;
        pI.hidden = true;
        poemsI.hidden = true;
    })
})();

(function poemasI() {
    In.addEventListener('click', () => {
        pI.hidden = false;
        poemsI.hidden = false;
        pH.hidden = true;
        poemsH.hidden = true;
    })
})();