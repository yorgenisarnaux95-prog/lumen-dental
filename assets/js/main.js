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
    var panelLinks = panel.querySelectorAll("a");
    burger.addEventListener("click", function () {
      var open = burger.classList.toggle("is-open");
      panel.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        panelLinks.forEach(function (a, i) {
          a.style.setProperty("--mnd", reduceMotion.matches ? "0s" : (i * 60) + "ms");
        });
      }
    });
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        burger.classList.remove("is-open");
        panel.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- IntersectionObserver reveals con stagger ----------
     Reversible en ambas direcciones: entra al bajar, se desarma al
     subir por encima. Nunca se hace unobserve. */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger, .reveal-scale, .choreo");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (entry.isIntersecting) {
          el.classList.add("in");
          if (el.classList.contains("reveal-stagger")) {
            var items = el.querySelectorAll(".r-item");
            items.forEach(function (item, i) {
              item.style.transitionDelay = reduceMotion.matches ? "0s" : (i * 90) + "ms";
            });
            clearTimeout(el._staggerClear);
            el._staggerClear = setTimeout(function () {
              items.forEach(function (item) { item.style.transitionDelay = ""; });
            }, items.length * 90 + 900);
          }
          if (el.classList.contains("choreo")) {
            var words = el.querySelectorAll(".word");
            words.forEach(function (w, i) {
              w.style.setProperty("--wd", reduceMotion.matches ? "0s" : (i * 45) + "ms");
            });
          }
        } else {
          el.classList.remove("in");
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- choreo: envuelve cada palabra en <span class="word"> ----------
     conserva el class list de cualquier span interno (p.ej. .accent) en
     vez de aplanarlo, para no perder el énfasis de esa palabra. */
  document.querySelectorAll(".choreo").forEach(function (el) {
    if (el.dataset.split === "done") return;
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.textContent = "";
    var wordIndex = 0;
    nodes.forEach(function (node) {
      var extraClass = node.nodeType === 1 ? node.className : "";
      var text = node.textContent || "";
      text.split(" ").forEach(function (word) {
        if (!word) return;
        if (wordIndex > 0) el.appendChild(document.createTextNode(" "));
        var span = document.createElement("span");
        span.className = extraClass ? "word " + extraClass : "word";
        span.textContent = word;
        el.appendChild(span);
        wordIndex++;
      });
    });
    el.dataset.split = "done";
  });

  /* ---------- subrayado dibujado a mano bajo la palabra de énfasis ---------- */
  document.querySelectorAll(".choreo .word.accent").forEach(function (word) {
    if (word.dataset.underlined === "done") return;
    word.classList.add("accent-underline");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 10");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M2 6 Q 50 1 98 6");
    path.setAttribute("pathLength", "1");
    svg.appendChild(path);
    word.appendChild(svg);
    word.dataset.underlined = "done";
  });

  /* ---------- reveal de cortina: envuelve cada h2 de sección en
     una máscara, el sistema de reveal existente hace el resto ---------- */
  document.querySelectorAll(".section-head h2").forEach(function (h2) {
    if (h2.dataset.maskSplit === "done") return;
    var inner = document.createElement("span");
    inner.className = "mask-inner";
    inner.innerHTML = h2.innerHTML;
    h2.innerHTML = "";
    h2.appendChild(inner);
    h2.dataset.maskSplit = "done";
  });

  /* ---------- iluminación de texto de lectura larga ----------
     cada palabra se enciende al cruzar la franja de lectura,
     continuo y en las dos direcciones del scroll. ---------- */
  document.querySelectorAll(".lit-text").forEach(function (el) {
    if (el.dataset.litSplit === "done") return;
    var text = el.textContent;
    el.textContent = "";
    var words = text.split(" ");
    words.forEach(function (word, i) {
      var span = document.createElement("span");
      span.className = "lit-word";
      span.textContent = word;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    el.dataset.litSplit = "done";
  });
  var litWords = document.querySelectorAll(".lit-word");
  if (litWords.length) {
    var smoothstep = function (x, e0, e1) {
      var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    };
    function updateLit() {
      if (reduceMotion.matches) return;
      var vh = window.innerHeight;
      var focusLine = vh * 0.62;
      var band = vh * 0.16;
      litWords.forEach(function (w) {
        var rect = w.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var p = smoothstep(focusLine - center, -band, band);
        w.style.opacity = (0.32 + p * 0.68).toFixed(2);
        w.classList.toggle("is-lit", p > 0.5);
      });
    }
    var litRaf = null;
    window.addEventListener("scroll", function () {
      if (litRaf) return;
      litRaf = requestAnimationFrame(function () { updateLit(); litRaf = null; });
    }, { passive: true });
    window.addEventListener("resize", updateLit);
    updateLit();
  }

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

  /* ---------- parallax de imágenes: capas a distinta velocidad,
     activo en todo el recorrido del scroll, no solo al entrar ---------- */
  var parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length) {
    function updateParallax() {
      if (reduceMotion.matches) return;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      parallaxEls.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.08;
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var offset = (center - vh / 2) * speed;
        el.style.setProperty("--py", (-offset).toFixed(1) + "px");
      });
    }
    var pRaf = null;
    window.addEventListener("scroll", function () {
      if (pRaf) return;
      pRaf = requestAnimationFrame(function () { updateParallax(); pRaf = null; });
    }, { passive: true });
    window.addEventListener("resize", updateParallax);
    updateParallax();
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
