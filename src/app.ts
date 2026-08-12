import 'dotenv/config'
import {Hono} from 'hono'
import {errorHandler} from './middlewares/error.middleware'
import {httpLogger} from "./middlewares/logger.middleware";
import {cors} from "hono/cors";
import {registerUserRoutes} from "./modules/users/users.routes";
import {registerSocialAccountRoutes} from "./modules/social-accounts/social-accounts.routes";
import {registerAuthRoutes} from "./modules/auth/auth.routes";
import {registerBillingRoutes} from "./modules/billing/billing.routes";
import { type HonoBindings, type HonoVariables, MastraServer } from '@mastra/hono'
import { mastra } from './mastra'

export const app = new Hono()

app.use("*", httpLogger());

const mastraServer = new MastraServer({ app, mastra, prefix: '/mastra' })

// CORS — allow any origin. `credentials: true` forbids a literal "*" ACAO
// (browsers drop it), so origin reflects back whatever Origin was sent.
app.use(
    "*",
    cors({
        credentials: true,
        origin: (origin) => origin,
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
);


await mastraServer.init()

app.get('/', (c) =>
    c.json({
        name: 'montez-agent-api',
        status: 'ok',
        message: 'Hello, World! 👋',
        timestamp: new Date().toISOString(),
    }),
)

// Satu onError saja — Hono hanya menyimpan yang terakhir didaftarkan.
// Penanganan AppError/HTTPException ada di errorHandler.
app.onError(errorHandler)

// `app.route("api", app)` TIDAK membuat sub-router "/api" — .route() di Hono
// mengembalikan `this`, jadi itu memasang route di path polos (mis. `/auth`,
// bukan `/api/auth`). Sub-app baru ini yang sebenarnya jadi namespace "/api".
const apiRoute = new Hono()
registerAuthRoutes(apiRoute)
registerUserRoutes(apiRoute)
registerSocialAccountRoutes(apiRoute)
registerBillingRoutes(apiRoute)
app.route("/api", apiRoute)

// Bun's documented pattern: exporting a default object with `fetch` makes
// `bun run src/app.ts` (and Vercel's Bun framework preset) start the server
// directly, both locally and on Vercel's Bun runtime. Named export `app`
// stays available so tests can call `app.request(...)` without a server.
export default {
    port: process.env.PORT,
    fetch: app.fetch,
}
