import { z } from "zod";

/**
 * Zod schemas matching TypeScript types from index.ts
 * Used for runtime validation in MCP tool parameters
 */

export const bucketPropertySchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    type: z.enum([
      "array",
      "multiselect",
      "boolean",
      "number",
      "object",
      "string",
      "storage",
      "richtext",
      "date",
      "textarea",
      "color",
      "relation",
      "location",
      "json",
      "hash",
    ]),
    format: z.string().optional(),
    acl: z.string().optional(),
    readOnly: z.boolean().optional(),
    examples: z.array(z.unknown()).optional(),
    maximum: z.number().optional(),
    minimum: z.number().optional(),
    maxLength: z.number().optional(),
    minLength: z.number().optional(),
    pattern: z.string().optional(),
    items: z
      .union([bucketPropertySchema, z.array(bucketPropertySchema)])
      .optional(),
    maxItems: z.number().optional(),
    minItems: z.number().optional(),
    uniqueItems: z.boolean().optional(),
    required: z.array(z.string()).optional(),
    properties: z.record(bucketPropertySchema).optional(),
    enum: z.array(z.unknown()).optional(),
    bucketId: z.string().optional(),
    relationType: z.enum(["onetoone", "onetomany"]).optional(),
    dependent: z.boolean().optional(),
    locationType: z.literal("Point").optional(),
    options: z
      .object({
        translate: z.boolean().optional(),
        history: z.boolean().optional(),
        position: z.enum(["left", "right", "bottom"]).optional(),
      })
      .optional(),
  })
);

export const bucketAclSchema = z.object({
  read: z.string(),
  write: z.string(),
});

export const bucketIndexSchema = z.object({
  definition: z.record(z.union([z.number(), z.string()])),
  options: z.record(z.unknown()).optional(),
});

export const bucketDocumentSettingsSchema = z.object({
  countLimit: z.number().optional(),
  limitExceedBehaviour: z.enum(["prevent", "remove"]).optional(),
});

export const bucketSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  primary: z.string().optional(),
  order: z.number().optional(),
  required: z.array(z.string()).optional(),
  readOnly: z.boolean().optional(),
  history: z.boolean().optional(),
  category: z.string().optional(),
  properties: z.record(bucketPropertySchema),
  acl: bucketAclSchema.optional(),
  indexes: z.array(bucketIndexSchema).optional(),
  documentSettings: bucketDocumentSettingsSchema.optional(),
});

export const functionTriggerSchema = z.object({
  type: z.enum([
    "http",
    "database",
    "bucket",
    "schedule",
    "system",
    "firehose",
  ]),
  active: z.boolean(),
  options: z.record(z.unknown()).optional(),
});

export const functionSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  triggers: z.record(functionTriggerSchema),
  timeout: z.number(),
  language: z.enum(["typescript", "javascript"]),
  memoryLimit: z.number().optional(),
  order: z.number().optional(),
  category: z.string().optional(),
  env_vars: z.array(z.string()).optional(),
});

export const identityAuthFactorSchema = z.record(z.unknown());

export const identitySchema = z.object({
  _id: z.string().optional(),
  identifier: z.string(),
  password: z.string().optional(),
  deactivateJwtsBefore: z.number().optional(),
  attributes: z.record(z.unknown()).optional(),
  authFactor: identityAuthFactorSchema.optional(),
});

export const apiKeySchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  key: z.string().optional(),
  active: z.boolean().optional(),
});

export const policyStatementSchema = z.object({
  action: z.string(),
  module: z.string(),
  resource: z
    .object({
      include: z.array(z.string()),
      exclude: z.array(z.string()),
    })
    .optional(),
});

export const policySchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  statement: z.array(policyStatementSchema),
});

// Bucket data is dynamic based on bucket schema, so we use z.record(z.unknown())
export const bucketDataSchema = z.record(z.unknown());
