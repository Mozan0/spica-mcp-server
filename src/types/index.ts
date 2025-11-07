/**
 * Type definitions for Spica MCP Server
 * Generated from Spica JSON schemas
 */

// ============================================
// BUCKET TYPES
// ============================================

export interface BucketProperty {
  title?: string;
  description?: string;
  type:
    | "array"
    | "multiselect"
    | "boolean"
    | "number"
    | "object"
    | "string"
    | "storage"
    | "richtext"
    | "date"
    | "textarea"
    | "color"
    | "relation"
    | "location"
    | "json"
    | "hash";
  format?: string;
  acl?: string;
  readOnly?: boolean;
  examples?: unknown[];
  maximum?: number;
  minimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  items?: BucketProperty | BucketProperty[];
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  required?: string[];
  properties?: Record<string, BucketProperty>;
  enum?: unknown[];
  // For relation type
  bucketId?: string;
  relationType?: "onetoone" | "onetomany";
  dependent?: boolean;
  locationType?: "Point";
  options?: {
    translate?: boolean;
    history?: boolean;
    position?: "left" | "right" | "bottom";
  };
}

export interface BucketIndex {
  definition: Record<string, number | string>;
  options?: Record<string, unknown>;
}

export interface BucketAcl {
  read: string;
  write: string;
}

export interface BucketDocumentSettings {
  countLimit?: number;
  limitExceedBehaviour?: "prevent" | "remove";
}

export interface Bucket {
  _id?: string;
  title: string;
  description: string;
  icon?: string;
  primary?: string;
  order?: number;
  required?: string[];
  readOnly?: boolean;
  history?: boolean;
  category?: string;
  properties: Record<string, BucketProperty>;
  acl?: BucketAcl;
  indexes?: BucketIndex[];
  documentSettings?: BucketDocumentSettings;
}

export interface FunctionTrigger {
  type: "http" | "database" | "bucket" | "schedule" | "system" | "firehose";
  active: boolean;
  options?: Record<string, unknown>;
}

export interface Function {
  _id?: string;
  name: string;
  description?: string;
  triggers: Record<string, FunctionTrigger>;
  timeout: number;
  language: "typescript" | "javascript";
  memoryLimit?: number;
  order?: number;
  category?: string;
  env_vars?: string[];
}

export interface IdentityAuthFactor {
  [key: string]: unknown;
}

export interface Identity {
  _id?: string;
  identifier: string;
  password?: string;
  deactivateJwtsBefore?: number;
  attributes?: Record<string, unknown>;
  authFactor?: IdentityAuthFactor;
}

export interface ApiKey {
  _id?: string;
  name: string;
  description?: string;
  key?: string;
  active?: boolean;
}

export interface PolicyStatement {
  action: string;
  module: string;
  resource?: {
    include: string[];
    exclude: string[];
  };
}

export interface Policy {
  _id?: string;
  name: string;
  description: string;
  statement: PolicyStatement[];
}

export interface ApiResponse<T> {
  data: T;
  [key: string]: unknown;
}

export interface ApiListResponse<T> {
  data: T[];
  meta?: {
    total: number;
    limit: number;
    skip: number;
  };
  [key: string]: unknown;
}
