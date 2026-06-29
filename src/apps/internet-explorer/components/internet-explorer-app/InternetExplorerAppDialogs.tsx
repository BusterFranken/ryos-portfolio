import { InputDialog } from "@/components/dialogs/InputDialog";
import { AppHelpAboutDialogs } from "@/components/shared/AppHelpAboutDialogs";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import FutureSettingsDialog from "@/components/dialogs/FutureSettingsDialog";
import { appMetadata } from "../..";
import type { AppProps } from "@/apps/base/types";

export interface InternetExplorerAppDialogsProps {
  isTitleDialogOpen: boolean;
  newFavoriteTitle: string;
  isHelpDialogOpen: boolean;
  isAboutDialogOpen: boolean;
  isClearFavoritesDialogOpen: boolean;
  isClearHistoryDialogOpen: boolean;
  isResetFavoritesDialogOpen: boolean;
  isFutureSettingsDialogOpen: boolean;
  translatedHelpItems: NonNullable<AppProps["helpItems"]>;
  setTitleDialogOpen: (open: boolean) => void;
  setNewFavoriteTitle: (title: string) => void;
  setHelpDialogOpen: (open: boolean) => void;
  setAboutDialogOpen: (open: boolean) => void;
  setClearFavoritesDialogOpen: (open: boolean) => void;
  setClearHistoryDialogOpen: (open: boolean) => void;
  setResetFavoritesDialogOpen: (open: boolean) => void;
  setFutureSettingsDialogOpen: (open: boolean) => void;
  handleTitleSubmit: () => void;
  handleClearFavorites: () => void;
  handleResetFavorites: () => void;
  clearHistory: () => void;
}

export function InternetExplorerAppDialogs({
  isTitleDialogOpen,
  newFavoriteTitle,
  isHelpDialogOpen,
  isAboutDialogOpen,
  isClearFavoritesDialogOpen,
  isClearHistoryDialogOpen,
  isResetFavoritesDialogOpen,
  isFutureSettingsDialogOpen,
  translatedHelpItems,
  setTitleDialogOpen,
  setNewFavoriteTitle,
  setHelpDialogOpen,
  setAboutDialogOpen,
  setClearFavoritesDialogOpen,
  setClearHistoryDialogOpen,
  setResetFavoritesDialogOpen,
  setFutureSettingsDialogOpen,
  handleTitleSubmit,
  handleClearFavorites,
  handleResetFavorites,
  clearHistory,
}: InternetExplorerAppDialogsProps) {
  return (
    <>
      <InputDialog
        isOpen={isTitleDialogOpen}
        onOpenChange={setTitleDialogOpen}
        onSubmit={handleTitleSubmit}
        title="Add Favorite"
        description="Enter a title for this favorite"
        value={newFavoriteTitle}
        onChange={setNewFavoriteTitle}
      />
      <AppHelpAboutDialogs
        appId="internet-explorer"
        helpItems={translatedHelpItems}
        metadata={appMetadata}
        isHelpOpen={isHelpDialogOpen}
        onHelpOpenChange={setHelpDialogOpen}
        isAboutOpen={isAboutDialogOpen}
        onAboutOpenChange={setAboutDialogOpen}
      />
      <ConfirmDialog
        isOpen={isClearFavoritesDialogOpen}
        onOpenChange={setClearFavoritesDialogOpen}
        onConfirm={handleClearFavorites}
        title="Clear Favorites"
        description="Are you sure you want to clear all favorites?"
      />
      <ConfirmDialog
        isOpen={isClearHistoryDialogOpen}
        onOpenChange={setClearHistoryDialogOpen}
        onConfirm={() => {
          clearHistory();
          setClearHistoryDialogOpen(false);
        }}
        title="Clear History"
        description="Are you sure you want to clear all history?"
      />
      <ConfirmDialog
        isOpen={isResetFavoritesDialogOpen}
        onOpenChange={setResetFavoritesDialogOpen}
        onConfirm={handleResetFavorites}
        title="Reset Favorites"
        description="Are you sure you want to reset favorites to default?"
      />
      <FutureSettingsDialog
        isOpen={isFutureSettingsDialogOpen}
        onOpenChange={setFutureSettingsDialogOpen}
      />
    </>
  );
}
