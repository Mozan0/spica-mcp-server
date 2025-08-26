import { z } from "zod";

export function registerFunctionTools(server: any, makeSpicaRequest: any) {
  server.addTool({
    name: "function-list",
    description: "Get all functions from Spica",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await makeSpicaRequest("GET", "/function");
        return `✅ Functions retrieved successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `❌ Failed to list functions:\n${err.message}`;
      }
    },
  });
}
