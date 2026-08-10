import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "jsonwebtoken", "@prisma/client"],
};

export default nextConfig;
