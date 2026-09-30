// Blog posts that go live automatically at a set time. Until then the post
// itself returns a 404, its card is removed from every blog slider, and it's
// left out of the sitemap. Add a post here with its UK go-live time (BST is
// +01:00, GMT is +00:00); once the time has passed the entry can be deleted.
export const SCHEDULED_POSTS: Record<string, string> = {
  "local-seo-how-to-get-your-business-found-on-google": "2026-10-02T00:00:00+01:00",
};

export function isUnpublished(slug: string, now = new Date()): boolean {
  const goLive = SCHEDULED_POSTS[slug];
  return Boolean(goLive) && now < new Date(goLive);
}

// Strips the blog cards (`<a class="blog-card" href="/slug/">…</a>`) of any
// post that hasn't gone live yet. Cards never contain another link, so the
// first closing </a> ends the card.
export function hideUnpublishedCards(html: string, now = new Date()): string {
  for (const slug of Object.keys(SCHEDULED_POSTS)) {
    if (!isUnpublished(slug, now)) continue;
    const open = `<a class="blog-card" href="/${slug}/">`;
    let start = html.indexOf(open);
    while (start !== -1) {
      const end = html.indexOf("</a>", start) + "</a>".length;
      html = html.slice(0, start) + html.slice(end).replace(/^\s*\n/, "");
      start = html.indexOf(open);
    }
  }
  return html;
}
