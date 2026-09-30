// Pages carry well over 100 images each (the homepage alone has ~150), and
// without lazy loading every one is requested the moment the page opens.
// Bursts that size from a single visitor trip Vercel's automatic DDoS
// mitigation, which then shows the "verifying your browser" checkpoint.
// Deferring off-screen images keeps each page view to a small burst.
function lazyLoadImages(html: string) {
  return html.replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async"');
}

export default function WpHtml({ html }: { html: string }) {
  return (
    <div
      className="wp-site-blocks entry-content"
      dangerouslySetInnerHTML={{ __html: lazyLoadImages(html) }}
    />
  );
}
