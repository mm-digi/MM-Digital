"use client";

import { useEffect, useLayoutEffect } from "react";

export default function WpChrome({
  headerHtml,
  footerHtml,
  children,
}: {
  headerHtml: string;
  footerHtml: string;
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    const header = document.querySelector("header.wp-block-template-part");
    if (!header || !document.querySelector(".mm-hero")) return;
    const apply = () => {
      document.documentElement.style.setProperty(
        "--mm-header-h",
        `${header.getBoundingClientRect().height}px`
      );
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--mm-header-h");
    };
  }, []);

  useEffect(() => {
    const opens = [...document.querySelectorAll(".wp-block-navigation__responsive-container-open")];
    const closes = [...document.querySelectorAll(".wp-block-navigation__responsive-container-close")];
    const containers = [...document.querySelectorAll(".wp-block-navigation__responsive-container")];

    const openMenu = (e: Event) => {
      e.preventDefault();
      containers.forEach((c) => c.classList.add("is-menu-open", "has-modal-open"));
      document.documentElement.classList.add("has-modal-open");
    };
    const closeMenu = (e: Event) => {
      e.preventDefault();
      containers.forEach((c) => c.classList.remove("is-menu-open", "has-modal-open"));
      document.documentElement.classList.remove("has-modal-open");
    };

    opens.forEach((el) => el.addEventListener("click", openMenu));
    closes.forEach((el) => el.addEventListener("click", closeMenu));

    const forms = [
      ...document.querySelectorAll(
        "form.kb-advanced-form, form.wpcf7-form, form.uagb-forms-main-form, form.mm-newsletter-form"
      ),
    ];
    const onSubmit = async (e: Event) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const data = Object.fromEntries(new FormData(form).entries());
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert(
        res.ok
          ? "The form has been submitted successfully!"
          : "There has been some error while submitting the form."
      );
      if (res.ok) form.reset();
    };
    forms.forEach((form) => form.addEventListener("submit", onSubmit));

    const particleOpts = {
      fullScreen: false,
      background: { color: "transparent" },
      fpsLimit: 60,
      particles: {
        number: { value: 70, density: { enable: true, area: 800 } },
        color: { value: "#ffffff" },
        links: { enable: true, distance: 140, color: "#ffffff", opacity: 0.18, width: 1 },
        move: { enable: true, speed: 1.2, outModes: { default: "out" } },
        opacity: { value: 0.7 },
        size: { value: { min: 1, max: 3 } },
      },
      interactivity: {
        events: { onHover: { enable: true, mode: "grab" }, resize: true },
        modes: { grab: { distance: 180, links: { opacity: 0.5 } } },
      },
      detectRetina: true,
    };
    const startParticles = () => {
      const ts = (window as Window & { tsParticles?: { load: (id: string, opts: object) => void } }).tsParticles;
      const el = document.getElementById("particles-bg");
      if (!ts || !el) return false;
      ts.load("particles-bg", particleOpts);
      return true;
    };
    let particleTimer: number | undefined;
    if (!startParticles()) {
      particleTimer = window.setInterval(() => {
        if (startParticles() && particleTimer) window.clearInterval(particleTimer);
      }, 200);
      window.setTimeout(() => particleTimer && window.clearInterval(particleTimer), 6000);
    }

    const values = [...document.querySelectorAll(".mm-values-item")];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("mm-visible");
        });
      },
      { threshold: 0.2 }
    );
    values.forEach((el) => io.observe(el));

    const typed = document.querySelector(".mm-typed") as HTMLElement | null;
    let typedTimer: number | undefined;
    if (typed) {
      const text = typed.dataset.text || typed.textContent || "";
      typed.textContent = "";
      let i = 0;
      const tick = () => {
        typed.textContent = text.slice(0, i);
        i += 1;
        if (i <= text.length) typedTimer = window.setTimeout(tick, 42);
        else typedTimer = window.setTimeout(() => {
          i = 0;
          typed.textContent = "";
          tick();
        }, 1800);
      };
      tick();
    }

    const faqItems = [...document.querySelectorAll(".uagb-faq-item")];
    const onFaq = (e: Event) => {
      const item = (e.currentTarget as HTMLElement).closest(".uagb-faq-item");
      if (!item) return;
      const group = item.closest(".uagb-faq") || item.parentElement;
      group?.querySelectorAll(".uagb-faq-item").forEach((other) => {
        if (other !== item) other.classList.remove("uagb-faq-item-active");
      });
      item.classList.toggle("uagb-faq-item-active");
    };
    faqItems.forEach((item) => item.addEventListener("click", onFaq));

    const sliders: Array<() => void> = [];
    document.querySelectorAll(".mm-google-slider").forEach((slider) => {
      const track = slider.querySelector(".mm-google-track") as HTMLElement | null;
      const cards = [...slider.querySelectorAll(".mm-google-card")] as HTMLElement[];
      const prevBtn = slider.querySelector(".mm-google-prev") as HTMLButtonElement | null;
      const nextBtn = slider.querySelector(".mm-google-next") as HTMLButtonElement | null;
      const viewport = slider.querySelector(".mm-google-viewport") as HTMLElement | null;
      if (!track || !cards.length || !prevBtn || !nextBtn || !viewport) return;
      let index = 0;
      const perView = () => {
        if (window.innerWidth <= 640) return 1;
        if (window.innerWidth <= 1100) return 2;
        return 4;
      };
      const update = () => {
        const view = perView();
        const maxIndex = Math.max(0, cards.length - view);
        if (index > maxIndex) index = maxIndex;
        const gap = 16;
        const width = (viewport.clientWidth - gap * (view - 1)) / view;
        cards.forEach((card) => {
          card.style.flex = `0 0 ${width}px`;
          card.style.width = `${width}px`;
        });
        track.style.transform = `translateX(-${index * (width + gap)}px)`;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index >= maxIndex;
      };
      prevBtn.addEventListener("click", () => {
        index -= 1;
        update();
      });
      nextBtn.addEventListener("click", () => {
        index += 1;
        update();
      });
      window.addEventListener("resize", update);
      update();
      sliders.push(() => window.removeEventListener("resize", update));
    });
    // Testimonials: one quote at a time, moving on every 7 seconds (a pink
    // bar shows the time left). Hovering or focusing pauses it, and the
    // arrows step backwards and forwards.
    document.querySelectorAll(".mm-quotes").forEach((section) => {
      const quotes = [...section.querySelectorAll(".mm-quote")] as HTMLElement[];
      const count = section.querySelector(".mm-quote-count b");
      const bar = section.querySelector(".mm-quote-progress i") as HTMLElement | null;
      const prevBtn = section.querySelector(".mm-quote-prev");
      const nextBtn = section.querySelector(".mm-quote-next");
      if (!quotes.length || !bar) return;
      const DURATION = 7000;
      let index = 0;
      let timer = 0;
      let startedAt = 0;
      let remaining = DURATION;
      let paused = false;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const restartBar = () => {
        bar.classList.remove("is-running");
        void bar.offsetWidth; // restart the CSS animation
        if (!reduceMotion) bar.classList.add("is-running");
      };
      const schedule = (ms: number) => {
        window.clearTimeout(timer);
        if (reduceMotion) return;
        startedAt = performance.now();
        remaining = ms;
        timer = window.setTimeout(() => show(index + 1), ms);
      };
      const show = (i: number) => {
        index = (i + quotes.length) % quotes.length;
        quotes.forEach((q, n) => {
          q.classList.toggle("is-active", n === index);
          q.setAttribute("aria-hidden", n === index ? "false" : "true");
        });
        if (count) count.textContent = String(index + 1).padStart(2, "0");
        restartBar();
        if (paused) {
          remaining = DURATION;
        } else {
          schedule(DURATION);
        }
      };
      const pause = () => {
        if (paused) return;
        paused = true;
        section.classList.add("is-paused");
        window.clearTimeout(timer);
        remaining = Math.max(0, remaining - (performance.now() - startedAt));
      };
      const resume = () => {
        if (!paused) return;
        paused = false;
        section.classList.remove("is-paused");
        schedule(remaining);
      };
      const onPrev = () => show(index - 1);
      const onNext = () => show(index + 1);
      const stage = section.querySelector(".mm-quotes-stage") as HTMLElement | null;

      prevBtn?.addEventListener("click", onPrev);
      nextBtn?.addEventListener("click", onNext);
      stage?.addEventListener("pointerenter", pause);
      stage?.addEventListener("pointerleave", resume);
      stage?.addEventListener("focusin", pause);
      stage?.addEventListener("focusout", resume);
      show(0);
      sliders.push(() => {
        window.clearTimeout(timer);
        prevBtn?.removeEventListener("click", onPrev);
        nextBtn?.removeEventListener("click", onNext);
        stage?.removeEventListener("pointerenter", pause);
        stage?.removeEventListener("pointerleave", resume);
        stage?.removeEventListener("focusin", pause);
        stage?.removeEventListener("focusout", resume);
      });
    });
    // "What We Do" row: a native sideways scroller (swipe/trackpad) that can
    // also be grabbed and dragged with a mouse. On release it glides to the
    // nearest card, carrying on in the direction of a quick flick.
    document.querySelectorAll(".mm-wwd-track").forEach((el) => {
      const track = el as HTMLElement;
      let startX = 0;
      let startScroll = 0;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
      let pointerId: number | null = null;
      let dragged = false;

      const onDown = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        // Stops the browser's own link/image drag and text selection, which
        // would otherwise hijack a drag that starts on a picture or text (and
        // show a white ghost box). Clicks still fire as normal.
        e.preventDefault();
        pointerId = e.pointerId;
        startX = lastX = e.clientX;
        lastTime = performance.now();
        startScroll = track.scrollLeft;
        velocity = 0;
        dragged = false;
      };
      const onMove = (e: PointerEvent) => {
        if (pointerId !== e.pointerId) return;
        const dx = e.clientX - startX;
        if (!dragged && Math.abs(dx) > 5) {
          dragged = true;
          track.classList.add("is-dragging");
          // Keeps the drag going if the mouse leaves the row; harmless to skip
          // if the browser has already released the pointer.
          try {
            track.setPointerCapture(e.pointerId);
          } catch {}
        }
        if (!dragged) return;
        const now = performance.now();
        velocity = (e.clientX - lastX) / Math.max(1, now - lastTime);
        lastX = e.clientX;
        lastTime = now;
        track.scrollLeft = startScroll - dx;
      };
      const onUp = (e: PointerEvent) => {
        if (pointerId !== e.pointerId) return;
        pointerId = null;
        if (!dragged) return;
        // Each card's resting position is its distance from the first card,
        // since the first card rests at scrollLeft 0.
        const items = [...track.querySelectorAll(".mm-wwd-item")] as HTMLElement[];
        const first = items[0]?.offsetLeft || 0;
        const max = track.scrollWidth - track.clientWidth;
        const target = track.scrollLeft - velocity * 250;
        let best = track.scrollLeft;
        let bestDist = Infinity;
        for (const item of items) {
          const pos = Math.min(max, item.offsetLeft - first);
          const dist = Math.abs(pos - target);
          if (dist < bestDist) {
            bestDist = dist;
            best = pos;
          }
        }
        // Keep snapping off until the glide finishes, or CSS snapping would
        // cut it short and leave the row between two cards.
        track.scrollTo({ left: best, behavior: "smooth" });
        // Turn snapping back on when the glide ends, with a timeout as a
        // safety net in case it's interrupted and no scrollend arrives.
        const settle = () => track.classList.remove("is-dragging");
        track.addEventListener("scrollend", settle, { once: true });
        setTimeout(settle, 900);
      };
      // A drag shouldn't count as a click on the service it ended over.
      const onClick = (e: MouseEvent) => {
        if (!dragged) return;
        e.preventDefault();
        e.stopPropagation();
        dragged = false;
      };

      const onDragStart = (e: DragEvent) => e.preventDefault();

      track.addEventListener("pointerdown", onDown);
      track.addEventListener("pointermove", onMove);
      track.addEventListener("pointerup", onUp);
      track.addEventListener("pointercancel", onUp);
      track.addEventListener("click", onClick, true);
      track.addEventListener("dragstart", onDragStart);
      sliders.push(() => {
        track.removeEventListener("pointerdown", onDown);
        track.removeEventListener("pointermove", onMove);
        track.removeEventListener("pointerup", onUp);
        track.removeEventListener("pointercancel", onUp);
        track.removeEventListener("click", onClick, true);
        track.removeEventListener("dragstart", onDragStart);
      });
    });
    document.querySelectorAll(".mm-services-slider, .mm-reviews-slider").forEach((slider) => {
      const track = slider.querySelector(".mm-services-track, .mm-reviews-track") as HTMLElement | null;
      const cards = [...slider.querySelectorAll(".mm-service-card, .mm-review-card")] as HTMLElement[];
      const prevBtn = slider.querySelector(".mm-services-prev, .mm-reviews-prev") as HTMLButtonElement | null;
      const nextBtn = slider.querySelector(".mm-services-next, .mm-reviews-next") as HTMLButtonElement | null;
      if (!track || !cards.length || !prevBtn || !nextBtn) return;
      let index = 0;
      const perView = () => {
        if (slider.classList.contains("mm-reviews-slider")) return 1;
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
      };
      const gap = () => {
        const styles = window.getComputedStyle(track);
        return parseFloat(styles.columnGap || styles.gap || "20");
      };
      const update = () => {
        const view = perView();
        const maxIndex = Math.max(0, cards.length - view);
        if (index > maxIndex) index = maxIndex;
        const width = cards[0].getBoundingClientRect().width;
        track.style.transform = `translateX(-${index * (width + gap())}px)`;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index >= maxIndex;
      };
      const onPrev = () => {
        index = Math.max(0, index - 1);
        update();
      };
      const onNext = () => {
        index = Math.min(Math.max(0, cards.length - perView()), index + 1);
        update();
      };
      prevBtn.addEventListener("click", onPrev);
      nextBtn.addEventListener("click", onNext);
      window.addEventListener("resize", update);
      update();
      sliders.push(() => {
        prevBtn.removeEventListener("click", onPrev);
        nextBtn.removeEventListener("click", onNext);
        window.removeEventListener("resize", update);
      });
    });

    return () => {
      opens.forEach((el) => el.removeEventListener("click", openMenu));
      closes.forEach((el) => el.removeEventListener("click", closeMenu));
      forms.forEach((form) => form.removeEventListener("submit", onSubmit));
      faqItems.forEach((item) => item.removeEventListener("click", onFaq));
      values.forEach((el) => io.unobserve(el));
      if (typedTimer) window.clearTimeout(typedTimer);
      if (particleTimer) window.clearInterval(particleTimer);
      sliders.forEach((off) => off());
    };
  }, []);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />
      {children}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </>
  );
}
