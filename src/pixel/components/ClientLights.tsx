"use client";

import { CLIENT_LIGHT_LABEL } from "@/lib/client-health";
import type { ActionBody, ActionResult, ClientLight, Snapshot } from "@/pixel/types";

const NEXT: Record<ClientLight, ClientLight> = { red: "amber", amber: "green", green: "red" };

export function ClientLights({
  snap,
  busy,
  act,
}: {
  snap: Snapshot;
  busy: boolean;
  act: (body: ActionBody) => Promise<ActionResult | void>;
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
              <a href={`/${snap.form.best.slug}/`}>{snap.form.best.name}</a>
              <span className="fine">{snap.form.best.label}</span>
            </p>
          ) : (
            <p className="fine">Not enough of last month to compare yet.</p>
          )}
          {snap.form.worst ? (
            <p className="form-line">
              <span className="fine">Worst this month</span>
              <a href={`/${snap.form.worst.slug}/`}>{snap.form.worst.name}</a>
              <span className="fine">{snap.form.worst.label}</span>
            </p>
          ) : null}
        </div>
        {snap.canEditLights ? <p className="fine">Click a light to change it.</p> : null}
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
              <a href={`/${client.slug}/`}>
                <span>{client.name}</span>
                <span className="sr-only">{CLIENT_LIGHT_LABEL[client.light]}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
