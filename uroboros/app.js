/* ============================================================
   УРОБОРОС — логика страницы.
   1) переключение семи стилей (текст не меняется, меняется форма)
   2) фоновые эффекты, свои для каждого стиля
   3) интерактивный виджет лаборатории, свой для каждого стиля
   4) общие штуки: калькулятор, форма, скролл-анимации
   ============================================================ */

(function () {
  "use strict";

  var THEMES = {
    cyber:  { name: "Кибер-брутализм", ticker: "СИСТЕМА В НОРМЕ // ОЧЕРЕДЬ: 2 ПРОЕКТА // РЕНДЕР 87% // ДОСТУП РАЗРЕШЁН" },
    swiss:  { name: "Брутализм",       ticker: "ФОРМА СЛЕДУЕТ ЗА СМЫСЛОМ / КРУПНО / ЧЁТКО / БЕЗ УКРАШЕНИЙ" },
    paper:  { name: "Газета",          ticker: "ВЕЧЕРНИЙ ВЫПУСК · СТУДИЯ УРОБОРОС ОТКРЫЛА НАБОР НА ОСЕНЬ · ЦЕНА НОМЕРА 3 КОП." },
    matrix: { name: "Матрица",         ticker: "> ПОДКЛЮЧЕНИЕ УСТАНОВЛЕНО // СЛЕДУЙ ЗА БЕЛЫМ КРОЛИКОМ // ВЫБЕРИ ТАБЛЕТКУ" },
    apple:  { name: "Минимализм",      ticker: "Меньше решений. Больше смысла. Дизайн, который не мешает." },
    y2k:    { name: "Y2K / сцена",     ticker: "★ WELCOME 2 MY SITE ★ BEST VIEWED IN 1024x768 ★ SIGN MY GUESTBOOK ★" },
    neo:    { name: "Neocities",       ticker: "✿ сайт обновлён 31.08 ✿ спасибо что зашли ✿ under construction ✿" },
    custom: { name: "Свой стиль",      ticker: "Чистый лист · персональный стиль под ваш бизнес · анкета занимает две минуты" }
  };
  var ORDER = ["cyber", "swiss", "paper", "matrix", "apple", "y2k", "neo", "custom"];
  var KEY = "uroboros-theme";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var rub = function (n) { return Math.round(n).toLocaleString("ru-RU") + " ₽"; };

  var current = null;
  var cleanup = [];          // функции остановки эффектов текущей темы
  function onCleanup(fn) { cleanup.push(fn); }
  function runCleanup() {
    cleanup.forEach(function (fn) { try { fn(); } catch (e) {} });
    cleanup = [];
    $("#fxLayer").innerHTML = "";
  }

  /* ==========================================================
     ПЕРЕКЛЮЧЕНИЕ ТЕМ
     ========================================================== */
  function setTheme(key, save) {
    if (!THEMES[key] || key === current) return;
    runCleanup();
    current = key;
    document.documentElement.setAttribute("data-theme", key);

    $$(".chip").forEach(function (c) { c.classList.toggle("is-active", c.dataset.setTheme === key); });
    $$("#footerThemes button").forEach(function (b) { b.classList.toggle("is-active", b.dataset.setTheme === key); });
    $("#currentThemeName").textContent = THEMES[key].name;
    $("#widgetThemeName").textContent = THEMES[key].name;
    $("#footerTheme").textContent = "Стиль: " + THEMES[key].name;
    buildMarquee(THEMES[key].ticker);

    EFFECTS[key] && EFFECTS[key]();
    WIDGETS[key] && WIDGETS[key]($("#themeWidget"));

    if (save !== false) { try { localStorage.setItem(KEY, key); } catch (e) {} }
  }

  function buildMarquee(text) {
    var track = $("#marqueeTrack");
    track.innerHTML = "";
    for (var i = 0; i < 8; i++) track.appendChild(el("span", null, text));
  }

  /* ==========================================================
     ФОНОВЫЕ ЭФФЕКТЫ ТЕМ
     ========================================================== */
  var EFFECTS = {

    /* Матрица: падающие символы */
    matrix: function () {
      var layer = $("#fxLayer");
      var cv = el("canvas");
      layer.appendChild(cv);
      var ctx = cv.getContext("2d");
      var chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ";
      var size = 16, cols, drops;

      function resize() {
        cv.width = window.innerWidth; cv.height = window.innerHeight;
        cols = Math.ceil(cv.width / size);
        drops = new Array(cols);
        for (var i = 0; i < cols; i++) drops[i] = Math.random() * -50;
      }
      resize();
      window.addEventListener("resize", resize);

      var raf, last = 0;
      function tick(t) {
        raf = requestAnimationFrame(tick);
        if (t - last < 55) return;
        last = t;
        ctx.fillStyle = "rgba(0,0,0,.09)";
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.font = size + "px 'Share Tech Mono', monospace";
        for (var i = 0; i < cols; i++) {
          var ch = chars[(Math.random() * chars.length) | 0];
          var y = drops[i] * size;
          ctx.fillStyle = Math.random() > 0.97 ? "#d8ffe4" : "rgba(0,255,65,.55)";
          ctx.fillText(ch, i * size, y);
          if (y > cv.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        }
      }
      raf = requestAnimationFrame(tick);
      onCleanup(function () { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); });
    },

    /* Y2K: блёстки за курсором */
    y2k: function () {
      var glyphs = ["✦", "★", "♥", "✧", "☆", "✿"];
      var colors = ["#ff00e6", "#5cff5c", "#ffe14d", "#00e5ff", "#ffffff"];
      var lastT = 0;
      function onMove(e) {
        var now = Date.now();
        if (now - lastT < 45) return;
        lastT = now;
        var s = el("span", "spark", glyphs[(Math.random() * glyphs.length) | 0]);
        s.style.left = e.clientX + "px";
        s.style.top = e.clientY + "px";
        s.style.color = colors[(Math.random() * colors.length) | 0];
        s.style.setProperty("--dx", ((Math.random() * 40) - 20) + "px");
        document.body.appendChild(s);
        setTimeout(function () { s.remove(); }, 900);
      }
      window.addEventListener("mousemove", onMove);
      onCleanup(function () {
        window.removeEventListener("mousemove", onMove);
        $$(".spark").forEach(function (n) { n.remove(); });
      });
    },

    /* Кибер: редкий глитч-сдвиг всей страницы */
    cyber: function () {
      var id = setInterval(function () {
        if (Math.random() > 0.55) return;
        var b = document.body;
        b.style.transition = "none";
        b.style.transform = "translateX(" + ((Math.random() * 6) - 3) + "px)";
        setTimeout(function () { b.style.transform = ""; }, 70);
      }, 5200);
      onCleanup(function () { clearInterval(id); document.body.style.transform = ""; });
    },

    /* Минимализм: плавный параллакс макета */
    apple: function () {
      var mock = $(".mock");
      function onScroll() {
        var y = window.scrollY;
        if (y < 900) mock.style.transform = "translateY(" + (y * -0.04) + "px)";
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      onCleanup(function () { window.removeEventListener("scroll", onScroll); mock.style.transform = ""; });
    },

    /* Брутализм: красный след-квадрат за курсором */
    swiss: function () {
      var dot = el("div");
      dot.style.cssText = "position:fixed;z-index:95;width:18px;height:18px;background:#e8341c;mix-blend-mode:multiply;pointer-events:none;left:-40px;top:-40px;transition:transform .12s ease";
      document.body.appendChild(dot);
      var x = 0, y = 0, cx = 0, cy = 0, raf;
      function onMove(e) { x = e.clientX; y = e.clientY; }
      function loop() {
        cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
        dot.style.left = (cx - 9) + "px"; dot.style.top = (cy - 9) + "px";
        raf = requestAnimationFrame(loop);
      }
      window.addEventListener("mousemove", onMove);
      raf = requestAnimationFrame(loop);
      onCleanup(function () { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); dot.remove(); });
    },

    /* Газета: лёгкое зерно поверх страницы */
    paper: function () {
      var layer = $("#fxLayer");
      var grain = el("div");
      grain.style.cssText = "position:absolute;inset:0;opacity:.16;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")";
      layer.appendChild(grain);
    },

    /* Neocities: плывущие облачка-гифки */
    neo: function () {
      var layer = $("#fxLayer");
      var wrap = el("div");
      wrap.style.cssText = "position:absolute;inset:0;overflow:hidden";
      layer.appendChild(wrap);
      var items = ["☁", "✿", "★", "☾", "❀"];
      for (var i = 0; i < 7; i++) {
        var s = el("span", null, items[i % items.length]);
        var dur = 26 + Math.random() * 30;
        s.style.cssText = "position:absolute;font-size:" + (18 + Math.random() * 22) + "px;opacity:.5;color:#7f92ea;top:" +
          (Math.random() * 90) + "%;left:-8%;animation:neoFloat " + dur + "s linear " + (-Math.random() * dur) + "s infinite";
        wrap.appendChild(s);
      }
      if (!$("#neoKeyframes")) {
        var st = el("style"); st.id = "neoKeyframes";
        st.textContent = "@keyframes neoFloat{to{transform:translateX(118vw)}}";
        document.head.appendChild(st);
      }
    }
  };

  /* ==========================================================
     ВИДЖЕТЫ ЛАБОРАТОРИИ (у каждого стиля свой)
     ========================================================== */
  var WIDGETS = {

    /* 01 · КИБЕР: панель состояния студии + сканирование */
    cyber: function (root) {
      root.innerHTML =
        '<p class="tw-note">Панель загрузки студии. Нажмите «Сканировать», чтобы пересобрать показатели.</p>' +
        '<div class="tw-bars" id="cbBars"></div>' +
        '<div class="tw-screen" id="cbLog"></div>' +
        '<div class="tw-row"><button class="tw-btn" id="cbScan">▶ Сканировать</button><button class="tw-btn" id="cbClear">Очистить лог</button></div>';

      var metrics = ["ЗАГРУЗКА СТУДИИ", "СВОБОДНЫЕ СЛОТЫ", "ОТРИСОВКА", "ОЧЕРЕДЬ ПРАВОК", "СВЯЗЬ С КЛИЕНТОМ"];
      var bars = $("#cbBars", root);
      metrics.forEach(function (m) {
        var row = el("div", "tw-bar");
        row.innerHTML = '<span>' + m + '</span><span class="tw-bar-track"><i class="tw-bar-fill"></i></span><b>0%</b>';
        bars.appendChild(row);
      });
      var log = $("#cbLog", root);
      function push(line) {
        var p = el("div", "tw-term-line", line);
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
      }
      function scan() {
        push("&gt; SCAN " + new Date().toLocaleTimeString("ru-RU") + " :: сбор телеметрии…");
        $$(".tw-bar", bars).forEach(function (row, i) {
          var v = 35 + Math.round(Math.random() * 62);
          $(".tw-bar-fill", row).style.width = v + "%";
          $("b", row).textContent = v + "%";
          setTimeout(function () { push("&nbsp;&nbsp;" + metrics[i] + " … " + v + "% OK"); }, 140 * (i + 1));
        });
        var slots = (C && C.status && C.status.slots != null) ? C.status.slots : 3;
        var queue = (C && C.status && C.status.queue != null) ? C.status.queue : 2;
        setTimeout(function () { push("&gt; ГОТОВО. В очереди: " + queue + ". Свободных слотов на месяц: " + slots); }, 900);
      }
      $("#cbScan", root).addEventListener("click", scan);
      $("#cbClear", root).addEventListener("click", function () { log.innerHTML = ""; });
      push("&gt; УРОБОРОС OS v7.0 // модуль статистики");
      scan();
    },

    /* 02 · БРУТАЛИЗМ: типографическая шкала */
    swiss: function (root) {
      root.innerHTML =
        '<p class="tw-note">Типографика — главный материал в этом стиле. Тяните ползунок и меняйте слово.</p>' +
        '<div class="tw-huge" id="swWord" style="font-size:76px">ФОРМА</div>' +
        '<div class="field"><label>Кегль: <b id="swSize">76</b> px</label><input type="range" id="swRange" min="28" max="180" value="76"></div>' +
        '<div class="tw-row">' +
          '<button class="tw-btn" data-w="ФОРМА">ФОРМА</button>' +
          '<button class="tw-btn" data-w="СМЫСЛ">СМЫСЛ</button>' +
          '<button class="tw-btn" data-w="СЕТКА">СЕТКА</button>' +
          '<button class="tw-btn" data-w="КОНТРАСТ">КОНТРАСТ</button>' +
          '<button class="tw-btn" id="swInv">Инверсия</button>' +
        '</div>';
      var word = $("#swWord", root), range = $("#swRange", root);
      range.addEventListener("input", function () {
        word.style.fontSize = range.value + "px";
        $("#swSize", root).textContent = range.value;
      });
      $$("[data-w]", root).forEach(function (b) {
        b.addEventListener("click", function () { word.textContent = b.dataset.w; });
      });
      $("#swInv", root).addEventListener("click", function () { word.classList.toggle("tw-invert"); });
    },

    /* 03 · ГАЗЕТА: наборная касса и печать одобрения */
    paper: function (root) {
      root.innerHTML =
        '<p class="tw-note">Наборный цех. Напечатайте заголовок вашего будущего сайта — увидите его в газетной гарнитуре.</p>' +
        '<input class="tw-input" id="ppInput" maxlength="42" value="Ваш заголовок в вечернем выпуске">' +
        '<div class="tw-type-out" id="ppOut"></div>' +
        '<div class="tw-row"><button class="tw-btn" id="ppPrint">Печатать</button><button class="tw-btn" id="ppStamp">Поставить штамп</button></div>' +
        '<div class="tw-stamp"><div class="tw-stamp-mark" id="ppMark">В НОМЕР · ОДОБРЕНО</div></div>';
      var input = $("#ppInput", root), out = $("#ppOut", root), timer = null;
      function typeIt() {
        clearTimeout(timer);
        var text = input.value || " ", i = 0;
        out.textContent = "";
        (function step() {
          out.textContent = text.slice(0, ++i);
          if (i < text.length) timer = setTimeout(step, 34);
        })();
      }
      $("#ppPrint", root).addEventListener("click", typeIt);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") typeIt(); });
      $("#ppStamp", root).addEventListener("click", function () {
        var m = $("#ppMark", root);
        m.classList.remove("is-on");
        void m.offsetWidth;
        m.classList.add("is-on");
      });
      typeIt();
      onCleanup(function () { clearTimeout(timer); });
    },

    /* 04 · МАТРИЦА: настоящий терминал с командами */
    matrix: function (root) {
      root.innerHTML =
        '<p class="tw-note">Терминал студии. Команды: help, price, works, time, order, whoami, clear.</p>' +
        '<div class="tw-screen" id="mxScreen"></div>' +
        '<div class="tw-prompt"><span>root@uroboros:~$</span><input id="mxInput" autocomplete="off" spellcheck="false"></div>';
      var screen = $("#mxScreen", root), input = $("#mxInput", root);
      function say(t) { var d = el("div", "tw-term-line", t); screen.appendChild(d); screen.scrollTop = screen.scrollHeight; }
      var CMD = {
        help: "Доступно: help, price, works, time, order, whoami, clear",
        price: "лендинг 40 000 ₽ · сайт под ключ 120 000 ₽ · индивидуально от 230 000 ₽ · предоплата 30%",
        works: "ГИДРА / ВЕЧЕРНИЙ ТИРАЖ / ORACLE / ЛУНА / ARCADE-77 / СЕВЕР",
        order: "Заявка открыта: прокрутите вниз до блока «Оставить заявку» и заполните бриф.",
        whoami: "guest · потенциальный клиент · уровень доступа: полный"
      };
      CMD.help = "Доступно: help, price, works, queue, time, order, whoami, clear";
      CMD.queue = (function () {
        var s = (C && C.status) || {};
        return s.open === false
          ? (s.noteClosed || "запись временно закрыта")
          : "в очереди " + (s.queue != null ? s.queue : "?") + " · свободных слотов " + (s.slots != null ? s.slots : "?") + " · ближайший старт " + (s.nextStart || "по договорённости");
      })();
      function run(raw) {
        var c = raw.trim().toLowerCase();
        say('<span style="opacity:.6">root@uroboros:~$ ' + raw + "</span>");
        if (!c) return;
        if (c === "clear") { screen.innerHTML = ""; return; }
        if (c === "time") { say(new Date().toLocaleString("ru-RU")); return; }
        say(CMD[c] || ('команда "' + c + '" не найдена. Наберите help'));
      }
      input.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        run(input.value);
        input.value = "";
      });
      say("Wake up… соединение установлено.");
      say("УРОБОРОС / DESIGN NODE 07 / доступ разрешён.");
      say("Наберите help и нажмите Enter.");
    },

    /* 05 · МИНИМАЛИЗМ: конфигуратор с плавным наклоном */
    apple: function (root) {
      root.innerHTML =
        '<p class="tw-note">Конфигуратор пакета. Наведите на карточку — она отзовётся на движение курсора.</p>' +
        '<div class="tw-tilt"><div class="tw-tilt-card" id="apCard">' +
          '<div style="font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;opacity:.55" id="apName">Лендинг</div>' +
          '<div class="tw-big" id="apPrice">40 000 ₽</div>' +
          '<div style="opacity:.6;font-size:.9rem" id="apTerm">7–10 рабочих дней</div>' +
        '</div></div>' +
        '<div class="seg" id="apSeg">' +
          '<button class="seg-btn is-active" data-n="Лендинг" data-p="40 000 ₽" data-t="7–10 рабочих дней">Лендинг</button>' +
          '<button class="seg-btn" data-n="Сайт под ключ" data-p="120 000 ₽" data-t="3–4 недели">Под ключ</button>' +
          '<button class="seg-btn" data-n="Индивидуально" data-p="от 230 000 ₽" data-t="от 6 недель">Индивидуально</button>' +
        '</div>' +
        '<p class="tw-note">Каждый пакет включает прототип, адаптив и исходники в Figma.</p>';
      var card = $("#apCard", root);
      function onMove(e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - .5) * -10;
        var ry = ((e.clientX - r.left) / r.width - .5) * 12;
        card.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
      }
      function onLeave() { card.style.transform = ""; }
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      $$("#apSeg .seg-btn", root).forEach(function (b) {
        b.addEventListener("click", function () {
          $$("#apSeg .seg-btn", root).forEach(function (x) { x.classList.remove("is-active"); });
          b.classList.add("is-active");
          card.style.opacity = "0"; card.style.transition = "opacity .18s";
          setTimeout(function () {
            $("#apName", root).textContent = b.dataset.n;
            $("#apPrice", root).textContent = b.dataset.p;
            $("#apTerm", root).textContent = b.dataset.t;
            card.style.opacity = "1";
          }, 180);
        });
      });
    },

    /* 06 · Y2K: счётчик, блёстки и гадалка */
    y2k: function (root) {
      root.innerHTML =
        '<p class="tw-note">★ Добро пожаловать в мою лабораторию! Не забудь нажать на кнопку ★</p>' +
        '<div class="tw-row"><span class="tw-counter" id="ykCount">000000</span><span class="tw-note">посетителей с 2001 года</span></div>' +
        '<div class="tw-glitter" id="ykBox"><b id="ykFortune" style="text-align:center;padding:0 14px">Нажми кнопку и узнай, какой стиль твой</b></div>' +
        '<div class="tw-row">' +
          '<button class="tw-btn" id="ykBoom">✦ ЖМИ МЕНЯ ✦</button>' +
          '<button class="tw-btn" id="ykFort">Погадать на стиль</button>' +
        '</div>';
      var n = 0;
      try { n = parseInt(localStorage.getItem("uroboros-hits") || "48713", 10); } catch (e) { n = 48713; }
      n += 1;
      try { localStorage.setItem("uroboros-hits", String(n)); } catch (e) {}
      $("#ykCount", root).textContent = String(n).padStart(6, "0");

      var box = $("#ykBox", root);
      $("#ykBoom", root).addEventListener("click", function () {
        var g = ["✦", "★", "♥", "☆", "✧"], c = ["#ff00e6", "#5cff5c", "#ffe14d", "#00e5ff", "#fff"];
        for (var i = 0; i < 34; i++) {
          (function (i) {
            var s = el("span", null, g[(Math.random() * g.length) | 0]);
            s.style.cssText = "position:absolute;left:50%;top:50%;pointer-events:none;font-size:" + (10 + Math.random() * 18) +
              "px;color:" + c[(Math.random() * c.length) | 0] + ";transition:transform .9s ease-out,opacity .9s";
            box.appendChild(s);
            requestAnimationFrame(function () {
              s.style.transform = "translate(" + ((Math.random() * 300) - 150) + "px," + ((Math.random() * 220) - 110) + "px) rotate(" + (Math.random() * 720) + "deg)";
              s.style.opacity = "0";
            });
            setTimeout(function () { s.remove(); }, 950);
          })(i);
        }
      });
      var fortunes = ["Тебе идёт кибер-брутализм ⚡", "Твой стиль — газета, ты любишь длинные тексты 📰",
        "Матрица зовёт. Зелёный тебе к лицу 🕶", "Минимализм: ничего лишнего, только суть ◻",
        "Y2K! Блёстки, гифки и счётчик посетителей ✦", "Neocities: уютный сайт с гостевой книгой ✿",
        "Брутализм: крупно, красно, честно ▮"];
      $("#ykFort", root).addEventListener("click", function () {
        $("#ykFortune", root).textContent = fortunes[(Math.random() * fortunes.length) | 0];
      });
    },

    /* 07 · NEOCITIES: питомец и гостевая книга */
    neo: function (root) {
      root.innerHTML =
        '<p class="tw-note">Уголок как в старом вебе: питомец и настоящая гостевая книга (записи хранятся в вашем браузере).</p>' +
        '<div class="tw-pet">' +
          '<div class="tw-pet-face" id="npFace">(^‿^)</div>' +
          '<div class="tw-pet-stats"><span>сытость: <b id="npFood">70</b></span><span>радость: <b id="npJoy">60</b></span></div>' +
          '<div class="tw-row"><button class="tw-btn" id="npFeed">Покормить 🍪</button><button class="tw-btn" id="npPlay">Поиграть 🎮</button></div>' +
        '</div>' +
        '<div class="field" style="margin:0"><label>Гостевая книга</label>' +
          '<input class="tw-input" id="npName" placeholder="Ваше имя" maxlength="20" style="margin-bottom:8px">' +
          '<input class="tw-input" id="npMsg" placeholder="Оставьте сообщение и нажмите Enter" maxlength="80">' +
        '</div>' +
        '<div class="tw-gb-list" id="npList"></div>';

      var food = 70, joy = 60, face = $("#npFace", root);
      function draw() {
        $("#npFood", root).textContent = food;
        $("#npJoy", root).textContent = joy;
        face.textContent = joy > 75 ? "(^▽^)" : joy > 45 ? "(^‿^)" : food < 35 ? "(っ- ‸ -ς)" : "(・_・)";
        face.classList.add("is-happy");
        setTimeout(function () { face.classList.remove("is-happy"); }, 220);
      }
      $("#npFeed", root).addEventListener("click", function () { food = Math.min(100, food + 12); joy = Math.min(100, joy + 4); draw(); });
      $("#npPlay", root).addEventListener("click", function () { joy = Math.min(100, joy + 14); food = Math.max(0, food - 6); draw(); });
      var decay = setInterval(function () { food = Math.max(0, food - 1); joy = Math.max(0, joy - 1); draw(); }, 9000);
      onCleanup(function () { clearInterval(decay); });
      draw();

      var list = $("#npList", root);
      function load() {
        var data;
        try { data = JSON.parse(localStorage.getItem("uroboros-guestbook") || "null"); } catch (e) { data = null; }
        if (!data) data = [{ n: "Марина", m: "Ой, как в 2004-м! Сделайте мне такой же ✿" }, { n: "kostya_98", m: "Гостевая книга — топ. Пишу заявку." }];
        list.innerHTML = "";
        data.slice(-12).forEach(function (r) {
          list.appendChild(el("div", "tw-gb-item", "<b>" + esc(r.n) + ":</b> " + esc(r.m)));
        });
        list.scrollTop = list.scrollHeight;
        return data;
      }
      function esc(s) { return String(s).replace(/[<>&"]/g, function (c) { return ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]; }); }
      var entries = load();
      $("#npMsg", root).addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        var m = this.value.trim();
        if (!m) return;
        var nm = $("#npName", root).value.trim() || "аноним";
        entries.push({ n: nm, m: m });
        try { localStorage.setItem("uroboros-guestbook", JSON.stringify(entries.slice(-40))); } catch (e2) {}
        this.value = "";
        entries = load();
      });
    },

    /* 08 · СВОЙ СТИЛЬ: анкета на персональный дизайн */
    custom: function (root) {
      var GROUPS = [
        { key: "Тон", opts: ["Светлый и спокойный", "Тёмный и premium", "Яркий и дерзкий"] },
        { key: "Характер", opts: ["Строгий, деловой", "Тёплый, человечный", "Экспериментальный"] },
        { key: "Плотность", opts: ["Много воздуха", "Плотно, много данных"] },
        { key: "Движение", opts: ["Без анимаций", "Мягкие переходы", "Заметная анимация"] }
      ];
      root.innerHTML =
        '<p class="tw-note">Ни один из семи стилей не подошёл — соберём восьмой, ваш. Отметьте, каким вы видите сайт, и мы предложим направление.</p>' +
        '<div id="cuGroups"></div>' +
        '<div class="field" style="margin:0"><label>Сайты, которые вам нравятся</label>' +
        '<input class="tw-input" id="cuRefs" placeholder="ссылки или названия через запятую"></div>' +
        '<div class="tw-row"><button class="tw-btn" id="cuSend">Перенести в бриф</button></div>' +
        '<p class="tw-note" id="cuOut"></p>';

      var wrap = $("#cuGroups", root);
      GROUPS.forEach(function (g, gi) {
        var f = el("div", "field");
        f.innerHTML = '<label>' + g.key + '</label>';
        var seg = el("div", "seg");
        g.opts.forEach(function (o, oi) {
          var b = el("button", "seg-btn" + (oi === 0 ? " is-active" : ""), o);
          b.type = "button";
          b.dataset.group = gi;
          b.addEventListener("click", function () {
            $$('[data-group="' + gi + '"]', wrap).forEach(function (x) { x.classList.remove("is-active"); });
            b.classList.add("is-active");
          });
          seg.appendChild(b);
        });
        f.appendChild(seg);
        wrap.appendChild(f);
      });

      $("#cuSend", root).addEventListener("click", function () {
        var picked = GROUPS.map(function (g, gi) {
          var b = $('[data-group="' + gi + '"].is-active', wrap);
          return g.key + ": " + (b ? b.textContent : "—");
        }).join("; ");
        var refs = $("#cuRefs", root).value.trim();
        var text = "Хочу персональный стиль. " + picked + (refs ? ". Нравятся: " + refs : "") + ".";
        var task = $("#fTask");
        task.value = task.value ? task.value.replace(/\s*$/, "") + " " + text : text;
        $("#fStyle").value = "custom";
        $("#cuOut", root).textContent = "Готово — ответы перенесены в бриф ниже. Осталось указать имя и контакт.";
        $("#brief").scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  /* ==========================================================
     СОДЕРЖИМОЕ ИЗ content.js (редактируется через admin.html)
     ========================================================== */
  var C = window.SITE_CONTENT || null;

  function pick(path) {
    return path.split(".").reduce(function (o, k) {
      return (o == null) ? undefined : o[k];
    }, C);
  }

  function applyContent() {
    if (!C) return;

    // простые подстановки по data-c="путь.к.значению"
    $$("[data-c]").forEach(function (n) {
      var v = pick(n.dataset.c);
      if (v == null) return;
      n.textContent = v;
      if (n.hasAttribute("data-text")) n.setAttribute("data-text", v);
    });

    // списки по data-c-list="путь.к.массиву"
    $$("[data-c-list]").forEach(function (n) {
      var arr = pick(n.dataset.cList);
      if (!Array.isArray(arr)) return;
      n.innerHTML = "";
      arr.forEach(function (t) { n.appendChild(el("li", null, String(t))); });
    });

    // строка статуса и очереди
    var s = C.status || {};
    var line = $("#statusLine");
    if (line) {
      var text = s.open
        ? "Очередь: " + plural(s.queue, "проект", "проекта", "проектов") +
          " · свободно " + plural(s.slots, "слот", "слота", "слотов") +
          (s.nextStart ? " · старт " + s.nextStart : "") +
          (s.noteOpen ? " · " + s.noteOpen : "")
        : (s.noteClosed || "Запись временно закрыта");
      $(".status-text", line).textContent = text;
      line.classList.toggle("is-closed", !s.open);
    }

    // контакты
    var k = C.contacts || {};
    if (k.telegram) setLink("#cTelegram", k.telegram, "https://t.me/" + String(k.telegram).replace(/^@/, ""));
    if (k.email) setLink("#cEmail", k.email, "mailto:" + k.email);
    if (k.phone) setLink("#cPhone", k.phone, "tel:" + String(k.phone).replace(/[^\d+]/g, ""));

    // цены калькулятора
    var calc = C.calc || {};
    var types = $$("#calcType .seg-btn");
    [calc.landing, calc.multi, calc.app].forEach(function (p, i) {
      if (p && types[i]) types[i].dataset.price = p;
    });
  }

  function setLink(sel, text, href) {
    var a = $(sel);
    if (!a) return;
    a.textContent = text;
    a.href = href;
  }

  function plural(n, one, few, many) {
    n = Number(n) || 0;
    var n10 = n % 10, n100 = n % 100, word;
    if (n10 === 1 && n100 !== 11) word = one;
    else if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) word = few;
    else word = many;
    return n + " " + word;
  }

  /* ==========================================================
     ОБЩЕЕ: калькулятор, форма, скролл, мелочи
     ========================================================== */
  function initCalc() {
    var typeBtns = $$("#calcType .seg-btn");
    var range = $("#pagesRange"), sum = $("#calcSum"), term = $("#calcTerm"), pagesOut = $("#pagesOut");

    function calc() {
      var active = $("#calcType .seg-btn.is-active");
      var base = parseInt(active.dataset.price, 10);
      var days = parseInt(active.dataset.days, 10);
      var pages = parseInt(range.value, 10);
      var perScreen = (C && C.calc && C.calc.perScreen) || 6000;
      var prepay = (C && C.calc && C.calc.prepay) || 30;
      var total = base + Math.max(0, pages - 3) * perScreen;
      var mult = 1;
      $$(".opts input").forEach(function (i) {
        if (!i.checked) return;
        if (i.dataset.price) total += parseInt(i.dataset.price, 10);
        if (i.dataset.mult) mult *= parseFloat(i.dataset.mult);
      });
      total *= mult;
      var totalDays = Math.round((days + Math.max(0, pages - 3) * 0.8) / (mult > 1 ? 2 : 1));
      pagesOut.textContent = pages;
      sum.textContent = rub(total);
      term.textContent = "срок: " + totalDays + " рабочих дней · предоплата " + prepay + "% — " + rub(total * prepay / 100);
    }
    typeBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        typeBtns.forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        calc();
      });
    });
    range.addEventListener("input", calc);
    $$(".opts input").forEach(function (i) { i.addEventListener("change", calc); });
    calc();
  }

  function initForm() {
    var form = $("#briefForm"), status = $("#formStatus");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["fName", "fContact"].forEach(function (id) {
        var input = $("#" + id), field = input.closest(".field");
        var bad = !input.value.trim();
        field.classList.toggle("has-error", bad);
        if (bad) ok = false;
      });
      if (!ok) { status.textContent = "Заполните имя и контакт — иначе не сможем ответить."; return; }
      status.textContent = "Готово! Бриф отправлен, ответим в течение рабочего дня. Смета: " + $("#calcSum").textContent + ".";
      form.reset();
      $("#fStyle").value = current;
    });
    // при смене темы подставляем её же в поле «понравившийся стиль»
    document.addEventListener("themechange", function () { $("#fStyle").value = current; });
  }

  function initReveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) { items.forEach(function (i) { i.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.transitionDelay = (en.target.dataset.d || 0) + "ms";
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (item, i) {
      item.dataset.d = (i % 3) * 90;
      io.observe(item);
    });
  }

  function initChrome() {
    // часы в шапке (видны в кибер- и матрица-стилях)
    var clock = $("#sysClock");
    setInterval(function () { clock.textContent = new Date().toLocaleTimeString("ru-RU"); }, 1000);
    clock.textContent = new Date().toLocaleTimeString("ru-RU");

    // кнопка наверх
    var top = $("#toTop");
    window.addEventListener("scroll", function () {
      top.classList.toggle("is-visible", window.scrollY > 700);
    }, { passive: true });
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

    // мобильное меню
    var nav = $("#nav");
    $("#burger").addEventListener("click", function () { nav.classList.toggle("is-open"); });
    $$("#nav a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("is-open"); }); });

    // список стилей в подвале
    var fl = $("#footerThemes");
    ORDER.forEach(function (k) {
      var li = el("li");
      var b = el("button", null, THEMES[k].name);
      b.dataset.setTheme = k;
      li.appendChild(b);
      fl.appendChild(li);
    });

    // клики по любым переключателям стиля
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-set-theme]");
      if (!t) return;
      setTheme(t.dataset.setTheme);
      document.dispatchEvent(new CustomEvent("themechange"));
    });

    // клавиши 1–7
    document.addEventListener("keydown", function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= ORDER.length) {
        setTheme(ORDER[n - 1]);
        document.dispatchEvent(new CustomEvent("themechange"));
      }
    });
  }

  /* ---------- старт ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    applyContent();
    initChrome();
    initCalc();
    initForm();
    initReveal();
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    setTheme(THEMES[saved] ? saved : "cyber", false);
  });
})();

