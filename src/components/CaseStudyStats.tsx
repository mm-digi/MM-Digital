"use client";

import { useEffect } from "react";

// The pink result figures count up once they scroll into view. Word results
// rise in instead. The page HTML cannot run its own script, so this watches
// the rendered circles.
const NUMBER = /^([\d,]+(?:\.\d+)?)([MK%])?(\+)?$/;

function format(value: number, decimals: number, grouped: boolean, unit: string, plus: string) {
  const shown = grouped
    ? Math.round(value).toLocaleString("en-GB")
    : decimals
      ? value.toFixed(decimals)
      : String(Math.round(value));
  return `${shown}${unit}${plus}`;
}

export default function CaseStudyStats() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nums = document.querySelectorAll<HTMLElement>('[class$="-num"], [class*="-num "]');
    if (!nums.length) return;

    const play = (el: HTMLElement) => {
      const original = (el.dataset.final || el.textContent || "").replace(/\s+/g, " ").trim();
      el.dataset.final = original;
      const match = original.match(NUMBER);
      if (!match || reduced) {
        el.classList.add("is-in");
        return;
      }
      const raw = match[1].replace(/,/g, "");
      const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
      const target = Number(raw);
      const grouped = match[1].includes(",");
      const unit = match[2] || "";
      const plus = match[3] || "";
      const start = performance.now();
      const duration = 1400;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = t < 1 ? format(target * eased, decimals, grouped, unit, plus) : original;
        if (t < 1) requestAnimationFrame(tick);
        else el.classList.add("is-landed");
      };
      el.textContent = format(0, decimals, grouped, unit, plus);
      el.classList.add("is-in");
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          play(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 },
    );

    nums.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
