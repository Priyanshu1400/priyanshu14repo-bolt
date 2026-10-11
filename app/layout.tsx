import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import { CartProvider } from '@/components/CartContext';
import { ToastProvider } from '@/components/ToastContext';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  metadataBase: new URL('https://300mltea.com'),
  title: '300ml Tea - Wahi wali chai. Kahin bhi.',
  description: '300ml Tea - Pre-measured raw chai blend. Maa ki chai ka magic, ab kahin bhi.',
  // Icons come from app/favicon.ico, app/icon.png (192px, a multiple of 48 as Google wants) and app/apple-icon.png.
  openGraph: {
    type: 'website',
    siteName: '300ml Tea',
    url: 'https://300mltea.com',
    title: '300ml Tea - Wahi wali chai. Kahin bhi.',
    description: '300ml Tea - Pre-measured raw chai blend. Maa ki chai ka magic, ab kahin bhi.',
    images: [
      { url: 'https://300mltea.com/og.png' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      { url: 'https://300mltea.com/og.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=Dela+Gothic+One&family=Inter:wght@400;500;600&family=Manrope:wght@500;800&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://checkout-ui.shiprocket.com/assets/styles/shopify.css"
        />
        {/* Tells search engines which logo belongs to the brand. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: '300ml Tea',
              url: 'https://300mltea.com',
              logo: 'https://300mltea.com/brand/icon-512.png',
            }),
          }}
        />
      </head>
      <body>
        <input type="hidden" value="300mltea.com" id="sellerDomain" />
        <CartProvider>
          <ToastProvider>
            <ClientLayout>{children}</ClientLayout>
          </ToastProvider>
        </CartProvider>
        <Script
          src="https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
