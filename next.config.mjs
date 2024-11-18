const isDevelopment = process.env.NODE_ENV !== "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  async redirects() {
    return isDevelopment
      ? []
      : [
          {
            source: "/app/:path*",
            destination: `${process.env.NEXT_PUBLIC_APP_URL}/:path*`,
            permanent: true,
          },
        ];
  },
  async rewrites() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "app.cogniba.com",
          },
        ],
        destination: "/app/:path*",
      },
    ];
  },
  async redirects() {
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: "/app/:path*",
          destination: "https://app.cogniba.com/:path*",
          permanent: true,
        },
      ];
    } else {
      return [];
    }
  },
};

export default nextConfig;
