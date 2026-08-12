/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Allow clipboard writes when the admin app is embedded or proxied.
          {
            key: "Permissions-Policy",
            value: "clipboard-read=(self), clipboard-write=(self)",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
