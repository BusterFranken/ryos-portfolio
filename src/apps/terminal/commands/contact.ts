import { Command } from "../types";
import { getContactEmail } from "@/utils/contactChannels";

export const contactCommand: Command = {
  name: "contact",
  description: "apps.terminal.commands.contact",
  // Email is assembled at runtime (not a literal in the bundle) so it can't be
  // scraped statically; it only appears when a visitor runs this command.
  handler: () => ({
    output: `let's talk —

  email      ${getContactEmail()}
  github     github.com/BusterFranken
  linkedin   linkedin.com/in/buster-franken
  youtube    youtube.com/@fruitpunchai5359

(it's all in the Contacts app too)`,
    isError: false,
  }),
};
