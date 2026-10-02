import { useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  getColorScheme,
  setColorScheme,
  subscribeColorScheme,
  type ColorScheme,
} from "@/lib/color-scheme";
import { useT } from "@/lib/i18n";

type Props = {
  /** Word plus icon, for the top of the homepage. The app header stays an icon. */
  labeled?: boolean;
};

/** Switches this device between dark and light. A stored choice is not overwritten. */
export function ColorSchemeToggle({ labeled = false }: Props) {
  const t = useT();
  const [scheme, setScheme] = useState<ColorScheme>("dark");

  useLayoutEffect(() => {
    setScheme(getColorScheme());
    return subscribeColorScheme(() => setScheme(getColorScheme()));
  }, []);

  const dark = scheme === "dark";
  const label = dark ? t("Light mode") : t("Dark mode");

  return (
    <button
      type="button"
      className={labeled ? "landing-theme-btn" : "header-icon-btn"}
      data-color-scheme-toggle={labeled ? "labeled" : "icon"}
      data-color-scheme={scheme}
      aria-label={label}
      title={label}
      onClick={() => setColorScheme(dark ? "light" : "dark")}
    >
      {dark ? (
        <Sun className={labeled ? "size-[18px]" : "size-[22px]"} strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon className={labeled ? "size-[18px]" : "size-[22px]"} strokeWidth={1.75} aria-hidden />
      )}
      {labeled ? <span>{label}</span> : null}
    </button>
  );
}
