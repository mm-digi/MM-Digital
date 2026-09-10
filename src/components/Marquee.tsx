export default function Marquee({
  items,
  height = 52,
}: {
  items: { src: string; alt: string }[];
  height?: number;
}) {
  const loop = [...items, ...items];
  return (
    <div className="marquee py-6">
      <div className="marquee-track items-center">
        {loop.map((item, i) => (
          <img
            key={`${item.src}-${i}`}
            src={item.src}
            alt={item.alt}
            style={{ height }}
            className="w-auto object-contain opacity-90"
          />
        ))}
      </div>
    </div>
  );
}
