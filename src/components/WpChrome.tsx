"use client";

import { useEffect } from "react";

export default function WpChrome({
  headerHtml,
  footerHtml,
  children,
}: {
  headerHtml: string;
  footerHtml: string;
  children: React.ReactNode;
}) {
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
    document.querySelectorAll(".ti-reviews-container").forEach((slider) => {
      const track = slider.querySelector(".ti-reviews-container-wrapper") as HTMLElement | null;
      const cards = [...slider.querySelectorAll(".ti-review-item")] as HTMLElement[];
      if (!track || cards.length < 2) return;

      slider.querySelector(".ti-controls")?.setAttribute("hidden", "true");

      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "mm-ti-arrow mm-ti-prev";
      prevBtn.setAttribute("aria-label", "Previous reviews");
      prevBtn.textContent = "←";
      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "mm-ti-arrow mm-ti-next";
      nextBtn.setAttribute("aria-label", "Next reviews");
      nextBtn.textContent = "→";
      slider.append(prevBtn, nextBtn);

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
        if (index < 0) index = 0;
        track.style.transform = `translateX(-${index * (100 / view)}%)`;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index >= maxIndex;
      };
      const onPrev = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        index -= 1;
        update();
      };
      const onNext = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        index += 1;
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
        prevBtn.remove();
        nextBtn.remove();
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
        if (window.innerWidth <= 768) return 1;
        if (slider.classList.contains("mm-reviews-slider")) {
          return window.innerWidth <= 1100 ? 1 : 2;
        }
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
