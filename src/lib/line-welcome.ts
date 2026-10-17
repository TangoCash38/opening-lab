/**
 * Title to append after the line-welcome heading.
 * A generic "Line N", or a locked line, stays unnamed so the heading does not
 * repeat the number or reveal a hidden name.
 */
export function welcomeLineName(name: string, locked = false): string | null {
  if (locked) return null;
  const trimmed = name.trim();
  if (!trimmed || /^line\s+\d+$/i.test(trimmed)) return null;
  const titled = trimmed.match(/^line\s+\d+\s*(?:[·•]|[-–—:])\s*(.+)$/i);
  if (titled) {
    const rest = titled[1].trim();
    return rest || null;
  }
  return trimmed;
}
