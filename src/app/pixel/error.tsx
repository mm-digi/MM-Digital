"use client";

export default function PixelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const raw = error.message || "";
  const message = /minified react error/i.test(raw) ? "The office was busy for a moment. Try again." : raw || "Try again in a moment.";
  return (
    <main className="plain-app">
      <h1>The office could not open</h1>
      <p>{message}</p>
      <button type="button" className="pxbtn" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
