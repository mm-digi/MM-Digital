import type { Metadata } from "next";
import { extractTitleFromHtml } from "@/lib/wp";

// Search and sharing details for a top-level page. Each page names itself as
// the canonical URL (otherwise it inherits the homepage's and Google treats it
// as a duplicate), and gets its own title and description in link previews.
export const SITE = "https://mm-digi.co.uk";
export const ORG_ID = `${SITE}/#organization`;
export const SITE_ID = `${SITE}/#website`;

const SHARE_IMAGE = {
  url: "/media/mm-digital-footer-image-1090df6.webp",
  alt: "MM Digital",
};

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const fullTitle = `${title} | MM Digital`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: "MM Digital",
      url: path,
      title: fullTitle,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
      images: [SHARE_IMAGE.url],
    },
  };
}

export function shareImage() {
  return SHARE_IMAGE;
}

type Crumb = { name: string; path: string };

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  if (path === "/") return `${SITE}/`;
  return `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationNode() {
  return {
    "@type": "MarketingAgency",
    "@id": ORG_ID,
    name: "MM Digital",
    legalName: "MM Digital Marketing Limited",
    url: `${SITE}/`,
    slogan: "From Concept To Conversion",
    email: "info@mm-digi.co.uk",
    telephone: "+447880601123",
    vatID: "GB527650580",
    identifier: {
      "@type": "PropertyValue",
      propertyID: "UK Company Number",
      value: "16994209",
    },
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SHARE_IMAGE.url),
    },
    image: absoluteUrl(SHARE_IMAGE.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Admiral Way",
      addressLocality: "Exeter",
      addressRegion: "Devon",
      postalCode: "EX2 7GA",
      addressCountry: "GB",
    },
    areaServed: ["Exeter", "Devon", "United Kingdom", "Europe"],
    sameAs: [
      "https://www.facebook.com/p/MM-Digital-61556568016532/",
      "https://www.instagram.com/_mmdigital_/",
      "https://www.linkedin.com/company/mmdigi/posts/?feedView=all",
      "https://www.tiktok.com/@mmdigimarketing",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+447880601123",
      email: "info@mm-digi.co.uk",
      contactType: "sales",
      areaServed: ["GB", "Europe"],
      availableLanguage: ["English"],
    },
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: `${SITE}/`,
    name: "MM Digital",
    description:
      "We help businesses grow with SEO, web design and digital marketing. Based in Exeter, UK.",
    publisher: { "@id": ORG_ID },
    inLanguage: "en-GB",
  };
}

export function webPageNode(options: { type?: string; name: string; path: string; description: string }) {
  const url = absoluteUrl(options.path);
  return {
    "@type": options.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: options.name,
    description: options.description,
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en-GB",
  };
}

export function breadcrumbNode(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

function decodeText(fragment: string) {
  return fragment
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;|&#0*38;/g, "&")
    .replace(/&nbsp;|&#0*160;/g, " ")
    .replace(/&#0*39;|&rsquo;|&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&mdash;|&#0*8212;/g, "—")
    .replace(/&ndash;|&#0*8211;/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

export function faqNode(html: string) {
  const entities = [];
  const pattern =
    /<details class="mmp-faq-item">\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/gi;
  for (const match of html.matchAll(pattern)) {
    const name = decodeText(match[1]);
    const text = decodeText(match[2]);
    if (!name || !text) continue;
    entities.push({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text },
    });
  }
  if (entities.length === 0) return null;
  return {
    "@type": "FAQPage",
    "@id": `${SITE}/pricing/#faq`,
    url: `${SITE}/pricing/`,
    mainEntity: entities,
  };
}

export function serviceListNode(html: string) {
  const nav = html.match(/<nav class="mds-switch"[\s\S]*?<\/nav>/);
  if (!nav) return null;
  const names = [...nav[0].matchAll(/<span>([\s\S]*?)<\/span>/g)]
    .map((match) => decodeText(match[1]))
    .filter(Boolean);
  if (names.length === 0) return null;
  return {
    "@type": "ItemList",
    "@id": `${SITE}/digital-services/#services`,
    name: "Digital services from MM Digital",
    numberOfItems: names.length,
    itemListElement: names.map((name, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name,
        url: `${SITE}/digital-services/`,
        provider: { "@id": ORG_ID },
        areaServed: ["Exeter", "Devon", "United Kingdom", "Europe"],
      },
    })),
  };
}

export function blogCards(html: string) {
  const cards = [];
  const pattern = /<a class="blog-card"[^>]*href="(\/[^"]+)"[\s\S]*?<h2>([\s\S]*?)<\/h2>/g;
  for (const match of html.matchAll(pattern)) {
    const path = match[1].endsWith("/") ? match[1] : `${match[1]}/`;
    const title = decodeText(match[2]);
    if (title) cards.push({ path, title });
  }
  return cards;
}

export function blogListNode(html: string) {
  const cards = blogCards(html);
  if (cards.length === 0) return null;
  return {
    "@type": "ItemList",
    "@id": `${SITE}/blogs/#posts`,
    name: "Marketing Blog & Insights",
    numberOfItems: cards.length,
    itemListElement: cards.map((card, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: card.title,
      url: absoluteUrl(card.path),
    })),
  };
}

const MONTHS: Record<string, string> = {
  january: "01",
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sep: "09",
  sept: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12",
};

export function parseBlogDate(text: string) {
  const dayMonth = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/);
  const monthDay = text.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/);
  const monthYear = text.match(/([A-Za-z]+)\s+(\d{4})/);
  if (dayMonth) {
    const month = MONTHS[dayMonth[2].toLowerCase()];
    if (!month) return null;
    return `${dayMonth[3]}-${month}-${dayMonth[1].padStart(2, "0")}`;
  }
  if (monthDay) {
    const month = MONTHS[monthDay[1].toLowerCase()];
    if (!month) return null;
    return `${monthDay[3]}-${month}-${monthDay[2].padStart(2, "0")}`;
  }
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()];
    if (!month) return null;
    return `${monthYear[2]}-${month}`;
  }
  return null;
}

export function blogDetails(html: string) {
  if (!html.includes('class="mm-blog"')) return null;
  const imageTag = html.match(/<img class="hero-image"[^>]*>/);
  const image = imageTag?.[0].match(/\ssrc="([^"]+)"/)?.[1] ?? null;
  const imageAlt = imageTag?.[0].match(/\salt="([^"]*)"/)?.[1];
  const author = html.match(/<div class="mm-author"[\s\S]*?<strong>([\s\S]*?)<\/strong>/);
  const dateText = html.match(/<p class="meta">([\s\S]*?)<\/p>/);
  const title = extractTitleFromHtml(html);
  if (!title) return null;
  return {
    title,
    image,
    imageAlt: imageAlt ? decodeText(imageAlt) : title,
    author: author ? decodeText(author[1]) : null,
    datePublished: dateText ? parseBlogDate(decodeText(dateText[1])) : null,
  };
}

export function blogPostingNode(html: string, slug: string, description: string | null) {
  const details = blogDetails(html);
  if (!details) return null;
  const url = `${SITE}/${slug}/`;
  const image = details.image ? absoluteUrl(details.image) : null;
  const author =
    !details.author || details.author === "MM Digital"
      ? { "@id": ORG_ID }
      : { "@type": "Person", name: details.author };
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: details.title,
    ...(description ? { description } : {}),
    ...(image
      ? {
          image: {
            "@type": "ImageObject",
            url: image,
            caption: details.imageAlt,
          },
        }
      : {}),
    ...(details.datePublished ? { datePublished: details.datePublished } : {}),
    author,
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: url,
    isPartOf: { "@id": `${SITE}/blogs/#webpage` },
    inLanguage: "en-GB",
  };
}
