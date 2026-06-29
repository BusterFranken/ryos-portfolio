import React from "react";
import { AppWindowShell } from "@/components/shared/AppWindowShell";
import { ControlPanelsMenuBar } from "../ControlPanelsMenuBar";
import { AppProps, ControlPanelsInitialData } from "@/apps/base/types";
import { useControlPanelsLogic } from "../../hooks/useControlPanelsLogic";
import { ControlPanelsDialogs } from "./ControlPanelsDialogs";
import { ControlPanelsMacLayout } from "./ControlPanelsMacLayout";
import { ControlPanelsMacPaneRenderer } from "./ControlPanelsMacPaneRenderer";
import { getControlPanelsTitlebarHeight } from "./controlPanelsMacMotion";
import {
  getControlPanelsMacWindowTitle,
  normalizeControlPanelPaneId,
  type ControlPanelMacNavigationEntry,
  type ControlPanelPaneId,
} from "./controlPanelsCategories";

export function ControlPanelsAppComponent({
  isWindowOpen,
  onClose,
  isForeground,
  skipInitialSound,
  initialData,
  instanceId,
  onNavigateNext,
  onNavigatePrevious,
}: AppProps<ControlPanelsInitialData>) {
  const logic = useControlPanelsLogic({ initialData });
  const {
    t,
    translatedHelpItems,
    windowTitle,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    isConfirmResetOpen,
    setIsConfirmResetOpen,
    isConfirmFormatOpen,
    setIsConfirmFormatOpen,
    fileInputRef,
    handleRestore,
    handleBackup,
    handleResetAll,
    handleConfirmReset,
    handleConfirmFormat,
    handleCheckForUpdates,
    currentTheme,
    setTheme,
    aquaMaterial,
    setAquaMaterial,
    supportsDarkMode,
    darkModePreference,
    setDarkMode,
    supportsAccent,
    accent,
    accentChrome,
    setAccent,
    wallpaperAccentColor,
    currentLanguage,
    setLanguage,
    tabStyles,
    isWindowsTheme,
    isMacOSTheme,
    uiSoundsEnabled,
    handleUISoundsChange,
    speechEnabled,
    handleSpeechChange,
    terminalSoundsEnabled,
    setTerminalSoundsEnabled,
    synthPreset,
    handleSynthPresetChange,
    masterVolume,
    setMasterVolume,
    setPrevMasterVolume,
    handleMasterMuteToggle,
    uiVolume,
    setUiVolume,
    setPrevUiVolume,
    handleUiMuteToggle,
    speechVolume,
    setSpeechVolume,
    setPrevSpeechVolume,
    handleSpeechMuteToggle,
    chatSynthVolume,
    setChatSynthVolume,
    setPrevChatSynthVolume,
    handleChatSynthMuteToggle,
    ipodVolume,
    setIpodVolume,
    setPrevIpodVolume,
    handleIpodMuteToggle,
    isIOS,
    shaderEffectEnabled,
    setShaderEffectEnabled,
  } = logic;

  const isSystem7Theme = currentTheme === "system7";
  const isWin98 = currentTheme === "win98";
  const titlebarHeight = getControlPanelsTitlebarHeight(currentTheme);
  const [currentEntry, setCurrentEntry] =
    React.useState<ControlPanelMacNavigationEntry>(() =>
      normalizeControlPanelPaneId(initialData?.defaultTab) ?? "home"
    );
  // The unified System Preferences layout reflects the active pane in the
  // window title across every theme (Show All falls back to the default title).
  const effectiveWindowTitle = React.useMemo(
    () => getControlPanelsMacWindowTitle(currentEntry, t, windowTitle),
    [currentEntry, t, windowTitle]
  );

  const renderMacPane = (
    paneId: ControlPanelPaneId,
    onNavigateToPane: (paneId: ControlPanelPaneId) => void
  ) => (
    <ControlPanelsMacPaneRenderer
      paneId={paneId}
      onNavigateToPane={onNavigateToPane}
      t={t}
      tabStyles={tabStyles}
      currentTheme={currentTheme}
      setTheme={setTheme}
      aquaMaterial={aquaMaterial}
      setAquaMaterial={setAquaMaterial}
      supportsDarkMode={supportsDarkMode}
      darkModePreference={darkModePreference}
      setDarkMode={setDarkMode}
      supportsAccent={supportsAccent}
      accent={accent}
      accentChrome={accentChrome}
      setAccent={setAccent}
      wallpaperAccentColor={wallpaperAccentColor}
      currentLanguage={currentLanguage}
      setLanguage={setLanguage}
      uiSoundsEnabled={uiSoundsEnabled}
      handleUISoundsChange={handleUISoundsChange}
      speechEnabled={speechEnabled}
      handleSpeechChange={handleSpeechChange}
      terminalSoundsEnabled={terminalSoundsEnabled}
      setTerminalSoundsEnabled={setTerminalSoundsEnabled}
      synthPreset={synthPreset}
      handleSynthPresetChange={handleSynthPresetChange}
      masterVolume={masterVolume}
      setMasterVolume={setMasterVolume}
      setPrevMasterVolume={setPrevMasterVolume}
      handleMasterMuteToggle={handleMasterMuteToggle}
      uiVolume={uiVolume}
      setUiVolume={setUiVolume}
      setPrevUiVolume={setPrevUiVolume}
      handleUiMuteToggle={handleUiMuteToggle}
      speechVolume={speechVolume}
      setSpeechVolume={setSpeechVolume}
      setPrevSpeechVolume={setPrevSpeechVolume}
      handleSpeechMuteToggle={handleSpeechMuteToggle}
      chatSynthVolume={chatSynthVolume}
      setChatSynthVolume={setChatSynthVolume}
      setPrevChatSynthVolume={setPrevChatSynthVolume}
      handleChatSynthMuteToggle={handleChatSynthMuteToggle}
      ipodVolume={ipodVolume}
      setIpodVolume={setIpodVolume}
      setPrevIpodVolume={setPrevIpodVolume}
      handleIpodMuteToggle={handleIpodMuteToggle}
      isIOS={isIOS}
      isMacOSTheme={isMacOSTheme}
      handleCheckForUpdates={handleCheckForUpdates}
      handleBackup={handleBackup}
      fileInputRef={fileInputRef}
      handleRestore={handleRestore}
      handleResetAll={handleResetAll}
      setIsConfirmFormatOpen={setIsConfirmFormatOpen}
      shaderEffectEnabled={shaderEffectEnabled}
      setShaderEffectEnabled={setShaderEffectEnabled}
    />
  );

  const menuBar = (
    <ControlPanelsMenuBar
      onClose={onClose}
      onShowHelp={() => setIsHelpDialogOpen(true)}
      onShowAbout={() => setIsAboutDialogOpen(true)}
    />
  );

  return (
    <AppWindowShell
      isWindowOpen={isWindowOpen}
      isWindowsTheme={isWindowsTheme}
      isForeground={isForeground}
      menuBar={menuBar}
      windowFrameProps={{
        title: effectiveWindowTitle,
        onClose,
        isForeground,
        appId: "control-panels",
        skipInitialSound,
        instanceId,
        onNavigateNext,
        onNavigatePrevious,
        windowConstraints: { maxWidth: 440, minHeight: 200, maxHeight: 600 },
      }}
      trailing={
        <ControlPanelsDialogs
          t={t}
          translatedHelpItems={translatedHelpItems}
          isHelpDialogOpen={isHelpDialogOpen}
          setIsHelpDialogOpen={setIsHelpDialogOpen}
          isAboutDialogOpen={isAboutDialogOpen}
          setIsAboutDialogOpen={setIsAboutDialogOpen}
          isConfirmResetOpen={isConfirmResetOpen}
          setIsConfirmResetOpen={setIsConfirmResetOpen}
          handleConfirmReset={handleConfirmReset}
          isConfirmFormatOpen={isConfirmFormatOpen}
          setIsConfirmFormatOpen={setIsConfirmFormatOpen}
          handleConfirmFormat={handleConfirmFormat}
        />
      }
    >
        <div className="flex flex-col w-full h-full min-h-0">
          <ControlPanelsMacLayout
            t={t}
            instanceId={instanceId}
            defaultPane={initialData?.defaultTab}
            onCurrentEntryChange={setCurrentEntry}
            isMacOSTheme={isMacOSTheme}
            isSystem7Theme={isSystem7Theme}
            isWindowsTheme={isWindowsTheme}
            isWin98={isWin98}
            titlebarHeight={titlebarHeight}
            renderPane={renderMacPane}
          />
        </div>
    </AppWindowShell>
  );
}
