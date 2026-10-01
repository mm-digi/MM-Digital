"use client";

import { useEffect } from "react";

// The case-study cards count up and, on a phone, play their hover move once
// they are actually on screen. A class does that. Scripts inside the page
// HTML never run, so the observer lives here.
export default function WorkMotion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll(".mmw-frame video").forEach((node) => {
      const video = node as HTMLVideoElement;
      video.muted = true;
      if (reduced) video.pause();
      else video.play().catch(() => {});
    });

    const cards = document.querySelectorAll(".mmw-card");
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return null;
}
