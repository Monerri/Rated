/**
 * Photographs used around the site. Each slot stays hidden until its file is
 * added: put the image in /public/photos and set `src` (for example
 * "/photos/home-hero.jpg"). Sizes are the minimum to supply; larger is fine.
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
    src: null,
    alt: "A bright, finished kitchen extension in a North East home",
    width: 1600,
    height: 2000,
  },
  /** Homepage, beside the four checks. Landscape 5:4. */
  homeChecks: {
    src: null,
    alt: "Close-up of a well-fitted window and sill",
    width: 2000,
    height: 1600,
  },
  /** About page, under the introduction. Landscape 3:2. */
  about: {
    src: null,
    alt: "A street of terraced and semi-detached houses in North East England",
    width: 2400,
    height: 1600,
  },
  /** For suppliers page, beside the introduction. Landscape 3:2. */
  forSuppliers: {
    src: null,
    alt: "A specialist talking through plans with a homeowner at their kitchen table",
    width: 2400,
    height: 1600,
  },
  /** Shown when a page is shared on social media or in messages. Landscape 1.91:1. */
  share: {
    src: null,
    alt: "A welcoming North East home",
    width: 1200,
    height: 630,
  },
} satisfies Record<string, PhotoSlot>;
