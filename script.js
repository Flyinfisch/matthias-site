const root = document.documentElement;
const themeButton = document.querySelector("#mode-toggle");
const story = document.querySelector(".story");
const stage = document.querySelector(".story-stage");
const pillar = document.querySelector(".pillar-body");
const cards = [...document.querySelectorAll(".story-card")];
const chapterNumber = document.querySelector("#chapter-number");
const chapterTitle = document.querySelector("#chapter-title");
const progressFill = document.querySelector("#progress-fill");
const modal = document.querySelector("#detail-modal");
const modalContent = document.querySelector("#modal-content");
const modalClose = modal.querySelector(".modal-close");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeIndex = 0;
let lastFocused = null;
let ticking = false;

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  themeButton.textContent = theme === "dark" ? "☀" : "◐";
  themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

setTheme(localStorage.getItem("theme") || "light");
themeButton.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateStory() {
  ticking = false;
  const rect = story.getBoundingClientRect();
  const scrollable = story.offsetHeight - stage.offsetHeight;
  const progress = clamp(-rect.top / Math.max(scrollable, 1), 0, 1);
  const exactStep = progress * (cards.length - 1);
  const orbitRadius = Math.min(window.innerWidth * (window.innerWidth < 760 ? 0.34 : 0.28), 420);

  activeIndex = clamp(Math.round(exactStep), 0, cards.length - 1);

  cards.forEach((card, index) => {
    const delta = index - exactStep;
    const angle = delta * 1.16;
    const distance = Math.abs(delta);
    const x = Math.sin(angle) * orbitRadius;
    const y = delta * Math.min(window.innerHeight * 0.52, 470);
    const depth = Math.cos(angle) * 170 - 170;
    const focus = Math.max(0, 1 - distance);
    const scale = clamp(0.62 + focus * 0.53 - distance * 0.035, 0.48, 1.15);
    const opacity = clamp(1.12 - distance * 0.36, 0, 1);
    const blur = Math.max(0, distance - 1.1) * 1.8;

    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
    card.style.setProperty("--depth", `${depth}px`);
    card.style.setProperty("--scale", scale.toFixed(3));
    card.style.setProperty("--opacity", opacity.toFixed(3));
    card.style.setProperty("--blur", `${blur.toFixed(2)}px`);
    card.style.zIndex = String(100 - Math.round(distance * 10));
    card.classList.toggle("is-active", index === activeIndex);
    card.classList.toggle("is-near", distance < 1.15);
    card.setAttribute("aria-hidden", distance > 1.15 ? "true" : "false");
    card.querySelector("button").tabIndex = distance < 1.15 ? 0 : -1;
  });

  const activeCard = cards[activeIndex];
  chapterNumber.textContent = String(activeIndex + 1).padStart(2, "0");
  chapterTitle.textContent = activeCard.dataset.title;
  progressFill.style.setProperty("--progress", `${progress * 100}%`);
  pillar.style.setProperty("--pillar-shift", `${(progress * 500) % 100}px`);
}

function requestStoryUpdate() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(updateStory);
  }
}

window.addEventListener("scroll", requestStoryUpdate, { passive: true });
window.addEventListener("resize", requestStoryUpdate);
updateStory();

function openModal(id, trigger) {
  const template = document.querySelector(`#modal-${id}`);
  if (!template) return;
  lastFocused = trigger;
  modalContent.replaceChildren(template.content.cloneNode(true));
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modalContent.scrollTop = 0;
  modalClose.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  modalContent.replaceChildren();
  lastFocused?.focus();
}

document.querySelectorAll("[data-modal]").forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.modal, button));
});

modal.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));

document.addEventListener("keydown", (event) => {
  if (!modal.classList.contains("is-open")) return;
  if (event.key === "Escape") closeModal();
  if (event.key === "Tab") {
    const focusable = [...modal.querySelectorAll("button, a, video[controls]")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

reduceMotion.addEventListener?.("change", requestStoryUpdate);
