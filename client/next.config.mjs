/** @type {import('next').NextConfig} */
const nextConfig = {
    // Static export for GitHub Pages; NEXT_PUBLIC_BASE_PATH is the repo
    // sub-path (e.g. /Crowd-Funding) and is empty for local dev.
    output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
