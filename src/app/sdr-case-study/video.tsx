"use client";

import { useEffect } from "react";

export default function CaseStudyVideo() {
  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>("video.sdr-scroll");
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      video.pause();
      video.controls = true;
      return;
    }
    video.muted = true;
    const play = () => {
      video.play().catch(() => {});
    };
    if (video.readyState >= 2) play();
    else video.addEventListener("canplay", play, { once: true });
  }, []);
  return null;
}
