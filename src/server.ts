import { app } from './app'

// Vercel's Bun framework preset detects this Bun.serve() call to route
// requests through a Vercel Function (needs `bunVersion` set in vercel.json).
// Locally, `bun run src/server.ts` starts the same server on process.env.PORT.
Bun.serve({
    port: process.env.PORT,
    fetch: app.fetch,
})
