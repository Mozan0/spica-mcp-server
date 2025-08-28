import { z } from "zod";

export function registerBucketTools(server: any, makeSpicaRequest: any) {
  server.addTool({
    name: "bucket-list",
    description: "Get all buckets from Spica.",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await makeSpicaRequest("GET", "/bucket");
        return `Buckets retrieved successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Failed to list buckets:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "bucket-create",
    description: "Create a new bucket in Spica.",
    parameters: z.object({
      title: z.string(),
      description: z.string(),
      properties: z.record(z.any()),
      icon: z.string().optional(),
      primary: z.string().optional(),
      readOnly: z.boolean().optional(),
      history: z.boolean().optional(),
      acl: z
        .object({
          read: z.string(),
          write: z.string(),
        })
        .optional(),
    }),
    execute: async ({
      title,
      description,
      properties,
      icon = "view_stream",
      primary = "title",
      readOnly = false,
      history = false,
      acl = { read: "true==true", write: "true==true" },
    }: any) => {
      try {
        const bucketData = {
          title,
          description,
          icon,
          primary,
          readOnly,
          history,
          properties,
          acl,
          order: 0,
        };

        const response = await makeSpicaRequest("POST", "/bucket", bucketData);
        return `Bucket created successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Failed to create bucket:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "bucket-update",
    description: "Update an existing bucket in Spica",
    parameters: z.object({
      bucketId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      properties: z.record(z.any()).optional(),
      icon: z.string().optional(),
      primary: z.string().optional(),
      readOnly: z.boolean().optional(),
      history: z.boolean().optional(),
      acl: z
        .object({
          read: z.string(),
          write: z.string(),
        })
        .optional(),
    }),
    execute: async ({ bucketId, ...updateData }: any) => {
      try {
        const currentResponse = await makeSpicaRequest(
          "GET",
          `/bucket/${bucketId}`
        );
        const currentData = currentResponse.data;

        const mergedData = { ...currentData, ...updateData, _id: bucketId };

        const response = await makeSpicaRequest(
          "PUT",
          `/bucket/${bucketId}`,
          mergedData
        );
        return `Bucket updated successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Failed to update bucket:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "bucket-delete",
    description: "Delete a bucket from Spica",
    parameters: z.object({
      bucketId: z.string(),
    }),
    execute: async ({ bucketId }: any) => {
      try {
        await makeSpicaRequest("DELETE", `/bucket/${bucketId}`);
        return `Bucket deleted successfully`;
      } catch (err: any) {
        return `Failed to delete bucket:\n${err.message}`;
      }
    },
  });
}
