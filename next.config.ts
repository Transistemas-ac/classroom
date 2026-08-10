import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "jsonwebtoken", "@prisma/client", "pdfkit"],
  outputFileTracingIncludes: {
    "/api/course/**/*": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;
