(function () {
  'use strict';

  var PERSPECTIVE = 900;
  var TAU = Math.PI * 2;
  var STEP = 1 / 240;
  var PAD = 32;
  var AXES = ['x', 'y', 'z', 'r', 'p'];
  var DOWN = { x: 0, y: 1 };

  var THEME = {
    '--swap-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--swap-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--swap-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--swap-shadow': '0 30px 60px -28px rgba(24, 24, 27, 0.35), 0 10px 24px -14px rgba(24, 24, 27, 0.2)',
    '--swap-media-edge': 'rgba(24, 24, 27, 0.06)',
    '--swap-ink': '#27272a',
    '--swap-badge': 'rgba(24, 24, 27, 0.05)',
    '--swap-shade': '#ffffff'
  };

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function stackBounds(o) {
    var slope = Math.tan((o.skewAmount * Math.PI) / 180);
    var spread = 1 + Math.max(0, o.hoverSpread);
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < o.visible; i++) {
      var scale = PERSPECTIVE / (PERSPECTIVE + i * o.depth);
      for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) {
        var u = a ? o.width / 2 : -o.width / 2;
        var v = b ? o.height / 2 : -o.height / 2;
        var x = (i * o.cardDistance * spread + u) * scale;
        var y = (-i * o.verticalDistance * spread + v + u * slope) * scale;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    return { width: Math.ceil(maxX - minX + PAD * 2), height: Math.ceil(maxY - minY + PAD * 2), originX: PAD - minX, originY: PAD - minY };
  }

  window.initCardSwap = function (root, opts) {
    opts = opts || {};
    var items = opts.items || [];
    var count = items.length;
    if (!count || !root) return;

    var s0 = {
      width: Number(opts.width) || 440,
      height: Number(opts.height) || 320,
      dx: opts.cardDistance != null ? opts.cardDistance : 60,
      dy: opts.verticalDistance != null ? opts.verticalDistance : 70,
      dz: Math.max(0, opts.depth != null ? opts.depth : 90),
      skew: opts.skewAmount != null ? opts.skewAmount : 6,
      visible: clamp(Math.round(opts.visibleCards != null ? opts.visibleCards : 4), 1, Math.max(1, count)),
      delay: opts.delay != null ? opts.delay : 4000,
      autoplay: opts.autoplay !== false,
      pauseOnHover: opts.pauseOnHover !== false,
      draggable: opts.draggable !== false,
      speed: clamp(opts.speed != null ? opts.speed : 1, 0.1, 4),
      bounce: clamp(opts.bounce != null ? opts.bounce : 0.35, 0, 1),
      parallax: clamp(opts.parallax != null ? opts.parallax : 0.5, 0, 1),
      hoverSpread: Math.max(0, opts.hoverSpread != null ? opts.hoverSpread : 0.12),
      dim: clamp(opts.dim != null ? opts.dim : 0.5, 0, 1),
      onChange: typeof opts.onChange === 'function' ? opts.onChange : function () {}
    };

    var bounds = stackBounds({ width: s0.width, height: s0.height, cardDistance: s0.dx, verticalDistance: s0.dy, depth: s0.dz, skewAmount: s0.skew, visible: s0.visible, hoverSpread: s0.hoverSpread });

    var keys = Object.keys(THEME);
    for (var k = 0; k < keys.length; k++) root.style.setProperty(keys[k], THEME[keys[k]]);
    root.style.setProperty('--swap-w', s0.width + 'px');
    root.style.setProperty('--swap-h', s0.height + 'px');
    root.style.setProperty('--swap-ox', bounds.originX + 'px');
    root.style.setProperty('--swap-oy', bounds.originY + 'px');
    root.style.setProperty('--swap-stage-w', bounds.width + 'px');
    root.style.setProperty('--swap-stage-h', bounds.height + 'px');
    root.style.setProperty('--swap-ratio', bounds.width + ' / ' + bounds.height);
    root.style.setProperty('--swap-radius', (opts.cardRadius != null ? Math.max(0, opts.cardRadius) : 18) + 'px');

    root.classList.add('card-swap');
    root.setAttribute('tabindex', '0');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', '项目卡片堆');

    root.innerHTML = '<div class="card-swap-sizer" aria-hidden="true"><span></span></div><div class="card-swap-stage"></div>';
    var stage = root.querySelector('.card-swap-stage');

    var slots = [];
    var i;
    for (i = 0; i < count; i++) {
      var item = items[i];
      var slot = document.createElement('div');
      slot.className = 'card-swap-slot';
      slot.setAttribute('data-swap-index', String(i));
      slot.innerHTML =
        '<div class="card-swap-card">' +
          '<div class="card-swap-item">' +
            '<div class="card-swap-head"><span class="card-swap-title">' + esc(item.cardTitle || item.title) + '</span></div>' +
            '<div class="card-swap-media"><img src="' + esc(item.image) + '" alt="' + esc(item.title || '') + '" draggable="false"></div>' +
          '</div>' +
          '<span class="card-swap-card-rim" aria-hidden="true"></span>' +
        '</div>' +
        '<span class="card-swap-shade" aria-hidden="true"></span>';
      stage.appendChild(slot);
      slots.push(slot);
    }

    var deck = [];
    for (i = 0; i < count; i++) {
      deck.push({
        el: slots[i], shade: slots[i].querySelector('.card-swap-shade'), index: i,
        pos: i, from: i, hold: 0, nudge: 0, phase: 'rest', dir: { x: 0, y: 1 }, tilt: 0,
        top: 0, under: false, x: 0, y: 0, z: 0, r: 0, p: 0,
        v: { x: 0, y: 0, z: 0, r: 0, p: 0 }
      });
    }

    var state = {
      order: deck.map(function (c) { return c.index; }), raf: 0, last: 0, timer: 0, queue: [], layers: 0, scale: 1,
      hovered: false, overCard: false, inView: true, drag: null,
      spread: 0, spreadV: 0, px: 0, py: 0, pvx: 0, pvy: 0, tx: 0, ty: 0, dragged: false,
      autoplay: s0.autoplay, delay: s0.delay
    };

    function slot(position, s) {
      var q = Math.min(position, s.visible);
      var spread = 1 + state.spread;
      return { x: q * s.dx * spread, y: -q * s.dy * spread, z: -q * s.dz, r: 0, p: q };
    }

    function clearance(s, dir) { return Math.abs(dir.x) * s.width + Math.abs(dir.y) * s.height + 12; }

    function targetOf(card, s, time) {
      if (card.phase === 'exit') {
        var base0 = slot(0, s);
        var reach = clearance(s, card.dir) * 1.3;
        return { x: base0.x + card.dir.x * reach, y: base0.y + card.dir.y * reach, z: base0.z, r: card.tilt, p: 0 };
      }
      if (card.phase === 'enter') {
        var base1 = slot(0, s);
        return { x: base1.x, y: base1.y + clearance(s, DOWN) * 1.3, z: base1.z, r: 0, p: card.p };
      }
      var position = (time < card.hold ? card.from : card.pos) + card.nudge;
      return slot(Math.max(0, position), s);
    }

    function layerOf(card) {
      if (card.top) return 1000 + card.top;
      if (card.under) return 1;
      return 10 + (count - card.pos) * 2;
    }

    function write(card, s) {
      var el = card.el, shade = card.shade;
      if (!el) return;
      el.style.transform = 'translate3d(' + card.x.toFixed(2) + 'px, ' + card.y.toFixed(2) + 'px, ' + card.z.toFixed(2) + 'px) rotate(' + card.r.toFixed(3) + 'deg) skewY(' + s.skew + 'deg)';
      el.style.zIndex = String(layerOf(card));
      var fade = clamp(s.visible - card.p, 0, 1);
      el.style.opacity = fade < 1 ? fade.toFixed(3) : '';
      el.style.visibility = fade <= 0.001 ? 'hidden' : '';
      if (shade) {
        var depthT = clamp(card.p / Math.max(1, s.visible - 1), 0, 1);
        shade.style.opacity = (s.dim * 0.62 * depthT).toFixed(3);
      }
      el.style.cursor = card.phase === 'drag' ? 'grabbing' : card.pos > 0 ? 'pointer' : (s.draggable ? 'grab' : '');
      if (card.pos === 0) el.setAttribute('data-front', ''); else el.removeAttribute('data-front');
    }

    function writeStage(s) {
      stage.style.perspectiveOrigin = (bounds.originX + state.px).toFixed(2) + 'px ' + (bounds.originY + state.py).toFixed(2) + 'px';
    }

    function integrate(card, target, omega, zeta, dt) {
      var k = omega * omega, d = 2 * zeta * omega;
      var steps = Math.max(1, Math.ceil(dt / STEP)), h = dt / steps;
      var a, i;
      for (i = 0; i < steps; i++) {
        for (a = 0; a < AXES.length; a++) {
          var axis = AXES[a];
          var vel = card.v[axis] + (k * (target[axis] - card[axis]) - d * card.v[axis]) * h;
          card.v[axis] = vel;
          card[axis] += vel * h;
        }
      }
    }

    function scalar(value, velocity, target, omega, zeta, dt) {
      var k = omega * omega, d = 2 * zeta * omega;
      var steps = Math.max(1, Math.ceil(dt / STEP)), h = dt / steps;
      var x = value, v = velocity;
      for (var i = 0; i < steps; i++) { v += (k * (target - x) - d * v) * h; x += v * h; }
      return [x, v];
    }

    function frame(time) {
      state.raf = 0;
      var s = s0;
      var dt = state.last ? Math.min(0.05, (time - state.last) / 1000) : 1 / 60;
      state.last = time;
      var speed = s.speed;
      var restOmega = TAU * 1.7 * speed;
      var restZeta = 1 - 0.72 * s.bounce;
      var exitOmega = TAU * 1.9 * speed;
      var busy = false;

      var spreadTarget = state.hovered ? s.hoverSpread : 0;
      var r1 = scalar(state.spread, state.spreadV, spreadTarget, TAU * 1.4, 0.9, dt);
      state.spread = r1[0]; state.spreadV = r1[1];
      var r2 = scalar(state.px, state.pvx, state.tx, TAU * 1.1, 1, dt);
      state.px = r2[0]; state.pvx = r2[1];
      var r3 = scalar(state.py, state.pvy, state.ty, TAU * 1.1, 1, dt);
      state.py = r3[0]; state.pvy = r3[1];
      if (Math.abs(state.spread - spreadTarget) > 0.0005 || Math.abs(state.spreadV) > 0.0005 || Math.abs(state.px - state.tx) > 0.05 || Math.abs(state.py - state.ty) > 0.05 || Math.abs(state.pvx) + Math.abs(state.pvy) > 0.05) busy = true;
      writeStage(s);

      for (var ci = 0; ci < deck.length; ci++) {
        var card = deck[ci];
        if (card.phase === 'drag') { busy = true; write(card, s); continue; }
        var target = targetOf(card, s, time);
        var moving = card.phase === 'exit' || card.phase === 'enter';
        integrate(card, target, moving ? exitOmega : restOmega, moving ? 1 : restZeta, dt);
        if (card.phase === 'exit') {
          var baseE = slot(0, s);
          var travelled = (card.x - baseE.x) * card.dir.x + (card.y - baseE.y) * card.dir.y;
          if (travelled >= clearance(s, card.dir)) { card.phase = 'rest'; card.top = 0; card.hold = 0; }
        } else if (card.phase === 'enter') {
          var baseN = slot(0, s);
          if (card.y - baseN.y >= clearance(s, DOWN)) { card.phase = 'rest'; card.under = false; card.hold = 0; }
        }
        if (card.hold > time || card.phase !== 'rest') busy = true;
        for (var ax = 0; ax < AXES.length; ax++) {
          var lim = AXES[ax] === 'p' ? 0.001 : 0.02;
          if (Math.abs(target[AXES[ax]] - card[AXES[ax]]) > lim || Math.abs(card.v[AXES[ax]]) > lim) busy = true;
        }
        write(card, s);
      }

      if (busy) state.raf = requestAnimationFrame(frame);
      else { state.last = 0; for (var ti = 0; ti < deck.length; ti++) if (deck[ti].top && deck[ti].phase === 'rest') deck[ti].top = 0; }
    }

    function wake() { if (!state.raf) state.raf = requestAnimationFrame(frame); }

    function paused() {
      return !s0.autoplay || count < 2 || (s0.pauseOnHover && state.overCard) || state.drag || !state.inView || document.visibilityState === 'hidden';
    }

    function schedule() {
      clearTimeout(state.timer); state.timer = 0;
      if (paused()) return;
      state.timer = setTimeout(function () { state.timer = 0; shift(1); }, Math.max(400, s0.delay));
    }

    function settleOrder(time, stagger) {
      state.order.forEach(function (index, position) {
        var card = deck[index];
        if (card.pos === position) return;
        card.from = card.pos; card.pos = position; card.hold = time + Math.max(0, position) * stagger;
      });
    }

    function shift(direction, options) {
      options = options || {};
      if (count < 2) return;
      var time = performance.now();
      var stagger = 0.05 / s0.speed;
      if (direction > 0) {
        var front = deck[state.order[0]];
        state.order = state.order.slice(1).concat([front.index]);
        settleOrder(time, stagger * 1000);
        front.phase = 'exit';
        front.dir = options.dir || DOWN;
        front.tilt = options.tilt || 0;
        front.top = ++state.layers;
        front.under = false; front.nudge = 0; front.hold = 0;
        if (options.velocity) { front.v.x = options.velocity.x; front.v.y = options.velocity.y; }
      } else {
        var back = deck[state.order[count - 1]];
        state.order = [back.index].concat(state.order.slice(0, count - 1));
        settleOrder(time, stagger * 1000);
        back.phase = 'enter'; back.top = 0; back.under = true; back.nudge = 0; back.hold = 0;
      }
      deck.forEach(function (card) { if (card.phase === 'rest') card.nudge = 0; });
      s0.onChange(state.order[0]);
      wake();
      schedule();
    }

    function fit() {
      var w = root.clientWidth, h = root.clientHeight;
      var scale = Math.min(1, w / bounds.width, h > 0 ? h / bounds.height : 1);
      state.scale = scale > 0 ? scale : 1;
      stage.style.transform = 'translate(-50%, -50%) scale(' + state.scale.toFixed(4) + ')';
    }

    function local(event) {
      var box = root.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top, w: box.width, h: box.height };
    }

    function onMove(event) {
      if (event.pointerType !== 'touch') {
        var point = local(event);
        var nx = clamp((point.x / Math.max(1, point.w)) * 2 - 1, -1, 1);
        var ny = clamp((point.y / Math.max(1, point.h)) * 2 - 1, -1, 1);
        state.tx = nx * s0.parallax * 0.35 * bounds.width;
        state.ty = ny * s0.parallax * 0.35 * bounds.height;
        state.hovered = true;
        var overCard = Boolean(event.target.closest && event.target.closest('[data-swap-index]'));
        if (overCard !== state.overCard) { state.overCard = overCard; schedule(); }
        wake();
      }
      var drag = state.drag;
      if (!drag || drag.id !== event.pointerId) return;
      var dx = (event.clientX - drag.startX) / state.scale;
      var dy = (event.clientY - drag.startY) / state.scale;
      if (!drag.active) {
        if (Math.hypot(dx, dy) < 5) return;
        drag.active = true; state.dragged = true;
        var cardA = deck[drag.index];
        cardA.phase = 'drag'; cardA.v = { x: 0, y: 0, z: 0, r: 0, p: 0 };
        if (root.setPointerCapture) root.setPointerCapture(event.pointerId);
        root.style.cursor = 'grabbing';
      }
      var card = deck[drag.index];
      var base = slot(0, s0);
      card.x = base.x + dx; card.y = base.y + dy; card.z = base.z;
      card.r = clamp(dx * 0.035, -9, 9); card.p = 0;
      var time = performance.now();
      drag.samples.push({ x: card.x, y: card.y, t: time });
      while (drag.samples.length > 2 && time - drag.samples[0].t > 90) drag.samples.shift();
      var progress = clamp(Math.hypot(dx, dy) / (Math.min(s0.width, s0.height) * 0.3), 0, 1);
      var next = deck[state.order[1]];
      if (next && next.phase === 'rest') next.nudge = -0.22 * progress;
      wake();
    }

    function onLeave(event) {
      if (event.pointerType === 'touch') return;
      if (state.drag && state.drag.active) return;
      state.hovered = false; state.overCard = false; state.tx = 0; state.ty = 0;
      schedule(); wake();
    }

    function onDown(event) {
      state.dragged = false;
      if (!s0.draggable || event.button > 0 || count < 2) return;
      var target = event.target.closest ? event.target.closest('[data-swap-index]') : null;
      if (!target || !root.contains(target)) return;
      var index = Number(target.getAttribute('data-swap-index'));
      if (index !== state.order[0] || deck[index].phase !== 'rest') return;
      state.drag = { id: event.pointerId, index: index, startX: event.clientX, startY: event.clientY, active: false, samples: [] };
      schedule();
    }

    function onUp(event) {
      var drag = state.drag;
      if (!drag || drag.id !== event.pointerId) return;
      state.drag = null;
      root.style.cursor = '';
      if (!drag.active) { schedule(); return; }
      if (root.releasePointerCapture) root.releasePointerCapture(event.pointerId);
      var card = deck[drag.index];
      var base = slot(0, s0);
      var first = drag.samples[0];
      var lastSample = drag.samples[drag.samples.length - 1];
      var span = first && lastSample ? Math.max(0.016, (lastSample.t - first.t) / 1000) : 1;
      var velocity = first && lastSample && lastSample !== first ? { x: (lastSample.x - first.x) / span, y: (lastSample.y - first.y) / span } : { x: 0, y: 0 };
      var offset = { x: card.x - base.x, y: card.y - base.y };
      var distance = Math.hypot(offset.x, offset.y);
      var fling = Math.hypot(velocity.x, velocity.y);
      var next = deck[state.order[1]];
      if (next) next.nudge = 0;
      if (event.type !== 'pointercancel' && (distance > Math.min(s0.width, s0.height) * 0.3 || fling > 700)) {
        var aim = { x: offset.x + velocity.x * 0.12, y: offset.y + velocity.y * 0.12 };
        var length = Math.hypot(aim.x, aim.y) || 1;
        card.phase = 'rest';
        shift(1, { dir: { x: aim.x / length, y: aim.y / length }, tilt: card.r, velocity: velocity });
      } else {
        card.phase = 'rest'; card.v.x = velocity.x; card.v.y = velocity.y;
        wake(); schedule();
      }
    }

    function onClick(event) {
      if (state.dragged) { state.dragged = false; return; }
      var target = event.target.closest ? event.target.closest('[data-swap-index]') : null;
      if (!target || !root.contains(target)) return;
      var index = Number(target.getAttribute('data-swap-index'));
      var position = state.order.indexOf(index);
      if (position > 0) {
        for (var n = 0; n < position; n++) setTimeout(function () { shift(1); }, n * 110 / s0.speed);
      }
    }

    function onVisibility() { schedule(); }

    var now = performance.now();
    deck.forEach(function (card) { card.from = 0; card.hold = now + (card.pos * 70) / s0.speed; });
    if (stage.animate) stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });

    fit();
    writeStage(s0);
    deck.forEach(function (card) { write(card, s0); });
    wake();

    if (window.ResizeObserver) { var ro = new ResizeObserver(fit); ro.observe(root); }
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        state.inView = entries[entries.length - 1] ? entries[entries.length - 1].isIntersecting : true;
        schedule();
      });
      io.observe(root);
    }

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    root.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);
    schedule();
  };
})();
