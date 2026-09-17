import fs from "node:fs";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !secretKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY for this one-off import.");
}

const usersSource = fs.readFileSync(new URL("../src/lib/users.ts", import.meta.url), "utf8");
const dashboardsSource = fs.readFileSync(new URL("../src/lib/clients.ts", import.meta.url), "utf8");
const users = [...usersSource.matchAll(/username:\s*"([^"]+)"[\s\S]*?slug:\s*"([^"]+)"[\s\S]*?passwordHash:\s*"([^"]+)"/g)]
  .map(([, username, slug, passwordHash]) => ({ username, slug, passwordHash }));
const dashboards = [...dashboardsSource.matchAll(/slug:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?embedUrl:\s*\n?\s*"([^"]+)"/g)]
  .map(([, slug, name, embedUrl]) => ({ slug, name, embedUrl }));

const supabase = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
const aliasFor = (username) => `${username.toLowerCase()}@clients.mm-digi.co.uk`;

async function findOrCreateUser(user) {
  const email = aliasFor(user.username);
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const existing = data.users.find((candidate) => candidate.email === email);
    if (existing) return existing;
    if (data.users.length < 1000) break;
    page += 1;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password_hash: user.passwordHash,
    email_confirm: true,
    user_metadata: { legacy_username: user.username, client_slug: user.slug },
  });
  if (error) throw error;
  return data.user;
}

for (const user of users) {
  const dashboard = dashboards.find((item) => item.slug === user.slug);
  if (!dashboard) {
    console.warn(`Skipping ${user.username}: no dashboard configuration found.`);
    continue;
  }
  const authUser = await findOrCreateUser(user);
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .upsert({ name: dashboard.name, slug: dashboard.slug }, { onConflict: "slug" })
    .select("id")
    .single();
  if (clientError) throw clientError;

  const { data: existingDashboard, error: dashboardLookupError } = await supabase
    .from("client_dashboards")
    .select("id")
    .eq("client_id", client.id)
    .eq("name", dashboard.name)
    .maybeSingle();
  if (dashboardLookupError) throw dashboardLookupError;
  if (!existingDashboard) {
    const { error } = await supabase.from("client_dashboards").insert({
      client_id: client.id,
      name: dashboard.name,
      embed_url: dashboard.embedUrl,
    });
    if (error) throw error;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: authUser.id,
    display_name: dashboard.name,
  });
  if (profileError) throw profileError;
  const { error: accessError } = await supabase.from("client_dashboard_access").upsert({
    user_id: authUser.id,
    client_id: client.id,
  });
  if (accessError) throw accessError;
  console.log(`Imported ${user.username} -> ${aliasFor(user.username)}`);
}

console.log(`Completed ${users.length} client imports. No emails were sent.`);
