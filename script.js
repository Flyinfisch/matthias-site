const story = document.querySelector(".story");
const stage = document.querySelector(".story-stage");
const pillar = document.querySelector(".pillar-body");
const cards = [...document.querySelectorAll(".story-card")];
const chapterNumber = document.querySelector("#chapter-number");
const chapterTitle = document.querySelector("#chapter-title");
const progressFill = document.querySelector("#progress-fill");
const galaxyCanvas = document.querySelector("#galaxy-canvas");
const galaxyContext = galaxyCanvas.getContext("2d");
const modal = document.querySelector("#detail-modal");
const modalContent = document.querySelector("#modal-content");
const modalClose = modal.querySelector(".modal-close");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeIndex = 0;
let lastFocused = null;
let targetProgress = 0;
let currentProgress = 0;
let previousFrameTime = 0;
let canvasWidth = 0;
let canvasHeight = 0;
let pixelRatio = 1;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const random = seededRandom(1827);
const lightClusters = Array.from({ length: 72 }, () => ({
  x: random(),
  y: random(),
  size: 8 + random() * 34,
  depth: 0.3 + random() * 1.4,
  alpha: 0.12 + random() * 0.42,
  hue: random() > 0.5 ? 192 + random() * 24 : 258 + random() * 40,
}));

const nebulaClouds = Array.from({ length: 7 }, (_, index) => ({
  x: 0.22 + random() * 0.56,
  y: 0.1 + random() * 0.8,
  radius: 0.16 + random() * 0.25,
  drift: 0.35 + random() * 0.8,
  hue: index % 2 ? 275 : 201,
}));

function resizeGalaxy() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  canvasWidth = Math.max(1, Math.round(window.innerWidth));
  canvasHeight = Math.max(1, Math.round(window.innerHeight));
  galaxyCanvas.width = Math.round(canvasWidth * pixelRatio);
  galaxyCanvas.height = Math.round(canvasHeight * pixelRatio);
  galaxyContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function readScrollProgress() {
  const rect = story.getBoundingClientRect();
  const scrollable = story.offsetHeight - stage.offsetHeight;
  targetProgress = clamp(-rect.top / Math.max(scrollable, 1), 0, 1);
}

function renderStory(progress) {
  const exactStep = progress * (cards.length - 1);
  const orbitRadius = Math.min(window.innerWidth * (window.innerWidth < 760 ? 0.36 : 0.32), 520);

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

function drawGlow(x, y, radius, hue, alpha) {
  const gradient = galaxyContext.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `hsla(${hue}, 100%, 92%, ${alpha})`);
  gradient.addColorStop(0.16, `hsla(${hue}, 95%, 70%, ${alpha * 0.72})`);
  gradient.addColorStop(0.48, `hsla(${hue}, 92%, 58%, ${alpha * 0.2})`);
  gradient.addColorStop(1, `hsla(${hue}, 90%, 45%, 0)`);
  galaxyContext.fillStyle = gradient;
  galaxyContext.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawGalaxy(time, progress) {
  galaxyContext.clearRect(0, 0, canvasWidth, canvasHeight);
  if (!canvasWidth || !canvasHeight) return;

  const centreX = canvasWidth / 2;
  const centreY = canvasHeight / 2;
  const pulse = reduceMotion.matches ? 1 : 1 + Math.sin(time * 0.00045) * 0.045;
  const coreRadius = Math.min(canvasWidth, canvasHeight) * 0.42 * pulse;
  drawGlow(centreX, centreY, coreRadius, 255, 0.24);
  drawGlow(centreX, centreY, coreRadius * 0.62, 198, 0.24);

  nebulaClouds.forEach((cloud, index) => {
    const motion = reduceMotion.matches ? 0 : time * 0.000025 * cloud.drift;
    const x = (cloud.x + Math.sin(motion + index) * 0.07) * canvasWidth;
    const travel = progress * canvasHeight * cloud.drift;
    const y = ((cloud.y * canvasHeight + travel) % (canvasHeight * 1.3)) - canvasHeight * 0.15;
    drawGlow(x, y, Math.min(canvasWidth, canvasHeight) * cloud.radius, cloud.hue, 0.12);
  });

  lightClusters.forEach((light, index) => {
    const sway = reduceMotion.matches ? 0 : Math.sin(time * 0.00035 + index * 1.7) * 12 * light.depth;
    const x = centreX + (light.x - 0.5) * canvasWidth * 0.72 + sway;
    const travel = progress * canvasHeight * 1.7 * light.depth;
    const y = ((light.y * canvasHeight + travel) % (canvasHeight * 1.24)) - canvasHeight * 0.12;
    drawGlow(x, y, light.size * (0.75 + light.depth * 0.32), light.hue, light.alpha);
  });
}

function animate(frameTime) {
  const deltaTime = Math.min(40, frameTime - previousFrameTime || 16);
  previousFrameTime = frameTime;
  readScrollProgress();

  if (reduceMotion.matches) {
    currentProgress = targetProgress;
  } else {
    const ease = 1 - Math.exp(-deltaTime * 0.009);
    currentProgress += (targetProgress - currentProgress) * ease;
  }

  renderStory(currentProgress);
  drawGalaxy(frameTime, currentProgress);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeGalaxy);
resizeGalaxy();
readScrollProgress();
currentProgress = targetProgress;
requestAnimationFrame(animate);

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

reduceMotion.addEventListener?.("change", () => {
  currentProgress = targetProgress;
});
