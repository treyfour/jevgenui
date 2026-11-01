// Shared by the root layout (server) and the picker (client). Kept out of the "use client"
// file because a server component can't read plain values exported from one.

export const themes = [
  { id: "linear-light", label: "Linear Light", mode: "light", swatch: ["#f4f4f5", "#5e6ad2", "#00b8cc"] },
  { id: "linear-dark", label: "Linear Dark", mode: "dark", swatch: ["#08090a", "#7170ff", "#00b8cc"] },
  { id: "jev-sky", label: "Jev Sky", mode: "light", swatch: ["#6badcd", "#9e5ae8", "#f554c4"] },
  { id: "jev-riso", label: "Jev Riso", mode: "light", swatch: ["#f386a1", "#1e1e1e", "#3a64b0"] },
  { id: "jev-night", label: "Jev Night", mode: "dark", swatch: ["#0d0b10", "#b353e3", "#f554c4"] },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export const THEME_KEY = "theme";

const modes = Object.fromEntries(themes.map((t) => [t.id, t.mode]));
// Before the theme family existed, the saved value was just "light" or "dark".
const legacy: Record<string, ThemeId> = { light: "linear-light", dark: "linear-dark" };

/** The saved choice, otherwise Linear in the system's mode. */
export function preferredTheme(): ThemeId {
  const saved = localStorage.getItem(THEME_KEY) ?? "";
  if (saved in modes) return saved as ThemeId;
  if (saved in legacy) return legacy[saved];
  return matchMedia("(prefers-color-scheme: dark)").matches ? "linear-dark" : "linear-light";
}

/** data-theme picks the palette; data-mode drives `dark:` utilities and color-scheme. */
export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  document.documentElement.setAttribute("data-mode", modes[id]);
}

/** Inline <head> script: the same logic as preferredTheme + applyTheme, before first paint. */
export const themeScript = `(function(){try{var m=${JSON.stringify(modes)},l=${JSON.stringify(legacy)},t=localStorage.getItem("${THEME_KEY}")||"";if(!m[t])t=l[t]||(matchMedia("(prefers-color-scheme: dark)").matches?"linear-dark":"linear-light");document.documentElement.setAttribute("data-theme",t);document.documentElement.setAttribute("data-mode",m[t])}catch(e){}})()`;
