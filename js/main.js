// ========================================
// Lenis smooth scroll
// ========================================
let lenis = null;
if (typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  const lenisRaf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(lenisRaf);
  };
  requestAnimationFrame(lenisRaf);
}

// ========================================
// AOS init
// ========================================
if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 900,
    once: true,
    offset: 80,
    easing: 'ease-out-cubic',
  });
  if (lenis) lenis.on('scroll', AOS.refresh);
}

// ========================================
// Effect slider
// ========================================
if (typeof Swiper !== 'undefined') {
  new Swiper('.effect__slider', {
    slidesPerView: 4,
    spaceBetween: 27,
    navigation: {
      prevEl: '.effect__arrow--prev',
      nextEl: '.effect__arrow--next',
    },
    pagination: {
      el: '.effect__pagination',
      clickable: true,
    },
  });
}

// ========================================
// Countdown timers
// ========================================
const pad = (value) => String(value).padStart(2, '0');

document.querySelectorAll('[data-duration-days]').forEach((timer) => {
  const deadline = Date.now() + Number(timer.dataset.durationDays) * 86400000;
  const cells = {
    days: timer.querySelector('[data-days]'),
    hours: timer.querySelector('[data-hours]'),
    minutes: timer.querySelector('[data-minutes]'),
    seconds: timer.querySelector('[data-seconds]'),
  };

  let tick = null;

  const renderTimer = () => {
    const left = Math.max(deadline - Date.now(), 0);
    const total = Math.floor(left / 1000);

    cells.days.textContent = pad(Math.floor(total / 86400));
    cells.hours.textContent = pad(Math.floor(total / 3600) % 24);
    cells.minutes.textContent = pad(Math.floor(total / 60) % 60);
    cells.seconds.textContent = pad(total % 60);

    if (left === 0 && tick) clearInterval(tick);
  };

  renderTimer();
  tick = setInterval(renderTimer, 1000);
});
// ========================================
// Burger menu
// ========================================
const burger = document.querySelector('.header__burger');
const menu = document.querySelector('.menu');

if (burger && menu) {
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', String(open));
    if (lenis) open ? lenis.stop() : lenis.start();
  };

  burger.addEventListener('click', () => setMenu(true));
  menu.querySelector('.menu__close').addEventListener('click', () => setMenu(false));

  // click on the dimmed area closes it
  menu.addEventListener('click', (event) => {
    if (event.target === menu) setMenu(false);
  });

  menu.querySelectorAll('.menu__link').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });
}

// ========================================
// Tariff popups
// ========================================
const setPopup = (popup, open) => {
  popup.classList.toggle('is-open', open);
  document.body.classList.toggle('is-locked', open);
  if (lenis) open ? lenis.stop() : lenis.start();
};

document.querySelectorAll('[data-popup]').forEach((trigger) => {
  const popup = document.getElementById(trigger.dataset.popup);
  if (!popup) return;

  trigger.addEventListener('click', () => setPopup(popup, true));
  popup.querySelector('.popup__close').addEventListener('click', () => setPopup(popup, false));

  // click on the dimmed area closes it
  popup.addEventListener('click', (event) => {
    if (event.target === popup) setPopup(popup, false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && popup.classList.contains('is-open')) setPopup(popup, false);
  });
});
