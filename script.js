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
