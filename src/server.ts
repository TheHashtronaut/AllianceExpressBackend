import { createServer, type Server } from 'node:http';

/**
 * Builds the HTTP server without starting it, so tests can bind it to an
 * ephemeral port and shut it down cleanly.
 */
export function buildServer(): Server {
  return createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  });
}
