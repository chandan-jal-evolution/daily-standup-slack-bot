import { Block, KnownBlock } from "@slack/bolt";

export const standupReminderBlocks = (
  username: string
): (Block | KnownBlock)[] => [
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `Hi ${username} :wave:`,
    },
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "Great to see you here! App helps you to stay up-to-date with your meetings and events right here within Slack. These are just a few things which you will be able to do:",
    },
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "1. What did you accomplish yesterday? \n 2. What will you do today? \n 3. Any blockers?",
    },
  },
];
