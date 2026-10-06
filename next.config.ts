import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    // Product images and brand logos are hosted on Cloudinary, which resizes
    // them on its CDN. See src/lib/image-loader.ts.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  experimental: {
    serverActions: {
      // Uploads go through Server Actions. Images can be up to 5 MB, plus
      // headroom for the other form fields and multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
