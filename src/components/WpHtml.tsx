export default function WpHtml({ html }: { html: string }) {
  return (
    <div
      className="wp-site-blocks entry-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
