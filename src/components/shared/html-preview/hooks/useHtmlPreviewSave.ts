import { saveBlobToDevice } from "@/utils/nativeFileDialogs";

export function useHtmlPreviewSave(
  getProcessedHtmlContent: () => string
) {
  const handleSaveToDisk = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([getProcessedHtmlContent()], { type: "text/html" });
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .substring(0, 19);
    void saveBlobToDevice(blob, `ryOS-generated-${timestamp}.html`, {
      filters: [{ name: "HTML", extensions: ["html"] }],
    });
  };

  return {
    handleSaveToDisk,
  };
}
