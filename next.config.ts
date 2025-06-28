
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Placeholder for potential future image sources if not data URIs
      // {
      //   protocol: 'https',
      //   hostname: 'storage.googleapis.com', // Example for GCS
      //   port: '',
      //   pathname: '/**',
      // },
    ],
    // Allow data URIs for generated images
    dangerouslyAllowSVG: true, // Not directly for data URIs but good to be aware of content types
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Example, adjust as needed
    // For data: URIs, they are handled by default in Next.js Image component.
    // If specific domain whitelisting is needed for remote patterns for AI generated images:
    // domains: ['your-image-hosting-domain.com'], // Add if AI returns URLs from specific domains.
  },
};

export default nextConfig;
