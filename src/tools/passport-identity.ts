import { z } from "zod";

export function registerPassportIdentityTools(
  server: any,
  makeSpicaRequest: any
) {
  server.addTool({
    name: "passport-identity-list",
    description: "Get all identities from Spica. ",
    parameters: z.object({
      limit: z.number().optional(),
      skip: z.number().optional(),
      sort: z.string().optional(),
    }),
    execute: async ({ limit, skip, sort }: any) => {
      try {
        let endpoint = "/passport/identity";
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        if (skip) params.append("skip", skip.toString());
        if (sort) params.append("sort", sort);
        if (params.toString()) endpoint += `?${params.toString()}`;

        const response = await makeSpicaRequest("GET", endpoint);
        return `Identities retrieved successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Failed to list identities:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-identity-get",
    description: "Get a single identity by id",
    parameters: z.object({ id: z.string() }),
    execute: async ({ id }: any) => {
      try {
        const response = await makeSpicaRequest(
          "GET",
          `/passport/identity/${id}`
        );
        return `Identity retrieved successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Failed to get identity:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-identity-create",
    description: "Create a new identity in Spica.",
    parameters: z.object({
      identifier: z.string(),
      password: z.string(),
      attributes: z.record(z.any()).optional(),
    }),
    execute: async ({ identifier, password, attributes }: any) => {
      try {
        const body: any = { identifier, password };
        if (attributes) body.attributes = attributes;
        const response = await makeSpicaRequest(
          "POST",
          "/passport/identity",
          body
        );
        return `Identity created successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Failed to create identity:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-identity-update",
    description: "Update an existing identity",
    parameters: z.object({
      id: z.string(),
      identifier: z.string().optional(),
      password: z.string().optional(),
      attributes: z.record(z.any()).optional(),
    }),
    execute: async ({ id, ...update }: any) => {
      try {
        const current = await makeSpicaRequest(
          "GET",
          `/passport/identity/${id}`
        );
        const merged = { ...current.data, ...update, _id: id };
        const response = await makeSpicaRequest(
          "PUT",
          `/passport/identity/${id}`,
          merged
        );
        return `Identity updated successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Failed to update identity:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-identity-delete",
    description: "Delete an identity",
    parameters: z.object({ id: z.string() }),
    execute: async ({ id }: any) => {
      try {
        await makeSpicaRequest("DELETE", `/passport/identity/${id}`);
        return `Identity deleted successfully`;
      } catch (err: any) {
        return `Failed to delete identity:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-identity-verify",
    description: "Verify current identity token",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await makeSpicaRequest(
          "GET",
          "/passport/identity/verify"
        );
        return `Token verified:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Token verify failed:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "passport-login",
    description: "Obtain access and refresh tokens by identifier/password",
    parameters: z.object({ identifier: z.string(), password: z.string() }),
    execute: async ({ identifier, password }: any) => {
      try {
        const response = await makeSpicaRequest("POST", "/passport/identify", {
          identifier,
          password,
        });
        return `Login successful:\n${JSON.stringify(response.data, null, 2)}`;
      } catch (err: any) {
        return `Login failed:\n${err.message}`;
      }
    },
  });
}
