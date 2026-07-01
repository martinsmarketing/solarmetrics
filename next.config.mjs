/** @type {import('next').NextConfig} */
// This site has been consolidated into ElectrifyMetrics. Permanently redirect
// every path to the matching section on the hub (paths are identical, e.g.
// /solar-cost/... -> electrifymetrics.vercel.app/solar-cost/...), passing SEO
// authority to the unified site. Update the destination when the custom domain
// (getelectrifymetrics.com) is attached.
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'https://electrifymetrics.vercel.app/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
