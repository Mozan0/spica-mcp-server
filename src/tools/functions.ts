import { z } from "zod";

export function registerFunctionTools(server: any, makeSpicaRequest: any) {
  server.addTool({
    name: "function-list",
    description: "List all functions",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await makeSpicaRequest("GET", "/function");
        return `Functions retrieved successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Failed to list functions:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "function-show",
    description: "Get function details by id",
    parameters: z.object({ id: z.string() }),
    execute: async (params: { id: string }) => {
      try {
        const response = await makeSpicaRequest(
          "GET",
          `/function/${params.id}`
        );
        return `Function retrieved:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Failed to get function ${params.id}:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "function-create",
    description:
      "Create a new function (body should match Spica Function structure)",
    parameters: z.object({ data: z.any() }),
    execute: async (params: { data: any }) => {
      try {
        const response = await makeSpicaRequest(
          "POST",
          "/function",
          params.data
        );
        return `Function created:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Failed to create function:\n${err.message}`;
      }
    },
  });

  // Update function (partial)
  server.addTool({
    name: "function-update",
    description: "Update function by id (partial update using PATCH)",
    parameters: z.object({ id: z.string(), data: z.any() }),
    execute: async (params: { id: string; data: any }) => {
      try {
        const response = await makeSpicaRequest(
          "PATCH",
          `/function/${params.id}`,
          params.data
        );
        return `Function updated:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Failed to update function ${params.id}:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "function-delete",
    description: "Delete function by id",
    parameters: z.object({ id: z.string() }),
    execute: async (params: { id: string }) => {
      try {
        await makeSpicaRequest("DELETE", `/function/${params.id}`);
        return `Function ${params.id} deleted`;
      } catch (err: any) {
        return `Failed to delete function ${params.id}:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "function-get-code",
    description: "Get function code (index) by id",
    parameters: z.object({ id: z.string() }),
    execute: async (params: { id: string }) => {
      try {
        const response = await makeSpicaRequest(
          "GET",
          `/function/${params.id}/index`
        );
        return `Function code retrieved:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Failed to get code for function ${params.id}:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "function-update-code",
    description: "Update function code (index) by id - pass { index: string }",
    parameters: z.object({ id: z.string(), index: z.string() }),
    execute: async (params: { id: string; index: string }) => {
      try {
        const body = { index: params.index };
        const response = await makeSpicaRequest(
          "POST",
          `/function/${params.id}/index`,
          body
        );
        return `Function code updated:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Failed to update code for function ${params.id}:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "function-list-dependencies",
    description: "List dependencies for a function",
    parameters: z.object({ id: z.string() }),
    execute: async (params: { id: string }) => {
      try {
        const response = await makeSpicaRequest(
          "GET",
          `/function/${params.id}/dependencies`
        );
        return `Dependencies:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Failed to list dependencies for ${params.id}:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "function-add-dependencies",
    description: 'Add dependencies to a function (pass { name: ["pkg", ...] })',
    parameters: z.object({ id: z.string(), name: z.array(z.string()) }),
    execute: async (params: { id: string; name: string[] }) => {
      try {
        const body = { name: params.name };
        const response = await makeSpicaRequest(
          "POST",
          `/function/${params.id}/dependencies`,
          body
        );
        return `Dependencies added:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Failed to add dependencies for ${params.id}:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "function-delete-dependency",
    description: "Delete a dependency from a function by package name",
    parameters: z.object({ id: z.string(), packageName: z.string() }),
    execute: async (params: { id: string; packageName: string }) => {
      try {
        await makeSpicaRequest(
          "DELETE",
          `/function/${params.id}/dependencies/${encodeURIComponent(
            params.packageName
          )}`
        );
        return `Dependency ${params.packageName} removed from function ${params.id}`;
      } catch (err: any) {
        return `Failed to remove dependency ${params.packageName} from ${params.id}:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "function-logs",
    description:
      "Query function logs (filters: functions, levels, begin, end, content, limit, skip)",
    parameters: z.object({
      functions: z.array(z.string()).optional(),
      levels: z.array(z.string()).optional(),
      begin: z.string().optional(),
      end: z.string().optional(),
      content: z.string().optional(),
      limit: z.string().optional(),
      skip: z.string().optional(),
    }),
    execute: async (params: any) => {
      try {
        const qs = new URLSearchParams();
        if (params.functions)
          params.functions.forEach((v: string) => qs.append("functions", v));
        if (params.levels)
          params.levels.forEach((v: string) => qs.append("levels", v));
        if (params.begin) qs.set("begin", params.begin);
        if (params.end) qs.set("end", params.end);
        if (params.content) qs.set("content", params.content);
        if (params.limit) qs.set("limit", params.limit);
        if (params.skip) qs.set("skip", params.skip);

        const path = qs.toString()
          ? `/function-logs?${qs.toString()}`
          : `/function-logs`;
        const response = await makeSpicaRequest("GET", path);
        return `Function logs:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Failed to retrieve function logs:\n${err.message}`;
      }
    },
  });
}
