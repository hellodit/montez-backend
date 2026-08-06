import 'dotenv/config'
import {Hono} from 'hono'
import {errorHandler} from './middlewares/error.middleware'
import {httpLogger} from "./middlewares/logger.middleware";
import {cors} from "hono/cors";
import {registerUserRoutes} from "./modules/users/users.routes";
import { env } from './config'
import { type HonoBindings, type HonoVariables, MastraServer } from '@mastra/hono'
import { mastra } from './mastra'

export const app = new Hono()

app.use("*", httpLogger());
const mastraServer = new MastraServer({ app, mastra, prefix: '/mastra' })

// CORS — FE di repo terpisah, ditambah Mastra Studio (dev). `credentials: true`
// wajib agar cookie sesi Better Auth ikut terkirim lintas-origin, tapi itu
// melarang wildcard origin — makanya origin harus daftar eksplisit, bukan "*".
app.use(
    "*",
    cors({
        credentials: true,
        origin: [
            "http://localhost:5173",
            "http://localhost:4111",
            "http://127.0.0.1:4111",
        ],
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

const apiRoute = app.route("api", app)
registerUserRoutes(apiRoute)

export default {
    port: env.PORT, fetch: app.fetch
}
