import type { Metadata } from 'next'
import { Inter, Cairo } from 'next/font/google'
import Script from 'next/script'
import '@/app/globals.css'
import { Providers } from '@/app/providers'
import { locales } from '@/lib/i18n'

const inter = Inter({ subsets: ['latin'] })
const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})



export const metadata: Metadata = {
  title: 'Modual - Build Your Own Website',
  description: 'Create your own professional website easily with Modual',
  icons:{
    icon: '/favicon.svg',
  }
}

export async function generateStaticParams() {
  return locales.map((locale) => ({
    lang: locale,
  }))
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  return (
    <html lang={params.lang} suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MZKHNQBP');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className={params.lang === 'ar' ? cairo.className : inter.className} suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MZKHNQBP"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers lang={params.lang}>{children}</Providers>
      </body>
    </html>
  )
}
