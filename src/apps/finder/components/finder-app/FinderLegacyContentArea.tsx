import { FinderFileListContent, type FinderFileListContentProps } from "./FinderFileListContent";
import type { TFunction } from "i18next";

export interface FinderLegacyContentAreaProps {
  t: TFunction;
  sortedFilesCount: number;
  storageSpaceAvailable: number;
  fileListContentProps: FinderFileListContentProps;
}

export function FinderLegacyContentArea({
  t,
  sortedFilesCount,
  storageSpaceAvailable,
  fileListContentProps,
}: FinderLegacyContentAreaProps) {
  return (
    <>
      <FinderFileListContent
        {...fileListContentProps}
        listClassName="flex-1 bg-white"
      />
      <div className="os-status-bar os-status-bar-text flex items-center justify-between px-2 py-1 text-[10px] font-geneva-12 bg-neutral-100 border-t border-neutral-300">
        <span>
          {sortedFilesCount}{" "}
          {sortedFilesCount !== 1
            ? t("apps.finder.statusBar.items")
            : t("apps.finder.statusBar.item")}
        </span>
        <span>
          {Math.round((storageSpaceAvailable / 1024 / 1024) * 10) / 10} MB{" "}
          {t("apps.finder.statusBar.available")}
        </span>
      </div>
    </>
  );
}
