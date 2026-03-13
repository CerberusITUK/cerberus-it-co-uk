document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const rafThrottle = callback => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        callback(...args);
        ticking = false;
      });
    };
  };

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll(".feature-animate").forEach(tile => {
    observer.observe(tile);
  });

  const parallaxImages = Array.from(
    document.querySelectorAll(".cards__media img, .cards__media video")
  );
  const PARALLAX_SCALE = 1.3;
  const MOVEMENT_FACTOR = 0.06;

  parallaxImages.forEach(img => img.classList.add("parallax-img"));

  const updateParallax = () => {
    parallaxImages.forEach(img => {
      const rect = img.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const distanceFromCenter = rect.top + rect.height / 2 - viewportHeight / 2;
      const extraHeight = (PARALLAX_SCALE - 1) * rect.height;
      const maxOffset = Math.max(extraHeight / 2 - 2, 0);
      const rawOffset = distanceFromCenter * MOVEMENT_FACTOR;
      const offset = Math.min(Math.max(rawOffset, 0), maxOffset);
      img.style.transform = `translate3d(0, ${offset}px, 0) scale(${PARALLAX_SCALE})`;
    });
  };

  if (parallaxImages.length) {
    const throttledParallax = rafThrottle(updateParallax);
    window.addEventListener("scroll", throttledParallax, { passive: true });
    window.addEventListener("resize", throttledParallax);
    updateParallax();
  }

  const tabs = Array.from(document.querySelectorAll(".projects__tab"));
  const panels = Array.from(document.querySelectorAll(".projects__panel"));

  if (tabs.length && panels.length) {
    const setActiveTab = targetTab => {
      const targetPanelId = targetTab.getAttribute("aria-controls");
      tabs.forEach(tab => {
        const isActive = tab === targetTab;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach(panel => {
        const isMatch = panel.id === targetPanelId;
        panel.classList.toggle("is-active", isMatch);
        panel.hidden = !isMatch;
      });
    };

    tabs.forEach(tab => {
      tab.addEventListener("click", () => setActiveTab(tab));
      tab.addEventListener("keydown", event => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const currentIndex = tabs.indexOf(tab);
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
        tabs[nextIndex].focus();
        setActiveTab(tabs[nextIndex]);
      });
    });

    const initiallyActive = tabs.find(tab => tab.classList.contains("is-active"));
    if (initiallyActive) {
      setActiveTab(initiallyActive);
    }
  }

  const pricingTabsContainer = document.querySelector(".pricing__tabs");
  const pricingTabs = Array.from(document.querySelectorAll(".pricing__tab"));
  const pricingIndicator = document.querySelector(".pricing__tab-indicator");
  const pricingActiveBg = document.querySelector(".pricing__tab-active");
  const pricingAmounts = Array.from(
    document.querySelectorAll(".pricing__amount[data-price]")
  );

  pricingAmounts.forEach(amountEl => {
    if (amountEl.dataset.prefix && amountEl.dataset.suffix) return;
    const text = amountEl.textContent || "";
    const match = text.match(/^(.*?)[0-9.,]+(.*)$/);
    if (match) {
      amountEl.dataset.prefix = match[1];
      amountEl.dataset.suffix = match[2];
    } else {
      amountEl.dataset.prefix = "£";
      amountEl.dataset.suffix = "";
    }
  });

  if (pricingTabsContainer && pricingTabs.length && pricingIndicator && pricingActiveBg) {
    const tabsStyles = getComputedStyle(pricingTabsContainer);
    const tabsPaddingLeft = parseFloat(tabsStyles.paddingLeft) || 0;
    const moveIndicator = target => {
      const containerRect = pricingTabsContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offset = targetRect.left - containerRect.left;
      pricingIndicator.style.width = `${targetRect.width}px`;
      pricingIndicator.style.transform = `translateX(${offset}px)`;
      pricingActiveBg.style.width = `${targetRect.width}px`;
      pricingActiveBg.style.transform = `translateX(${offset - tabsPaddingLeft}px)`;
    };

    const updatePricingAmounts = billing => {
      const isYearly = billing === "yearly";
      const formatPrice = (value, element) => {
        const prefix = element.dataset.prefix ?? "£";
        const suffix = element.dataset.suffix ?? "";
        const formattedNumber = Math.round(value).toLocaleString("en-GB");
        return `${prefix}${formattedNumber}${suffix}`;
      };
      const animatePriceChange = (element, targetValue) => {
        const currentText = element.textContent.replace(/[^0-9.]/g, "");
        const startValue = Number(currentText) || Number(element.dataset.price) || targetValue;
        const duration = 350;
        const startTime = performance.now();

        if (element._priceAnimation) {
          cancelAnimationFrame(element._priceAnimation);
        }

        const step = now => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = startValue + (targetValue - startValue) * eased;
          element.textContent = formatPrice(value, element);

          if (progress < 1) {
            element._priceAnimation = requestAnimationFrame(step);
          } else {
            element.textContent = formatPrice(targetValue, element);
            element._priceAnimation = null;
          }
        };

        element._priceAnimation = requestAnimationFrame(step);
      };

      pricingAmounts.forEach(amountEl => {
        const basePrice = Number(amountEl.dataset.price);
        if (Number.isNaN(basePrice)) return;
        const computedPrice = isYearly ? Math.round(basePrice * 0.8) : basePrice;
        animatePriceChange(amountEl, computedPrice);
      });
    };

    const setActivePricingTab = target => {
      pricingTabs.forEach(tab => {
        const isActive = tab === target;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });
      moveIndicator(target);
      const billing = target.dataset.billing;
      if (billing) {
        updatePricingAmounts(billing);
      }
    };

    pricingTabs.forEach(tab => {
      tab.addEventListener("click", () => setActivePricingTab(tab));
    });

    const initialPricingTab =
      pricingTabs.find(tab => tab.classList.contains("is-active")) || pricingTabs[0];

    if (initialPricingTab) {
      setActivePricingTab(initialPricingTab);
    }

    window.addEventListener("resize", () => {
      const active = pricingTabs.find(tab => tab.classList.contains("is-active"));
      if (active) moveIndicator(active);
    });
  }

  const contactModal = document.getElementById("contact-modal");
  const openContactButtons = Array.from(document.querySelectorAll("[data-open-contact]"));
  const closeContactButtons = Array.from(document.querySelectorAll("[data-close-contact]"));

  if (contactModal && (openContactButtons.length || closeContactButtons.length)) {
    const setModalOpen = isOpen => {
      contactModal.classList.toggle("is-open", isOpen);
      contactModal.setAttribute("aria-hidden", String(!isOpen));
      document.body.classList.toggle("modal-open", isOpen);
    };

    openContactButtons.forEach(button => {
      button.addEventListener("click", () => setModalOpen(true));
    });

    closeContactButtons.forEach(button => {
      button.addEventListener("click", () => setModalOpen(false));
    });

    contactModal.addEventListener("click", event => {
      if (event.target === contactModal) {
        setModalOpen(false);
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    });
  }

  const rateControlledVideos = Array.from(document.querySelectorAll("video[data-playback-rate]"));

  if (rateControlledVideos.length) {
    rateControlledVideos.forEach(video => {
      const rate = Number(video.dataset.playbackRate);
      if (Number.isFinite(rate) && rate > 0) {
        const applyRate = () => {
          video.playbackRate = rate;
        };
        video.addEventListener("loadeddata", applyRate);
        video.addEventListener("play", applyRate);
      }
    });
  }

  document.querySelectorAll(".faq__trigger").forEach(trigger => {
    const content = trigger.nextElementSibling;
    if (!content) return;

    const setMaxHeightAuto = el => {
      el.style.maxHeight = "none";
    };

    const collapse = el => {
      el.style.maxHeight = `${el.scrollHeight}px`;
      requestAnimationFrame(() => {
        el.style.maxHeight = "0px";
        el.style.opacity = "0";
      });

      const onEnd = event => {
        if (event.target !== el) return;
        el.hidden = true;
        el.style.maxHeight = "0px";
        el.removeEventListener("transitionend", onEnd);
      };

      el.addEventListener("transitionend", onEnd);
    };

    const expand = el => {
      el.hidden = false;
      el.style.maxHeight = "0px";
      el.style.opacity = "0";
      requestAnimationFrame(() => {
        el.style.maxHeight = `${el.scrollHeight}px`;
        el.style.opacity = "1";
      });

      const onEnd = event => {
        if (event.target !== el) return;
        setMaxHeightAuto(el);
        el.removeEventListener("transitionend", onEnd);
      };

      el.addEventListener("transitionend", onEnd);
    };

    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      if (expanded) {
        collapse(content);
      } else {
        expand(content);
      }
    });
  });

  const heroClock = document.querySelector(".iphone-chat__time");

  if (heroClock) {
    const updateHeroClock = () => {
      const now = new Date();
      heroClock.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    const scheduleHeroClock = () => {
      updateHeroClock();
      const now = new Date();
      const msUntilNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
      setTimeout(scheduleHeroClock, Math.max(msUntilNextMinute, 1000));
    };

    scheduleHeroClock();
  }

  const heroPhone = document.querySelector(".iphone-chat");

  if (heroPhone) {
    const phoneStyles = window.getComputedStyle(heroPhone);
    const baseRotateY = parseFloat(phoneStyles.getPropertyValue("--phone-rotate-y")) || 0;
    const baseRotateX = parseFloat(phoneStyles.getPropertyValue("--phone-rotate-x")) || 0;
    let phoneInView = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const updatePhoneTilt = () => {
      if (!phoneInView) return;
      const rect = heroPhone.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportCenter = viewportHeight / 2;
      const phoneCenter = rect.top + rect.height / 2;
      const distance = phoneCenter - viewportCenter;
      const normalized = clamp(distance / (viewportHeight * 0.6), -1, 1);
      const rotateY = baseRotateY + normalized * 8;
      const rotateX = baseRotateX - normalized * 6;
      heroPhone.style.setProperty("--phone-rotate-y", `${rotateY}deg`);
      heroPhone.style.setProperty("--phone-rotate-x", `${rotateX}deg`);
    };

    const phoneObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          phoneInView = entry.isIntersecting;
          if (phoneInView) {
            updatePhoneTilt();
          } else {
            heroPhone.style.setProperty("--phone-rotate-y", `${baseRotateY}deg`);
            heroPhone.style.setProperty("--phone-rotate-x", `${baseRotateX}deg`);
          }
        });
      },
      { threshold: 0.2 }
    );

    phoneObserver.observe(heroPhone);

    const throttledPhoneTilt = rafThrottle(updatePhoneTilt);
    window.addEventListener("scroll", throttledPhoneTilt, { passive: true });
    window.addEventListener("resize", throttledPhoneTilt);
  }

  const rippleTargets = Array.from(
    document.querySelectorAll(".button-primary, .button-secondary")
  );

  if (rippleTargets.length) {
    rippleTargets.forEach(target => {
      let ripple = target.querySelector(".button-ripple");

      if (!ripple) {
        ripple = document.createElement("span");
        ripple.className = "button-ripple";
        for (let i = 0; i < 3; i += 1) {
          const dot = document.createElement("span");
          dot.className = "button-ripple__dot";
          ripple.appendChild(dot);
        }
        target.appendChild(ripple);
      }

      const triggerRipple = event => {
        const rect = target.getBoundingClientRect();
        const clientX = event?.clientX ?? rect.left + rect.width / 2;
        const clientY = event?.clientY ?? rect.top + rect.height / 2;
        const relativeX = ((clientX - rect.left) / rect.width) * 100;
        const relativeY = ((clientY - rect.top) / rect.height) * 100;
        ripple.style.setProperty("--ripple-x", `${relativeX}%`);
        ripple.style.setProperty("--ripple-y", `${relativeY}%`);
        ripple.classList.remove("is-active");
        // Force reflow so animation can restart
        void ripple.offsetWidth;
        ripple.classList.add("is-active");
      };

      target.addEventListener("pointerdown", triggerRipple);
      target.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          triggerRipple(event);
        }
      });
    });
  }

  const pingPongVideos = Array.from(document.querySelectorAll("video[data-pingpong]"));

  if (pingPongVideos.length) {
    pingPongVideos.forEach(video => {
      const speed = Number(video.dataset.pingpongSpeed) || 0.6;
      const holdDuration = Number(video.dataset.pingpongHold) || 0;
      const state = {
        direction: 1,
        rafId: null,
        prevTimestamp: null,
        holdTimeout: null
      };

      const cancelReverse = () => {
        if (state.rafId) {
          cancelAnimationFrame(state.rafId);
          state.rafId = null;
        }
        state.prevTimestamp = null;
      };

      const clearHold = () => {
        if (state.holdTimeout) {
          clearTimeout(state.holdTimeout);
          state.holdTimeout = null;
        }
      };

      const playForward = () => {
        cancelReverse();
        clearHold();
        state.direction = 1;
        video.playbackRate = speed;
        if (video.paused) {
          video.play().catch(() => {});
        }
      };

      const animateReverse = timestamp => {
        if (state.prevTimestamp == null) state.prevTimestamp = timestamp;
        const elapsed = (timestamp - state.prevTimestamp) / 1000;
        state.prevTimestamp = timestamp;
        const delta = elapsed * speed;
        const nextTime = Math.max(0, video.currentTime - delta);
        video.currentTime = nextTime;

        if (nextTime <= 0.02) {
          state.direction = 1;
          playForward();
          return;
        }

        state.rafId = requestAnimationFrame(animateReverse);
      };

      const playReverse = () => {
        video.pause();
        state.direction = -1;
        cancelReverse();
        clearHold();
        state.rafId = requestAnimationFrame(animateReverse);
      };

      video.addEventListener("loadeddata", () => {
        playForward();
      });

      video.addEventListener("ended", () => {
        video.pause();
        clearHold();
        state.holdTimeout = window.setTimeout(() => {
          playReverse();
        }, holdDuration);
      });

      video.addEventListener("play", () => {
        if (state.direction < 0) {
          video.pause();
        }
      });
    });
  }

  let isProgrammaticScroll = false;
  let releaseProgrammaticScroll = null;
  let programmaticScrollLockId = 0;
  let cacheNavSectionOffsets = () => {};

  const heroSections = Array.from(document.querySelectorAll(".hero"));

  if (heroSections.length) {
    const heroConfigs = heroSections
      .map(section => ({ section, bg: section.querySelector(".hero__bg") }))
      .filter(config => config.bg);

    if (heroConfigs.length) {
      const maxOffset = 140;
      let ticking = false;

      const updateParallax = () => {
        const viewportHeight = window.innerHeight || 1;
        const midpoint = viewportHeight * 0.5;

        heroConfigs.forEach(({ section, bg }) => {
          const rect = section.getBoundingClientRect();
          const progress = (midpoint - rect.top) / viewportHeight;
          const clamped = Math.max(Math.min(progress, 1), -1);
          const offset = clamped * maxOffset;
          bg.style.setProperty("--hero-parallax", offset.toFixed(2));
        });

        ticking = false;
      };

      const requestParallax = () => {
        if (ticking || isProgrammaticScroll) return;
        ticking = true;
        requestAnimationFrame(updateParallax);
      };

      heroConfigs.forEach(({ section, bg }) => {
        const updateFade = event => {
          const rect = section.getBoundingClientRect();
          const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
          const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
          bg.style.setProperty("--hero-fade-x", `${xPercent.toFixed(2)}%`);
          bg.style.setProperty("--hero-fade-y", `${yPercent.toFixed(2)}%`);
        };

        const resetFade = () => {
          bg.style.setProperty("--hero-fade-x", "50%");
          bg.style.setProperty("--hero-fade-y", "53%");
        };

        section.addEventListener("pointermove", updateFade);
        section.addEventListener("pointerleave", resetFade);
      });

      requestParallax();
      window.addEventListener("scroll", requestParallax, { passive: true });
      window.addEventListener("resize", requestParallax);
    }
  }

  const siteHeader = document.querySelector("[data-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const siteNav = document.querySelector("#site-nav");
  const navHighlight = document.querySelector(".site-nav__highlight");
  const navLinks = siteNav ? Array.from(siteNav.querySelectorAll("a")) : [];
  const navSections = navLinks
    .map(link => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return null;
      const sectionId = href.slice(1);
      const sectionEl = document.getElementById(sectionId);
      return sectionEl ? { link, section: sectionEl } : null;
    })
    .filter(Boolean);
  const shouldSlideHeader = () => window.matchMedia("(max-width: 1200px)").matches;

  const getSlideLimit = () => {
    const clampMin = 50;
    const clampMax = 140;
    if (siteHeader && siteNav) {
      const dividerOffset = siteNav.offsetTop || 0;
      if (dividerOffset > 0) {
        return Math.min(Math.max(dividerOffset, clampMin), clampMax);
      }
    }
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const fallbackPreferred = vw * 0.07;
    return Math.min(Math.max(fallbackPreferred, clampMin), clampMax);
  };

  const applyHeaderSlide = () => {
    if (!siteHeader) return;
    if (!shouldSlideHeader()) {
      siteHeader.style.setProperty("--header-slide", "0px");
      if (window.scrollY > 24) {
        siteHeader.classList.add("is-condensed");
      } else {
        siteHeader.classList.remove("is-condensed");
      }
      return;
    }
    siteHeader.classList.remove("is-condensed");
    const maxSlide = getSlideLimit();
    const slideAmount = Math.min(Math.max(window.scrollY, 0), maxSlide);
    siteHeader.style.setProperty("--header-slide", `${slideAmount}px`);
  };

  let headerSlideRaf = null;
  const requestHeaderSlideUpdate = () => {
    if (headerSlideRaf) return;
    headerSlideRaf = requestAnimationFrame(() => {
      applyHeaderSlide();
      headerSlideRaf = null;
    });
  };

  applyHeaderSlide();
  window.addEventListener("scroll", requestHeaderSlideUpdate, { passive: true });
  window.addEventListener("resize", requestHeaderSlideUpdate);

  if (siteHeader && navToggle && siteNav) {
    const toggleNav = () => {
      const isOpen = siteHeader.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    };

    const closeNav = () => {
      siteHeader.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    navToggle.addEventListener("click", toggleNav);
    siteNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeNav));

    window.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeNav();
      }
    });
  }

  if (siteNav && navHighlight && navLinks.length) {
    const NAV_HIGHLIGHT_GUTTER = 8;

    const moveNavHighlight = target => {
      if (!target) return;
      const navRect = siteNav.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const highlightWidth = targetRect.width + NAV_HIGHLIGHT_GUTTER * 2;
      navHighlight.style.width = `${highlightWidth}px`;
      navHighlight.style.height = `${targetRect.height}px`;
      navHighlight.style.transform = `translate(${targetRect.left - navRect.left - NAV_HIGHLIGHT_GUTTER}px, ${targetRect.top - navRect.top}px)`;
      navHighlight.classList.add("is-visible");
    };

    const setActiveNavLink = target => {
      navLinks.forEach(link => link.classList.toggle("is-active", link === target));
      moveNavHighlight(target);
    };

    const activeLink = navLinks.find(link => link.classList.contains("is-active")) || navLinks[0];
    if (activeLink) {
      moveNavHighlight(activeLink);
    }

    const beginProgrammaticScrollLock = () => {
      programmaticScrollLockId += 1;
      const lockId = programmaticScrollLockId;
      isProgrammaticScroll = true;
      releaseProgrammaticScroll = () => {
        if (programmaticScrollLockId !== lockId) return;
        isProgrammaticScroll = false;
        releaseProgrammaticScroll = null;
      };
    };

    const handleNavSelection = link => {
      beginProgrammaticScrollLock();
      setActiveNavLink(link);
    };

    navLinks.forEach(link => {
      link.addEventListener("click", () => handleNavSelection(link));
      link.addEventListener("keydown", event => {
        if (event.key === " ") {
          event.preventDefault();
          link.click();
        }
      });
    });

    const repositionActiveHighlight = () => {
      const currentActive = navLinks.find(link => link.classList.contains("is-active"));
      if (currentActive) {
        moveNavHighlight(currentActive);
      }
    };

    let cachedOffsets = [];

    cacheNavSectionOffsets = () => {
      cachedOffsets = navSections
        .map(({ link, section }) => ({ link, top: section.offsetTop }))
        .sort((a, b) => a.top - b.top);
    };

    cacheNavSectionOffsets();

    let scrollSpyRaf = null;

    const updateActiveSectionFromScroll = () => {
      if (isProgrammaticScroll || !cachedOffsets.length) return;
      const headerOffset = (siteHeader && siteHeader.offsetHeight) || 0;
      const scrollPosition = window.scrollY + headerOffset + 40;
      let currentLink = cachedOffsets[0].link;

      for (let i = 0; i < cachedOffsets.length; i += 1) {
        if (scrollPosition >= cachedOffsets[i].top) {
          currentLink = cachedOffsets[i].link;
        } else {
          break;
        }
      }

      if (currentLink && !currentLink.classList.contains("is-active")) {
        setActiveNavLink(currentLink);
      }
    };

    const handleScrollSpy = () => {
      if (scrollSpyRaf) return;
      scrollSpyRaf = requestAnimationFrame(() => {
        updateActiveSectionFromScroll();
        scrollSpyRaf = null;
      });
    };

    window.addEventListener("scroll", handleScrollSpy, { passive: true });

    window.addEventListener("resize", () => {
      repositionActiveHighlight();
      cacheNavSectionOffsets();
      updateActiveSectionFromScroll();
    });

    updateActiveSectionFromScroll();
  }

  let activeScrollId = 0;

  const easeInOutCubic = t =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const smoothScrollTo = (targetEl) => {
    activeScrollId += 1;
    const id = activeScrollId;
    isProgrammaticScroll = true;

    const headerOffset = (siteHeader && siteHeader.offsetHeight) || 0;
    const start = window.scrollY;
    const end = targetEl.getBoundingClientRect().top + start - headerOffset - 12;
    const distance = end - start;

    if (Math.abs(distance) < 4) {
      window.scrollTo(0, end);
      isProgrammaticScroll = false;
      cacheNavSectionOffsets();
      return;
    }

    const duration = 1100;
    const startTime = performance.now();

    const step = now => {
      if (id !== activeScrollId) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, start + distance * easeInOutCubic(progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isProgrammaticScroll = false;
        cacheNavSectionOffsets();
      }
    };

    requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const href = link.getAttribute("href");
      const id = href && href.startsWith("#") ? href.substring(1) : null;
      const el = id ? document.getElementById(id) : null;
      if (el) {
        event.preventDefault();
        smoothScrollTo(el);
      }
    });
  });

  const currentYearEl = document.querySelector("[data-current-year]");
  if (currentYearEl) {
    currentYearEl.textContent = String(new Date().getFullYear());
  }
});
