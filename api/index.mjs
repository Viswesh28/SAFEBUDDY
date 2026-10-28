// Vercel serverless entry point.
//
// The Express app in server/src handles every /api/* request; the React build is served by
// Vercel's CDN from client/dist (see vercel.json). One cold start initialises the repository
// once, and later requests in the same instance reuse it.
import { app, initialiseApp } from '../server/src/index.js';

let ready;

export default async function handler(request, response) {
  ready ??= initialiseApp();
  await ready;
  return app(request, response);
}
