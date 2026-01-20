import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supportedLanguages = ['en', 'ar', 'fr', 'nl'];
const defaultLanguage = 'en';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle API routes with existing CORS logic
  if (pathname.startsWith('/api')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    // Add CORS headers to response
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  }

  // Handle language routing
  const pathnameHasLanguage = supportedLanguages.some(
    (lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`
  );

  // Skip language routing for public assets and special routes
  if (pathname.includes('.') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // If no language prefix, redirect to default language
  if (!pathnameHasLanguage && pathname !== '/') {
    // Redirect with language prefix
    const languageFromCookie = request.cookies.get('NEXT_LOCALE')?.value || defaultLanguage;
    return NextResponse.redirect(
      new URL(`/${languageFromCookie}${pathname}`, request.url)
    );
  }

  // If user accesses root path, detect language and redirect
  if (pathname === '/') {
    const languageFromCookie = request.cookies.get('NEXT_LOCALE')?.value || defaultLanguage;
    const languageFromHeader = request.headers.get('accept-language')?.split(',')[0].split('-')[0] || defaultLanguage;
    const detectedLanguage = supportedLanguages.includes(languageFromCookie)
      ? languageFromCookie
      : supportedLanguages.includes(languageFromHeader)
      ? languageFromHeader
      : defaultLanguage;

    return NextResponse.redirect(new URL(`/${detectedLanguage}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
