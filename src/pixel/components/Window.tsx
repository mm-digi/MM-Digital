import type { ReactNode } from "react";

export function Window({
  title,
  onClose,
  children,
  id,
}: {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="wood" id={id} aria-label={title}>
      <header className="wood-bar">
        <h2>{title}</h2>
        {onClose ? (
          <button type="button" className="pxbtn alt tiny" onClick={onClose}>
            Close
          </button>
        ) : null}
      </header>
      <div className="wood-body">{children}</div>
    </section>
  );
}
