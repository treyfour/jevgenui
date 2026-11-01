"use client";

import { Palette } from "lucide-react";
import { useLayoutEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { applyTheme, preferredTheme, THEME_KEY, themes, type ThemeId } from "@/lib/theme";

// The theme lives on <html data-theme>; read it from there rather than mirroring it in state.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const currentTheme = () => document.documentElement.getAttribute("data-theme");
const noTheme = () => null;

export function ThemePicker() {
  const theme = useSyncExternalStore(subscribe, currentTheme, noTheme);

  // React's dev-mode remount resets <html> attributes, clearing what the head script set.
  // Re-apply before paint; a no-op in production.
  useLayoutEffect(() => {
    applyTheme(preferredTheme());
  }, []);

  const choose = (id: string) => {
    localStorage.setItem(THEME_KEY, id);
    applyTheme(id as ThemeId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Choose theme">
          <Palette />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme ?? ""} onValueChange={choose}>
          {themes.map((t) => (
            <DropdownMenuRadioItem key={t.id} value={t.id}>
              <span className="flex -space-x-1">
                {t.swatch.map((c) => (
                  <span key={c} className="size-3 rounded-full ring-1 ring-border" style={{ background: c }} />
                ))}
              </span>
              {t.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
