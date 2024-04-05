"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const bolt_1 = require("@slack/bolt");
(0, dotenv_1.config)();
const app = new bolt_1.App({
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
});
app.event("app_home_opened", async ({ event, client, context }) => {
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({
      /* the user that opened your app's app home */
      user_id: event.user,
      /* the view object that appears in the app home*/
      view: {
        type: "home",
        callback_id: "home_view",
        /* body of the view */
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Welcome to your _App's Home tab_* :tada:",
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "This button won't do much for now but you can set up a listener for it using the `actions()` method and passing its unique `action_id`. See an example in the `examples` folder within your Bolt app.",
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Click me!",
                },
              },
            ],
          },
        ],
      },
    });
  } catch (error) {
    console.error(error);
  }
});
app.event("app_mention", async ({ event, say }) => {
  // say() sends a message to the channel where the event was triggered
  await say(`What's up <@${event.user}>!`);
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
