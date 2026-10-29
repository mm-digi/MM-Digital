"use client";

import { CLIENT_LIGHT_LABEL } from "@/lib/client-health";
import type { ActionBody, ActionResult, ClientLight, Snapshot } from "@/pixel/types";

const NEXT: Record<ClientLight, ClientLight> = { red: "amber", amber: "green", green: "red" };

export function ClientLights({
  snap,
  busy,
  act,
  onOpen,
}: {
  snap: Snapshot;
  busy: boolean;
  act: (body: ActionBody) => Promise<ActionResult | void>;
  onOpen: (slug: string, name: string) => void;
}) {
  return (
    <aside className="lights wood" aria-label="Client health">
      <header className="wood-bar">
        <h2>Clients</h2>
      </header>
      <div className="wood-body">
        <div className="form-block">
          <p className="fine">Each client against their own last month.</p>
          {snap.form.best ? (
            <p className="form-line">
              <span className="fine">Best this month</span>
              <button type="button" className="client-name" onClick={() => onOpen(snap.form.best!.slug, snap.form.best!.name)}>{snap.form.best.name}</button>
              <span className="fine">{snap.form.best.label}</span>
            </p>
          ) : (
            <p className="fine">Not enough of last month to compare yet.</p>
          )}
          {snap.form.worst ? (
            <p className="form-line">
              <span className="fine">Worst this month</span>
              <button type="button" className="client-name" onClick={() => onOpen(snap.form.worst!.slug, snap.form.worst!.name)}>{snap.form.worst.name}</button>
              <span className="fine">{snap.form.worst.label}</span>
            </p>
          ) : null}
        </div>
        <p className="fine">{snap.canEditLights ? "Click a light to change it, or a name for a quick look." : "Click a name for a quick look."}</p>
        <ul className="light-list">
          {snap.clients.map((client) => (
            <li key={client.slug}>
              {snap.canEditLights ? (
                <button
                  type="button"
                  className="lamp-btn"
                  disabled={busy}
                  aria-label={`Change ${client.name}`}
                  onClick={() => void act({ type: "clientLight", slug: client.slug, light: NEXT[client.light] })}
                >
                  <i className={`lamp ${client.light}`} aria-hidden="true" />
                </button>
              ) : (
                <i className={`lamp ${client.light}`} aria-hidden="true" />
              )}
              <button type="button" className="client-name" onClick={() => onOpen(client.slug, client.name)}>
                <span>{client.name}</span>
                <span className="sr-only">{CLIENT_LIGHT_LABEL[client.light]}. Quick look.</span>
              </button>
              <a className="client-open" href={`/${client.slug}/`} aria-label={`Open ${client.name}'s dashboard`} title="Open the full dashboard">
                ↗
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
