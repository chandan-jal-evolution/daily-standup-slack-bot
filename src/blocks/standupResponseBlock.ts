import { Block, KnownBlock } from "@slack/bolt";

export const standupResponseBlocks = (
  user_name: string,
  user_id: string,
  text: string
): (Block | KnownBlock)[] => [
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Standup Report From ${user_name} (<@${user_id}>)*:`,
    },
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "Here is the task you're working on:",
    },
  },
  {
    type: "divider",
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${text}`,
    },
  },
];
