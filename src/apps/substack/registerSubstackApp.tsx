import type { AppProps } from "@/apps/base/types";
import { createLazyComponent } from "@/config/lazyAppComponent";
import { SubstackWindow } from "./components/SubstackWindow";

export function makeSubstackApp() {
  const SubstackApp = (props: AppProps) => (
    <SubstackWindow appId="substack" {...props} />
  );
  return createLazyComponent(
    () => Promise.resolve({ default: SubstackApp }),
    "substack"
  );
}
