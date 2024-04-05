import { config } from "dotenv";
import { App } from "@slack/bolt";

config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.command("/hello", async ({ command, ack, say }) => {
  await ack();
  await say(`Hello, <@${command.user_id}>`);
});

(async () => {
  // Start the app
  const PORT = process.env.PORT || 3000;
  await app.start(PORT);
  console.log(`⚡ Bot app is running on http://localhost:${PORT}`);
})();
