import { MCPServer, text, widget } from "mcp-use/server";
import { z } from "zod";

const server = new MCPServer({
  name: "supermemory-mcp",
  title: "Supermemory MCP",
  version: "1.0.0",
  description: "Supermemory memory graph widget for MCP clients",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://supermemory.ai",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

const toolSchema = z.object({
  page: z
    .number()
    .int()
    .positive()
    .max(1000)
    .optional()
    .describe("Page number to fetch from Supermemory (default: 1)"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .describe("Documents per page (default: 250, max: 500)"),
  sort: z
    .enum(["createdAt", "updatedAt"])
    .optional()
    .describe("Sort field for documents (default: createdAt)"),
  order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort order (default: desc)"),
  variant: z
    .enum(["console", "consumer"])
    .optional()
    .describe("Graph display variant"),
  showSpacesSelector: z
    .boolean()
    .optional()
    .describe("Whether to show the spaces dropdown in the widget"),
});

const apiResponseSchema = z.object({
  documents: z.array(z.object({ id: z.string() }).passthrough()),
  pagination: z
    .object({
      currentPage: z.number().optional(),
      totalPages: z.number().optional(),
      totalDocuments: z.number().optional(),
    })
    .partial()
    .optional(),
});

const SUPERMEMORY_API_BASE_URL =
  process.env.SUPERMEMORY_API_BASE_URL || "https://api.supermemory.ai";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
};

const fetchMemoryGraphDocuments = async (input: z.infer<typeof toolSchema>) => {
  const apiKey = process.env.SUPERMEMORY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SUPERMEMORY_API_KEY is not set on the MCP server environment."
    );
  }

  const response = await fetch(
    `${SUPERMEMORY_API_BASE_URL}/v3/documents/documents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        page: input.page ?? 1,
        limit: input.limit ?? 250,
        sort: input.sort ?? "createdAt",
        order: input.order ?? "desc",
      }),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Supermemory API request failed (${response.status}): ${message}`
    );
  }

  const json = await response.json();
  return apiResponseSchema.parse(json);
};

server.tool(
  {
    name: "show-memory-graph",
    description:
      "Display your Supermemory documents and memories as an interactive memory graph widget.",
    schema: toolSchema,
    widget: {
      name: "memory-graph",
      invoking: "Loading your Supermemory graph...",
      invoked: "Memory graph loaded",
    },
  },
  async (input) => {
    const variant = input.variant ?? "consumer";
    const showSpacesSelector =
      input.showSpacesSelector ?? (variant === "console");

    try {
      const data = await fetchMemoryGraphDocuments(input);
      const loadedCount = data.documents.length;
      const totalCount = data.pagination?.totalDocuments;

      return widget({
        props: {
          documents: data.documents,
          variant,
          showSpacesSelector,
          page: input.page ?? 1,
          limit: input.limit ?? 250,
          totalDocuments: totalCount,
        },
        output: text(
          totalCount
            ? `Loaded ${loadedCount} documents for your memory graph (out of ${totalCount}).`
            : `Loaded ${loadedCount} documents for your memory graph.`
        ),
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      return widget({
        props: {
          documents: [],
          variant,
          showSpacesSelector,
          errorMessage,
        },
        output: text(`Unable to load memory graph: ${errorMessage}`),
      });
    }
  }
);

server.listen().then(() => {
  console.log(`Server running`);
});
