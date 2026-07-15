import { AppMenuBarShell } from "@/components/shared/menubar/AppMenuBarShell";
import { AppMenuBarMenus } from "@/components/shared/menubar/AppMenuBarMenus";
import { useAppMenuBarChrome } from "@/hooks/useAppMenuBarChrome";
import { useTranslation } from "react-i18next";

interface GoMenuBarProps {
  onClose: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
  onNewGame: () => void;
  onPass: () => void;
  canPass: boolean;
}

export function GoMenuBar({
  onClose,
  onShowHelp,
  onShowAbout,
  onNewGame,
  onPass,
  canPass,
}: GoMenuBarProps) {
  const { t } = useTranslation();
  const {
    isShareDialogOpen,
    setIsShareDialogOpen,
    isWindowsTheme,
    isMacOSTheme,
    appId,
    appName,
  } = useAppMenuBarChrome("go");

  return (
    <AppMenuBarShell
      isWindowsTheme={isWindowsTheme}
      isMacOSTheme={isMacOSTheme}
      appId={appId}
      appName={appName}
      isShareDialogOpen={isShareDialogOpen}
      setIsShareDialogOpen={setIsShareDialogOpen}
      helpItemLabel="Go Help"
      aboutItemLabel="About Go"
      onShowHelp={onShowHelp}
      onShowAbout={onShowAbout}
    >
      <AppMenuBarMenus
        menus={[
          {
            label: t("common.menu.file"),
            items: [
              { type: "action", label: "New Game", onClick: onNewGame },
              {
                type: "action",
                label: "Pass",
                onClick: onPass,
                disabled: !canPass,
              },
              { type: "separator" },
              {
                type: "action",
                label: t("common.menu.close"),
                onClick: onClose,
                shortcutId: "close",
              },
            ],
          },
        ]}
      />
    </AppMenuBarShell>
  );
}
