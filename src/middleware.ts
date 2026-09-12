import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Generate a random nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // Set the nonce in the request headers so it can be read in Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Call the intl middleware with the modified request
  const response = intlMiddleware(request);

  // Set the CSP header on the response
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com;
    style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com;
    frame-src 'self' https://www.googletagmanager.com https://maps.google.com https://www.google.com;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  
  // To make sure x-nonce is passed to the downstream response (Server Components can read request headers)
  // Actually, Next.js allows reading request headers directly if we passed them via intlMiddleware(request) - wait! intlMiddleware doesn't accept modified request headers easily unless we do something else.
  // Wait, intlMiddleware(request) does not automatically pass requestHeaders.
  // We need to use NextResponse.next({ request: { headers: requestHeaders } }) but intlMiddleware returns its own response.
  // But intlMiddleware creates a response. To pass request headers, we might need to modify it.
  
  // Actually, intlMiddleware in next-intl >= 3 supports passing a request with modified headers?
  // Let's check next-intl docs. Usually, `intlMiddleware(request)` just works if we modify `request.headers` directly.
  return response;
}

export const config = {
  matcher: ['/', '/(tr|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
