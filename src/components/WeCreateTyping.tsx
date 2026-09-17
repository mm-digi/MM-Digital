"use client";

import { useEffect, useState } from "react";

const phrases = [
  { text: "brands that stand out", color: "#ff808b" },
  { text: "websites that convert", color: "#f6bd60" },
  { text: "content that connects", color: "#84dcc6" },
  { text: "strategies that scale", color: "#a9def9" },
  { text: "campaigns that perform", color: "#e4c1f9" },
  { text: "growth that lasts", color: "#ff99c8" },
];

export default function WeCreateTyping() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visibleText, setVisibleText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const phrase = phrases[phraseIndex];

  useEffect(() => {
    const isComplete = visibleText === phrase.text;
    const isEmpty = visibleText.length === 0;
    const delay = isComplete && !deleting ? 1200 : deleting ? 45 : 75;

    const timer = window.setTimeout(() => {
      if (isComplete && !deleting) {
        setDeleting(true);
        return;
      }

      if (deleting && isEmpty) {
        setDeleting(false);
        setPhraseIndex((current) => (current + 1) % phrases.length);
        return;
      }

      setVisibleText((current) =>
        deleting
          ? phrase.text.slice(0, Math.max(0, current.length - 1))
          : phrase.text.slice(0, current.length + 1),
      );
    }, delay);

    return () => window.clearTimeout(timer);
  }, [deleting, phrase, visibleText]);

  return (
    <section className="we-create-section" aria-label="What MM Digital creates">
      <span className="we-create-accessible">
        We create brands that stand out, websites that convert, content that
        connects, strategies that scale, campaigns that perform, and growth that
        lasts.
      </span>
      <span className="we-create-line" aria-hidden="true">
        <span>We create</span>
        <span className="we-create-typed" style={{ color: phrase.color }}>
          {visibleText}
        </span>
      </span>
    </section>
  );
}
