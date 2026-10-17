/**
 * Title to append after the line-welcome heading.
 * A generic "Line N" stays unnamed so the heading does not repeat the number.
 * A real name is shown even when the line is locked, as a teaser.
 * `locked` is accepted so older call sites keep compiling. It no longer hides the name.
 */
export function welcomeLineName(name: string, _locked = false): string | null {
  const trimmed = name.trim();
  if (!trimmed || /^line\s+\d+$/i.test(trimmed)) return null;
  const titled = trimmed.match(/^line\s+\d+\s*(?:[·•]|[-–—:])\s*(.+)$/i);
  if (titled) {
    const rest = titled[1].trim();
    return rest || null;
  }
  return trimmed;
}
