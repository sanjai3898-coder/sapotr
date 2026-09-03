/* ═══════════════════════════════════════════════════════════
   SAPOTR — landing page behaviour (vanilla JS, no libraries)
    1 Helpers          7 Chat sequence
    2 Header + nav     8 Count-up stats
    3 Reveals + split  9 Services rail
    4 Scroll FX       10 FAQ accordion
    5 Booking app     11 CTA form
    6 Journey scrub   12 Card reveals + tilt + magnet
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───── 1 · Helpers ───── */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Pure helpers are hung here so they can be unit-tested without a real scroll. */
  var SAPOTR = window.SAPOTR = window.SAPOTR || {};
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /** Run cb once, the first time el enters the viewport. */
  function once(el, cb, opts) {
    if (!el) return;
    if (!('IntersectionObserver' in window) || reduced) { cb(el); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cb(e.target);
        io.unobserve(e.target);
      });
    }, opts || { threshold: 0.25 });
    io.observe(el);
  }

  /* rAF-coalesced scroll subscribers — one listener for the whole page. */
  var onScroll = (function () {
    var subs = [], queued = false;
    function run() { queued = false; var y = window.scrollY; subs.forEach(function (f) { f(y); }); }
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    }, { passive: true });
    window.addEventListener('resize', run);
    return function (f) { subs.push(f); f(window.scrollY); };
  })();

  /* ───── 2 · Header + mobile nav ───── */
  var header = $('.site-header');
  var hero = $('#hero');
  var burger = $('#burger');
  var mnav = $('#mobile-nav');

  function syncHeader(y) {
    var overHero = hero && (y === undefined ? window.scrollY : y) < hero.offsetHeight - 90;
    header.dataset.mode = (overHero && mnav.hidden) ? 'over' : 'solid';
  }
  onScroll(syncHeader);

  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    mnav.hidden = open;
    syncHeader();
  });
  mnav.addEventListener('click', function (e) {
    if (!e.target.closest('a')) return;
    burger.setAttribute('aria-expanded', 'false');
    mnav.hidden = true;
    syncHeader();
  });

  /* ───── 3 · Reveals + headline word split ───── */
  /* Wrap each word so it can rise out of its own overflow box. */
  $$('[data-split]').forEach(function (el) {
    var frag = document.createDocumentFragment();
    el.childNodes.forEach ? null : null;
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {                       /* plain text → split */
        node.textContent.split(/(\s+)/).forEach(function (chunk) {
          if (!chunk) return;
          if (/^\s+$/.test(chunk)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span');
          w.className = 'w';
          var i = document.createElement('i');
          i.textContent = chunk;
          w.appendChild(i);
          frag.appendChild(w);
        });
      } else if (node.nodeType === 1) {                /* element → keep, split inside */
        var host = node.cloneNode(false);
        node.textContent.split(/(\s+)/).forEach(function (chunk) {
          if (!chunk) return;
          if (/^\s+$/.test(chunk)) { host.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span');
          w.className = 'w';
          var i = document.createElement('i');
          i.textContent = chunk;
          w.appendChild(i);
          host.appendChild(w);
        });
        frag.appendChild(host);
      }
    });
    el.textContent = '';
    el.appendChild(frag);
    /* stagger each word */
    $$('.w i', el).forEach(function (i, n) { i.style.transitionDelay = (n * 55) + 'ms'; });
  });

  (function reveals() {
    var items = $$('[data-r], [data-split], .card');
    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.filter(function (e) { return e.isIntersecting; })
        .forEach(function (e, i) {
          if (e.target.hasAttribute('data-r')) {
            e.target.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
          }
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ───── 4 · Scroll FX: progress bar, parallax, cursor glow ───── */
  (function scrollFx() {
    var bar = $('#scroll-bar span');
    var nodes = $$('[data-parallax]');
    var video = $('#hero-video');

    onScroll(function (y) {
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }
      if (reduced) return;
      nodes.forEach(function (el) {
        el.style.transform = 'translate3d(0,' + (-y * parseFloat(el.dataset.parallax)).toFixed(2) + 'px,0)';
      });
      if (video && y < window.innerHeight) {
        video.style.transform = 'scale(1.05) translate3d(0,' + (y * 0.1).toFixed(2) + 'px,0)';
      }
    });

    var glow = $('#cursor-glow');
    if (glow && fine && !reduced) {
      var gx = 0, gy = 0, cx = 0, cy = 0, on = false;
      window.addEventListener('pointermove', function (e) {
        gx = e.clientX; gy = e.clientY;
        if (!on) { on = true; glow.style.opacity = '1'; }
      }, { passive: true });
      (function loop() {
        cx += (gx - cx) * 0.08;
        cy += (gy - cy) * 0.08;
        glow.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) translate(-50%,-50%)';
        requestAnimationFrame(loop);
      })();
    }
  })();

  /* ───── 5 · Phone showcase ───── */
  (function phoneApp() {
    var list = $('#app-list');
    if (!list) return;

    var CATEGORY = 'Store / Retail';
    var ROSTER = [
      { name: 'Sarah M.', photo: 'assets/emp-sarah.jpg', km: 2.4, rating: 4.9, role: 'Retail Support' },
      { name: 'Tane W.',  photo: 'assets/emp-tane.jpg',  km: 4.2, rating: 4.9, role: 'Stock & Floor' }
    ];

    var done = $('#app-done');
    var TICK = '<svg class="vbadge" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 2.4l2.3 1.6 2.8-.2.9 2.7 2.2 1.7-1 2.6 1 2.6-2.2 1.7-.9 2.7-2.8-.2L12 21.6l-2.3-1.6-2.8.2-.9-2.7-2.2-1.7 1-2.6-1-2.6 2.2-1.7.9-2.7 2.8.2z"/>' +
      '<path d="M8.4 12.1l2.4 2.4 4.7-4.9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function render() {
      done.hidden = true;
      list.hidden = false;
      $('#app-cat').textContent = CATEGORY;
      $('#app-kicker').textContent = 'Available now';
      $('#app-sub').textContent = 'Takanini · ' + ROSTER.length + ' nearby';

      list.innerHTML = ROSTER.map(function (p, i) {
        return '<li class="emp" style="animation-delay:' + (i * 70) + 'ms">' +
          '<img src="' + p.photo + '" alt="' + p.name + ', verified SAPOTR employee partner" width="42" height="42" loading="lazy">' +
          '<span class="emp-meta">' +
            '<span class="emp-name">' + p.name + TICK + '<span class="sr-only">Verified</span></span>' +
            '<span class="emp-role">' + p.role + '</span>' +
            '<span class="emp-stat"><b>' + p.km.toFixed(1) + ' km</b><b>★ ' + p.rating.toFixed(1) + '</b><b class="free">Available</b></span>' +
          '</span>' +
          '<button type="button" class="emp-assign" data-assign="' + p.name + '">Assign</button></li>';
      }).join('') +
        '<li class="app-more">+ ' + (12 - ROSTER.length) + ' more available nearby</li>';
    }

    /* Tapping Assign walks the screen to the "arriving" state. */
    function assign(name) {
      list.hidden = true;
      done.hidden = false;
      $('#done-sub').textContent = name.split(' ')[0] + ' is on the way · ' +
        (12 + Math.floor(Math.random() * 14)) + ' min';
    }

    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-assign]');
      if (b) assign(b.dataset.assign);
    });
    $('#app-reset').addEventListener('click', render);

    render();
  })();

  /* ───── 6 · Journey: scroll-scrubbed steps ───── */
  (function journey() {
    var steps = $$('#steps .step');
    var minis = $$('.mini');
    var fill = $('#journey-fill');
    var track = $('#journey-track');
    if (!steps.length) return;

    var at = -1;
    function show(i) {
      if (i === at) return;
      at = i;
      steps.forEach(function (s, n) {
        s.classList.toggle('is-on', n === i);
        s.setAttribute('aria-pressed', String(n === i));
      });
      minis.forEach(function (m, n) { m.classList.toggle('is-on', n === i); });
      if (fill) fill.style.height = ((i + 1) / steps.length * 100) + '%';
    }

    steps.forEach(function (s, i) {
      s.addEventListener('click', function () { show(i); });
    });

    /* Desktop: map scroll position inside the tall track onto the four steps.
       Kept as a pure function so the mapping can be tested without scrolling. */
    function stepFromRect(top, height, viewport, count) {
      var span = height - viewport;
      if (span <= 0) return null;                     /* track shorter than viewport */
      var p = Math.min(Math.max(-top / span, 0), 0.999);
      return Math.floor(p * count);
    }
    SAPOTR.stepFromRect = stepFromRect;

    var scrubs = window.matchMedia('(min-width: 1001px)').matches && !reduced;
    if (scrubs && track) {
      onScroll(function () {
        var r = track.getBoundingClientRect();
        var i = stepFromRect(r.top, r.height, window.innerHeight, steps.length);
        if (i !== null) show(i);
      });
    } else {
      show(0);
    }
  })();

  /* ───── 7 · Chat sequence ───── */
  once($('#chat'), function (card) {
    var bubs = $$('.bub', card), chips = $$('.chat-chips li', card);
    bubs.forEach(function (b, i) { setTimeout(function () { b.classList.add('in'); }, 300 + i * 600); });
    chips.forEach(function (c, i) {
      setTimeout(function () { c.classList.add('in'); }, 300 + bubs.length * 600 + i * 110);
    });
  }, { threshold: 0.35 });

  /* ───── 8 · Count-up stats ───── */
  once($('#stats'), function (grid) {
    $$('.stat-n', grid).forEach(function (el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      if (reduced) { el.textContent = target.toLocaleString('en-NZ') + '+'; return; }
      var start = null;
      (function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / 1700, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-NZ') + '+';
        if (p < 1) requestAnimationFrame(frame);
      })(performance.now());
    });
  }, { threshold: 0.3 });

  /* ───── 9 · Services rail ───── */
  (function rail() {
    var el = $('#rail');
    if (!el) return;
    var stride = function () {
      var c = $('.card', el);
      return c ? c.getBoundingClientRect().width + 22 : 380;
    };

    $$('[data-rail]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        el.scrollBy({ left: stride() * Number(btn.dataset.rail), behavior: reduced ? 'auto' : 'smooth' });
      });
    });

    el.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      el.scrollBy({ left: stride() * (e.key === 'ArrowRight' ? 1 : -1), behavior: reduced ? 'auto' : 'smooth' });
    });

    var down = false, startX = 0, startLeft = 0, moved = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      down = true; moved = 0; startX = e.clientX; startLeft = el.scrollLeft;
      el.classList.add('is-drag');
    });
    el.addEventListener('pointermove', function (e) {
      if (!down) return;
      moved = Math.abs(e.clientX - startX);
      el.scrollLeft = startLeft - (e.clientX - startX);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      el.addEventListener(ev, function () {
        if (!down) return;
        down = false;
        el.classList.remove('is-drag');
      });
    });
    el.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  })();

  /* ───── 10 · FAQ accordion ───── */
  $$('#acc .acc-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wasOpen = btn.getAttribute('aria-expanded') === 'true';
      $$('#acc .acc-q').forEach(function (o) {
        o.setAttribute('aria-expanded', 'false');
        o.closest('.acc-i').classList.remove('is-open');
      });
      if (!wasOpen) {
        btn.setAttribute('aria-expanded', 'true');
        btn.closest('.acc-i').classList.add('is-open');
      }
    });
  });

  /* ───── 11 · CTA form ───── */
  (function ctaForm() {
    var form = $('#cta-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      $('#cta-note').textContent = 'Thanks — we’ll be in touch to confirm your booking.';
    });
  })();

  /* ───── 12 · Tilt + magnet micro-interactions ───── */
  if (fine && !reduced) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ty', (px * 7).toFixed(2) + 'deg');
        el.style.setProperty('--tx', (-py * 7).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--ty', '0deg');
        el.style.setProperty('--tx', '0deg');
      });
    });

    /* buttons drift a few pixels toward the cursor */
    $$('.magnet').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1) + 'px,' +
                                            ((e.clientY - r.top - r.height / 2) * 0.18).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ───── Ticker: duplicate the row so the marquee loops seamlessly ───── */
  (function ticker() {
    var inner = $('#ticker-inner');
    if (!inner || reduced) return;
    var copy = inner.firstElementChild.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    inner.appendChild(copy);
  })();

  /* ───── Misc ───── */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  var video = $('#hero-video');
  if (video && !reduced) {
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* poster covers it */ });
  }
})();
