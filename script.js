(() => {
  'use strict';

  /* =========================================================
     0. Helpers
  ========================================================= */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const toastEl = $('#toast');
  let toastTimer = null;
  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* =========================================================
     1. Sticky header shrink on scroll + back-to-top + scroll spy
  ========================================================= */
  const header = $('#siteHeader');
  const backToTop = $('#backToTop');
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');

  function onScroll(){
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    backToTop.classList.toggle('show', y > 500);

    // scroll-spy: highlight active nav link
    let currentId = sections[0]?.id;
    for (const sec of sections){
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 140) currentId = sec.id;
    }
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* =========================================================
     2. Mobile hamburger nav
  ========================================================= */
  const hamburgerBtn = $('#hamburgerBtn');
  const mobileNav = $('#mobileNav');
  const mobileOverlay = $('#mobileOverlay');

  function openMobileNav(){
    mobileNav.classList.add('open');
    mobileOverlay.classList.add('show');
    hamburgerBtn.classList.add('open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileNav(){
    mobileNav.classList.remove('open');
    mobileOverlay.classList.remove('show');
    hamburgerBtn.classList.remove('open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  hamburgerBtn.addEventListener('click', () => {
    mobileNav.classList.contains('open') ? closeMobileNav() : openMobileNav();
  });
  mobileOverlay.addEventListener('click', closeMobileNav);
  $$('#mobileNav a').forEach(a => a.addEventListener('click', closeMobileNav));
  $('#mobileBookBtn').addEventListener('click', () => { closeMobileNav(); openModal(); });

  // Close mobile nav with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });

  /* =========================================================
     3. Smooth-scroll for in-page links
  ========================================================= */
  $$('[data-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const offset = header.offsetHeight + 12;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* =========================================================
     4. Hero carousel (auto-rotate + dot navigation)
  ========================================================= */
  const heroPlates = $$('.hero-plate');
  const dots = $$('.dot');
  let heroIndex = 0;
  let heroTimer = null;

  function goToSlide(i){
    heroPlates[heroIndex]?.classList.remove('active');
    dots[heroIndex]?.classList.remove('active');
    heroIndex = (i + heroPlates.length) % heroPlates.length;
    heroPlates[heroIndex].classList.add('active');
    dots[heroIndex].classList.add('active');
  }
  function startHeroAuto(){
    clearInterval(heroTimer);
    heroTimer = setInterval(() => goToSlide(heroIndex + 1), 4200);
  }
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goToSlide(i); startHeroAuto(); });
  });
  startHeroAuto();

  /* Our Story button — just scrolls to About/features with a friendly toast */
  $('#ourStoryBtn').addEventListener('click', () => {
    const target = $('#about');
    const offset = header.offsetHeight + 12;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    showToast('12+ years of good food & great mood 🌿');
  });

  /* =========================================================
     5. Menu filters
  ========================================================= */
  const filterChips = $$('#menuFilters .chip');
  const menuCards = $$('.menu-card');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      menuCards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hide', !match);
      });
    });
  });

  /* =========================================================
     6. Favorite (heart) toggle on menu cards
  ========================================================= */
  $$('[data-fav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const active = btn.classList.toggle('active');
      btn.textContent = active ? '♥' : '♡';
      const dish = btn.closest('.menu-card').querySelector('h3').textContent;
      showToast(active ? `${dish} added to favorites ♥` : `${dish} removed from favorites`);
    });
  });

  /* =========================================================
     7. Order tray (cart) — add items, remove, total, badge
  ========================================================= */
  const orderTray = $('#orderTray');
  const trayToggle = $('#trayToggle');
  const closeTrayBtn = $('#closeTray');
  const orderList = $('#orderList');
  const orderTotalEl = $('#orderTotal');
  const trayCountEl = $('#trayCount');

  let order = []; // { name, price, qty }

  function renderOrder(){
    orderList.innerHTML = '';
    if (order.length === 0){
      orderList.innerHTML = '<li class="order-empty">Your tray is empty — add a favorite from the menu.</li>';
    } else {
      order.forEach((item, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.qty} × ${item.name}</span>
          <span>$${(item.qty * item.price).toFixed(2)} <button class="remove-item" data-idx="${idx}" aria-label="Remove ${item.name}">✕</button></span>`;
        orderList.appendChild(li);
      });
    }
    const total = order.reduce((sum, i) => sum + i.qty * i.price, 0);
    orderTotalEl.textContent = `$${total.toFixed(2)}`;
    const count = order.reduce((sum, i) => sum + i.qty, 0);
    trayCountEl.textContent = count;
  }

  $$('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      const existing = order.find(i => i.name === name);
      if (existing){ existing.qty += 1; } else { order.push({ name, price, qty: 1 }); }
      renderOrder();
      openTray();
      btn.textContent = 'Added ✓';
      btn.classList.add('added');
      setTimeout(() => { btn.textContent = 'Add +'; btn.classList.remove('added'); }, 1400);
      showToast(`${name} added to your order`);
    });
  });

  orderList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-item');
    if (!removeBtn) return;
    const idx = parseInt(removeBtn.dataset.idx, 10);
    order.splice(idx, 1);
    renderOrder();
  });

  function openTray(){ orderTray.classList.add('open'); }
  function closeTray(){ orderTray.classList.remove('open'); }
  trayToggle.addEventListener('click', () => {
    orderTray.classList.contains('open') ? closeTray() : openTray();
  });
  closeTrayBtn.addEventListener('click', closeTray);

  $('#orderReserveBtn').addEventListener('click', () => {
    closeTray();
    openModal();
    if (order.length){
      const summary = order.map(i => `${i.qty}× ${i.name}`).join(', ');
      $('#notes').value = `Pre-order: ${summary}`;
    }
  });

  renderOrder();

  /* View Full Menu button */
  $('#viewMenuBtn').addEventListener('click', () => {
    showToast('Full menu coming soon — chef is still plating it 👨‍🍳');
  });

  /* =========================================================
     8. Reservation modal (open/close + booking triggers)
  ========================================================= */
  const modalOverlay = $('#modalOverlay');
  const reservationModal = $('#reservationModal');
  const modalClose = $('#modalClose');
  const reservationForm = $('#reservationForm');
  const formSuccess = $('#formSuccess');

  function openModal(){
    modalOverlay.classList.add('show');
    reservationModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    reservationForm.style.display = '';
    formSuccess.classList.remove('show');
    setTimeout(() => $('#fullName')?.focus(), 300);
  }
  function closeModal(){
    modalOverlay.classList.remove('show');
    reservationModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  ['#bookTableBtn', '#bannerBookBtn'].forEach(sel => {
    $(sel)?.addEventListener('click', openModal);
  });
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reservationModal.classList.contains('show')) closeModal();
  });
  $('#successClose').addEventListener('click', closeModal);

  /* Guest stepper */
  const guestsInput = $('#guests');
  $('#guestMinus').addEventListener('click', () => {
    guestsInput.value = Math.max(1, parseInt(guestsInput.value, 10) - 1);
  });
  $('#guestPlus').addEventListener('click', () => {
    guestsInput.value = Math.min(20, parseInt(guestsInput.value, 10) + 1);
  });

  /* Default the date field to today (min) */
  const dateInput = $('#date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  /* =========================================================
     9. Reservation form validation
  ========================================================= */
  const validators = {
    fullName: v => v.trim().length >= 2 || 'Please enter your full name.',
    phone: v => /^[0-9+()\-\s]{7,}$/.test(v.trim()) || 'Enter a valid phone number.',
    date: v => !!v || 'Please choose a date.',
    time: v => !!v || 'Please choose a time.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address.'
  };

  function validateField(field){
    const input = $(`#${field}`);
    const errEl = $(`#err-${field}`);
    const result = validators[field](input.value);
    if (result === true){
      input.classList.remove('invalid');
      errEl.textContent = '';
      return true;
    } else {
      input.classList.add('invalid');
      errEl.textContent = result;
      return false;
    }
  }

  Object.keys(validators).forEach(field => {
    const input = $(`#${field}`);
    input.addEventListener('blur', () => validateField(field));
    input.addEventListener('input', () => {
      if (input.classList.contains('invalid')) validateField(field);
    });
  });

  reservationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const allValid = Object.keys(validators).map(validateField).every(Boolean);
    if (!allValid){
      const firstInvalid = reservationForm.querySelector('.invalid');
      firstInvalid?.focus();
      showToast('Please fix the highlighted fields.');
      return;
    }
    const data = {
      name: $('#fullName').value.trim(),
      guests: guestsInput.value,
      date: dateInput.value,
      time: $('#time').value
    };
    const prettyDate = new Date(data.date + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    $('#successMsg').textContent =
      `Thanks, ${data.name}! A table for ${data.guests} is booked on ${prettyDate} at ${data.time}. A confirmation will be sent to your email.`;
    reservationForm.style.display = 'none';
    formSuccess.classList.add('show');
    order = [];
    renderOrder();
    reservationForm.reset();
    guestsInput.value = 2;
  });

  /* =========================================================
     10. Animated stat counters (trigger once, on scroll into view)
  ========================================================= */
  const statEls = $$('.stat');
  function animateCount(el){
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const isDecimal = el.dataset.decimal === 'true';
    const numEl = el.querySelector('.stat-num');
    const duration = 1400;
    const start = performance.now();

    function tick(now){
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = target * eased;
      numEl.textContent = (isDecimal ? value.toFixed(1) : Math.round(value)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* =========================================================
     11. Scroll-reveal for cards/sections + stat trigger
  ========================================================= */
  $$('.menu-card, .feature, .reserve-banner-inner').forEach(el => el.setAttribute('data-reveal', ''));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  $$('[data-reveal]').forEach(el => revealObserver.observe(el));

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        animateCount(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  statEls.forEach(el => statsObserver.observe(el));

  /* =========================================================
     12. Decorative leaf cursor (pointer devices only)
  ========================================================= */
  const leafCursor = $('#leafCursor');
  const hasFinePointer = window.matchMedia('(pointer:fine)').matches;
  if (hasFinePointer){
    const hoverTargets = '.hero, .menu-card, .feature';
    document.addEventListener('mousemove', (e) => {
      leafCursor.style.left = e.clientX + 'px';
      leafCursor.style.top = e.clientY + 'px';
    });
    document.addEventListener('mouseover', (e) => {
      leafCursor.style.opacity = e.target.closest(hoverTargets) ? '0.9' : '0';
    });
    document.addEventListener('mouseleave', () => { leafCursor.style.opacity = '0'; });
  }

  /* =========================================================
     13. Footer year
  ========================================================= */
  $('#year').textContent = new Date().getFullYear();

})();
