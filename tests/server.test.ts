import { afterEach, describe, expect, it } from 'vitest';
import type { AddressInfo, Server } from 'node:net';

import { buildServer } from '../src/server.js';

let server: Server | undefined;

/** Starts the server on a random free port and returns its base URL. */
async function start(): Promise<string> {
  server = buildServer();
  await new Promise<void>((resolve) => server!.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

afterEach(async () => {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  }
});

describe('server', () => {
  it('responds with a healthy status', async () => {
    const baseUrl = await start();

    const response = await fetch(baseUrl);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});
