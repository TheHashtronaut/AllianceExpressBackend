import { buildServer } from './server.js';

const port = Number(process.env['PORT'] ?? 3000);

const server = buildServer();

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
