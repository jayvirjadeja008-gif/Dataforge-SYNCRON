import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppClientShell from '../components/AppClientShell';
import { siteConfig } from '../config/site.config';

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.projectName}: AI for Open Source Issue Triage and First Reply Drafting`,
    template: `%s | ${siteConfig.projectName}`
  },
  description: siteConfig.subline,
  keywords: [
    'Open Source',
    'AI Triage',
    'GitHub App',
    'Issue Classification',
    'Duplicate Detection',
    'CodeSherpa',
    'Qwen2.5-Coder',
    'FastAPI',
    'Next.js'
  ],
  authors: [{ name: siteConfig.teamNames.join(', '), url: siteConfig.githubProfileUrl }],
  creator: siteConfig.teamNames.join(', '),
  metadataBase: new URL(siteConfig.canonicalUrl || 'https://patchpilot.dev'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.canonicalUrl,
    title: `${siteConfig.projectName}: AI for Open Source Issue Triage`,
    description: siteConfig.subline,
    siteName: siteConfig.projectName,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${siteConfig.projectName} Open Graph Preview`
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.projectName}: AI for Open Source Issue Triage`,
    description: siteConfig.subline,
    images: ['/og-image.png']
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [{ url: '/apple-touch-icon.png' }]
  },
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  themeColor: '#0E1116',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <AppClientShell>{children}</AppClientShell>
      </body>
    </html>
  );
}
