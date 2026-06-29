import { Command } from "../types";

export const whoamiCommand: Command = {
  name: "whoami",
  description: "apps.terminal.commands.whoami",
  handler: () => ({
    output: `buster franken

builder of small, sharp things — web apps, a couple of games, and the
odd AI experiment. you're inside my portfolio: it's a tiny operating
system where every window is a project.

  projects   what i've made
  contact    how to reach me`,
    isError: false,
  }),
};