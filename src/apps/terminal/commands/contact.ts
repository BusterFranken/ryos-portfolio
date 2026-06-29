import { Command } from "../types";

export const contactCommand: Command = {
  name: "contact",
  description: "apps.terminal.commands.contact",
  handler: () => ({
    output: `let's talk —

  email      busterfranken@gmail.com
  github     github.com/BusterFranken
  linkedin   linkedin.com/in/buster-franken
  substack   substack.com/@busterfranken
  youtube    youtube.com/@fruitpunchai5359

(it's all in the Contacts app too)`,
    isError: false,
  }),
};
