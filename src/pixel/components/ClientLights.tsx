import { CLIENT_LIGHT_LABEL, clientsByHealth } from "@/lib/client-health";

export function ClientLights() {
  const clients = clientsByHealth();
  return (
    <aside className="lights wood" aria-label="Client health">
      <header className="wood-bar">
        <h2>Clients</h2>
      </header>
      <div className="wood-body">
        <ul className="light-list">
          {clients.map((client) => (
            <li key={client.slug}>
              <a href={`/${client.slug}/`}>
                <i className={`lamp ${client.light}`} aria-hidden="true" />
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
