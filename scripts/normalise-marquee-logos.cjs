// Trims each brand logo to its visible edges and re-centres it vertically on a
// 250px-tall black canvas cropped to the logo's width, scaled so every logo
// carries similar visual weight. Cropping the width lets the marquee put an
// even gap between logos in the homepage "Trusted by Leading Brands" marquee.
const sharp = require("sharp");
const path = require("path");

const CANVAS_H = 250;
const TARGET_AREA = 26000; // content area (px²) on the canvas
const MAX_W = 440;
const MAX_H = 170;

const logos = {
  "aspects-of-oak": "media/aoo-white.webp",
  "auric-performance": "media/ap.webp",
  bastion: "logos/Bastion.png",
  bfb: "media/bfb.webp",
  brs: "media/brs.webp",
  captrad: "logos/Captrad.png",
  "design-with-bloom": "logos/Design With Bloom.png",
  "evolution-padel": "media/ep.webp",
  "lost-in-hound": "media/lost-in-hound-2.webp",
  mtd: "media/mtd-white.webp",
  "new-reflexions": "media/nr-white.webp",
  oriels: "media/oriels-white.webp",
  palace: "media/palace.webp",
  rnp: "media/rnp-white.webp",
  sdr: "media/sdr-2.webp",
  sms: "media/sms.webp",
  "the-loft": "media/the-loft.webp",
  trendz: "logos/Trendz.png",
  vaala: "media/vaala-white-2.webp",
  waldrons: "media/waldrons-white-2.webp",
  yvonne: "media/yvonne-3.webp",
};

const pub = (p) => path.join(__dirname, "..", "public", p);

(async () => {
  for (const [slug, src] of Object.entries(logos)) {
    const trimmed = await sharp(pub(src))
      .flatten({ background: "#000" })
      .trim({ background: "#000", threshold: 30 })
      .toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = trimmed.info;

    let scale = Math.sqrt(TARGET_AREA / (w * h));
    scale = Math.min(scale, MAX_W / w, MAX_H / h);
    const nw = Math.round(w * scale);
    const nh = Math.round(h * scale);

    const resized = await sharp(trimmed.data).resize(nw, nh).toBuffer();
    await sharp({
      create: { width: nw, height: CANVAS_H, channels: 3, background: "#000" },
    })
      .composite([{ input: resized, left: 0, top: Math.round((CANVAS_H - nh) / 2) }])
      .webp({ quality: 90 })
      .toFile(pub(`logos/marquee/${slug}.webp`));

    console.log(`${slug.padEnd(20)} ${w}x${h} -> ${nw}x${nh}`);
  }
})();
