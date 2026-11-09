import type { PhotoSlot } from "@/config/photos";

/** A photo from config/photos.ts. Renders nothing until the photo has been supplied. */
export function Photo({ photo, className = "", priority = false }: { photo: PhotoSlot; className?: string; priority?: boolean }) {
  if (!photo.src) return null;
  return (
    // Plain <img>: the site is served from Cloudflare without Next's image optimiser.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.src}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`h-auto w-full rounded-[var(--radius-panel)] object-cover ${className}`}
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
    />
  );
}
