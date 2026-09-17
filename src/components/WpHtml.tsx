export default function WpHtml({ html }: { html: string }) {
  let headingCount = 0;
  let closingHeadingCount = 0;
  const accessibleHtml = html
    .replace(/<h1(\s[^>]*)?>/gi, (match) => {
      headingCount += 1;
      return headingCount === 1 ? match : match.replace(/^<h1/i, "<h2");
    })
    .replace(/<\/h1>/gi, (match) => {
      closingHeadingCount += 1;
      return closingHeadingCount === 1 ? match : "</h2>";
    })
    .replace(/(<img\b[^>]*?)\s+alt=(['"])(?:\s*)\2/gi, (match, before, quote) => {
      const source = before.match(/src=(['"])([^'"]+)\1/i)?.[2] || "MM Digital image";
      const filename = source.split("/").pop()?.split("?")[0]?.replace(/[-_]+/g, " ").replace(/\.[^.]+$/, "");
      return `${before} alt=${quote}${filename || "MM Digital image"}${quote}`;
    });

  return (
    <div
      className="wp-site-blocks entry-content"
      dangerouslySetInnerHTML={{ __html: accessibleHtml }}
    />
  );
}
