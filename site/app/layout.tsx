import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/config/site";
import { SmoothScrollProvider } from "@/lib/animations/SmoothScrollProvider";
import { Cursor } from "@/components/ui/Cursor";
import { Navigation } from "@/components/navigation/Navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.brand.url),
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
  keywords: [...siteConfig.seo.keywords],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    type: "website",
    url: siteConfig.brand.url,
    siteName: siteConfig.brand.name,
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    locale: "en_US",
    images: [{ url: "/brand/og-image.jpg", width: 1200, height: 630, alt: siteConfig.seo.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    images: ["/brand/og-image.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Optician",
  name: siteConfig.brand.name,
  url: siteConfig.brand.url,
  description: siteConfig.seo.description,
  areaServed: { "@type": "City", name: "Rabat" },
  knowsAbout: [
    "Opticien",
    "Opticienne",
    "Lunettes de vue",
    "Lunettes solaires",
    "Lentilles de contact",
    "Optique",
    "Eyewear",
    "Vision",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScrollProvider>
          <Cursor />
          <Navigation />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
