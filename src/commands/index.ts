import { App } from "@slack/bolt";

import hello from "./hello";

export default function registerCommands(app: App) {
  hello(app);
}
