import { propertyTypeLabels, type PropertyType } from "@/lib/listings/types";

/** Deterministic hue from a string so each listing gets a stable color. */
function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

/**
 * Self-contained SVG placeholder used in place of real listing photos (which
 * require a licensed feed). Seeded by the listing id so each card looks
 * distinct, and clearly marked as a sample.
 */
export function ListingImage({
  id,
  propertyType,
  className = "",
}: {
  id: string;
  propertyType: PropertyType;
  className?: string;
}) {
  const hue = hueFromId(id);
  const c1 = `hsl(${hue} 55% 55%)`;
  const c2 = `hsl(${(hue + 40) % 360} 50% 42%)`;
  const gid = `g-${id}`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 400 240"
        className="h-full w-full"
        role="img"
        aria-label={`${propertyTypeLabels[propertyType]} sample image`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <rect width="400" height="240" fill={`url(#${gid})`} />
        {/* simple house silhouette */}
        <g fill="rgba(255,255,255,0.92)">
          <path d="M200 78 L286 148 L114 148 Z" />
          <rect x="134" y="146" width="132" height="60" rx="3" />
          <rect x="180" y="170" width="26" height="36" fill={c2} />
          <rect x="222" y="160" width="26" height="22" fill={c2} />
        </g>
      </svg>
      <span className="absolute left-2 top-2 rounded bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">
        Sample photo
      </span>
    </div>
  );
}
