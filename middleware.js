// Vercel middleware: serve the single-page app shell for client-side routes so that deep
// links such as /learn/right-to-learn return 200 instead of 404. API routes, hashed assets
// and public files are excluded through the matcher.
export const config = {
  matcher: ['/((?!api/|assets/|audio/|.*\\.[^/]+$).*)']
};

export default function middleware(request) {
  const target = new URL('/index.html', request.url);
  return new Response(null, { headers: { 'x-middleware-rewrite': target.toString() } });
}
