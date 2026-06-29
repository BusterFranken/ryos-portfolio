import { Command } from "../types";

export const projectsCommand: Command = {
  name: "projects",
  description: "apps.terminal.commands.projects",
  handler: () => ({
    output: `things i've made:

  casefile       a courtroom-drama investigation game
  eigenvector    eigenvector.pro — a live experiment
  mpoftheweek    MP of the Week
  hush           a quiet little web toy
  kafka-form     a Kafkaesque web form
  dnd-cv         my CV, as a D&D character sheet
  tarot          a bit-art fortune teller
  pawnshop       an AI jewelry-appraisal marketplace (wip)
  buster-barn    a full-screen pixel-art barn game — careful

also worth a look: gallery · videos · résumé · substack
→ double-click them on the desktop, or: open <name>`,
    isError: false,
  }),
};
