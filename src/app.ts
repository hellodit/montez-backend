import 'dotenv/config'
import {Hono} from 'hono'
import {errorHandler} from './middlewares/error.middleware'
import {httpLogger} from "./middlewares/logger.middleware";
import {cors} from "hono/cors";
import {registerUserRoutes} from "./modules/users/users.routes";
import {registerSocialAccountRoutes} from "./modules/social-accounts/social-accounts.routes";
import {registerAuthRoutes} from "./modules/auth/auth.routes";
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
app.route("/api", apiRoute)

// Vercel's zero-config Hono detection requires the plain app instance as the
// default export (https://vercel.com/docs/frameworks/backend/hono). Bun also
// auto-serves any entrypoint's default export that has a `.fetch` method,
// falling back to `process.env.PORT` on its own — so this one export serves
// both `bun run src/app.ts` locally and Vercel's Node.js runtime.
export default app
