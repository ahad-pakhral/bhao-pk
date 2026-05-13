/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.daraz.pk' },
      { protocol: 'https', hostname: 'img.drz.lazcdn.com' },
      { protocol: 'https', hostname: '**.telemart.pk' },
      { protocol: 'https', hostname: '**.shophive.com' },
      { protocol: 'https', hostname: '**.priceoye.pk' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
