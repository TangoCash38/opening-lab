/** Plain share of the Opening Lab creator page. No code is attached to the address. */
export const CREATOR_PAGE_SHARE = "openinglab.co.uk/creator-packs/creator/your-name";

export function CreatorPromoteNote() {
  return (
    <aside className="creator-packs-form" data-creator-promote>
      <h2>Promote your packs</h2>
      <p className="creator-packs-note">
        Share your Opening Lab creator page, and tell your audience to find you there, on the website or in the app.
        Players buy on Opening Lab. A plain share of that page is enough, for example{" "}
        <span className="creator-promote-url">{CREATOR_PAGE_SHARE}</span>.
      </p>
    </aside>
  );
}
