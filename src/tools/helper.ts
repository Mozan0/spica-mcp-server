import { z } from "zod";

export function registerHelperTools(server: any) {
  server.addTool({
    name: "workflow-guide",
    description:
      "MANDATORY FIRST STEP: Always use this to understand the required documentation-first workflow before performing ANY Spica operations. This tool explains why and how to use search/fetch tools first.",
    parameters: z.object({}),
    execute: async () => {
      return `
        **WORKFLOW - READ THIS FIRST**

        **STEP 1: SEARCH DOCUMENTATION**
        - Use "search" tool with relevant keywords (e.g., "bucket creation", "identity management", "API endpoints")
        - This finds all relevant documentation files in your knowledge base
        - Never skip this step - documentation is constantly updated

        **STEP 2: GET SPECIFIC ANSWERS** 
        - If the answer requires precise content from a document (examples, exact fields, code snippets), call the "fetch" tool with the document id returned by "search" to retrieve that document's metadata/content
        - The recommended pattern:
          1) search(...) -> get candidate documents (ids)
          2) fetch(document_id) -> retrieve metadata/preview
        - Example: "How do I create a bucket with validation rules? Use fetch(file-xyz) if you need the exact JSON schema." 

        **STEP 3: EXECUTE SPICA OPERATIONS**
        - Only after consulting documentation, use bucket-*, passport-*, function-* tools
        - Use the exact parameters and structure learned from documentation

        **STEP 4: PRIORITIZE DEVKIT**
        - Use @spica/devkit packages over rest api https requests whenever possible for the case

        **NEVER DO THIS:**
        - Don't use Spica tools without first checking documentation
        - Don't assume API structure - always verify with search/fetch
        - Don't guess parameter names or required fields

        **WHY THIS MATTERS:**
        - Spica APIs have specific schemas and validation rules
        - Parameter names and required fields change between versions  
        - Documentation contains examples and best practices
        - Wrong API calls can cause data corruption or security issues

        **EXAMPLE WORKFLOW:**
        1. search("bucket creation validation")
        2. fetch(document_id) -> retrieve metadata/preview
        3. if needed answer_question("What are the required fields for creating a bucket?")
        4. if needed bucket-create etc. (with proper parameters from docs)

        `;
    },
  });
}
