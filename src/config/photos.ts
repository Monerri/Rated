/**
 * Photographs used around the site. Each slot stays hidden until its file is
 * added: put the image in /public/photos and set `src` (for example
 * "/photos/home-hero.jpg"). Width and height must match the file.
 * Photos must be ones we have the right to use, and must not suggest a
 * particular specialist did the work unless they did.
 */
export interface PhotoSlot {
  /** Path under /public, or null until supplied. */
  src: string | null;
  /** Describes the photo for screen readers. Update it to match the real image. */
  alt: string;
  /** Width and height in pixels of the file to supply (sets the aspect ratio). */
  width: number;
  height: number;
}

export const photos = {
  /** Homepage, beside the headline. Portrait 4:5. */
  homeHero: {
    src: "/photos/home-hero.jpg",
    alt: "A couple chatting at a farmhouse table in a bright kitchen extension with roof windows and doors open to the garden",
    width: 922,
    height: 1152,
  },
  /** Homepage, beside the four checks. Landscape 5:4. */
  homeChecks: {
    src: "/photos/home-checks.jpg",
    alt: "Close-up of a sage-green timber window fitted into an old brick wall above a stone sill",
    width: 1152,
    height: 922,
  },
  /** About page, under the introduction. Landscape 3:2. */
  about: {
    src: "/photos/about.jpg",
    alt: "A sunny street of red-brick terraces and semi-detached houses, with hills in the distance",
    width: 1500,
    height: 1000,
  },
  /** For suppliers page, beside the introduction. Landscape 3:2. */
  forSuppliers: {
    src: "/photos/for-suppliers.jpg",
    alt: "A specialist pointing to extension plans while a homeowner listens at her dining table",
    width: 1264,
    height: 843,
  },
  /** Shown when a page is shared on social media or in messages. Landscape 1.91:1. */
  share: {
    src: "/photos/share.jpg",
    alt: "A brick single-storey rear extension with folding doors open onto a patio garden",
    width: 1200,
    height: 630,
  },
} satisfies Record<string, PhotoSlot>;
