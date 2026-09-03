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

  /* ───── 6 · How-it-works cards ───── */
  (function workCards() {
    var cards = $$('#work .wcard');
    if (!cards.length || reduced) return;

    function play(card) {
      var v = $('.wcard-video', card);
      if (!v) return;
      if (!v.dataset.loaded) { v.load(); v.dataset.loaded = '1'; }
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* poster stands in */ });
      card.classList.add('playing');
    }
    function stop(card) {
      var v = $('.wcard-video', card);
      if (v) v.pause();
    }

    /* Only decode while the row is actually on screen. */
    if (!('IntersectionObserver' in window)) { cards.forEach(play); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) play(e.target); else stop(e.target);
      });
    }, { threshold: 0.5 });
    cards.forEach(function (c) { io.observe(c); });
  })();

  /* ───── 7 · Chat sequence ───── */
  once($('#chat'), function (card) {
    var msgs = $$('.msg', card);
    var chips = $$('.chat-chips li', card);
    var body = $('.chat-body', card);
    var status = $('#chat-status');

    if (reduced) {
      msgs.forEach(function (m) { m.classList.add('in'); });
      chips.forEach(function (c) { c.classList.add('in'); });
      return;
    }

    /* One reusable "…" bubble that hops to wherever the next reply lands. */
    var dots = document.createElement('span');
    dots.className = 'typing';
    dots.innerHTML = '<i></i><i></i><i></i>';
    body.appendChild(dots);

    var at = 0;
    function next() {
      if (at >= msgs.length) {
        dots.remove();
        if (status) status.textContent = 'online';
        chips.forEach(function (c, i) {
          setTimeout(function () { c.classList.add('in'); }, 220 + i * 110);
        });
        return;
      }
      var m = msgs[at++];
      var incoming = m.classList.contains('msg--in');

      /* Outgoing notes appear straight away; replies get a typing beat first. */
      if (!incoming) {
        m.classList.add('in');
        setTimeout(next, 620);
        return;
      }
      body.insertBefore(dots, m);
      dots.classList.add('on');
      if (status) status.textContent = 'typing…';
      setTimeout(function () {
        dots.classList.remove('on');
        if (status) status.textContent = 'online';
        m.classList.add('in');
        setTimeout(next, 700);
      }, 1050);
    }
    setTimeout(next, 350);
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

  /* ───── 9b · Swipe dots for the mobile carousels ───── */
  (function swipeDots() {
    [['#work', '#work-dots', '.wcard'], ['#rail', '#rail-dots', '.card']].forEach(function (pair) {
      var box = $(pair[0]), holder = $(pair[1]);
      if (!box || !holder) return;
      var items = $$(pair[2], box);
      if (items.length < 2) return;

      items.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to ' + (i + 1) + ' of ' + items.length);
        b.addEventListener('click', function () {
          box.scrollTo({ left: items[i].offsetLeft - box.offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
        });
        holder.appendChild(b);
      });
      var dots = $$('button', holder);

      function sync() {
        /* whichever card sits nearest the middle of the viewport is "current" */
        var mid = box.scrollLeft + box.clientWidth / 2, best = 0, dist = Infinity;
        items.forEach(function (el, i) {
          var c = el.offsetLeft - box.offsetLeft + el.offsetWidth / 2;
          var d = Math.abs(c - mid);
          if (d < dist) { dist = d; best = i; }
        });
        dots.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === best)); });
      }
      var queued = false;
      box.addEventListener('scroll', function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; sync(); });
      }, { passive: true });
      sync();
    });
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

    /* tiles light up under the pointer */
    $$('[data-spot]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
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
