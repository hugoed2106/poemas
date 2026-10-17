(function () {
  if (!window.pdfjsLib) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  document.querySelectorAll(".pdf").forEach(function (box) {
    var skip = Number(box.dataset.skip || 0), page = 1, doc = null, busy = false, next = null;
    var canvas = box.querySelector("canvas"), msg = box.querySelector(".pdf-msg"),
        prev = box.querySelector(".prev"), nxt = box.querySelector(".next"),
        cur = box.querySelector(".cur"), tot = box.querySelector(".tot");
    function ok(n) { return n !== skip; }
    function step(n, dir) { while (n >= 1 && n <= doc.numPages && !ok(n)) n += dir; return n; }
    function draw(n) {
      busy = true; cur.textContent = n;
      prev.disabled = step(n - 1, -1) < 1; nxt.disabled = step(n + 1, 1) > doc.numPages;
      doc.getPage(n).then(function (p) {
        var w = box.querySelector(".pdf-stage").clientWidth || 360, v1 = p.getViewport({ scale: 1 });
        var s = w / v1.width, r = window.devicePixelRatio || 1, v = p.getViewport({ scale: s * r });
        canvas.width = v.width; canvas.height = v.height; canvas.style.width = w + "px";
        return p.render({ canvasContext: canvas.getContext("2d"), viewport: v }).promise;
      }).then(function () { busy = false; if (next) { var q = next; next = null; go(q); } });
    }
    function go(n) { if (busy) next = n; else draw(n); }
    prev.onclick = function () { var n = step(page - 1, -1); if (n >= 1) { page = n; go(n); } };
    nxt.onclick = function () { var n = step(page + 1, 1); if (n <= doc.numPages) { page = n; go(n); } };
    var url = box.dataset.src.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
    pdfjsLib.getDocument(url).promise.then(function (pdf) {
      doc = pdf; tot.textContent = pdf.numPages - (skip && skip <= pdf.numPages ? 1 : 0);
      page = step(1, 1); msg.hidden = true; canvas.hidden = false; draw(page);
    }).catch(function () { msg.textContent = "No se pudo cargar el PDF."; });
  });
})();
