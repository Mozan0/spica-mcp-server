import { z } from "zod";
import { Bucket, BucketProperty, BucketAcl } from "../types/index.js";
import { bucketPropertySchema, bucketAclSchema } from "../types/zod-schemas.js";

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
      properties: z.record(bucketPropertySchema),
      icon: z.string().optional(),
      primary: z.string().optional(),
      readOnly: z.boolean().optional(),
      history: z.boolean().optional(),
      acl: bucketAclSchema.optional(),
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
    }: {
      title: string;
      description: string;
      properties: Record<string, BucketProperty>;
      icon?: string;
      primary?: string;
      readOnly?: boolean;
      history?: boolean;
      acl?: BucketAcl;
    }) => {
      try {
        const bucketData: Bucket = {
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
      properties: z.record(bucketPropertySchema).optional(),
      icon: z.string().optional(),
      primary: z.string().optional(),
      readOnly: z.boolean().optional(),
      history: z.boolean().optional(),
      acl: bucketAclSchema.optional(),
    }),
    execute: async ({
      bucketId,
      title,
      description,
      properties,
      icon,
      primary,
      readOnly,
      history,
      acl,
    }: {
      bucketId: string;
      title?: string;
      description?: string;
      properties?: Record<string, BucketProperty>;
      icon?: string;
      primary?: string;
      readOnly?: boolean;
      history?: boolean;
      acl?: BucketAcl;
    }) => {
      try {
        const currentResponse = await makeSpicaRequest(
          "GET",
          `/bucket/${bucketId}`
        );
        const currentData: Bucket = currentResponse.data;

        const updateData: Partial<Bucket> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (properties !== undefined) updateData.properties = properties;
        if (icon !== undefined) updateData.icon = icon;
        if (primary !== undefined) updateData.primary = primary;
        if (readOnly !== undefined) updateData.readOnly = readOnly;
        if (history !== undefined) updateData.history = history;
        if (acl !== undefined) updateData.acl = acl;

        const mergedData: Bucket = {
          ...currentData,
          ...updateData,
          _id: bucketId,
        };

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
    execute: async ({ bucketId }: { bucketId: string }): Promise<string> => {
      try {
        await makeSpicaRequest("DELETE", `/bucket/${bucketId}`);
        return `Bucket deleted successfully`;
      } catch (err: any) {
        return `Failed to delete bucket:\n${err.message}`;
      }
    },
  });
}
