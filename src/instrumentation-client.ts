import { initBotId } from "botid/client/core";

// Server actions post to the page they run on. These are the pages whose actions call
// checkBotId(): the report email on /buy and /sell, and the contact form.
initBotId({
  protect: [
    { path: "/buy", method: "POST" },
    { path: "/sell", method: "POST" },
    { path: "/contact", method: "POST" },
  ],
});
