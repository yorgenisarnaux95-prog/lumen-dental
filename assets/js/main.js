/* LUMEN — motor compartido: reveals, nav flotante, cursor, menú móvil, reduced motion */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- nav flotante (aparece al subir, se oculta al bajar) ---------- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var lastY = window.scrollY;
    var navShown = false;
    function showNav() { if (!navShown) { nav.classList.add("is-visible"); nav.classList.remove("is-hidden"); navShown = true; } }
    function hideNav() { if (navShown && window.scrollY > 120) { nav.classList.remove("is-visible"); nav.classList.add("is-hidden"); navShown = false; } }
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y < 80) { showNav(); }
      else if (y < lastY - 4) { showNav(); }
      else if (y > lastY + 4) { hideNav(); }
      lastY = y;
    }, { passive: true });
    setTimeout(showNav, 300);
  }

  /* ---------- menú móvil ---------- */
  var burger = document.querySelector(".nav-burger");
  var panel = document.querySelector(".mobile-panel");
  if (burger && panel) {
    burger.addEventListener("click", function () {
      var open = burger.classList.toggle("is-open");
      panel.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        burger.classList.remove("is-open");
        panel.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- IntersectionObserver reveals con stagger ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger, .reveal-scale, .choreo");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("in");
        if (el.classList.contains("reveal-stagger")) {
          var items = el.querySelectorAll(".r-item");
          items.forEach(function (item, i) {
            item.style.transitionDelay = reduceMotion.matches ? "0s" : (i * 90) + "ms";
          });
          setTimeout(function () {
            items.forEach(function (item) { item.style.transitionDelay = ""; });
          }, items.length * 90 + 900);
        }
        if (el.classList.contains("choreo")) {
          var words = el.querySelectorAll(".word");
          words.forEach(function (w, i) {
            w.style.setProperty("--wd", reduceMotion.matches ? "0s" : (i * 45) + "ms");
          });
        }
        io.unobserve(el);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- choreo: envuelve cada palabra en <span class="word"> ---------- */
  document.querySelectorAll(".choreo").forEach(function (el) {
    if (el.dataset.split === "done") return;
    var text = el.textContent;
    el.textContent = "";
    var words = text.split(" ");
    words.forEach(function (word, i) {
      var span = document.createElement("span");
      span.className = "word";
      span.textContent = word;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    el.dataset.split = "done";
  });

  /* ---------- contadores animados ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    var started = false;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || started) return;
        started = true;
        if (reduceMotion.matches) { el.textContent = target.toFixed(decimals); obs.unobserve(el); return; }
        var start = performance.now();
        var dur = 1400;
        function tick(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.6 });
    obs.observe(el);
  });

  /* ---------- líneas SVG que se autotrazan con scroll ---------- */
  var drawEls = document.querySelectorAll("[data-draw-path]");
  if (drawEls.length) {
    drawEls.forEach(function (path) {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
    });
    function updateDraw() {
      drawEls.forEach(function (path) {
        var rect = path.ownerSVGElement.getBoundingClientRect();
        var vh = window.innerHeight;
        var p = (vh - rect.top) / (vh + rect.height);
        p = Math.max(0, Math.min(1, p));
        var len = path.getTotalLength();
        path.style.strokeDashoffset = reduceMotion.matches ? 0 : len * (1 - p);
      });
    }
    var drawRaf = null;
    window.addEventListener("scroll", function () {
      if (drawRaf) return;
      drawRaf = requestAnimationFrame(function () { updateDraw(); drawRaf = null; });
    }, { passive: true });
    window.addEventListener("resize", updateDraw);
    updateDraw();
  }

  /* ---------- cursor personalizado (desktop) + ripple móvil ---------- */
  var mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var cursor = null;
  function initCursor() {
    if (cursor || !mqFine.matches) return;
    cursor = document.createElement("div");
    cursor.className = "cursor";
    document.body.appendChild(cursor);
    var cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      if (cursor) { cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)"; requestAnimationFrame(loop); }
    })();
    document.querySelectorAll("a, button, .btn").forEach(function (el) {
      el.addEventListener("pointerenter", function () { cursor && cursor.classList.add("is-active"); });
      el.addEventListener("pointerleave", function () { cursor && cursor.classList.remove("is-active"); });
    });
  }
  if (mqFine.matches) initCursor();

  document.addEventListener("pointerdown", function (e) {
    if (mqFine.matches) return;
    var target = e.target.closest("a, button, .btn");
    if (!target) return;
    var r = document.createElement("span");
    r.className = "ripple";
    r.style.left = e.clientX + "px";
    r.style.top = e.clientY + "px";
    document.body.appendChild(r);
    setTimeout(function () { r.remove(); }, 650);
  });

  /* ---------- reduced motion en vivo ---------- */
  reduceMotion.addEventListener("change", function (e) {
    if (e.matches) { document.body.classList.add("paused"); revealEls.forEach(function (el) { el.classList.add("in"); }); }
    else { document.body.classList.remove("paused"); }
  });
  if (reduceMotion.matches) document.body.classList.add("paused");

  /* ---------- pausa animaciones fuera de viewport / pestaña oculta ---------- */
  document.addEventListener("visibilitychange", function () {
    document.body.classList.toggle("paused", document.hidden || reduceMotion.matches);
  });
})();
