import type { MetadataRoute } from 'next'

// Installable from the browser menu. Starts on the closet since that's where
// people go to log what they're wearing.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ClosetCurator',
    short_name: 'Closet',
    description: 'Wear what you own. Outfits from your real closet and a clear view of what never gets worn.',
    start_url: '/closet',
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: '#FAFAFA',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }
}
