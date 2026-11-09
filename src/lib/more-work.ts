// "More of our work" strip near the bottom of every case study. Each one links
// to the next three in the Our Work order (wrapping round), so every case study
// is linked from three others as well as from Our Work.

const CASE_STUDIES = [
  { slug: "lost-in-hound-case-study", name: "Lost In Hound", line: "From brand concept to thriving ecommerce brand", image: "/media/work/lost-in-hound-photo.webp" },
  { slug: "oriels-case-study", name: "Oriels Exeter", line: "One of the city’s most in-demand venues", image: "/media/work/oriels-photo.webp" },
  { slug: "yvonne-coombers-case-study", name: "Yvonne Coomber", line: "Growing an artist’s online presence and reach", image: "/media/work/yvonne.webp" },
  { slug: "auric-performance-case-study", name: "Auric Performance", line: "A brand and digital presence built from scratch", image: "/media/work/auric-photo.webp" },
  { slug: "waldrons-patisseries-case-study", name: "Waldron’s Patisserie", line: "Expanding reach across UK foodservice", image: "/media/work/waldrons.webp" },
  { slug: "sdr-case-study", name: "SDR", line: "Driving more car sellers to the car buying service", image: "/media/work/sdr-photo.webp" },
  { slug: "aspects-of-oaks-case-study", name: "Aspects Of Oak", line: "A stronger presence in high-end carpentry", image: "/media/work/aspects-oak.webp" },
  { slug: "vaala-case-study", name: "Vaala", line: "Growth through targeted lead generation", image: "/media/work/vaala-photo.webp" },
  { slug: "evolution-padel-case-study", name: "Evolution Padel", line: "A padel brand built from the ground up", image: "/media/work/evolution-padel-photo.webp" },
];

const STYLE = `<style>
.mmx-more { background: #000; color: #fff; padding: 72px 0 24px; }
.mmx-more * { box-sizing: border-box; }
.mmx-wrap { max-width: 1600px; margin: 0 auto; padding: 0 48px; }
.mmx-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
.mmx-more h2 { margin: 0; font-family: "Libre Baskerville", Georgia, serif !important; font-weight: 400; font-size: clamp(1.7rem, 3vw, 2.8rem); line-height: 1.1; letter-spacing: -0.02em; color: #fff; }
.mmx-all { color: #ff808b !important; text-decoration: none; font-size: 1rem; }
.mmx-all:hover { text-decoration: underline; }
.mmx-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.mmx-card { display: flex; flex-direction: column; color: #fff !important; text-decoration: none !important; }
.mmx-img { aspect-ratio: 4 / 3; overflow: hidden; border-radius: 14px; background: #111; }
.mmx-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
.mmx-card:hover .mmx-img img, .mmx-card:focus-visible .mmx-img img { transform: scale(1.04); }
.mmx-card h3 { margin: 16px 0 4px; font-family: "Libre Baskerville", Georgia, serif !important; font-weight: 400; font-size: 1.35rem; color: #fff; }
.mmx-card p { margin: 0; color: rgba(255, 255, 255, 0.72); font-size: 0.98rem; line-height: 1.45; }
.mmx-card span { margin-top: 10px; color: #ff808b; font-size: 0.95rem; }
@media (max-width: 900px) {
  .mmx-wrap { padding: 0 20px; }
  .mmx-grid { grid-template-columns: 1fr; gap: 28px; }
  .mmx-more { padding: 56px 0 16px; }
}
@media (prefers-reduced-motion: reduce) { .mmx-img img { transition: none; } }
</style>`;

function moreWork(slug: string) {
  const index = CASE_STUDIES.findIndex((item) => item.slug === slug);
  if (index < 0) return "";
  const picks = [1, 2, 3].map((step) => CASE_STUDIES[(index + step) % CASE_STUDIES.length]);
  const cards = picks
    .map(
      (item) =>
        `<a class="mmx-card" href="/${item.slug}/"><div class="mmx-img"><img src="${item.image}" alt="${item.name} case study" loading="lazy" decoding="async"></div><h3>${item.name}</h3><p>${item.line}</p><span>Read the case study <span aria-hidden="true">→</span></span></a>`,
    )
    .join("");
  return `${STYLE}<section class="mmx-more" aria-labelledby="mmx-more-title"><div class="mmx-wrap"><div class="mmx-head"><h2 id="mmx-more-title">More of our work</h2><a class="mmx-all" href="/our-work/">See all our work →</a></div><div class="mmx-grid">${cards}</div></div></section>`;
}

// Slots the strip in just above the case study's closing "Get in touch" section.
export function withMoreWork(html: string, slug: string) {
  const strip = moreWork(slug);
  if (!strip) return html;
  const cta = html.search(/<section class="[a-z]+-cta"/);
  return cta < 0 ? html + strip : html.slice(0, cta) + strip + html.slice(cta);
}
