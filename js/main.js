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
// The arrows sit over the slider on desktop and next to the title on mobile,
// where they also grey out at the ends - which only happens with the loop off,
// and `loop` cannot go in `breakpoints`, so the slider is rebuilt on the change.
// ========================================
const effectMq = window.matchMedia('(max-width: 620px)');
const effectRow = document.querySelector('.effect__row');
const effectNav = document.querySelector('.effect__nav');
const effectArrows = [...document.querySelectorAll('.effect__arrow')];

if (effectRow && effectNav && effectArrows.length) {
  const syncEffectArrows = () => {
    (effectMq.matches ? effectNav : effectRow).append(...effectArrows);
  };

  syncEffectArrows();
  effectMq.addEventListener('change', syncEffectArrows);
}

if (typeof Swiper !== 'undefined') {
  let effectSwiper = null;

  const buildEffectSwiper = () => {
    if (effectSwiper) effectSwiper.destroy(true, true);

    effectSwiper = new Swiper('.effect__slider', {
      // at 620 and below the slides take their 269px width from CSS
      slidesPerView: 'auto',
      spaceBetween: 10,
      loop: !effectMq.matches,
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
  };

  buildEffectSwiper();
  effectMq.addEventListener('change', buildEffectSwiper);
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

  trigger.addEventListener('click', () => {
    // triggers also sit inside the tariff popups and in the burger menu, so
    // whatever is already open has to give way before this one shows
    document.querySelectorAll('.popup.is-open')
      .forEach((open) => open.classList.remove('is-open'));
    if (menu) menu.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');

    setPopup(popup, true);
  });

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
// Popup forms
// Each one posts to Web3Forms in the background so the popup stays put. The
// access key lives in a hidden field per form, in index.html.
// ========================================
document.querySelectorAll('.form').forEach((form) => {
  const status = form.querySelector('.form__status');
  const button = form.querySelector('.form__btn');

  const setStatus = (message, state = '') => {
    status.textContent = message;
    status.className = state ? `form__status ${state}` : 'form__status';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const key = form.elements.access_key.value;
    if (!key || key.startsWith('YOUR_')) {
      setStatus('Форма не подключена: добавьте Web3Forms access key.', 'is-error');
      return;
    }

    button.disabled = true;
    setStatus('Отправляем...');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
      });
      const result = await response.json();

      if (result.success) {
        form.reset();
        setStatus('Заявка отправлена! Мы свяжемся с вами.', 'is-ok');
      } else {
        setStatus(result.message || 'Не удалось отправить. Попробуйте еще раз.', 'is-error');
      }
    } catch {
      setStatus('Не удалось отправить. Проверьте соединение.', 'is-error');
    } finally {
      button.disabled = false;
    }
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
      // every item starts expanded, the chevron still collapses it
      head.setAttribute('aria-expanded', 'true');
      item.classList.add('is-open');

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
// Hero video link
// It lives in the header, but three items do not fit across a phone header, so
// at 620px and below it drops back into the hero under the buttons.
// ========================================
const heroVideo = document.querySelector('.hero__video');
const headerContainer = document.querySelector('.header__container');
const heroBottom = document.querySelector('.hero__bottom');

if (heroVideo && headerContainer && heroBottom && burger) {
  const heroVideoMq = window.matchMedia('(max-width: 620px)');

  const syncHeroVideo = () => {
    // back before the burger, so it lands in the middle grid column again
    if (heroVideoMq.matches) heroBottom.append(heroVideo);
    else headerContainer.insertBefore(heroVideo, burger);
  };

  syncHeroVideo();
  heroVideoMq.addEventListener('change', syncHeroVideo);
}

// ========================================
// Weeks progress
// The line fills and the numbers light up as the block travels past the middle
// of the screen. Mobile only - desktop keeps the drawn track and the icons.
// ========================================
const weeksBody = document.querySelector('.weeks__body');
const weeksProgress = document.querySelector('.weeks__progress');
const weeksNums = [...document.querySelectorAll('.weeks__num')];

if (weeksBody && weeksProgress && weeksNums.length) {
  const weeksMq = window.matchMedia('(max-width: 769px)');
  let weeksFrame = null;

  const drawWeeks = () => {
    weeksFrame = null;
    if (!weeksMq.matches) return;

    const marker = window.innerHeight / 2;
    const track = weeksProgress.getBoundingClientRect();
    const filled = (marker - track.top) / track.height;

    weeksBody.style.setProperty('--weeks-progress', `${Math.min(Math.max(filled, 0), 1) * 100}%`);

    // a number lights up once its own middle has passed the same marker
    weeksNums.forEach((num) => {
      const box = num.getBoundingClientRect();
      num.classList.toggle('is-active', box.top + box.height / 2 <= marker);
    });
  };

  // rAF-throttled, so a burst of scroll events still costs one measure per frame
  const queueWeeks = () => {
    if (weeksFrame === null) weeksFrame = requestAnimationFrame(drawWeeks);
  };

  drawWeeks();
  window.addEventListener('scroll', queueWeeks, { passive: true });
  window.addEventListener('resize', queueWeeks);
  weeksMq.addEventListener('change', drawWeeks);
}

// ========================================
// Lesson prices
// Both prices sit on the poster on mobile, which means moving them into the
// media box - they cannot be pinned to it from the content column.
// ========================================
const lessonMedia = document.querySelector('.lesson__media');
const lessonContent = document.querySelector('.lesson__content');
const lessonPrices = [...document.querySelectorAll('.lesson__old-price, .lesson__price')];

if (lessonMedia && lessonContent && lessonPrices.length) {
  const lessonMq = window.matchMedia('(max-width: 620px)');
  const lessonTimerTitle = lessonContent.querySelector('.lesson__timer-title');

  const syncLessonPrices = () => {
    if (lessonMq.matches) {
      lessonMedia.append(...lessonPrices);
    } else {
      // back into the column in their original order, above the timer heading
      lessonPrices.forEach((price) => lessonContent.insertBefore(price, lessonTimerTitle));
    }
  };

  syncLessonPrices();
  lessonMq.addEventListener('change', syncLessonPrices);
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
      // every card starts expanded, the chevron still collapses it
      head.setAttribute('aria-expanded', 'true');
      card.classList.add('is-open');

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
