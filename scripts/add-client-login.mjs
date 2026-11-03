// Adds a client dashboard login to src/lib/users.ts.
//
//   node scripts/add-client-login.mjs <username> <dashboard-slug>
//
// Makes a random password, prints it once for you to send to the client, and
// saves only its bcrypt hash, so the password itself is never stored. Run it
// again for the same username to replace a forgotten password.

import { randomInt } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import bcrypt from "bcryptjs";

const [username, slug] = process.argv.slice(2);
if (!username || !slug) {
  console.error("Usage: node scripts/add-client-login.mjs <username> <dashboard-slug>");
  process.exit(1);
}

const clients = readFileSync("src/lib/clients.ts", "utf8");
if (!clients.includes(`slug: "${slug}"`)) {
  console.error(`No dashboard with slug "${slug}" in src/lib/clients.ts.`);
  process.exit(1);
}

// No look-alike characters (0/O, 1/l/I), so it's easy to read out or type.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const password = Array.from({ length: 16 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const hash = bcrypt.hashSync(password, 12);
const line = `  { username: "${username}", slug: "${slug}", passwordHash: "${hash}" },`;

const file = "src/lib/users.ts";
const lines = readFileSync(file, "utf8").split("\n");
const existing = lines.findIndex((l) => l.includes(`username: "${username}"`));
if (existing >= 0) {
  lines[existing] = line;
} else {
  // Client logins go before the staff logins.
  const staff = lines.findIndex((l) => l.includes('role: "staff"'));
  lines.splice(staff >= 0 ? staff : lines.indexOf("];"), 0, line);
}
writeFileSync(file, lines.join("\n"));

console.log(`${existing >= 0 ? "Replaced" : "Added"} login for ${slug}`);
console.log(`  Username: ${username}`);
console.log(`  Password: ${password}`);
console.log("Send these to the client now: the password isn't saved anywhere.");
