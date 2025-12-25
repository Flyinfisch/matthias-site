/* =====================
   LIGHT / DARK MODE
   ===================== */
const toggleBtn = document.getElementById('mode-toggle');
const root = document.documentElement;

function setTheme(mode) {
  root.setAttribute('data-theme', mode);
  localStorage.setItem('theme', mode);
  toggleBtn.textContent = mode === 'dark' ? '☀️' : '🌙';
}

toggleBtn.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

/* =====================
   TYPING ANIMATION
   ===================== */
const words = ['Matthias', 'innovative', 'curious', 'driven'];
const typingElement = document.getElementById('typing');
const cursor = document.querySelector('.cursor');

let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const currentWord = words[wordIndex];
  typingElement.textContent = currentWord.substring(0, charIndex);

  let speed = isDeleting ? 60 : 120;
  cursor.classList.remove('fast-blink'); // default blink speed

  if (!isDeleting && charIndex < currentWord.length) {
    charIndex++; // typing forward
  } else if (!isDeleting && charIndex === currentWord.length) {
    // full word typed — pause, blink faster
    cursor.classList.add('fast-blink');
    isDeleting = true;
    speed = 1500;
  } else if (isDeleting && charIndex > 0) {
    charIndex--; // deleting
  } else if (isDeleting && charIndex === 0) {
    // finished deleting — pause before next word
    cursor.classList.add('fast-blink');
    isDeleting = false;
    wordIndex = (wordIndex + 1) % words.length;
    speed = 500;
  }

  setTimeout(typeEffect, speed);
}

document.addEventListener('DOMContentLoaded', typeEffect);

/* =====================
   PROJECT MODAL
   ===================== */
document.addEventListener('DOMContentLoaded', () => {
  const cards = Array.from(document.querySelectorAll('.project-card'));
  const modal = document.getElementById('project-modal');
  const modalBody = modal.querySelector('.modal-body');
  const btnClose = modal.querySelector('.modal-close');
  const btnPrev = modal.querySelector('[data-prev]');
  const btnNext = modal.querySelector('[data-next]');
  const overlay = modal.querySelector('.modal-overlay');

  let currentSlides = [];
  let currentSlide = 0;

  function buildSlidesFromCard(card) {
    const slideEls = Array.from(card.querySelectorAll('.slide'));
    if (slideEls.length) return slideEls.map(el => el.innerHTML);

    // Fallback: description first, then image
    const slides = [];
    const text = card.querySelector('p');
    if (text) slides.push(`<div class="modal-caption">${text.innerHTML}</div>`);
    const img = card.querySelector('img');
    if (img) slides.push(`<img src="${img.src}" alt="${img.alt||''}" class="modal-image">`);
    return slides;
  }

  function renderSlide(index, animate = true) {
    if (!currentSlides.length) return;
    index = (index + currentSlides.length) % currentSlides.length;
    currentSlide = index;

    const newContent = currentSlides[index];

    if (!animate) {
      modalBody.innerHTML = newContent;
      modalBody.classList.add('fade-in');
      return;
    }

    // fade out current, replace, then fade in
    modalBody.classList.remove('fade-in');
    modalBody.classList.add('fade-out');

    setTimeout(() => {
      modalBody.innerHTML = newContent;
      modalBody.classList.remove('fade-out');
      modalBody.classList.add('fade-in');
    }, 200);
  }

  function openModalWithCard(card) {
    currentSlides = buildSlidesFromCard(card);
    if (!currentSlides.length) return;
    renderSlide(0, false);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    // small delay so fade-in transition triggers
    setTimeout(() => modalBody.classList.add('fade-in'), 10);
    // focus for keyboard nav
    btnClose.focus();
  }

  function closeModal() {
    modalBody.classList.remove('fade-in');
    modalBody.classList.add('fade-out');
    setTimeout(() => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      modalBody.classList.remove('fade-out');
      modalBody.innerHTML = '';
      currentSlides = [];
      currentSlide = 0;
    }, 180);
  }

  // Attach click handlers to cards
  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openModalWithCard(card);
    });
  });

  // Controls
  btnClose.addEventListener('click', closeModal);
  btnPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    renderSlide(currentSlide - 1, true);
  });
  btnNext.addEventListener('click', (e) => {
    e.stopPropagation();
    renderSlide(currentSlide + 1, true);
  });

  // Close on overlay click
  overlay.addEventListener('click', closeModal);

  // Keyboard navigation (when modal open: left/right change slides; Esc closes)
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') renderSlide(currentSlide - 1, true);
    if (e.key === 'ArrowRight') renderSlide(currentSlide + 1, true);
  });
});
