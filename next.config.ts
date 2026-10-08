import type { NextConfig } from "next";
import { services } from "./src/config/services";

const nextConfig: NextConfig = {
  // Pages are pre-built, so the questionnaire and register-interest addresses
  // are redirected here rather than at request time.
  async redirects() {
    return services.flatMap((s) =>
      s.status === "live"
        ? [{ source: `/register-interest/${s.slug}`, destination: `/find-a-specialist/${s.slug}`, permanent: false }]
        : [{ source: `/find-a-specialist/${s.slug}`, destination: `/register-interest/${s.slug}`, permanent: false }],
    );
  },
};

export default nextConfig;
