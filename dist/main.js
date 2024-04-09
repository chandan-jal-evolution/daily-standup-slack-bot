"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const bolt_1 = require("@slack/bolt");
const web_api_1 = require("@slack/web-api");
const mongoose_1 = __importDefault(require("mongoose"));
const reports_1 = __importDefault(require("./models/reports"));
const commands_1 = __importDefault(require("./commands"));
const blocks_1 = require("./blocks");
(0, dotenv_1.config)();
const app = new bolt_1.App({
    appToken: process.env.SLACK_APP_TOKEN,
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    // socketMode: true,
});
const web = new web_api_1.WebClient(process.env.SLACK_BOT_TOKEN);
// Connect to the db
mongoose_1.default.connect(process.env.DATABASE_URI).then(() => {
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
        if (!result.channels)
            return [];
        return result.channels.filter((channel) => channel.is_member);
    }
    catch (error) {
        console.error("Error fetching joined channels:", error);
        return [];
    }
}
// Function to fetch information about all members in a channel
async function getChannelMembers(channelId) {
    try {
        // Call the conversations.members method to retrieve information about all members in the channel
        const result = await web.conversations.members({
            channel: channelId,
        });
        // Return the array of member IDs
        if (!result.members)
            return [];
        return result.members.filter((member) => member !== process.env.SLACK_BOT_MEMBER_ID);
    }
    catch (error) {
        console.error("Error fetching channel members:", error);
        process.exit(1);
    }
}
// Function to get information about a specific member
async function getMemberInfo(memberId) {
    try {
        // Call the users.info method
        const result = await web.users.info({
            user: memberId,
        });
        return result.user; // Return user information
    }
    catch (error) {
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
        const fetchAllMemberPromise = channels.map((c) => getChannelMembers(c.id));
        const nestedMembers = await Promise.all(fetchAllMemberPromise);
        const members = Array.from(new Set(nestedMembers.flat()));
        for (const member of members) {
            const user = await getMemberInfo(member);
            await app.client.chat.postMessage({
                token: process.env.SLACK_BOT_TOKEN,
                channel: member,
                blocks: (0, blocks_1.standupReminderBlocks)(user?.real_name || user?.name || member),
            });
        }
    }
    catch (error) {
        console.error("Error sending standup message:", error);
    }
}
// Function to collect the response from the user
async function collectStandupResponse(channelId, userId, text) {
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
            blocks: (0, blocks_1.standupResponseBlocks)(user.user?.real_name || "", user.user?.id || "", text),
        });
    }
    catch (error) {
        console.error("Error sending standup report:", error);
    }
}
// Listen to message
app.message(async ({ event, message, say }) => {
    try {
        console.log("message = ", message);
        // Check if the message is from the bot itself to avoid infinite loops
        if (event.subtype && event.subtype === "bot_message") {
            return;
        }
        // Step TODO:
        // 1. Save the message inside db
        // 2. send it to the channel
        const report = new reports_1.default({ ...message });
        report.save();
        console.log("Message has been saved");
        // const chennels = await getJoinedChannels();
        // console.log(chennels);
        collectStandupResponse("C06TBP8HFU1", report.user, report.text);
    }
    catch (error) {
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
(0, commands_1.default)(app);
(async () => {
    // Start the app
    const PORT = process.env.PORT || 3000;
    await app.start(PORT);
    console.log(`⚡ Bot app is running on http://localhost:${PORT}`);
})();
