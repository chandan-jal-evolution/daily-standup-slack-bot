import axios from "axios";

export async function sendMessageToSlackChannel(text: string) {
  await axios.post(
    "https://hooks.slack.com/services/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",
    {
      text,
    }
  );
}
