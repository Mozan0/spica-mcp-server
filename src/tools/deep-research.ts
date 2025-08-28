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
      "ALWAYS USE THIS FIRST! Search for documents in your vector store collection to understand available APIs, endpoints, and functionality. You should default to calling this even if you think you already know the answer, since the documentation is always being updated. Use this before any Spica API operations to understand the correct syntax, parameters, and best practices.",
    parameters: z.object({
      query: z
        .string()
        .describe(
          "Search query string to find relevant documents about Spica APIs, endpoints, or functionality"
        ),
    }),
    execute: async ({ query }: any) => {
      if (!query || !query.trim()) return "Query cannot be empty";
      if (!openaiClient)
        return " OpenAI client not initialized - API key missing";
      if (!VECTOR_STORE_ID) return "Vector store ID not configured";

      try {
        // Use vector store search for semantic matching (corrected API call)
        const searchResponse = await openaiClient.vectorStores.search(
          VECTOR_STORE_ID,
          { query: query }
        );

        const results: any[] = [];

        if (searchResponse?.data) {
          for (const item of searchResponse.data) {
            const fileId = item.file_id;
            const filename = item.filename || `Document ${fileId}`;

            let textContent = "";
            if (item.content && Array.isArray(item.content)) {
              textContent = item.content
                .map((c: any) => c.text)
                .filter(Boolean)
                .join("\n");
            }

            const snippet =
              textContent.length > 200
                ? textContent.substring(0, 200) + "..."
                : textContent || "Content preview not available";

            results.push({
              id: fileId,
              title: filename,
              text: snippet,
              url: `https://platform.openai.com/storage/files/${fileId}`,
              score: item.score || 0,
            });
          }
        }

        if (results.length === 0) {
          const files = await openaiClient.vectorStores.files.list(
            VECTOR_STORE_ID
          );
          for (const file of files.data) {
            const fileInfo = await openaiClient.files.retrieve(file.id);
            const filename = fileInfo.filename || `Document ${file.id}`;

            results.push({
              id: file.id,
              title: filename,
              text: "Content preview not available - use fetch or answer_question tool",
              url: `https://platform.openai.com/storage/files/${file.id}`,
            });
          }
        }

        return `Found ${results.length} relevant documents:\n${JSON.stringify(
          { results },
          null,
          2
        )}\n\nNext step: Use fetch tool with your specific query to get detailed information from these documents.`;
      } catch (err: any) {
        return `Error searching vector store: ${err.message}`;
      }
    },
  });

  server.addTool({
    name: "fetch",
    description:
      "Retrieve complete document content by ID from your documentation collection. Use this to get the full text of a specific document after using the search tool to find relevant documents.",
    parameters: z.object({
      id: z
        .string()
        .describe("File ID from your document collection (file-xxx)"),
    }),
    execute: async ({ id }: any) => {
      if (!id) return "Document ID is required";
      if (!openaiClient)
        return "OpenAI client not initialized - API key missing";

      try {
        let fileContent = "";
        try {
          const contentResponse = await (
            openaiClient as any
          ).vectorStores.files.content({
            vector_store_id: VECTOR_STORE_ID,
            file_id: id,
          });

          if (contentResponse?.data && Array.isArray(contentResponse.data)) {
            const contentParts = contentResponse.data
              .map((item: any) => item.text)
              .filter(Boolean);
            fileContent = contentParts.join("\n");
          }
        } catch (error: any) {
          fileContent = `Content not available via vector store API. Error: ${error.message}`;
        }

        // Get file metadata
        const fileInfo = await openaiClient.files.retrieve(id);
        const filename = fileInfo.filename || `Document ${id}`;

        const result = {
          id,
          title: filename,
          text:
            fileContent ||
            "Full content access not available - use answer_question tool for semantic search",
          url: `https://platform.openai.com/storage/files/${id}`,
          metadata: {
            file_id: id,
            filename,
            vector_store_id: VECTOR_STORE_ID,
            content_length: fileContent.length,
          },
        };

        return `Document content retrieved:\n${JSON.stringify(
          result,
          null,
          2
        )}`;
      } catch (err: any) {
        return `Could not fetch document with ID ${id}: ${err.message}`;
      }
    },
  });

  server.addTool({
    name: "answer_question",
    description:
      "Get AI-powered answers from your documentation collection. Use this after searching to get specific information about Spica APIs, endpoints, parameters, examples, and best practices and fetch to retrieve latest documents about this topics. Always consult documentation before performing any Spica operations.",
    parameters: z.object({
      query: z
        .string()
        .describe(
          "Your specific question about Spica APIs, functionality, or implementation details"
        ),
    }),
    execute: async ({ query }: any) => {
      if (!query || !query.trim()) return "Query cannot be empty";
      if (!openaiClient)
        return "OpenAI client not initialized - API key missing";

      try {
        // Step 1: Search vector store for relevant content
        let searchResponse: any;
        try {
          searchResponse = await openaiClient.vectorStores.search(
            VECTOR_STORE_ID,
            { query: query }
          );
        } catch (searchErr) {
          return `Vector store search not available: ${searchErr}`;
        }

        if (!searchResponse?.data || searchResponse.data.length === 0) {
          return `No relevant documents found for your query. Try rephrasing or ensure your vector store contains relevant content.`;
        }

        // Step 2: Group results by file_id with total score
        const fileScoreMap: Record<string, number> = {};
        const fileChunksMap: Record<string, string[]> = {};

        for (const item of searchResponse.data) {
          const fileId = item.file_id;
          if (!fileId) continue;

          const score = item.score || 0;
          const texts: string[] = [];

          if (item.content && Array.isArray(item.content)) {
            for (const contentObj of item.content) {
              if (contentObj.text) {
                texts.push(contentObj.text);
              }
            }
          }

          fileScoreMap[fileId] = (fileScoreMap[fileId] || 0) + score;
          if (!fileChunksMap[fileId]) fileChunksMap[fileId] = [];
          fileChunksMap[fileId].push(...texts);
        }

        if (Object.keys(fileChunksMap).length === 0) {
          return `No relevant document chunks found for your query. The search returned results but no readable content was available.`;
        }

        // Step 3: Select file with highest total relevance score
        const bestFileId = Object.keys(fileScoreMap).reduce((a, b) =>
          fileScoreMap[a] > fileScoreMap[b] ? a : b
        );
        const combinedText = fileChunksMap[bestFileId].join("\n");

        // Get filename from search results
        let filename = null;
        for (const item of searchResponse.data) {
          if (item.file_id === bestFileId) {
            filename = item.filename;
            break;
          }
        }

        // Step 4: Prepare prompt for LLM
        const prompt = `
        Based on the document content below, provide a comprehensive answer to the user's question. 
        Be specific and cite relevant details from the document.
        
        Document Content:
        ${combinedText}

        User Question: 
        ${query}

        Please provide a detailed, helpful answer based on the document content. 
        If the document doesn't contain enough information to fully answer the question, mention what information is available and what might be missing.`;

        // Step 5: Call OpenAI chat completion
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
          answer,
          source_title: filename || `Document ${bestFileId}`,
          source_url: `https://platform.openai.com/storage/files/${bestFileId}`,
          relevance_score: fileScoreMap[bestFileId],
          success: true,
        };

        return `Question answered:\n${JSON.stringify(result, null, 2)}`;
      } catch (err: any) {
        return `An error occurred while processing your question: ${err.message}`;
      }
    },
  });
}
