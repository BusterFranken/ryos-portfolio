import type { RefObject } from "react";
import type { ReactNode } from "react";
import type { LanguageCode } from "@/stores/useLanguageStore";
import type { OsThemeId } from "@/themes/types";
import type { AccentChrome, AccentId } from "@/themes/accents";
import type { TabStyleConfig } from "@/utils/tabStyles";
import {
  type ControlPanelPaneId,
} from "./controlPanelsCategories";
import { AppearancePaneContent } from "./AppearancePaneContent";
import { DesktopScreenSaverPaneContent } from "./DesktopScreenSaverPaneContent";
import { InternationalPaneContent } from "./InternationalPaneContent";
import { SoundPaneContent } from "./SoundPaneContent";
import { DisplaysPaneContent } from "./DisplaysPaneContent";
import { SharingPaneContent } from "./SharingPaneContent";
import { SoftwareUpdatePaneContent } from "./SoftwareUpdatePaneContent";

export type ControlPanelsMacPaneRendererProps = {
  paneId: ControlPanelPaneId;
  onNavigateToPane?: (paneId: ControlPanelPaneId) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  tabStyles: TabStyleConfig;
  currentTheme: OsThemeId;
  setTheme: (theme: OsThemeId) => void;
  aquaMaterial: "classic" | "glass";
  setAquaMaterial: (material: "classic" | "glass") => void;
  supportsDarkMode: boolean;
  darkModePreference: "system" | "light" | "dark";
  setDarkMode: (mode: "system" | "light" | "dark") => void;
  supportsAccent: boolean;
  accent: AccentId;
  accentChrome: AccentChrome | null;
  setAccent: (accent: AccentId) => void;
  wallpaperAccentColor: string | null;
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  uiSoundsEnabled: boolean;
  handleUISoundsChange: (enabled: boolean) => void;
  speechEnabled: boolean;
  handleSpeechChange: (enabled: boolean) => void;
  terminalSoundsEnabled: boolean;
  setTerminalSoundsEnabled: (enabled: boolean) => void;
  synthPreset: string;
  handleSynthPresetChange: (preset: string) => void;
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  setPrevMasterVolume: (volume: number) => void;
  handleMasterMuteToggle: () => void;
  uiVolume: number;
  setUiVolume: (volume: number) => void;
  setPrevUiVolume: (volume: number) => void;
  handleUiMuteToggle: () => void;
  speechVolume: number;
  setSpeechVolume: (volume: number) => void;
  setPrevSpeechVolume: (volume: number) => void;
  handleSpeechMuteToggle: () => void;
  chatSynthVolume: number;
  setChatSynthVolume: (volume: number) => void;
  setPrevChatSynthVolume: (volume: number) => void;
  handleChatSynthMuteToggle: () => void;
  ipodVolume: number;
  setIpodVolume: (volume: number) => void;
  setPrevIpodVolume: (volume: number) => void;
  handleIpodMuteToggle: () => void;
  isIOS: boolean;
  isMacOSTheme: boolean;
  handleCheckForUpdates: () => void;
  handleBackup: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleResetAll: () => void;
  setIsConfirmFormatOpen: (open: boolean) => void;
  shaderEffectEnabled: boolean;
  setShaderEffectEnabled: (enabled: boolean) => void;
};

export function ControlPanelsMacPaneRenderer(
  props: ControlPanelsMacPaneRendererProps
): ReactNode {
  const { paneId, t } = props;

  switch (paneId) {
    case "appearance":
      return (
        <AppearancePaneContent
          t={t}
          currentTheme={props.currentTheme}
          setTheme={props.setTheme}
          aquaMaterial={props.aquaMaterial}
          setAquaMaterial={props.setAquaMaterial}
          supportsDarkMode={props.supportsDarkMode}
          darkModePreference={props.darkModePreference}
          setDarkMode={props.setDarkMode}
          supportsAccent={props.supportsAccent}
          accent={props.accent}
          accentChrome={props.accentChrome}
          setAccent={props.setAccent}
          wallpaperAccentColor={props.wallpaperAccentColor}
          tabStyles={props.tabStyles}
        />
      );
    case "desktop-screen-saver":
      return <DesktopScreenSaverPaneContent t={t} />;
    case "international":
      return (
        <InternationalPaneContent
          t={t}
          currentLanguage={props.currentLanguage}
          setLanguage={props.setLanguage}
        />
      );
    case "sound":
      return (
        <SoundPaneContent
          t={t}
          uiSoundsEnabled={props.uiSoundsEnabled}
          handleUISoundsChange={props.handleUISoundsChange}
          speechEnabled={props.speechEnabled}
          handleSpeechChange={props.handleSpeechChange}
          terminalSoundsEnabled={props.terminalSoundsEnabled}
          setTerminalSoundsEnabled={props.setTerminalSoundsEnabled}
          synthPreset={props.synthPreset}
          handleSynthPresetChange={props.handleSynthPresetChange}
          masterVolume={props.masterVolume}
          setMasterVolume={props.setMasterVolume}
          setPrevMasterVolume={props.setPrevMasterVolume}
          handleMasterMuteToggle={props.handleMasterMuteToggle}
          uiVolume={props.uiVolume}
          setUiVolume={props.setUiVolume}
          setPrevUiVolume={props.setPrevUiVolume}
          handleUiMuteToggle={props.handleUiMuteToggle}
          speechVolume={props.speechVolume}
          setSpeechVolume={props.setSpeechVolume}
          setPrevSpeechVolume={props.setPrevSpeechVolume}
          handleSpeechMuteToggle={props.handleSpeechMuteToggle}
          chatSynthVolume={props.chatSynthVolume}
          setChatSynthVolume={props.setChatSynthVolume}
          setPrevChatSynthVolume={props.setPrevChatSynthVolume}
          handleChatSynthMuteToggle={props.handleChatSynthMuteToggle}
          ipodVolume={props.ipodVolume}
          setIpodVolume={props.setIpodVolume}
          setPrevIpodVolume={props.setPrevIpodVolume}
          handleIpodMuteToggle={props.handleIpodMuteToggle}
          isIOS={props.isIOS}
        />
      );
    case "displays":
      return (
        <DisplaysPaneContent
          t={t}
          shaderEffectEnabled={props.shaderEffectEnabled}
          setShaderEffectEnabled={props.setShaderEffectEnabled}
        />
      );
    case "sharing":
      return (
        <SharingPaneContent
          t={t}
          handleBackup={props.handleBackup}
          fileInputRef={props.fileInputRef}
          handleRestore={props.handleRestore}
          handleResetAll={props.handleResetAll}
          setIsConfirmFormatOpen={props.setIsConfirmFormatOpen}
        />
      );
    case "software-update":
      return (
        <SoftwareUpdatePaneContent
          t={t}
          handleCheckForUpdates={props.handleCheckForUpdates}
        />
      );
    default:
      return null;
  }
}
