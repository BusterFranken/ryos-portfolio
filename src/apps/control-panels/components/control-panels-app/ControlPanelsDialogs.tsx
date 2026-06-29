import { AppHelpAboutDialogs } from "@/components/shared/AppHelpAboutDialogs";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { appMetadata } from "../..";

export type ControlPanelsDialogsProps = {
  t: (key: string, opts?: Record<string, unknown>) => string;
  translatedHelpItems: { icon: string; title: string; description: string }[];
  isHelpDialogOpen: boolean;
  setIsHelpDialogOpen: (open: boolean) => void;
  isAboutDialogOpen: boolean;
  setIsAboutDialogOpen: (open: boolean) => void;
  isConfirmResetOpen: boolean;
  setIsConfirmResetOpen: (open: boolean) => void;
  handleConfirmReset: () => void;
  isConfirmFormatOpen: boolean;
  setIsConfirmFormatOpen: (open: boolean) => void;
  handleConfirmFormat: () => void;
};

export function ControlPanelsDialogs(props: ControlPanelsDialogsProps) {
  const {
    t,
    translatedHelpItems,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    isConfirmResetOpen,
    setIsConfirmResetOpen,
    handleConfirmReset,
    isConfirmFormatOpen,
    setIsConfirmFormatOpen,
    handleConfirmFormat,
  } = props;

  return (
    <>
      <AppHelpAboutDialogs
        appId="control-panels"
        helpItems={translatedHelpItems}
        metadata={appMetadata}
        isHelpOpen={isHelpDialogOpen}
        onHelpOpenChange={setIsHelpDialogOpen}
        isAboutOpen={isAboutDialogOpen}
        onAboutOpenChange={setIsAboutDialogOpen}
      />
      <ConfirmDialog
        isOpen={isConfirmResetOpen}
        onOpenChange={setIsConfirmResetOpen}
        onConfirm={handleConfirmReset}
        title={t("common.system.resetAllSettings")}
        description={t("common.system.resetAllSettingsDesc")}
      />
      <ConfirmDialog
        isOpen={isConfirmFormatOpen}
        onOpenChange={setIsConfirmFormatOpen}
        onConfirm={handleConfirmFormat}
        title={t("common.system.formatFileSystem")}
        description={t("common.system.formatFileSystemDesc")}
      />
    </>
  );
}
