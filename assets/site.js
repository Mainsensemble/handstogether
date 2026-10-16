/* Mains Ensemble / Hands Together — scripts communs (sans dépendance) */
(function () {
  "use strict";
  var LANG_KEY = "me_lang_manual";   // choix manuel de langue
  var NL_KEY = "me_newsletter";      // fréquence du pop-up infolettre
  var COOKIE_KEY = "me_notice_ok";   // bandeau d'information témoins
  var DAY = 86400000;

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* 1. Nettoyer ?lang=manual / ?from=auto de l'adresse affichée */
  try {
    var url = new URL(location.href);
    if (url.searchParams.has("lang") || url.searchParams.has("from")) {
      url.searchParams.delete("lang"); url.searchParams.delete("from");
      history.replaceState(null, "", url.pathname + (url.search || "") + url.hash);
    }
  } catch (e) {}

  /* 2. Sélecteur de langue : mémoriser le choix manuel (désactive la redirection auto) */
  document.querySelectorAll("[data-lang-switch]").forEach(function (a) {
    a.addEventListener("click", function () {
      store(LANG_KEY, "1");
      document.cookie = LANG_KEY + "=1; max-age=31536000; path=/; SameSite=Lax; Secure";
    });
  });

  /* 3. Menu mobile */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* 3b. Boutons « Donnez » : aller directement au formulaire Donorbox.
         Les photos qui se chargent plus haut peuvent déplacer la page ;
         on réajuste donc la position pendant quelques secondes,
         sauf si la personne fait défiler elle-même. */
  var form = document.getElementById("formulaire-don");
  if (form) {
    var userMoved = false;
    ["wheel", "touchstart", "keydown"].forEach(function (ev) {
      window.addEventListener(ev, function () { userMoved = true; }, { passive: true });
    });
    function headerH() {
      var h = document.querySelector(".site-header");
      return (h ? h.getBoundingClientRect().height : 0) + 12;
    }
    function goToForm(smooth) {
      var y = form.getBoundingClientRect().top + window.scrollY - headerH();
      window.scrollTo({ top: Math.max(0, y), behavior: smooth ? "smooth" : "auto" });
    }
    function keepOnForm() {
      userMoved = false;
      [1000, 1800, 2800, 4000].forEach(function (t) {
        setTimeout(function () {
          if (userMoved) return;
          var off = form.getBoundingClientRect().top - headerH();
          if (Math.abs(off) > 6) goToForm(false);
        }, t);
      });
    }
    document.querySelectorAll('a[href="#formulaire-don"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        goToForm(true);
        if (history.replaceState) history.replaceState(null, "", "#formulaire-don");
        keepOnForm();
      });
    });
    if (location.hash === "#formulaire-don" || location.hash === "#donnez" || location.hash === "#donate") {
      window.addEventListener("load", function () { goToForm(false); keepOnForm(); });
    }
  }

  /* 4. Bouton « Donnez » flottant Donorbox : ordinateur seulement
        (grand écran + souris). Jamais sur téléphone ni tablette. */
  var sticky = document.getElementById("donorbox-sticky-config");
  if (sticky && window.matchMedia &&
      window.matchMedia("(min-width: 1025px) and (hover: hover) and (pointer: fine)").matches) {
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.id = "donorbox-donate-button-installer";
    s.src = "https://donorbox.org/install-donate-button.js";
    ["data-href", "data-style", "data-button-cta", "data-img-src"].forEach(function (k) {
      s.setAttribute(k, sticky.getAttribute(k));
    });
    document.body.appendChild(s);
  }

  /* 5. Bandeau d'information sur les témoins (Loi 25) */
  var bar = document.getElementById("cookie-bar");
  if (bar && read(COOKIE_KEY) !== "1") {
    bar.classList.add("show");
    var ok = bar.querySelector("[data-cookie-ok]");
    if (ok) ok.addEventListener("click", function () { store(COOKIE_KEY, "1"); bar.classList.remove("show"); });
  }

  /* 6. Carrousel photo : précédent / suivant / pause */
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var track = root.querySelector(".car-track");
    var slides = root.querySelectorAll(".car-slide");
    var prev = root.querySelector("[data-prev]");
    var next = root.querySelector("[data-next]");
    var play = root.querySelector("[data-play]");
    var count = root.querySelector(".car-count");
    var i = 0, timer = null, n = slides.length;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var labels = { pause: play.getAttribute("data-pause"), play: play.getAttribute("data-play-label") };
    function go(k) {
      i = (k + n) % n;
      track.style.transform = "translateX(" + (-100 * i) + "%)";
      slides.forEach(function (sl, j) { sl.setAttribute("aria-hidden", j === i ? "false" : "true"); });
      if (count) count.textContent = (i + 1) + " / " + n;
    }
    function start() { stop(); timer = setInterval(function () { go(i + 1); }, 5000); play.innerHTML = "❚❚ " + labels.pause; play.setAttribute("aria-pressed", "false"); }
    function stop() { if (timer) clearInterval(timer); timer = null; play.innerHTML = "▶ " + labels.play; play.setAttribute("aria-pressed", "true"); }
    prev.addEventListener("click", function () { go(i - 1); if (timer) start(); });
    next.addEventListener("click", function () { go(i + 1); if (timer) start(); });
    play.addEventListener("click", function () { timer ? stop() : start(); });
    // glisser du doigt sur téléphone
    var x0 = null;
    track.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(dx < 0 ? i + 1 : i - 1); if (timer) start(); }
    });
    go(0);
    if (reduce) stop(); else start();
  });

  /* 7. Pop-up infolettre
        - s'ouvre avec le bouton « M'inscrire » à tout moment
        - s'ouvre seul sur ordinateur seulement, après 60 secondes ET la moitié de la page lue,
          sauf s'il a été fermé 2 fois (pause de 5 jours)
        - ne s'ouvre pas seul pendant que la personne regarde le formulaire de don */
  var overlay = document.getElementById("nl-overlay");
  if (!overlay) return;
  var state = { closes: 0, until: 0 };
  try { state = Object.assign(state, JSON.parse(read(NL_KEY) || "{}")); } catch (e) {}
  var frame = overlay.querySelector("iframe");
  var closeBtn = overlay.querySelector(".nl-close");
  var lastFocus = null, autoShown = false, openedByUser = false;
  var donateZone = document.querySelector("[data-donate-zone]");

  function inDonateZone() {
    if (!donateZone) return false;
    var r = donateZone.getBoundingClientRect();
    return r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.4;
  }
  function show(byUser) {
    openedByUser = byUser;
    if (frame && !frame.src) frame.src = frame.getAttribute("data-src");
    lastFocus = document.activeElement;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    closeBtn && closeBtn.focus();
  }
  function autoOpen() {
    if (autoShown || overlay.classList.contains("show")) return;
    if (inDonateZone()) { setTimeout(autoOpen, 20000); return; }
    autoShown = true; show(false);
  }
  function close() {
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    if (!openedByUser) {
      state.closes = (state.closes || 0) + 1;
      if (state.closes >= 2) { state.until = Date.now() + 5 * DAY; state.closes = 0; }
      store(NL_KEY, JSON.stringify(state));
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll("[data-open-newsletter]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); show(true); });
  });
  closeBtn && closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("show")) close();
  });
  /* Ouverture automatique : ordinateur seulement (jamais sur téléphone ni tablette),
     après 60 secondes ET quand la personne a lu au moins la moitié de la page. */
  var isComputer = window.matchMedia &&
    window.matchMedia("(min-width: 1025px) and (hover: hover) and (pointer: fine)").matches;
  if (isComputer && !(state.until && Date.now() < state.until)) {
    var timeOk = false, scrollOk = false;
    function readHalf() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      return h <= 0 || window.scrollY / h >= 0.5;
    }
    function check() { if (timeOk && scrollOk) { window.removeEventListener("scroll", onScroll); autoOpen(); } }
    function onScroll() { if (!scrollOk && readHalf()) { scrollOk = true; check(); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    setTimeout(function () { timeOk = true; scrollOk = scrollOk || readHalf(); check(); }, 60000);
  }
})();
