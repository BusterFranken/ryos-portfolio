import { useState, useEffect, useRef, useCallback } from "react";
import { useAppHelpAboutDialogs } from "@/hooks/useAppHelpAboutDialogs";
import { useTranslatedHelpItems } from "@/hooks/useTranslatedHelpItems";
import {
  useFileSystem,
  DocumentContent,
} from "@/apps/finder/hooks/useFileSystem";
import { useThemeFlags } from "@/hooks/useThemeFlags";
import { STORES, dbOperations } from "@/utils/indexedDB";
import { useTerminalStoreShallow } from "@/stores/useTerminalStore";
import { useTerminalStore } from "@/stores/useTerminalStore";
import { useLaunchApp } from "@/hooks/useLaunchApp";
import { useAppStore } from "@/stores/useAppStore";
import { useTerminalSounds } from "@/hooks/useTerminalSounds";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFilesStore } from "@/stores/useFilesStore";
import i18n from "@/lib/i18n";
import { CommandHistory, CommandContext } from "../types";

// Maximum number of rendered command entries to keep in memory
const MAX_RENDERED_HISTORY = 200;
import { parseCommand } from "../utils/commandParser";
import { commands, AVAILABLE_COMMANDS } from "../commands";
import { helpItems } from "../index";
import { useVimLogic } from "./useVimLogic";
import type { AIChatMessage } from "@/types/chat";


// Helper function to check if a message is urgent (starts with "!!!!")
export const isUrgentMessage = (content: string): boolean =>
  content.startsWith("!!!!");

// Function to clean urgent message prefix
export const cleanUrgentPrefix = (content: string): string => {
  return isUrgentMessage(content) ? content.slice(4).trimStart() : content;
};

interface UseTerminalLogicOptions {
  isForeground?: boolean;
  initialData?: { prefillCommand?: string };
}

export const useTerminalLogic = ({
  isForeground = true,
  initialData,
}: UseTerminalLogicOptions = {}) => {
  const translatedHelpItems = useTranslatedHelpItems(
    "terminal",
    helpItems || []
  );
  const {
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
  } = useAppHelpAboutDialogs();
  const [currentCommand, setCurrentCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyCommands, setHistoryCommands] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(12); // Default font size in pixels
  // Get state from terminal store
  const { currentPath: storedPath } = useTerminalStoreShallow((state) => ({
    currentPath: state.currentPath,
  }));
  // AI assistant ("Ryo") was removed for the no-backend portfolio build. These
  // are inert stand-ins so the terminal renders purely as a classic shell.
  const isInAiMode = false;
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [isInteractingWithPreview, setIsInteractingWithPreview] =
    useState(false);
  const [inputFocused, setInputFocused] = useState(false); // Add state for input focus
  const spinnerChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  // Track if auto-scrolling is enabled
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // Reference to track if user is at the bottom
  const isAtBottomRef = useRef(true);
  const hasScrolledRef = useRef(false);
  const previousCommandHistoryLength = useRef(0);

  // Keep track of the last processed message ID to avoid duplicates
  const lastProcessedMessageIdRef = useRef<string | null>(null);
  // Inert AI chat stand-ins (AI assistant removed in the no-backend build).
  const aiMessages: AIChatMessage[] = [];
  const isAiLoading = false;
  const stopAiResponse = () => {};

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const prefillAppliedRef = useRef<string | null>(null);

  // Pre-fill command from initialData (e.g. from Spotlight search)
  useEffect(() => {
    if (
      initialData?.prefillCommand &&
      initialData.prefillCommand !== prefillAppliedRef.current
    ) {
      prefillAppliedRef.current = initialData.prefillCommand;
      setCurrentCommand(initialData.prefillCommand);
      // Focus the input so user can immediately press Enter or edit
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [initialData?.prefillCommand]);

  const { currentPath, files, navigateToPath, saveFile, moveToTrash } =
    useFileSystem(storedPath);

  const {
    isInVimMode,
    vimFile,
    vimPosition,
    vimCursorLine,
    vimCursorColumn,
    vimMode,
    vimSearchPattern,
    vimVisualStartLine,
    handleVimInput,
    handleVimTextInput,
    handleVimKeyDown,
  } = useVimLogic({
    currentCommand,
    setCurrentCommand,
    commandHistory,
    setCommandHistory,
    currentPath,
    files,
    saveFile,
  });

  const launchApp = useLaunchApp();
  const bringInstanceToForeground = useAppStore(
    (state) => state.bringInstanceToForeground
  );

  const {
    playCommandSound,
    playErrorSound,
    toggleMute,
    isMuted,
    playElevatorMusic,
    stopElevatorMusic,
    playDingSound,
    playMooSound,
  } = useTerminalSounds();

  const username = useAuthStore((state) => state.username);
  const { isWindowsTheme } = useThemeFlags();

  // Load command history from store
  useEffect(() => {
    const { commandHistory: storedHistory } = useTerminalStore.getState();
    setHistoryCommands(storedHistory.map((cmd) => cmd.command));
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString();
    const asciiArt = `     __  __ 
 _  /  \\(_  
| \\/\\__/__) 
  /         `;

    setCommandHistory([
      {
        command: "",
        output: `${asciiArt}\n${i18n.t("apps.terminal.output.lastLogin", { time: currentTime })}\n${i18n.t("apps.terminal.output.typeHelpForCommands")}\n\n`,
        path: "welcome-message",
      },
    ]);
  }, []);

  // Handle scroll events to enable/disable auto-scroll
  const handleScroll = () => {
    if (terminalRef.current) {
      hasScrolledRef.current = true;
      const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
      // Check if user is at the bottom (allowing for a small buffer of 10px)
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

      // If we were at bottom and scrolled up, disable auto-scroll
      if (isAtBottomRef.current && !isAtBottom) {
        setAutoScrollEnabled(false);
      }
      // If we're at bottom, enable auto-scroll
      if (isAtBottom) {
        setAutoScrollEnabled(true);
        isAtBottomRef.current = true;
      }
    }
  };

  // Improved scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  // Auto-scroll to bottom when command history changes
  useEffect(() => {
    if (!terminalRef.current) return;

    // Always scroll to bottom on initial load
    if (!hasScrolledRef.current) {
      scrollToBottom();
      return;
    }

    // For subsequent updates, only scroll if auto-scroll is enabled
    if (autoScrollEnabled) {
      scrollToBottom();
    }

    previousCommandHistoryLength.current = commandHistory.length;
  }, [commandHistory, autoScrollEnabled, scrollToBottom]);

  // Modify the focus effect to respect preview interaction
  useEffect(() => {
    if (inputRef.current && isForeground && !isInteractingWithPreview) {
      inputRef.current.focus();
    }
  }, [isForeground, commandHistory, isInteractingWithPreview]);

  // Save current path to store when it changes
  useEffect(() => {
    useTerminalStore.getState().setCurrentPath(currentPath);
  }, [currentPath]);

  // Spinner animation effect
  useEffect(() => {
    if (isAiLoading) {
      const interval = setInterval(() => {
        setSpinnerIndex((prevIndex) => (prevIndex + 1) % spinnerChars.length);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isAiLoading, spinnerChars.length]);

  const [isClearingTerminal, setIsClearingTerminal] = useState(false);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCommand.trim()) return;

    if (isInVimMode) {
      handleVimInput(currentCommand);
      return;
    }

    // Add command to history commands array
    const newHistoryCommands = [...historyCommands, currentCommand];
    setHistoryCommands(newHistoryCommands);
    setHistoryIndex(-1);

    // Store command in history via Zustand store
    useTerminalStore.getState().addCommand(currentCommand);

    // Process the command asynchronously
    processCommand(currentCommand).then((result) => {
      // Play appropriate sound based on command result
      if (result.isError) {
        playErrorSound();
      } else {
        playCommandSound();
      }

      // Reset animated lines to ensure only new content gets animated
      setAnimatedLines(new Set());

      // Add to command history (keep bounded)
      setCommandHistory((prev) => [
        ...prev.slice(-MAX_RENDERED_HISTORY + 1),
        {
          command: currentCommand,
          output: result.output,
          path: currentPath,
          // Style system messages in gray (errors, or explicitly marked system messages)
          isSystemMessage: result.isSystemMessage ?? result.isError,
        },
      ]);
    });

    // Clear current command
    setCurrentCommand("");
  };

  // parseCommand is now imported from utils/commandParser

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isInVimMode) {
      handleVimKeyDown(e);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      // Navigate up through command history
      if (historyCommands.length > 0) {
        const newIndex =
          historyIndex < historyCommands.length - 1
            ? historyIndex + 1
            : historyIndex;
        setHistoryIndex(newIndex);
        const historicCommand =
          historyCommands[historyCommands.length - 1 - newIndex] || "";

        // If we're not in AI mode and the historic command was from AI mode
        // (doesn't start with 'ryo' and was saved with 'ryo' prefix)
        const savedCommands = useTerminalStore.getState().commandHistory;
        const commandEntry = savedCommands[savedCommands.length - 1 - newIndex];
        if (
          !isInAiMode &&
          commandEntry &&
          commandEntry.command.startsWith("ryo ") &&
          !historicCommand.startsWith("ryo ")
        ) {
          setCurrentCommand("ryo " + historicCommand);
        } else {
          setCurrentCommand(historicCommand);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      // Navigate down through command history
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const historicCommand =
          historyCommands[historyCommands.length - 1 - newIndex] || "";

        // Same logic for down arrow
        const savedCommands = useTerminalStore.getState().commandHistory;
        const commandEntry = savedCommands[savedCommands.length - 1 - newIndex];
        if (
          !isInAiMode &&
          commandEntry &&
          commandEntry.command.startsWith("ryo ") &&
          !historicCommand.startsWith("ryo ")
        ) {
          setCurrentCommand("ryo " + historicCommand);
        } else {
          setCurrentCommand(historicCommand);
        }
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const completedCommand = autoComplete(currentCommand);
      setCurrentCommand(completedCommand);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      if (currentCommand) {
        // Clear current input with ^C indicator
        setCommandHistory((prev) => [
          ...prev,
          {
            command: currentCommand + "^C",
            output: "",
            path: currentPath,
          },
        ]);
        setCurrentCommand("");
      }
      setHistoryIndex(-1);
    }
  };

  // Update autoComplete to handle quotes
  const autoComplete = (input: string): string => {
    // If the input ends with a space, don't try to autocomplete
    if (input.endsWith(" ")) return input;

    const { cmd, args } = parseCommand(input);

    // If this is the first word (command autocomplete)
    if (!input.includes(" ")) {
      const matches = AVAILABLE_COMMANDS.filter((availableCmd) =>
        availableCmd.startsWith(cmd)
      );

      if (matches.length === 1) {
        // Exact match, replace the command
        return matches[0];
      } else if (matches.length > 1) {
        // Show matching commands
        setCommandHistory([
          ...commandHistory,
          {
            command: input,
            output: matches.join("  "),
            path: currentPath,
          },
        ]);
        return input;
      }
    }
    // File/directory autocompletion (for commands that take file arguments)
    else if (["cd", "cat", "rm", "edit", "vim", "grep"].includes(cmd)) {
      const lastArg = args.length > 0 ? args[args.length - 1] : "";

      const matches = files.reduce<string[]>((acc, file) => {
        if (file.name.toLowerCase().startsWith(lastArg.toLowerCase())) {
          acc.push(file.name);
        }
        return acc;
      }, []);

      if (matches.length === 1) {
        // Exact match, replace the last part
        // Handle filenames with spaces by adding quotes if needed
        const matchedName = matches[0];
        const needsQuotes = matchedName.includes(" ");

        // Rebuild the command with the matched filename
        const commandParts = input.split(" ");

        // Remove the last part (partial filename)
        commandParts.pop();

        // Add the completed filename (with quotes if needed)
        if (
          needsQuotes &&
          !lastArg.startsWith('"') &&
          !lastArg.startsWith("'")
        ) {
          commandParts.push(`"${matchedName}"`);
        } else {
          commandParts.push(matchedName);
        }

        return commandParts.join(" ");
      } else if (matches.length > 1) {
        // Show matching files/directories
        setCommandHistory([
          ...commandHistory,
          {
            command: input,
            output: matches.join("  "),
            path: currentPath,
          },
        ]);
        return input;
      }
    }

    return input; // Return original if no completions
  };

  const processCommand = async (
    command: string
  ): Promise<{ output: string; isError: boolean; isSystemMessage?: boolean }> => {
    const { cmd, args } = parseCommand(command);

    // Create command context
    const context: CommandContext = {
      currentPath,
      files,
      navigateToPath,
      saveFile,
      moveToTrash: (file) => moveToTrash(file),
      playCommandSound,
      playErrorSound,
      playMooSound,
      launchApp,
      setIsAboutDialogOpen,
      username,
    };

    // Check if command exists in registry
    if (commands[cmd]) {
      const result = await commands[cmd].handler(args, context);

      // Special handling for clear command
      if (cmd === "clear") {
        // Trigger clearing animation
        setIsClearingTerminal(true);
        // Stop any ongoing AI responses
        if (isInAiMode) {
          stopAiResponse();
        }
        setTimeout(() => {
          setIsClearingTerminal(false);
          setCommandHistory([]);
          // Reset tracking refs for AI responses
          lastProcessedMessageIdRef.current = null;
        }, 500); // Animation duration
      }

      return result;
    }

    // Handle commands that are not yet in the registry
    switch (cmd) {
      case "cat": {
        if (args.length === 0) {
          return {
            output: "usage: cat <filename>",
            isError: true,
          };
        }

        const fileName = args[0];
        const file = files.find((f) => f.name === fileName);

        if (!file) {
          return {
            output: `file not found: ${fileName}`,
            isError: true,
          };
        }

        if (file.isDirectory) {
          return {
            output: `${fileName} is a directory, not a file`,
            isError: true,
          };
        }

        // Use a loading message while we fetch content
        const tempOutput = `Loading ${fileName}...`;

        // Create a class to handle file content reading - using same pattern as vim
        class FileReader {
          async readContent() {
            try {
              if (this.isRealFile()) {
                await this.loadRealFileContent();
              } else {
                this.handleVirtualFile();
              }
            } catch (error) {
              this.handleError(error);
            }
          }

          isRealFile() {
            // Ensure file exists and check path properties
            return (
              file &&
              (file.path.startsWith("/Documents/") ||
                file.path.startsWith("/Images/"))
            );
          }

          async loadRealFileContent() {
            // Ensure file exists first
            if (!file) return;

            // Get file metadata from the store to find UUID
            const fileStore = useFilesStore.getState();
            const fileMetadata = fileStore.getItem(file.path);

            if (!fileMetadata || !fileMetadata.uuid) {
              this.updateOutput(`${fileName}: file metadata not found`);
              return;
            }

            // Determine store based on file path
            const storeName = file.path.startsWith("/Documents/")
              ? STORES.DOCUMENTS
              : STORES.IMAGES;

            const contentData = await dbOperations.get<DocumentContent>(
              storeName,
              fileMetadata.uuid
            );

            if (contentData && contentData.content) {
              // Convert content to text based on type
              let fileContent = "";
              if (contentData.content instanceof Blob) {
                fileContent = await contentData.content.text();
              } else if (typeof contentData.content === "string") {
                fileContent = contentData.content;
              }

              // Update terminal with content
              this.updateOutput(fileContent || `${fileName} is empty`);
            } else {
              // Handle missing content
              this.updateOutput(`${fileName} is empty or could not be read`);
            }
          }

          handleVirtualFile() {
            this.updateOutput(
              `${fileName} content not available (virtual file)`
            );
          }

          updateOutput(content: string) {
            // Update the terminal history with the content
            setCommandHistory((prev) => {
              const lastCommand = prev[prev.length - 1];
              if (lastCommand.output === tempOutput) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastCommand,
                    output: content,
                  },
                ];
              }
              return prev;
            });
          }

          handleError(error: unknown) {
            const err = error as Error;
            console.error("Error reading file content:", err);
            this.updateOutput(
              `Error reading file: ${err.message || "Unknown error"}`
            );
          }
        }

        // Start the reading process asynchronously
        setTimeout(() => {
          const reader = new FileReader();
          reader.readContent();
        }, 100);

        return {
          output: tempOutput,
          isError: false,
        };
      }

      case "edit": {
        if (args.length === 0) {
          return {
            output: "usage: edit <filename>",
            isError: true,
          };
        }

        const fileToEdit = args[0];
        const fileToEditObj = files.find((f) => f.name === fileToEdit);

        if (!fileToEditObj) {
          return {
            output: `file not found: ${fileToEdit}`,
            isError: true,
          };
        }

        if (fileToEditObj.isDirectory) {
          return {
            output: `${fileToEdit} is a directory, not a file`,
            isError: true,
          };
        }

        // Check if the file is already in Documents folder or needs copying
        if (!fileToEditObj.path.startsWith("/Documents/")) {
          // Create a copy in the Documents folder
          const fileName = fileToEditObj.name;
          const documentsPath = `/Documents/${fileName}`;

          // Helper function to handle document copying asynchronously
          setTimeout(async () => {
            try {
              // Get the content if it's a real file
              if (fileToEditObj && fileToEditObj.path.startsWith("/Images/")) {
                // For image files, we need to get the content from IndexedDB
                // Get file metadata from the store to find UUID
                const fileStore = useFilesStore.getState();
                const fileMetadata = fileStore.getItem(fileToEditObj.path);

                if (fileMetadata && fileMetadata.uuid) {
                  const contentData = await dbOperations.get<DocumentContent>(
                    STORES.IMAGES,
                    fileMetadata.uuid
                  );
                  let fileContent = "";

                  if (contentData && contentData.content) {
                    if (contentData.content instanceof Blob) {
                      fileContent = await contentData.content.text();
                    } else if (typeof contentData.content === "string") {
                      fileContent = contentData.content;
                    }
                  }

                  // Save to Documents
                  await saveFile({
                    name: fileName,
                    path: documentsPath,
                    content: fileContent || "",
                    type: "text",
                    icon: "/icons/file-text.png",
                  });
                } else {
                  // No UUID found, create empty document
                  await saveFile({
                    name: fileName,
                    path: documentsPath,
                    content: "",
                    type: "text",
                    icon: "/icons/file-text.png",
                  });
                }
              } else {
                // For virtual files, create an empty document
                await saveFile({
                  name: fileName,
                  path: documentsPath,
                  content: "",
                  type: "text",
                  icon: "/icons/file-text.png",
                });
              }

              // Launch TextEdit with the copied file
              launchApp("textedit", {
                initialData: { path: documentsPath, content: "" },
              });
            } catch (error) {
              console.error("Error preparing file for editing:", error);
            }
          }, 100);
        } else {
          // If already in Documents, just launch TextEdit directly with the file path
          // Let TextEdit use its own content loading mechanism
          launchApp("textedit", {
            initialData: {
              path: fileToEditObj.path,
              content: "",
            },
          });
        }
        return {
          output: `opening ${fileToEdit} in textedit...`,
          isError: false,
        };
      }

      case "history": {
        const cmdHistory = useTerminalStore.getState().commandHistory;
        if (cmdHistory.length === 0) {
          return {
            output: "no command history",
            isError: false,
          };
        }

        // Calculate padding for index column based on number of commands
        const indexPadding = cmdHistory.length.toString().length;

        // Find the longest command to determine command column width
        const longestCmd = Math.min(
          25, // Maximum width to prevent extremely long commands from using too much space
          Math.max(...cmdHistory.map((cmd) => cmd.command.length))
        );

        return {
          output: cmdHistory
            .map((cmd, idx) => {
              const date = new Date(cmd.timestamp);
              const indexStr = (idx + 1).toString().padStart(indexPadding, " ");

              // Truncate very long commands and add ellipsis
              const displayCmd =
                cmd.command.length > 25
                  ? cmd.command.substring(0, 22) + "..."
                  : cmd.command;

              // Pad command to align timestamps
              const paddedCmd = displayCmd.padEnd(longestCmd, " ");

              // Simplified date format: MM/DD HH:MM
              const dateStr = `${(date.getMonth() + 1)
                .toString()
                .padStart(2, "0")}/${date
                .getDate()
                .toString()
                .padStart(2, "0")} ${date
                .getHours()
                .toString()
                .padStart(2, "0")}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;

              return `${indexStr}  ${paddedCmd}  # ${dateStr}`;
            })
            .join("\n"),
          isError: false,
        };
      }

      case "su": {
        // Accounts/authentication were removed for the static, no-backend
        // portfolio build. Always respond as an anonymous guest.
        return {
          output: "su: authentication not available",
          isError: true,
        };
      }

      case "logout": {
        if (!username) {
          return { output: "not logged in", isError: true };
        }

        const tempOutput = "logging out...";

        class LogoutHandler {
          async perform() {
            try {
              await useAuthStore.getState().logout();
              this.updateOutput("logged out");
            } catch (err) {
              const errorMsg =
                err instanceof Error ? err.message : "unknown error";
              this.updateOutput(`logout failed: ${errorMsg}`);
            }
          }

          updateOutput(content: string) {
            setCommandHistory((prev) => {
              const last = prev[prev.length - 1];
              if (last.output === tempOutput) {
                return [...prev.slice(0, -1), { ...last, output: content }];
              }
              return prev;
            });
          }
        }

        setTimeout(() => {
          new LogoutHandler().perform();
        }, 50);

        return { output: tempOutput, isError: false };
      }

      default:
        return {
          output: i18n.t("apps.terminal.output.commandNotFound", { cmd }),
          isError: true,
        };
    }
  };

  const increaseFontSize = () => {
    if (fontSize < 24) {
      setFontSize((prevSize) => prevSize + 2);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 10) {
      setFontSize((prevSize) => prevSize - 2);
    }
  };

  const [terminalFlash, setTerminalFlash] = useState(false);

  const resetFontSize = () => {
    setFontSize(12); // Reset to default

    // Create a flash effect when resetting font size
    setTerminalFlash(true);
    setTimeout(() => setTerminalFlash(false), 300);
  };

  // Track which output lines should use typewriter effect
  const [animatedLines, setAnimatedLines] = useState<Set<number>>(new Set());

  // Add new line to the animated lines set - optimize to prevent unnecessary updates
  useEffect(() => {
    if (commandHistory.length === 0) return;

    const newIndex = commandHistory.length - 1;
    const item = commandHistory[newIndex];

    // Skip adding animation if we've already processed this length
    if (previousCommandHistoryLength.current === commandHistory.length) return;
    previousCommandHistoryLength.current = commandHistory.length;

    setAnimatedLines((prev) => {
      // If the line is already animated, don't update the set
      if (prev.has(newIndex)) return prev;

      const newSet = new Set(prev);

      // Only animate certain types of output
      if (
        !item.path.startsWith("ai-") &&
        item.output &&
        item.output.length > 0 &&
        item.output.length < 150 &&
        !item.output.startsWith("command not found") &&
        !item.output.includes("commands") &&
        !item.output.includes("     __  __") &&
        !item.output.includes("ask ryo anything.") &&
        // Don't animate ls command output
        !(item.command && item.command.trim().startsWith("ls"))
      ) {
        newSet.add(newIndex);
      }

      return newSet;
    });
  }, [commandHistory]);

  // Update HTML preview usage in the component
  const handleHtmlPreviewInteraction = (isInteracting: boolean) => {
    setIsInteractingWithPreview(isInteracting);
  };

  // Add the following style in a useEffect that runs once to add the global animation
  useEffect(() => {
    // Add breathing animation if it doesn't exist
    if (!document.getElementById("breathing-animation")) {
      const style = document.createElement("style");
      style.id = "breathing-animation";
      style.innerHTML = `
        @keyframes breathing {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        .shimmer-subtle {
          animation: shimmer-text 2.5s ease-in-out infinite;
        }
        
        @keyframes shimmer-text {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }

        @keyframes gradient-spin {
          0% { color: #FFB3BA; }  /* Pastel Pink */
          20% { color: #BAFFC9; } /* Pastel Green */
          40% { color: #BAE1FF; } /* Pastel Blue */
          60% { color: #FFFFBA; } /* Pastel Yellow */
          80% { color: #FFE4BA; } /* Pastel Orange */
          100% { color: #FFB3BA; } /* Back to Pastel Pink */
        }

        .gradient-spin {
          animation: gradient-spin 4s ease-in-out infinite;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      // Clean up on unmount
      const styleElement = document.getElementById("breathing-animation");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Only apply to AI assistant messages and user messages in AI mode
  const shouldApplyMarkdown = (path: string): boolean => {
    return path === "ai-assistant" || path === "ai-user";
  };

  const handleClearTerminal = () => {
    setIsClearingTerminal(true);
    setTimeout(() => {
      setIsClearingTerminal(false);
      setCommandHistory([]);
    }, 500);
  };

  return {
    translatedHelpItems,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    currentCommand,
    setCurrentCommand,
    commandHistory,
    fontSize,
    spinnerIndex,
    spinnerChars,
    isInAiMode,
    isAiLoading,
    aiMessages,
    handleCommandSubmit,
    handleKeyDown,
    inputFocused,
    setInputFocused,
    inputRef,
    terminalRef,
    currentPath,
    isClearingTerminal,
    setIsClearingTerminal,
    animatedLines,
    handleScroll,
    handleHtmlPreviewInteraction,
    isMuted,
    toggleMute,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    terminalFlash,
    isInVimMode,
    vimFile,
    vimPosition,
    vimCursorLine,
    vimCursorColumn,
    vimMode,
    vimSearchPattern,
    vimVisualStartLine,
    handleVimTextInput,
    playElevatorMusic,
    stopElevatorMusic,
    playDingSound,
    bringInstanceToForeground,
    handleClearTerminal,
    isWindowsTheme,
    shouldApplyMarkdown,
  };
};
