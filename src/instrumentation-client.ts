import { initBotId } from "botid/client/core";

// Vercel BotID: an invisible check that the site's forms were sent by a person
// in a browser. The routes listed here call checkBotId() before sending email.
initBotId({
  protect: [
    { path: "/api/contact", method: "POST" },
    { path: "/api/newsletter", method: "POST" },
  ],
});
