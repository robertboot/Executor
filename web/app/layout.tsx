import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Heirloom — Collect. Value. Preserve. Pass On.',
  description:
    'Catalog the heirlooms in your life. Photograph, value, and pass them on with stories intact.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0F3D2E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
