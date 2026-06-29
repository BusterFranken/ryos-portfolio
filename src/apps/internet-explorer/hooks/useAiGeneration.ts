/**
 * Internet Explorer "Time Machine" AI generation — STUBBED.
 *
 * The original hook streamed an AI-generated "future" version of a website
 * from the removed `/api/ie-generate` endpoint. The static portfolio build
 * has no backend, so generation is a no-op: plain URL / iframe browsing is
 * unaffected (that path lives in `InternetExplorerContentPane`, not here).
 *
 * The exported interface is preserved verbatim so `useInternetExplorerLogic`
 * compiles unchanged.
 */

interface UseAiGenerationProps {
  onLoadingChange?: (isLoading: boolean) => void;
  customTimeline?: { [year: string]: string };
}

interface UseAiGenerationReturn {
  generateFuturisticWebsite: (
    url: string,
    year: string,
    signal?: AbortSignal,
    prefetchedTitle?: string | null,
    currentHtmlContent?: string | null
  ) => Promise<void>;
  aiGeneratedHtml: string | null;
  isAiLoading: boolean;
  isFetchingWebsiteContent: boolean;
  stopGeneration: () => void;
}

export function useAiGeneration(
  _props: UseAiGenerationProps = {}
): UseAiGenerationReturn {
  return {
    generateFuturisticWebsite: async () => {},
    aiGeneratedHtml: null,
    isAiLoading: false,
    isFetchingWebsiteContent: false,
    stopGeneration: () => {},
  };
}
