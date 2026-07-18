import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "prisma",
    "pg",
    "bcryptjs",
    "pdfjs-dist",
    "tesseract.js",
  ],
};

export default nextConfig;
