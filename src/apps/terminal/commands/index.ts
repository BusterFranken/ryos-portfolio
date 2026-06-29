import { Command } from "../types";

// Import all commands
import { helpCommand } from "./help";
import { clearCommand } from "./clear";
import { pwdCommand } from "./pwd";
import { lsCommand } from "./ls";
import { cdCommand } from "./cd";
import { touchCommand } from "./touch";
import { rmCommand } from "./rm";
import { mkdirCommand } from "./mkdir";
import { echoCommand } from "./echo";
import { whoamiCommand } from "./whoami";
import { dateCommand } from "./date";
import { cowsayCommand } from "./cowsay";
import { aboutCommand } from "./about";
import { vimCommand } from "./vim";
import { openCommand } from "./open";
import { grepCommand } from "./grep";
import { uptimeCommand } from "./uptime";
import { projectsCommand } from "./projects";
import { contactCommand } from "./contact";

// Create command registry
export const commands: Record<string, Command> = {
  help: helpCommand,
  clear: clearCommand,
  pwd: pwdCommand,
  ls: lsCommand,
  cd: cdCommand,
  touch: touchCommand,
  rm: rmCommand,
  mkdir: mkdirCommand,
  echo: echoCommand,
  whoami: whoamiCommand,
  date: dateCommand,
  cowsay: cowsayCommand,
  about: aboutCommand,
  vim: vimCommand,
  open: openCommand,
  grep: grepCommand,
  uptime: uptimeCommand,
  projects: projectsCommand,
  contact: contactCommand,
};

// Export list of available command names for autocompletion
export const AVAILABLE_COMMANDS = Object.keys(commands).concat([
  "cat",
  "edit",
  "history",
  "su",
  "logout",
]);