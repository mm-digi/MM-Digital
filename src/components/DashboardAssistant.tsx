"use client";

import { useEffect, useRef, useState } from "react";
import type { Insight } from "@/lib/metrics/insights";

type Message = { from: "client" | "mm"; lines: string[] };

// Colours are set inline throughout so the WordPress stylesheets on dashboard
// pages can't override them.
const PINK = "#ff808b";

function Avatar() {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ background: PINK, color: "#fff" }}
    >
      MM
    </span>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="MM is typing">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-bounce rounded-full"
          style={{ background: "#9a9a9a", animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

export default function DashboardAssistant({ clientName, insights }: { clientName: string; insights: Insight[] }) {
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "mm",
      lines: [`Hi ${clientName} 👋`, "I can answer questions about your latest marketing results. What would you like to know?"],
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function ask(insight: Insight) {
    setAsked((current) => [...current, insight.id]);
    setMessages((current) => [...current, { from: "client", lines: [insight.question] }]);
    setTyping(true);
    timer.current = setTimeout(() => {
      setTyping(false);
      setMessages((current) => [...current, { from: "mm", lines: insight.answer }]);
    }, 900);
  }

  const remaining = insights.filter((insight) => !asked.includes(insight.id));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="dashboard-assistant"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-5 py-3 font-bold shadow-[0_12px_30px_rgba(0,0,0,0.45)] sm:bottom-6 sm:right-6"
        style={{ background: PINK, color: "#fff", border: "none" }}
      >
        <span aria-hidden="true">{open ? "×" : "💬"}</span>
        {open ? "Close" : "Ask MM"}
      </button>

      {open ? (
        <div
          id="dashboard-assistant"
          role="dialog"
          aria-label="Chat with MM about your results"
          className="fixed inset-x-4 bottom-20 z-50 flex h-[min(600px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[380px]"
          style={{ background: "#0d0d0d", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.12)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#161616", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <Avatar />
            <div className="leading-tight">
              <p className="text-sm font-bold" style={{ color: "#fff", margin: 0 }}>
                MM Assistant
              </p>
              <p className="flex items-center gap-1.5 text-xs" style={{ color: "#9a9a9a", margin: 0 }}>
                <span className="h-2 w-2 rounded-full" style={{ background: "#4ade80" }} />
                Online
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((message, index) =>
              message.from === "mm" ? (
                <div key={index} className="flex items-end gap-2">
                  <Avatar />
                  <div
                    className="max-w-[80%] space-y-2 rounded-2xl rounded-bl-md px-4 py-3 text-[0.92rem] leading-6"
                    style={{ background: "#1f1f1f", color: "#e6e6e6" }}
                  >
                    {message.lines.map((line, lineIndex) => (
                      <p key={lineIndex} style={{ color: "inherit", margin: 0 }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div key={index} className="flex justify-end">
                  <div
                    className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-3 text-[0.92rem] leading-6"
                    style={{ background: PINK, color: "#fff" }}
                  >
                    <p style={{ color: "inherit", margin: 0 }}>{message.lines[0]}</p>
                  </div>
                </div>
              )
            )}

            {typing ? (
              <div className="flex items-end gap-2">
                <Avatar />
                <div className="rounded-2xl rounded-bl-md px-4 py-3" style={{ background: "#1f1f1f" }}>
                  <TypingDots />
                </div>
              </div>
            ) : remaining.length ? (
              <div className="flex flex-col items-end gap-2 pt-1">
                {remaining.map((insight) => (
                  <button
                    key={insight.id}
                    type="button"
                    onClick={() => ask(insight)}
                    className="max-w-[85%] rounded-2xl px-3 py-2 text-right text-sm hover:opacity-80"
                    style={{ background: "transparent", color: PINK, border: `1px solid ${PINK}` }}
                  >
                    {insight.question}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <Avatar />
                <div className="rounded-2xl rounded-bl-md px-4 py-3 text-[0.92rem] leading-6" style={{ background: "#1f1f1f", color: "#e6e6e6" }}>
                  <p style={{ color: "inherit", margin: 0 }}>
                    That&rsquo;s everything for now. If you&rsquo;d like to talk it through,{" "}
                    <a href="tel:07880601123" className="underline" style={{ color: PINK }}>
                      give us a call
                    </a>
                    .
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-3" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <input
              type="text"
              disabled
              placeholder="Typing your own questions is coming soon"
              aria-label="Message"
              className="min-w-0 flex-1 rounded-full px-4 py-2.5 text-sm"
              style={{ background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.1)", cursor: "not-allowed" }}
            />
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(255, 128, 139, 0.35)", color: "#fff" }}
            >
              ➤
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
