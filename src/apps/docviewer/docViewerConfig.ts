import type { AppId } from "@/config/appRegistryData";

/** A document rendered by the DocViewer window (one per app id). */
export interface DocViewerDoc {
  appId: AppId;
  title: string;
  mode: "pdf";
  /** Public path to the document. Deferred until the file is dropped in. */
  src?: string;
}

export const docViewerDocs: Partial<Record<AppId, DocViewerDoc>> = {
  "cv-pdf": {
    appId: "cv-pdf",
    title: "Résumé",
    mode: "pdf",
    src: "/assets/documents/resume-buster.pdf",
  },
};

export function resolveDoc(appId: AppId): DocViewerDoc | undefined {
  return docViewerDocs[appId];
}
