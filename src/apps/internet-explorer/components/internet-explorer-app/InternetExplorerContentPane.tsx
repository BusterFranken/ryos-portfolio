import type { ReactNode, RefObject } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import type { ErrorResponse } from "@/stores/useInternetExplorerStore";
import { ErrorPage } from "./ErrorPage";

export interface InternetExplorerContentPaneProps {
  errorDetails: ErrorResponse | null;
  url: string;
  year: string;
  finalUrl: string | null;
  status: string;
  isForeground: boolean;
  currentTheme: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  loadingBarVariants: Variants;
  getDebugStatusMessage: () => ReactNode;
  handleGoBack: () => void;
  handleNavigate: (navUrl: string, navYear?: string) => void;
  handleIframeLoad: () => void;
  handleIframeError: () => void;
  bringInstanceToForeground: (instanceId: string) => void;
  instanceId: string;
}

export function InternetExplorerContentPane({
  errorDetails,
  url,
  year,
  finalUrl,
  status,
  isForeground,
  currentTheme,
  iframeRef,
  loadingBarVariants,
  getDebugStatusMessage,
  handleGoBack,
  handleNavigate,
  handleIframeLoad,
  handleIframeError,
  bringInstanceToForeground,
  instanceId,
}: InternetExplorerContentPaneProps) {
  const renderErrorPage = () => {
    if (!errorDetails) return null;

    const title =
      errorDetails.type === "network"
        ? "Cannot find server or DNS Error"
        : "Error";
    const primaryMessage = errorDetails.message || "An error occurred";
    const secondaryMessage = errorDetails.details;
    const suggestions = [
      "Check the web address you typed and try again.",
      "Go back to the previous page.",
      "Try refreshing the page.",
    ];
    const footerText = errorDetails.hostname
      ? `Host: ${errorDetails.hostname}`
      : "";

    return (
      <ErrorPage
        title={title}
        primaryMessage={primaryMessage}
        secondaryMessage={secondaryMessage}
        suggestions={suggestions}
        details={errorDetails.details}
        footerText={footerText}
        onGoBack={handleGoBack}
        onRetry={() => handleNavigate(url, year)}
      />
    );
  };

  return (
    <>
      <div className="flex-1 relative bg-white">
        {errorDetails ? (
          renderErrorPage()
        ) : (
          <iframe
            ref={iframeRef}
            src={finalUrl || ""}
            className="border-0 block"
            style={{
              width: "calc(100% + 1px)",
              height: "calc(100% + 1px)",
            }}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-pointer-lock"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}

        {!isForeground && (
          <div
            className="absolute inset-0 bg-transparent z-50"
            onClick={() => bringInstanceToForeground(instanceId)}
            onMouseDown={() => bringInstanceToForeground(instanceId)}
            onTouchStart={() => bringInstanceToForeground(instanceId)}
            onWheel={() => bringInstanceToForeground(instanceId)}
            onDragStart={() => bringInstanceToForeground(instanceId)}
            onKeyDown={() => bringInstanceToForeground(instanceId)}
          />
        )}

        <AnimatePresence>
          {status === "loading" && (
            <motion.div
              className="absolute top-0 left-0 right-0 bg-transparent backdrop-blur-sm overflow-hidden z-40"
              variants={loadingBarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="h-full animate-progress-indeterminate" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15 }}
            className={`os-status-bar os-status-bar-text font-geneva-12 absolute bottom-0 left-0 right-0 bg-neutral-100 dark:bg-neutral-900 text-[10px] px-2 py-1 flex items-center z-50 ${
              currentTheme === "system7"
                ? "border-t border-black"
                : "border-t border-neutral-300 dark:border-white/10"
            }`}
          >
            <div className="flex-1 truncate">{getDebugStatusMessage()}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
