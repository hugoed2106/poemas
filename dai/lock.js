(function () {
  var PASSWORD = "231224", KEY = "poemas-dai-unlocked-v1";
  var screen = document.getElementById("screenBlock"), form = document.getElementById("passForm"),
      input = document.getElementById("passInput"), err = document.getElementById("passError"),
      remember = document.getElementById("remember"), clearBtn = document.getElementById("clearBtn");
  function open() { screen.hidden = true; document.body.classList.remove("locked"); }
  var saved = false; try { saved = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (saved) open(); else { document.body.classList.add("locked"); input.focus(); }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (input.value === PASSWORD) {
      try { if (remember.checked) localStorage.setItem(KEY, "1"); } catch (x) {}
      err.hidden = true; open();
    } else { err.hidden = false; input.value = ""; input.focus(); }
  });
  clearBtn.addEventListener("click", function () { input.value = ""; err.hidden = true; input.focus(); });
})();
