import { z } from "zod";

export function registerPassportApikeyTools(
  server: any,
  makeSpicaRequest: any
) {
  server.addTool({
    name: "passport-apikey-list",
    description: "Get all API keys",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await makeSpicaRequest("GET", "/passport/apikey");
        return `✅ API keys:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `❌ Failed to list apikeys:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-apikey-get",
    description: "Get a single API key by id",
    parameters: z.object({ id: z.string() }),
    execute: async ({ id }: any) => {
      try {
        const response = await makeSpicaRequest(
          "GET",
          `/passport/apikey/${id}`
        );
        return `✅ API key:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `❌ Failed to get apikey:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-apikey-create",
    description: "Create a new API key",
    parameters: z.object({
      name: z.string(),
      description: z.string().optional(),
      active: z.boolean().optional(),
      policies: z.array(z.string()).optional(),
    }),
    execute: async ({ name, description, active = true, policies }: any) => {
      try {
        const body: any = { name, description, active };
        const response = await makeSpicaRequest(
          "POST",
          "/passport/apikey",
          body
        );
        const created = response.data;

        if (policies && policies.length > 0) {
          for (const policyId of policies) {
            try {
              await makeSpicaRequest(
                "PUT",
                `/passport/apikey/${created._id}/policy/${policyId}`
              );
            } catch (innerErr: any) {
              return `⚠️ API key created but failed to assign policy ${policyId}:\n${innerErr.message}`;
            }
          }
        }

        return `✅ API key created successfully:\n${JSON.stringify(
          created,
          null,
          2
        )}`;
      } catch (err: any) {
        return `❌ Failed to create apikey:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-apikey-update",
    description: "Update an API key (name/description/active)",
    parameters: z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      active: z.boolean().optional(),
    }),
    execute: async ({ id, ...update }: any) => {
      try {
        const current = await makeSpicaRequest("GET", `/passport/apikey/${id}`);
        const merged = { ...current.data, ...update };
        const response = await makeSpicaRequest(
          "PUT",
          `/passport/apikey/${id}`,
          merged
        );
        return `✅ API key updated:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `❌ Failed to update apikey:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-apikey-delete",
    description: "Delete an API key",
    parameters: z.object({ id: z.string() }),
    execute: async ({ id }: any) => {
      try {
        await makeSpicaRequest("DELETE", `/passport/apikey/${id}`);
        return `✅ API key deleted`;
      } catch (err: any) {
        return `❌ Failed to delete apikey:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-apikey-assign-policy",
    description: "Assign a policy to an existing API key",
    parameters: z.object({ apikeyId: z.string(), policyId: z.string() }),
    execute: async ({ apikeyId, policyId }: any) => {
      try {
        const response = await makeSpicaRequest(
          "PUT",
          `/passport/apikey/${apikeyId}/policy/${policyId}`
        );
        return `✅ Policy assigned to API key:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `❌ Failed to assign policy to apikey:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-apikey-remove-policy",
    description: "Remove a policy from an API key",
    parameters: z.object({ apikeyId: z.string(), policyId: z.string() }),
    execute: async ({ apikeyId, policyId }: any) => {
      try {
        await makeSpicaRequest(
          "DELETE",
          `/passport/apikey/${apikeyId}/policy/${policyId}`
        );
        return `✅ Policy removed from API key`;
      } catch (err: any) {
        return `❌ Failed to remove policy from apikey:\n${err.message}`;
      }
    },
  });
}
