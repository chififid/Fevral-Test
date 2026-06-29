function bindSwipe(target, onSwipe, threshold = 48) {
  let startX = 0;
  let startY = 0;
  let pointerId = null;

  target.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    if (event.target.closest("a, button, summary")) return;

    startX = event.clientX;
    startY = event.clientY;
    pointerId = event.pointerId;
    try {
      target.setPointerCapture?.(pointerId);
    } catch {
      // Synthetic pointer events in tests do not always create an active pointer.
    }
  });

  target.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointerId) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    pointerId = null;

    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    onSwipe(deltaX < 0 ? 1 : -1);
  });

  target.addEventListener("pointercancel", () => {
    pointerId = null;
  });
}

function setupPreloader() {
  const preloader = document.querySelector("[data-preloader]");
  if (!preloader) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const startedAt = performance.now();
  const minimumDuration = reduceMotion ? 320 : 1250;
  const safetyDuration = reduceMotion ? 900 : 2400;
  let hidden = false;

  function hide() {
    if (hidden) return;
    hidden = true;

    const elapsed = performance.now() - startedAt;
    const wait = Math.max(0, minimumDuration - elapsed);

    window.setTimeout(() => {
      preloader.classList.add("is-hidden");
      window.setTimeout(() => {
        preloader.remove();
      }, reduceMotion ? 80 : 820);
    }, wait);
  }

  if (document.readyState === "complete") hide();
  else window.addEventListener("load", hide, { once: true });

  window.setTimeout(hide, safetyDuration);
}

setupPreloader();

function setReveal(element, type = "line", delay = 0) {
  if (!element) return;
  element.dataset.reveal = type;
  element.style.setProperty("--reveal-delay", `${delay}ms`);
}

function splitTextForReveal(element, startDelay = 0, step = 34) {
  if (!element || element.dataset.wordsReady === "true") return;

  const label = element.textContent.replace(/\s+/g, " ").trim();
  let index = 0;

  function walk(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        const parts = child.textContent.split(/(\s+)/);

        parts.forEach((part) => {
          if (!part) return;

          if (/^\s+$/.test(part)) {
            fragment.append(document.createTextNode(part));
            return;
          }

          const span = document.createElement("span");
          span.dataset.reveal = "word";
          span.style.setProperty(
            "--reveal-delay",
            `${startDelay + index * step}ms`,
          );
          span.textContent = part;
          span.setAttribute("aria-hidden", "true");
          fragment.append(span);
          index += 1;
        });

        child.replaceWith(fragment);
        return;
      }

      if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
        walk(child);
      }
    });
  }

  element.setAttribute("aria-label", label);
  walk(element);
  element.dataset.wordsReady = "true";
}

function setupRevealMotion() {
  const sections = [...document.querySelectorAll("main > section")];
  document.body.classList.add("motion-ready");

  sections.forEach((section) => {
    section.dataset.revealRoot = "";
  });

  const welcome = document.querySelector(".welcome");
  if (welcome) {
    setReveal(welcome.querySelector(".welcome__title-media"), "control", 0);
    splitTextForReveal(welcome.querySelector("h1"), 90, 38);
    setReveal(welcome.querySelector(".welcome__hero-media"), "media", 210);
    setReveal(welcome.querySelector(".welcome__copy"), "line", 340);
    setReveal(welcome.querySelector(".pill"), "control", 430);
  }

  const highlights = document.querySelector(".highlights");
  if (highlights) {
    splitTextForReveal(highlights.querySelector("h2"), 0, 32);
    setReveal(highlights.querySelector(".film-link"), "line", 180);
    setReveal(highlights.querySelector(".highlights__viewport"), "media", 260);
    setReveal(highlights.querySelector(".gallery-controls"), "control", 470);
  }

  const pricing = document.querySelector(".pricing");
  if (pricing) {
    splitTextForReveal(pricing.querySelector("h2"), 0, 32);
    pricing.querySelectorAll(".price-card").forEach((card, index) => {
      setReveal(card, "card", 160 + index * 90);
    });
  }

  document.querySelectorAll(".app-section").forEach((section) => {
    setReveal(
      section.querySelector(".app-hero, .productivity__hero"),
      "media",
      0,
    );
    setReveal(
      section.querySelector(".app-icon, .productivity-logo"),
      "control",
      130,
    );

    const eyebrow = section.querySelector(".eyebrow");
    if (section.classList.contains("productivity")) {
      eyebrow?.querySelectorAll("span").forEach((span, index) => {
        setReveal(span, "word", 170 + index * 70);
      });
    } else {
      setReveal(eyebrow, "line", 170);
    }

    splitTextForReveal(section.querySelector(".app-intro h2"), 220, 30);
    setReveal(section.querySelector(".app-intro > div"), "line", 410);

    section.querySelectorAll(".feature-card").forEach((card, index) => {
      setReveal(card, "card", 90 + Math.min(index, 5) * 70);
    });
  });

  const faq = document.querySelector(".faq");
  if (faq) {
    splitTextForReveal(faq.querySelector("h2"), 0, 34);
    faq.querySelectorAll("details").forEach((details, index) => {
      setReveal(details, "line", 160 + index * 55);
    });
  }

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -18% 0px",
      threshold: 0.12,
    },
  );

  sections.forEach((section) => observer.observe(section));

  window.setTimeout(() => {
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top < window.innerHeight * 0.92) {
        section.classList.add("is-revealed");
      }
    });
  }, 240);

}

setupRevealMotion();

const slider = document.querySelector('[data-slider="highlights"]');

if (slider) {
  const track = slider.querySelector(".highlights__track");
  const cards = [...slider.querySelectorAll(".highlight-card")];
  const dotsHost = slider.querySelector("[data-dots]");
  const playToggle = slider.querySelector("[data-play-toggle]");
  const duration = 5200;
  let active = 0;
  let playing = true;
  let startedAt = performance.now();
  let lastProgress = 0;
  let raf = null;
  let wheelLocked = false;
  let slideOffsets = [];

  function normalizeSlide(index) {
    return ((index % cards.length) + cards.length) % cards.length;
  }

  function measureSlides() {
    const firstLeft = cards[0]?.offsetLeft || 0;
    slideOffsets = cards.map((card) => Math.round(card.offsetLeft - firstLeft));
    render(lastProgress);
  }

  function showSlide(index, cycle = false) {
    active = cycle
      ? normalizeSlide(index)
      : Math.min(Math.max(index, 0), cards.length - 1);
    startedAt = performance.now();
    render();
  }

  const dots = cards.map((_, index) => {
    const button = document.createElement("button");
    button.className = "dot";
    button.type = "button";
    button.setAttribute("aria-label", `Show slide ${index + 1}`);
    button.addEventListener("click", () => {
      showSlide(index);
    });
    dotsHost.append(button);
    return button;
  });

  function render(progress = 0) {
    lastProgress = progress;
    track.style.setProperty("--slide-offset", `${slideOffsets[active] || 0}px`);
    cards.forEach((card, index) =>
      card.classList.toggle("is-active", index === active),
    );
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === active);
      dot.style.setProperty("--progress", index === active ? progress : 0);
      dot.style.setProperty(
        "--progress-opacity",
        playing && index === active ? 1 : 0,
      );
    });
    playToggle.classList.toggle("is-paused", !playing);
    playToggle.setAttribute(
      "aria-label",
      playing ? "Pause slideshow" : "Play slideshow",
    );
  }

  function tick(now) {
    const progress = playing
      ? Math.min((now - startedAt) / duration, 1)
      : lastProgress;
    if (playing && progress >= 1) {
      active = (active + 1) % cards.length;
      startedAt = now;
      render(0);
    } else {
      render(progress);
    }
    raf = requestAnimationFrame(tick);
  }

  playToggle.addEventListener("click", () => {
    playing = !playing;
    if (playing) {
      startedAt = performance.now() - lastProgress * duration;
    }
    render(lastProgress);
  });

  slider.addEventListener(
    "wheel",
    (event) => {
      const delta = event.shiftKey ? event.deltaY : event.deltaX;
      if (Math.abs(delta) < 18 || wheelLocked) return;

      event.preventDefault();
      showSlide(active + (delta > 0 ? 1 : -1));

      wheelLocked = true;
      window.setTimeout(() => {
        wheelLocked = false;
      }, 520);
    },
    { passive: false },
  );

  bindSwipe(slider, (direction) => {
    showSlide(active + direction, true);
  });

  window.addEventListener("resize", measureSlides);
  measureSlides();
  raf = requestAnimationFrame(tick);
}

document.querySelectorAll(".feature-rail").forEach((rail) => {
  const originalCards = [...rail.querySelectorAll(".feature-card")];
  if (originalCards.length < 2) return;

  const before = document.createDocumentFragment();
  const after = document.createDocumentFragment();

  originalCards.forEach((card) => {
    const beforeClone = card.cloneNode(true);
    const afterClone = card.cloneNode(true);
    beforeClone.classList.add("is-clone");
    afterClone.classList.add("is-clone");
    beforeClone.setAttribute("aria-hidden", "true");
    afterClone.setAttribute("aria-hidden", "true");
    before.append(beforeClone);
    after.append(afterClone);
  });

  rail.prepend(before);
  rail.append(after);

  const nav = document.createElement("div");
  const previous = document.createElement("button");
  const next = document.createElement("button");
  const cards = [...rail.querySelectorAll(".feature-card")];
  const originalCount = originalCards.length;
  let offsets = [];
  let active = 0;
  let locked = false;
  let suppressCardClick = false;
  let resetTimer = null;

  nav.className = "feature-nav";
  previous.type = "button";
  next.type = "button";
  previous.setAttribute("aria-label", "Previous cards");
  next.setAttribute("aria-label", "Next cards");
  nav.append(previous, next);
  rail.after(nav);
  setReveal(nav, "control", 540);

  function measure() {
    const firstLeft = cards[0].offsetLeft;
    offsets = cards.map((card) => Math.round(card.offsetLeft - firstLeft));
    nav.hidden = false;
    active = normalize(active);
    render(true);
  }

  function normalize(index) {
    return ((index % originalCount) + originalCount) % originalCount;
  }

  function getDomIndex(index) {
    return originalCount + index;
  }

  function setRailOffset(domIndex, instant = false) {
    if (instant) rail.classList.add("is-resetting");
    else rail.classList.remove("is-resetting");

    rail.style.setProperty(
      "--rail-offset",
      `${offsets[domIndex] || 0}px`,
    );
    previous.disabled = false;
    next.disabled = false;

    if (instant) {
      rail.offsetHeight;
      requestAnimationFrame(() => {
        rail.classList.remove("is-resetting");
      });
    }
  }

  function render(instant = false) {
    setRailOffset(getDomIndex(active), instant);
  }

  function move(delta) {
    if (locked) return;
    locked = true;
    active += delta;
    render();
    scheduleReset();
  }

  function resetIfNeeded() {
    window.clearTimeout(resetTimer);
    if (active < 0 || active >= originalCount) {
      active = normalize(active);
      render(true);
    }
    locked = false;
  }

  function scheduleReset() {
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(resetIfNeeded, 760);
  }

  function goToDomIndex(domIndex) {
    if (locked) return;

    const targetOffset = offsets[domIndex];
    if (targetOffset === undefined) return;

    const currentOffset =
      Number.parseFloat(
        getComputedStyle(rail).getPropertyValue("--rail-offset"),
      ) || 0;

    active = domIndex - originalCount;

    if (Math.round(currentOffset) === targetOffset) {
      active = normalize(active);
      render(true);
      locked = false;
      return;
    }

    locked = true;
    setRailOffset(domIndex);
    scheduleReset();
  }

  previous.addEventListener("click", () => {
    move(-1);
  });

  next.addEventListener("click", () => {
    move(1);
  });

  rail.addEventListener(
    "wheel",
    (event) => {
      const delta = event.shiftKey ? event.deltaY : event.deltaX;
      if (Math.abs(delta) < 18) return;

      event.preventDefault();
      move(delta > 0 ? 1 : -1);
    },
    { passive: false },
  );

  bindSwipe(rail, (direction) => {
    suppressCardClick = true;
    window.setTimeout(() => {
      suppressCardClick = false;
    }, 350);
    move(direction);
  });

  cards.forEach((card, domIndex) => {
    card.addEventListener("click", (event) => {
      if (suppressCardClick || event.target.closest("a, button")) return;
      goToDomIndex(domIndex);
    });
  });

  rail.addEventListener("transitionend", (event) => {
    if (event.propertyName === "transform") resetIfNeeded();
  });

  window.addEventListener("resize", measure);
  measure();
});

document.querySelectorAll(".faq details").forEach((details) => {
  const summary = details.querySelector("summary");
  if (!summary) return;

  function clearHeight() {
    details.style.height = "";
    details.removeEventListener("transitionend", onTransitionEnd);
  }

  function onTransitionEnd(event) {
    if (event.propertyName !== "height") return;

    if (details.dataset.closing === "true") {
      details.open = false;
      delete details.dataset.closing;
    }

    clearHeight();
  }

  summary.addEventListener("click", (event) => {
    event.preventDefault();
    const startHeight = details.offsetHeight;
    details.style.height = `${startHeight}px`;
    details.removeEventListener("transitionend", onTransitionEnd);
    details.addEventListener("transitionend", onTransitionEnd);

    if (details.open) {
      details.dataset.closing = "true";
      requestAnimationFrame(() => {
        details.style.height = `${summary.offsetHeight}px`;
      });
      return;
    }

    details.open = true;
    requestAnimationFrame(() => {
      details.style.height = `${details.scrollHeight}px`;
    });
  });
});

document.querySelectorAll("[data-play-on-view]").forEach((video) => {
  let played = false;

  const playOnce = () => {
    if (played) return;
    played = true;
    video.currentTime = 0;
    video.play().catch(() => {
      played = false;
    });
  };

  if (!("IntersectionObserver" in window)) {
    playOnce();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        playOnce();
        observer.disconnect();
      }
    },
    { threshold: 0.35 },
  );

  observer.observe(video);
});
