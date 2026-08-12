import { Mastra } from '@mastra/core'
import {montezAssistant} from "./agents/assistant";
import {PostgresStore} from "@mastra/pg";
import { env } from "../config";

export function createMastra() {
  return new Mastra({
    agents: {
      assistant: montezAssistant,
    },
    storage: new PostgresStore({
      id: "mastra-storage",
      connectionString: env.MASTRA_DATABASE_URL,
      disableInit: false,
    }),
  });
}

export const mastra = createMastra();
