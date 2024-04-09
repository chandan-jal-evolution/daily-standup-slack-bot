import type { App } from "@slack/bolt";

export default function hello(app: App) {
  app.command("/hello", async ({ command, ack, say }) => {
    await ack();
    await say(`Hello, <@${command.user_id}>`);
  });
}
