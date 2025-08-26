import { FastMCP } from "fastmcp";
import OpenAI from "openai";
import * as dotenv from "dotenv";

import { registerBucketTools } from "./tools/bucket";
import { registerBucketDataTools } from "./tools/bucket-data";
import { registerPassportIdentityTools } from "./tools/passport-identity";
import { registerPassportApikeyTools } from "./tools/passport-apikey";
import { registerPassportPolicyTools } from "./tools/passport-policy";
import { registerFunctionTools } from "./tools/functions";
import { registerDeepResearchTools } from "./tools/deep-research";
import { registerHelperTools } from "./tools/helper";
import { makeSpicaRequest } from "./spica";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID || "";

let openaiClient: OpenAI | null = null;
if (OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
}

const server = new FastMCP({ name: "spica-mcp-server", version: "1.0.0" });

// Register tools from modules
registerBucketTools(server, makeSpicaRequest);
registerBucketDataTools(server, makeSpicaRequest);
registerFunctionTools(server, makeSpicaRequest);
registerPassportIdentityTools(server, makeSpicaRequest);
registerPassportApikeyTools(server, makeSpicaRequest);
registerPassportPolicyTools(server, makeSpicaRequest);
registerDeepResearchTools(server, openaiClient, VECTOR_STORE_ID);
registerHelperTools(server);

server.start({ transportType: "stdio" });
