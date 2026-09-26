/**
 * Open Terms or Privacy as a real document load.
 *
 * TanStack Link flushSyncs before navigate(). If that click also closes an
 * overlay, useOverlayHistory calls history.back() in the same turn and the
 * route change never sticks (website menu).
 *
 * The Play wrap is a System WebView. history.back() there is webView.goBack():
 * it tears the document down before a follow-up assign runs, so the tap
 * shows nothing. Assign the link href directly and do not go back first.
 * LauncherActivity keeps http(s) inside that WebView.
 */
export function openLegalDocument(event: {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  preventDefault(): void;
  currentTarget: { href: string };
}): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  ) {
    return;
  }
  event.preventDefault();
  window.location.assign(event.currentTarget.href);
}
