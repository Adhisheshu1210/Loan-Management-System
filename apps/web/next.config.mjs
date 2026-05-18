/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/Loan-Management-System",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
