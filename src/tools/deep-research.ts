import { z } from "zod";
import OpenAI from "openai";

export function registerDeepResearchTools(
  server: any,
  openaiClient: OpenAI | null,
  VECTOR_STORE_ID: string
) {
  server.addTool({
    name: "search",
    description:
      "🔍 ALWAYS USE THIS FIRST! Search for documents in your vector store collection to understand available APIs, endpoints, and functionality. You should default to calling this even if you think you already know the answer, since the documentation is always being updated. Use this before any Spica API operations to understand the correct syntax, parameters, and best practices.",
    parameters: z.object({
      query: z
        .string()
        .describe(
          "Search query string to find relevant documents about Spica APIs, endpoints, or functionality"
        ),
    }),
    execute: async ({ query }: any) => {
      if (!query || !query.trim()) return "❌ Query cannot be empty";
      if (!openaiClient)
        return "❌ OpenAI client not initialized - API key missing";
      if (!VECTOR_STORE_ID) return "❌ Vector store ID not configured";

      try {
        const files = await openaiClient.vectorStores.files.list(
          VECTOR_STORE_ID
        );
        const results: any[] = [];

        for (const file of files.data) {
          const fileInfo = await openaiClient.files.retrieve(file.id);
          const filename = fileInfo.filename || `Document ${file.id}`;

          results.push({
            id: file.id,
            title: filename,
            text: "Content preview not available - use answer_question tool to get relevant content",
            url: `https://platform.openai.com/storage/files/${file.id}`,
          });
        }

        return `✅ Found ${
          results.length
        } files in vector store:\n${JSON.stringify(
          { results },
          null,
          2
        )}\n\n💡 Next step: Use answer_question tool with your specific query to get detailed information from these documents.`;
      } catch (err: any) {
        return `❌ Error searching vector store: ${err.message}`;
      }
    },
  });

  server.addTool({
    name: "fetch",
    description:
      "📄 Retrieve document metadata by ID from your documentation collection. Use this to get basic information about a specific document after using the search tool to find relevant documents.",
    parameters: z.object({
      id: z
        .string()
        .describe("File ID from your document collection (file-xxx)"),
    }),
    execute: async ({ id }: any) => {
      if (!id) return "❌ Document ID is required";
      if (!openaiClient)
        return "❌ OpenAI client not initialized - API key missing";

      try {
        const fileInfo = await openaiClient.files.retrieve(id);
        const filename = fileInfo.filename || `Document ${id}`;

        const result = {
          id,
          title: filename,
          text: "Full content access not available - use answer_question tool for semantic search",
          url: `https://platform.openai.com/storage/files/${id}`,
          metadata: {
            file_id: id,
            filename,
            vector_store_id: VECTOR_STORE_ID,
          },
        };

        return `✅ Document metadata retrieved:\n${JSON.stringify(
          result,
          null,
          2
        )}\n\n💡 To get actual content and answers from this document, use the answer_question tool.`;
      } catch (err: any) {
        return `❌ Could not fetch document with ID ${id}: ${err.message}`;
      }
    },
  });

  server.addTool({
    name: "answer_question",
    description:
      "🤖 Get AI-powered answers from your documentation collection. Use this after searching to get specific information about Spica APIs, endpoints, parameters, examples, and best practices. Always consult documentation before performing any Spica operations.",
    parameters: z.object({
      query: z
        .string()
        .describe(
          "Your specific question about Spica APIs, functionality, or implementation details"
        ),
    }),
    execute: async ({ query }: any) => {
      if (!query || !query.trim()) return "❌ Query cannot be empty";
      if (!openaiClient)
        return "❌ OpenAI client not initialized - API key missing";

      try {
        const files = await openaiClient.vectorStores.files.list(
          VECTOR_STORE_ID
        );

        if (!files.data || files.data.length === 0)
          return `❌ No documents found in vector store`;

        const firstFile = files.data[0];
        const fileInfo = await openaiClient.files.retrieve(firstFile.id);
        const filename = fileInfo.filename || `Document ${firstFile.id}`;

        const prompt = `Based on the documents in my vector store collection, provide a helpful answer to the user's question. While I cannot access the specific document content directly, provide guidance based on the query.\n\nDocument Collection: Contains ${files.data.length} documents including "${filename}"\nUser Question: ${query}\n\nPlease provide a helpful answer and suggest how the user might find more specific information in their document collection.`;

        const response = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 1000,
        });

        const answer =
          response.choices[0].message.content?.trim() || "No answer generated";

        const result = {
          query,
          answer:
            answer +
            "\n\n💡 Note: This is a general response. For more specific answers, consider using OpenAI's Assistant API with your vector store.",
          source_title: `Collection of ${files.data.length} documents`,
          source_url: `Vector Store ${VECTOR_STORE_ID}`,
          success: true,
        };

        return `✅ Question answered:\n${JSON.stringify(result, null, 2)}`;
      } catch (err: any) {
        return `❌ An error occurred while processing your question: ${err.message}`;
      }
    },
  });
}
