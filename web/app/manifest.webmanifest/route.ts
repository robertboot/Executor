export function GET() {
  const manifest = {
    name: 'Heirloom',
    short_name: 'Heirloom',
    description:
      'Catalog the heirlooms in your life. Photograph, value, and pass them on.',
    start_url: '/home',
    display: 'standalone',
    background_color: '#FAF7F2',
    theme_color: '#0F3D2E',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'content-type': 'application/manifest+json' },
  });
}
