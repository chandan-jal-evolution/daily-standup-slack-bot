import { config } from "dotenv";
import { App } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import cron from "node-cron";
import mongoose from "mongoose";
import Reports from "./models/reports";
import registerCommands from "./commands";
import { standupReminderBlocks, standupResponseBlocks } from "./blocks";

config();

const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // socketMode: true,
});

const web = new WebClient(process.env.SLACK_BOT_TOKEN);

// Connect to the db
mongoose.connect(process.env.DATABASE_URI!).then(() => {
  console.log("Connected to the db");
});

// Function to get all channels that bot have joined
async function getBotJoinedChannels() {
  try {
    // Call the conversations.list method with types parameter set to "public_channel,private_channel" to retrieve both public and private channels
    const result = await web.conversations.list({
      types: "public_channel,private_channel",
    });

    // Return the array of channel objects
    if (!result.channels) return [];
    return result.channels.filter((channel) => channel.is_member);
  } catch (error) {
    console.error("Error fetching joined channels:", error);
    return [];
  }
}

// Function to get all channels by user
async function getChannelsByUser(userId: string) {
  try {
    // fetch all the channels where the bot has joined and user joined
    const allJoinedChannels = await web.users.conversations({
      token: process.env.SLACK_BOT_TOKEN,
      user: userId,
      types: "public_channel,private_channel",
    });

    if (!allJoinedChannels.channels) return [];
    return allJoinedChannels.channels;
  } catch (error) {
    console.error("Error fetching joined channels:", error);
    return [];
  }
}

// Function to fetch information about all members in a channel
async function getChannelMembers(channelId: string) {
  try {
    // Call the conversations.members method to retrieve information about all members in the channel
    const result = await web.conversations.members({
      channel: channelId,
    });
    // Return the array of member IDs
    if (!result.members) return [];
    return result.members.filter(
      (member) => member !== process.env.SLACK_BOT_MEMBER_ID
    );
  } catch (error) {
    console.error("Error fetching channel members:", error);
    process.exit(1);
  }
}

// Function to get information about a specific member
async function getMemberInfo(memberId: string) {
  try {
    // Call the users.info method
    const result = await web.users.info({
      user: memberId,
    });
    return result.user; // Return user information
  } catch (error) {
    console.error("Error fetching member information:", error);
    return null;
  }
}

// Function to send standup message to each member
async function sendStandupMessage() {
  try {
    // 1. Get channels from the bot member id
    // 2. Get members of all these channels
    // 3. Find each members and there dynamic channel id
    const channels = await getBotJoinedChannels();

    const fetchAllMemberPromise = channels.map((c) => getChannelMembers(c.id!));
    const nestedMembers = await Promise.all(fetchAllMemberPromise);
    const members = Array.from(new Set(nestedMembers.flat()));

    for (const member of members) {
      const user = await getMemberInfo(member);

      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: member,
        blocks: standupReminderBlocks(user?.real_name || user?.name || member),
        text: `Hi ${user?.real_name || user?.name || member} :wave:`,
      });
    }
  } catch (error) {
    console.error("Error sending standup message:", error);
  }
}

// Function to collect the response from the user
async function collectStandupResponse(
  channelId: string,
  userId: string,
  text: string
) {
  try {
    const user = await app.client.users.info({
      token: process.env.SLACK_BOT_TOKEN,
      user: userId,
    });

    await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: channelId,
      as_user: true,
      icon_url: user.user?.profile?.image_original,
      username: user.user?.real_name || user.user?.name || "",
      blocks: standupResponseBlocks(
        user.user?.real_name || "",
        user.user?.id || "",
        text
      ),
    });
  } catch (error) {
    console.error("Error sending standup report:", error);
  }
}

// Listen to message
app.message(async ({ event, message, say }) => {
  try {
    // Check if it is from the bot channel
    console.log("message = ", message);
    console.log("event = ", event);

    if (message.subtype === undefined || message.subtype === "bot_message") {
      // Save the message
      const report = new Reports({ ...message });
      report.save();

      const userChannels = await getChannelsByUser(message.user!);
      const botChannels = await getBotJoinedChannels();

      const botList = botChannels.map((b) => b.id!);
      const userList = userChannels.map((u) => u.id!);
      const commonList = botList
        .filter((b) => userList.includes(b))
        .filter((c) => c !== undefined);

      // Send it to the channel
      for (const channelId of commonList) {
        await collectStandupResponse(channelId, message.user!, message.text!);
      }

      // Send thank you message
      await say({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Thank you :tada:",
            },
          },
        ],
      });
    }

    // console.log(event);
    // console.log("this is comming inside");
    // console.log("now save");
    // console.log("channel = ", event.channel);
    // Fetch members form the channel
    // const members = await getChannelMembers(event.channel);
    // console.log("members = ", members);

    // Fetch information about the conversation
    // const conversationInfo = await app.client.conversations.info({
    //   channel: event.channel,
    // });

    // Check if the conversation members include the bot's user ID
    // const botUserId = await app.client.auth.test().then((res) => {
    //   console.log("bot auth response = ", res);
    //   return res.bot_id;
    // });

    // console.log(conversationInfo);
    // console.log(botUserId);

    // console.log("event = ", event);
    // console.log("message = ", message);
    // // Check if it is from the bot channel
    // const otherThenBotSelfChannels = await getBotJoinedChannels();
    // console.log(otherThenBotSelfChannels.map((c) => c.id));
    // console.log(event.channel);
    // const item = otherThenBotSelfChannels.find((c) => c.id === event.channel);
    // if (item === undefined) {
    //   return;
    // }

    // console.log("message = ", message);
    // Check if the message is from the bot itself to avoid infinite loops
    // if (event.channel_type === "im" && event.subtype === "bot_message") {
    //   console.log("bot sent this message");
    //   return;
    // }

    // Step TODO:
    // 1. Save the message inside db
    // 2. send it to the channel
    // const report = new Reports({ ...message });
    // report.save();
    // console.log("report data = ", report);
    // console.log("Message has been saved");

    // const result = await web.conversations.list({
    //   types: "public_channel,private_channel",
    // });

    // // const chennels = await getJoinedChannels();
    // // console.log(chennels);
    // Testing channel
    // collectStandupResponse("C06TBP8HFU1", report.user!, report.text!);
  } catch (error) {
    console.error("Error saving message:", error);
  }
});

// Schedule the bot to run daily at 9:00 AM
// cron.schedule("*/10 * * * * *", async () => {
//   // Your bot logic here
//   sendStandupMessage();
//   // For example, send standup messages to each member
//   // and collect responses to send to a particular channel
// });

// Register commands
registerCommands(app);

(async () => {
  // Start the app
  const PORT = process.env.PORT || 3000;
  await app.start(PORT);
  console.log(`⚡ Bot app is running on http://localhost:${PORT}`);
})();
