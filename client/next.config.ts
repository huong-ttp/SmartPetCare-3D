import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
  async redirects() {
    return [
      // Trung tâm nhắc lịch đã được hợp nhất vào Trung tâm thông báo
      {
        source: "/reminders",
        destination: "/notifications?type=reminder",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
