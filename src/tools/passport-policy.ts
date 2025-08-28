import { z } from "zod";

export function registerPassportPolicyTools(
  server: any,
  makeSpicaRequest: any
) {
  server.addTool({
    name: "passport-policy-list",
    description: "Get all policies",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await makeSpicaRequest("GET", "/passport/policy");
        return `Policies:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Failed to list policies:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-policy-get",
    description: "Get a single policy by id",
    parameters: z.object({ id: z.string() }),
    execute: async ({ id }: any) => {
      try {
        const response = await makeSpicaRequest(
          "GET",
          `/passport/policy/${id}`
        );
        return `Policy:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Failed to get policy:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-policy-create",
    description: "Create a new policy. ",
    parameters: z.object({
      name: z.string(),
      description: z.string(),
      statement: z.array(
        z.object({
          action: z.string(),
          module: z.string(),
          resource: z
            .object({
              include: z.array(z.string()).optional(),
              exclude: z.array(z.string()).optional(),
            })
            .optional(),
        })
      ),
    }),
    execute: async ({ name, description, statement }: any) => {
      try {
        const body = { name, description, statement };
        const response = await makeSpicaRequest(
          "POST",
          "/passport/policy",
          body
        );
        return ` Policy created:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Failed to create policy:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-policy-update",
    description: "Update an existing policy",
    parameters: z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      statement: z
        .array(
          z.object({
            action: z.string(),
            module: z.string(),
            resource: z
              .object({
                include: z.array(z.string()).optional(),
                exclude: z.array(z.string()).optional(),
              })
              .optional(),
          })
        )
        .optional(),
    }),
    execute: async ({ id, ...update }: any) => {
      try {
        const current = await makeSpicaRequest("GET", `/passport/policy/${id}`);
        const merged = { ...current.data, ...update };
        const response = await makeSpicaRequest(
          "PUT",
          `/passport/policy/${id}`,
          merged
        );
        return `Policy updated:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Failed to update policy:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-policy-delete",
    description: "Delete a policy",
    parameters: z.object({ id: z.string() }),
    execute: async ({ id }: any) => {
      try {
        await makeSpicaRequest("DELETE", `/passport/policy/${id}`);
        return `Policy deleted`;
      } catch (err: any) {
        return `Failed to delete policy:\n${err.message}`;
      }
    },
  });
}
