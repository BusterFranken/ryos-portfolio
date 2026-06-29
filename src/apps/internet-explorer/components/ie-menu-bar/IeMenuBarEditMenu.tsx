import {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "@/components/ui/menubar";
import type { InternetExplorerMenuBarViewModel } from "./useInternetExplorerMenuBar";

export function IeMenuBarEditMenu({
  vm,
}: {
  vm: InternetExplorerMenuBarViewModel;
}) {
  const { t, onRefresh, onStop, isLoading } = vm;

  return (
    <MenubarMenu>
      <MenubarTrigger className="px-2 py-1 text-md focus-visible:ring-0">
        {t("common.menu.edit")}
      </MenubarTrigger>
      <MenubarContent align="start" sideOffset={1} className="px-0">
        <MenubarItem onClick={onRefresh} className="text-md h-6 px-3">
          {t("apps.internet-explorer.menu.refresh")}
        </MenubarItem>
        <MenubarItem
          onClick={onStop}
          disabled={!isLoading}
          className={
            !isLoading
              ? "text-neutral-400 text-md h-6 px-3"
              : "text-md h-6 px-3"
          }
        >
          {t("apps.internet-explorer.menu.stop")}
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
