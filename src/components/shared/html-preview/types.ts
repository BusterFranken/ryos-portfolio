// Component to render ryOS Code Previews
export interface HtmlPreviewProps {
  htmlContent: string;
  onInteractionChange?: (isInteracting: boolean) => void;
  isStreaming?: boolean;
  maxHeight?: number | string;
  minHeight?: number | string;
  minWidth?: number | string;
  initialFullScreen?: boolean;
  className?: string;
  playElevatorMusic?: (mode?: "past" | "future" | "now") => void;
  stopElevatorMusic?: () => void;
  playDingSound?: () => void;
  maximizeSound?: { play: () => void };
  minimizeSound?: { play: () => void };
  isInternetExplorer?: boolean;
  baseUrlForAiContent?: string;
  mode?: "past" | "future" | "now";
}
