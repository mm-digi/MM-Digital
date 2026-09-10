export type ClientUser = {
  username: string;
  slug: string;
  passwordHash: string;
};

export const CLIENT_USERS: ClientUser[] = [
  { username: "auric-performance", slug: "auric-performance-dashboard", passwordHash: "$2b$12$twVjSFpQqYV1KDFM89wXeeFXAir0IpsTAzWwqofMmTq2qY5ixoWAi" },
  { username: "aspects-of-oak", slug: "aspects-of-oak-dashboard", passwordHash: "$2b$12$ImGZztv0WP/5197qCptRGePlids1slz2/3BqJM16lZvknnkB4VFGS" },
  { username: "bfb-carpentry", slug: "bfb-carpentry-dashboard", passwordHash: "$2b$12$dr8wetnFhWilvxF2jv3u3.9XlbkgzHeQx5ycrKRZKvUh/0rtcfXuW" },
  { username: "lost-in-hound", slug: "lost-in-hound-dashboard", passwordHash: "$2b$12$dXH87TmBQDj7r5NfmROgfeO7gCX5lsrX3iYQhfOkk8/L0t0UACx4i" },
  { username: "mtd-complete", slug: "mtd-complete-dashboard", passwordHash: "$2b$12$xkoPMVDAn.rF4UgRhQ4uCemF0NFDfLDz/WcUO6YmBXDS2kGPWQdx6" },
  { username: "oriels-client", slug: "oriels-exeter-dashboard", passwordHash: "$2b$12$ZCJjWVOnRNIk7I/OV1WtluwKXNrJUSCfqISxvT6CSy3TTBkMMZfNG" },
  { username: "the-palace-nightclub", slug: "palace-nightclub-dashboard", passwordHash: "$2b$12$W6rxQliOW34jrJxmw/8df.x3oKDzibSgAXWGQvoVBc3sxejNOKLlC" },
  { username: "richard-n-Philip", slug: "richard-n-philip-dashboard", passwordHash: "$2b$12$zRaW6WAjngDWrDobAyC/n.cuFwb8Y8drT4gyyUpky8XmlussIIgoO" },
  { username: "sdr-the-car-buying-service", slug: "sdr-the-car-buying-service-dashboard", passwordHash: "$2b$12$Cia5XGGVg4w6pgo3b6LRt.hMl1MaWJe/P20Fb0SdzEHOAX0a//I9O" },
  { username: "yvonne-coomber-client", slug: "yvonne-coomber-art-dashboard", passwordHash: "$2b$12$ghhn8KZ57afqE/Act7jn9uCugHjnFmjjk464GcSXwKnQbCv6SMuOG" },
  { username: "captrad", slug: "captrad-dashboard", passwordHash: "$2b$12$ZxqcR1G85rbOEfoDt5zN7urtlRQ8yJCiRda78iX2KzibR401Ef7yu" },
  { username: "vaala-client", slug: "vaala-dashboard", passwordHash: "$2b$12$k4vuUWoGm9Xfcs7XrXjF5./Vi243rwQ7rno2JnltKEut8WkFN5zL6" },
  { username: "waldrons-patisserie-client", slug: "waldrons-patisserie-dashboard", passwordHash: "$2b$12$cGd9wB7bmux.e3UydjHSIOs9kzrWJFeM3H45gmbPmX56cCYWq0yuK" },
  { username: "brs-bristol", slug: "brs-bristol-dashboard", passwordHash: "$2b$12$I6OOPz4EMSeBTbfjOXqSWuhagToYlWe.qXCzgMRUoHBijgHnTGcKG" },
  { username: "evolution-padel", slug: "evolution-padel-2", passwordHash: "$2b$12$wMWktOwx05fzs0y/bSTzY.THddkgHzQRcD/O9njPm5jhPQoyBnCsG" },
  { username: "new-reflexions", slug: "new-reflexions-dashboard", passwordHash: "$2b$12$wQjES06u1/pRPSwu./KM2uW5WOl239KybJ2KYL7rSZh4a4wT8g2y." },
  { username: "search-mortgage-solutions", slug: "search-mortgage-solutions-dashboard", passwordHash: "$2b$12$KsWIrbJrqISpWkGFtOcIBuJfOB/gtVNMitDXoXqth5wEGkvnpiZ5y" },
  { username: "the-loft-hair-studio-client", slug: "the-loft-hair-studio-dashboard", passwordHash: "$2b$12$J18R/vuk9i2tOWEPSpQZWO.G/PFrA6NUaRsA.hGjofLPUgRxL/NOC" },
  { username: "tors-vodka-client", slug: "tors-vodka-dashboard", passwordHash: "$2b$12$c4k15UQfyHoUUs.lVjIOjuh3JdjYgevcgZcuHsmjhfZyHEgR7diJu" },
  { username: "trendz", slug: "trendz-dashboard", passwordHash: "$2b$12$XZFPq/7IZJz4sDhSifAYW.X4i/GC9H5qW5c.N8.RJjd5Fk6jfn8ri" },
  { username: "bastion", slug: "bastion-dashboard", passwordHash: "$2b$12$D50b3JspWokrOjXJ8fpa0egDNct/OGJJiU62oUNZ8sfrvfy1VNJMS" },
  { username: "design-with-bloom", slug: "design-with-bloom-dashboard", passwordHash: "$2b$12$1lf9lIpkXw4Vqr8/Jv5P2.nf2QmlKuE/SBtibCkU.sburB8O77IaK" },
];

export function findUser(username: string) {
  const needle = username.trim().toLowerCase();
  return CLIENT_USERS.find((u) => u.username.toLowerCase() === needle);
}
