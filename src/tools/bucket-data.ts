import { z } from "zod";

export function registerBucketDataTools(server: any, makeSpicaRequest: any) {
  server.addTool({
    name: "bucket-data-list",
    description: "Get all data from a specific bucket",
    parameters: z.object({
      bucketId: z.string(),
      limit: z.number().optional(),
      skip: z.number().optional(),
    }),
    execute: async ({ bucketId, limit, skip }: any) => {
      try {
        let endpoint = `/bucket/${bucketId}/data`;
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        if (skip) params.append("skip", skip.toString());
        if (params.toString()) endpoint += `?${params.toString()}`;

        const response = await makeSpicaRequest("GET", endpoint);
        return `✅ Bucket data retrieved successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `❌ Failed to list bucket data:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "bucket-data-create",
    description:
      "Add new data to a bucket. 💡 Tip: Use search + answer_question tools first to understand the bucket schema and required data structure before adding data.",
    parameters: z.object({
      bucketId: z.string(),
      data: z.record(z.any()),
    }),
    execute: async ({ bucketId, data }: any) => {
      try {
        const response = await makeSpicaRequest(
          "POST",
          `/bucket/${bucketId}/data`,
          data
        );
        return `✅ Bucket data created successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `❌ Failed to create bucket data:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "bucket-data-update",
    description: "Update existing data in a bucket",
    parameters: z.object({
      bucketId: z.string(),
      dataId: z.string(),
      data: z.record(z.any()),
    }),
    execute: async ({ bucketId, dataId, data }: any) => {
      try {
        const response = await makeSpicaRequest(
          "PUT",
          `/bucket/${bucketId}/data/${dataId}`,
          data
        );
        return `✅ Bucket data updated successfully:\n${JSON.stringify(
          response.data,
          null,
          2
        )}`;
      } catch (err: any) {
        return `❌ Failed to update bucket data:\n${err.message}`;
      }
    },
  });

  server.addTool({
    name: "bucket-data-delete",
    description: "Delete specific data from a bucket",
    parameters: z.object({
      bucketId: z.string(),
      dataId: z.string(),
    }),
    execute: async ({ bucketId, dataId }: any) => {
      try {
        const response = await makeSpicaRequest(
          "DELETE",
          `/bucket/${bucketId}/data/${dataId}`
        );
        return `✅ Bucket data deleted successfully`;
      } catch (err: any) {
        return `❌ Failed to delete bucket data:\n${err.message}`;
      }
    },
  });
}
