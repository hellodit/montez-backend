import { mkdirSync } from "node:fs";
import type { Auth } from "better-auth";
import { Mastra } from '@mastra/core'
import { MastraCompositeStore } from "@mastra/core/storage";
import { Observability, MastraStorageExporter, MastraPlatformExporter } from "@mastra/observability";
import { MastraAuthBetterAuth, type BetterAuthUser } from "@mastra/auth-better-auth";
import {montezAssistant} from "./agents/assistant";
import {PostgresStore} from "@mastra/pg";
import { DuckDBStore } from "@mastra/duckdb";
import { auth } from "../modules/auth/auth";
import { env } from "../config";

function isAdminUser(betterAuthUser: BetterAuthUser): boolean {
  return (betterAuthUser.user as { isAdmin?: boolean }).isAdmin === true;
}

const OBSERVABILITY_DB_PATH = ".mastra/observability.duckdb";

export function createMastra() {
  // DuckDB doesn't create its parent directory on its own.
  mkdirSync(".mastra", { recursive: true });

  return new Mastra({
    agents: {
      assistant: montezAssistant,
    },
    storage: new MastraCompositeStore({
      id: "mastra-storage",
      default: new PostgresStore({
        id: "mastra-postgres",
        connectionString: env.MASTRA_DATABASE_URL,
        disableInit: false,
      }),
      domains: {
        // Traces/metrics/logs need an OLAP store — Postgres isn't supported for metrics.
        observability: new DuckDBStore({ path: OBSERVABILITY_DB_PATH }).observability,
      },
    }),
    observability: new Observability({
      configs: {
        default: {
          serviceName: "montez-backend",
          exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
        },
      },
    }),
    server: {
      // Reuse the app's own Better Auth instance — Studio logs in with the same
      // email/password accounts, but only admins (isAdmin) get past authorization.
      auth: new MastraAuthBetterAuth({
        // Cast: our `auth` instance's additionalFields (isAdmin) make its type
        // more specific than the generic `Auth` this package expects — safe,
        // since it's a strict superset at runtime.
        auth: auth as unknown as Auth,
        signUpEnabled: false,
        authorizeUser: async (user) => isAdminUser(user),
      }),
    },
  });
}

export const mastra = createMastra();
