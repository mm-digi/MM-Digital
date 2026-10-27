"use client";

export default function PixelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="plain-app">
      <h1>The office could not open</h1>
      <p>{error.message || "Try again in a moment."}</p>
      <button type="button" className="pxbtn" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
