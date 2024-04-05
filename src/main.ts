import { config } from "dotenv";
import { App } from "@slack/bolt";
import cron from "node-cron";

config();

const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
});

// Define your daily standup message
const standupMessage =
  "Please answer the following questions in your standup:\n1. What did you accomplish yesterday?\n2. What will you do today?\n3. Any blockers?";

// Function to send standup message to each member
async function sendStandupMessage(channelId: string, userId: string) {
  try {
    const user = await app.client.users.info({
      token: process.env.SLACK_BOT_TOKEN,
      user: userId,
    });

    await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: channelId,
      user: userId,
      text: `Hey there *${user.user?.real_name}* 👋,\n\n${standupMessage}`,
    });
  } catch (error) {
    console.error("Error sending standup message:", error);
  }
}

// Function to collect responses and send them to a particular channel
async function collectStandupResponses(
  channelId: string,
  userId: string,
  responses: string[]
) {
  try {
    const user = await app.client.users.info({
      token: process.env.SLACK_BOT_TOKEN,
      user: userId,
    });

    await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: channelId,
      text: `Standup report from ${user.user?.name} (${
        user.user?.name
      }): \n${responses.join("\n")}`,
    });
  } catch (error) {
    console.error("Error sending standup report:", error);
  }
}

// Listen to message
app.message(async ({ message, say }) => {
  console.log(message);
  // Check if the message is from the bot itself to avoid infinite loops
  if (message.subtype && message.subtype === "me_message") {
    return;
  }

  console.log(message);
  // React to the message
  await say(`You said: ${message}`);
});

// Schedule the bot to run daily at 9:00 AM
cron.schedule("*/10 * * * * *", async () => {
  // Your bot logic here
  console.log("Running the bot...");
  sendStandupMessage(
    process.env.SLACK_BOT_CHANNEL_ID!,
    process.env.SLACK_BOT_MEMBER_ID!
  );
  // For example, send standup messages to each member
  // and collect responses to send to a particular channel
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
