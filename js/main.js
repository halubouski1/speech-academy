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
    // at 620 and below the slides take their 269px width from CSS
    slidesPerView: 'auto',
    spaceBetween: 35,
    loop: true,
    // without this Swiper 11 pads the loop with empty slides when there
    // aren't enough real ones, which is what blocked scrolling right
    loopAddBlankSlides: false,
    breakpoints: {
      621: { slidesPerView: 2, spaceBetween: 27 },
      770: { slidesPerView: 3, spaceBetween: 27 },
      1181: { slidesPerView: 4, spaceBetween: 27 },
    },
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

// ========================================
// Help accordion
// The markup is desktop-first, so below 769px the DOM is rebuilt
// into an accordion and put back as it was above that width.
// ========================================
const helpList = document.querySelector('.help__list');

if (helpList) {
  const helpMq = window.matchMedia('(max-width: 769px)');
  const helpTitle = document.querySelector('.help__title');
  const helpTitleHtml = helpTitle ? helpTitle.innerHTML : '';

  const buildHelpAccordion = () => {
    if (helpList.dataset.accordion === 'on') return;

    helpList.querySelectorAll('.help__item').forEach((item) => {
      const icon = item.querySelector('img');
      const body = item.querySelector('.help__body');
      const question = item.querySelector('.help__question');
      const answer = item.querySelector('.help__answer');

      const chevron = document.createElement('img');
      chevron.className = 'help__chevron';
      chevron.src = 'assets/icons/chevron.svg';
      chevron.alt = '';
      chevron.width = 14;
      chevron.height = 9;

      const head = document.createElement('button');
      head.type = 'button';
      head.className = 'help__head';
      head.setAttribute('aria-expanded', 'false');

      icon.classList.add('help__icon');
      head.append(icon, question, chevron);

      // two wrappers: the outer collapses, the inner clips. The padding has to
      // stay off both of them - border-box floors an element at its own padding
      const wrap = document.createElement('div');
      wrap.className = 'help__answer-wrap';
      const wrapInner = document.createElement('div');
      wrapInner.className = 'help__answer-inner';

      wrapInner.append(answer);
      wrap.append(wrapInner);

      body.remove();
      item.append(head, wrap);
    });

    if (helpTitle) {
      helpTitle.innerHTML = helpTitleHtml.replace(
        'За 5 недель',
        '<span class="help__title-accent">За 5 недель</span>'
      );
    }

    helpList.dataset.accordion = 'on';
  };

  const destroyHelpAccordion = () => {
    if (helpList.dataset.accordion !== 'on') return;

    helpList.querySelectorAll('.help__item').forEach((item) => {
      const icon = item.querySelector('.help__icon');
      const question = item.querySelector('.help__question');
      const answer = item.querySelector('.help__answer');

      const body = document.createElement('div');
      body.className = 'help__body';
      body.append(question, answer);

      icon.classList.remove('help__icon');
      item.classList.remove('is-open');
      item.replaceChildren(icon, body);
    });

    if (helpTitle) helpTitle.innerHTML = helpTitleHtml;

    delete helpList.dataset.accordion;
  };

  const syncHelpAccordion = () => {
    if (helpMq.matches) buildHelpAccordion();
    else destroyHelpAccordion();
  };

  // delegated, so it survives the markup being rebuilt
  helpList.addEventListener('click', (event) => {
    const head = event.target.closest('.help__head');
    if (!head) return;

    const item = head.closest('.help__item');
    const open = item.classList.toggle('is-open');
    head.setAttribute('aria-expanded', String(open));
  });

  syncHelpAccordion();
  helpMq.addEventListener('change', syncHelpAccordion);
}

// ========================================
// Test CTA
// The title, list and button sit inside .test__content on desktop and move
// into their own section below the photo on mobile, where the pinned
// background image would otherwise cover them.
// ========================================
const testCta = document.querySelector('.test-cta .container');
const testContent = document.querySelector('.test__content');

if (testCta && testContent) {
  const testMq = window.matchMedia('(max-width: 1180px)');
  const testParts = ['.test__title', '.test__list', '.test__btn']
    .map((selector) => document.querySelector(selector))
    .filter(Boolean);

  const syncTestCta = () => {
    // append keeps their original order, and .test__label stays put
    (testMq.matches ? testCta : testContent).append(...testParts);
  };

  syncTestCta();
  testMq.addEventListener('change', syncTestCta);
}

// ========================================
// Everything accordion
// Desktop-first markup, so at 620px and below each card is rebuilt into a
// clickable head plus a separate answer box, and put back above that width.
// ========================================
const everythingList = document.querySelector('.everything__list');

if (everythingList) {
  const everythingMq = window.matchMedia('(max-width: 620px)');

  const buildEverything = () => {
    if (everythingList.dataset.accordion === 'on') return;

    everythingList.querySelectorAll('.everything__card').forEach((card) => {
      const text = card.querySelector('.everything__text');

      const chevron = document.createElement('img');
      chevron.className = 'everything__chevron';
      chevron.src = 'assets/icons/chevron-everything.svg';
      chevron.alt = '';
      chevron.width = 21;
      chevron.height = 13;

      const head = document.createElement('button');
      head.type = 'button';
      head.className = 'everything__head';
      head.setAttribute('aria-expanded', 'false');

      // everything but the paragraph moves into the head
      head.append(...[...card.children].filter((el) => el !== text), chevron);

      // two wrappers: the outer collapses, the inner clips. The padding has to
      // stay off both of them - border-box floors an element at its own padding
      const answer = document.createElement('div');
      answer.className = 'everything__answer';
      const answerInner = document.createElement('div');
      answerInner.className = 'everything__answer-inner';

      text.replaceWith(answer);
      answerInner.append(text);
      answer.append(answerInner);

      card.prepend(head);
    });

    everythingList.dataset.accordion = 'on';
  };

  const destroyEverything = () => {
    if (everythingList.dataset.accordion !== 'on') return;

    everythingList.querySelectorAll('.everything__card').forEach((card) => {
      const head = card.querySelector('.everything__head');
      const text = card.querySelector('.everything__text');
      if (!head) return;

      head.querySelector('.everything__chevron').remove();
      const kids = [...head.children];

      card.classList.remove('is-open');
      // the .everything__answer wrapper is dropped along with the old children
      card.replaceChildren(...kids, text);
    });

    delete everythingList.dataset.accordion;
  };

  const syncEverything = () => {
    if (everythingMq.matches) buildEverything();
    else destroyEverything();
  };

  // delegated, so it survives the markup being rebuilt
  everythingList.addEventListener('click', (event) => {
    const head = event.target.closest('.everything__head');
    if (!head) return;

    const card = head.closest('.everything__card');
    const open = card.classList.toggle('is-open');
    head.setAttribute('aria-expanded', String(open));
  });

  syncEverything();
  everythingMq.addEventListener('change', syncEverything);
}

// ========================================
// In-page anchors
// Delegated on document, so it runs after the menu's own link handler has
// closed the panel and restarted lenis.
// ========================================
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const hash = link.getAttribute('href');
  if (hash.length < 2) return; // plain "#" placeholders

  const target = document.querySelector(hash);
  if (!target) return;

  event.preventDefault();

  // negative offset stops the section landing flush against the top edge
  if (lenis) lenis.scrollTo(target, { offset: -100, duration: 1.2 });
  else window.scrollTo({ top: target.offsetTop - 100, behavior: 'smooth' });
});

// ========================================
// Video playback
// The play overlay starts the clip and hands over to the native controls.
// ========================================
document.addEventListener('click', (event) => {
  // anywhere on the card, not just the play button
  const trigger = event.target.closest('.card, .about__video, .about__btn');
  if (!trigger) return;

  // the about button sits outside the video, so it points at it
  const wrap = trigger.classList.contains('about__btn')
    ? document.querySelector('.about__video')
    : trigger;

  // once playing, clicks belong to the native controls
  if (!wrap || wrap.classList.contains('is-playing')) return;

  const video = wrap.querySelector('video');
  if (!video) return;

  video.controls = true;
  wrap.classList.add('is-playing');
  video.play();

  if (trigger.classList.contains('about__btn')) {
    if (lenis) lenis.scrollTo(wrap, { offset: -100, duration: 1.2 });
    else wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
